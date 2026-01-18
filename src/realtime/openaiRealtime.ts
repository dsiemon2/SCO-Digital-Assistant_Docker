import WebSocket from 'ws';
import pino from 'pino';

const logger = pino();

export type ToolSpec = {
  name: string;
  description?: string;
  input_schema: Record<string, any>;
};

export type OpenAIRealtimeOptions = {
  model?: string;
  apiKey?: string;
  voice?: string;
  inputSampleRate?: number;
  outputSampleRate?: number;
  turnDetection?: 'server_vad' | 'none';
  tools?: ToolSpec[];
  instructions?: string;
};

export type ToolCallEvent = {
  id?: string;
  name?: string;
  tool_name?: string;
  arguments?: string | Record<string, any>;
  tool_call_id?: string;
};

export type Handlers = {
  onAudioDelta?: (b64Pcm16_16k: string) => void;
  onTextDelta?: (textChunk: string) => void;
  onResponseCompleted?: () => void;
  onToolCall?: (call: ToolCallEvent) => Promise<any>;
  onError?: (err: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
};

export class OpenAIRealtimeClient {
  private ws?: WebSocket;
  private opts: Required<OpenAIRealtimeOptions>;
  private handlers: Handlers;
  private connected = false;
  private pendingBytes = 0;
  private heartbeatTimer?: NodeJS.Timeout;

  constructor(opts: OpenAIRealtimeOptions = {}, handlers: Handlers = {}) {
    this.opts = {
      model: opts.model || process.env.OPENAI_REALTIME_MODEL || 'gpt-4o-realtime-preview',
      apiKey: opts.apiKey || process.env.OPENAI_API_KEY || '',
      voice: opts.voice || process.env.OPENAI_TTS_VOICE || 'alloy',
      inputSampleRate: opts.inputSampleRate ?? 16000,
      outputSampleRate: opts.outputSampleRate ?? 16000,
      turnDetection: opts.turnDetection || 'server_vad',
      tools: opts.tools || [],
      instructions: opts.instructions || `You are a helpful voice assistant for The Soup Cookoff, a soup tasting festival that benefits the AKT Foundation.

Your primary functions are:
1. Provide information about upcoming events (dates, locations, times)
2. Help callers purchase tickets (GA $15 or VIP $35)
3. Explain sponsorship opportunities ($250-$2,500)
4. Share information about past winners
5. Explain how to enter as a chef (Professional, Amateur, or Junior divisions)
6. Answer general questions about the organization

When helping with ticket purchases:
- Confirm the event, ticket type, and quantity
- Collect customer name, email, and phone
- Collect credit card information (number, expiration, CVV)
- Process the payment and provide a confirmation code

Be friendly, concise, and helpful. If you can't help with something, offer to transfer to a human.
IMPORTANT: Never use emojis in your responses - this is a voice call and emojis cannot be spoken.
When using the answerQuestion tool, include a brief spoken citation like "According to our FAQ..." at the end.`,
    };
    this.handlers = handlers;

    if (!this.opts.apiKey) {
      throw new Error('OpenAIRealtimeClient: OPENAI_API_KEY missing.');
    }
  }

  connect() {
    const url = `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(this.opts.model)}`;
    this.ws = new WebSocket(url, {
      headers: {
        Authorization: `Bearer ${this.opts.apiKey}`,
        'OpenAI-Beta': 'realtime=v1',
      },
    });

    this.ws.on('open', () => {
      this.connected = true;
      this.send({
        type: 'session.update',
        session: {
          input_audio_format: { type: 'pcm16', sample_rate: this.opts.inputSampleRate },
          output_audio_format: { type: 'pcm16', sample_rate: this.opts.outputSampleRate },
          turn_detection: this.opts.turnDetection === 'server_vad'
            ? { type: 'server_vad' }
            : { type: 'none' },
          voice: this.opts.voice,
          tools: this.opts.tools,
          instructions: this.opts.instructions,
        },
      });
      this.startHeartbeat();
      this.handlers.onOpen?.();
      logger.info('OpenAI Realtime: connected');
    });

    this.ws.on('message', (data: WebSocket.RawData) => {
      try {
        const evt = JSON.parse(data.toString());
        this.routeEvent(evt);
      } catch (e: any) {
        logger.warn({ err: e }, 'OpenAI Realtime: failed to parse message');
      }
    });

    this.ws.on('close', () => {
      this.connected = false;
      this.stopHeartbeat();
      this.handlers.onClose?.();
      logger.info('OpenAI Realtime: closed');
    });

    this.ws.on('error', (err) => {
      this.handlers.onError?.(err as any);
      logger.error({ err }, 'OpenAI Realtime: error');
    });
  }

  close() {
    try {
      this.stopHeartbeat();
      this.ws?.close();
    } catch {}
    this.connected = false;
  }

  updateSession(patch: Record<string, any>) {
    this.send({ type: 'session.update', session: patch });
  }

  appendAudioBase64(b64Pcm16_16k: string) {
    if (!this.connected) return;
    const payload = { type: 'input_audio_buffer.append', audio: b64Pcm16_16k };
    this.pendingBytes += Buffer.byteLength(b64Pcm16_16k, 'base64');
    this.send(payload);
  }

  commitAndRespond(modalities: Array<'text' | 'audio'> = ['text', 'audio']) {
    if (!this.connected) return;
    this.send({ type: 'input_audio_buffer.commit' });
    this.send({ type: 'response.create', response: { modalities } });
    this.pendingBytes = 0;
  }

  maybeAutoFlush(thresholdBytes = 32000) {
    if (this.pendingBytes >= thresholdBytes) {
      this.commitAndRespond(['text', 'audio']);
    }
  }

  private send(obj: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify(obj));
  }

  private routeEvent(evt: any) {
    if (evt.type === 'response.audio.delta' && evt.delta) {
      this.handlers.onAudioDelta?.(evt.delta);
      return;
    }

    if (evt.type === 'response.output_text.delta' && evt.delta) {
      this.handlers.onTextDelta?.(evt.delta);
      return;
    }

    if (evt.type === 'response.completed') {
      this.handlers.onResponseCompleted?.();
      return;
    }

    if (evt.type === 'response.function_call' || evt.type === 'tool.call') {
      const call: ToolCallEvent = {
        id: evt.id,
        name: evt.name,
        tool_name: evt.tool_name,
        arguments: evt.arguments,
        tool_call_id: evt.tool_call_id,
      };
      void this.handleToolCall(call);
      return;
    }
  }

  private async handleToolCall(call: ToolCallEvent) {
    const name = call.name || call.tool_name;
    const args = typeof call.arguments === 'string'
      ? safeParseJson(call.arguments)
      : (call.arguments || {});
    const toolCallId = call.tool_call_id || call.id;

    let output: any = { ok: false, error: `Unhandled tool ${name}` };
    try {
      if (this.handlers.onToolCall) {
        output = await this.handlers.onToolCall({ ...call, arguments: args });
      }
    } catch (e: any) {
      output = { ok: false, error: e?.message || String(e) };
    }

    this.send({
      type: 'tool.output',
      tool_call_id: toolCallId,
      output: JSON.stringify(output),
    });
  }

  private startHeartbeat(intervalMs = 20000) {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      try {
        if (this.connected) {
          this.send({ type: 'session.update', session: { keepalive_at: Date.now() } });
        }
      } catch {}
    }, intervalMs);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }
}

function safeParseJson(s?: string) {
  if (!s) return {};
  try { return JSON.parse(s); } catch { return {}; }
}
