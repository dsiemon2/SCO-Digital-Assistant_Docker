# Synthetic Voice Testing Suite

**Objective**: Eliminate manual "phone tag" testing by creating an automated suite that calls the SCO Digital Assistant, simulates a user, and verifies the system's behavior.

---

## 1. Concept: "Twilio Calling Twilio"

We treat the Voice Assistant as a "Black Box." We don't test the implementation details (like `kb.ts`); we test the **caller experience**.

*   **The Test Runner**: A Node.js script (jest/vitest).
*   **The Mock User**: A separate Twilio-powered agent that speaks pre-defined text/audio.
*   **The Target**: Your deployed (or ngrok-tunneled) SCO Digital Assistant.

---

## 2. Architecture

```mermaid
graph TD
    TestRunner[Test Runner (Jest)] -->|1. Initiates Call| UserTwilio[Twilio "Mock User"]
    UserTwilio -->|2. SIP/PSTN Call| TargetTwilio[Twilio "SCO Assistant"]
    TargetTwilio -->|3. Webhook| AppServer[SCO App Server]
    
    subgraph "The Conversation"
        UserTwilio -- "I want tickets" (Audio) --> TargetTwilio
        TargetTwilio -- "Which type?" (Audio) --> UserTwilio
    end

    TestRunner -->|4. Verifies| Database[(Postgres DB)]
    TestRunner -->|5. Analyzes| CallLogs[Twilio Call Logs]
```

---

## 3. Implementation Strategy

### A. The "Mock User" Controller
We create a simple TwiML endpoint that acts as the user. It plays audio files in sequence, waiting for silence (the Assistant speaking) in between.

```typescript
// test/mock-user-server.ts
app.post('/voice/mock-user', (req, res) => {
  const twiml = new VoiceResponse();
  
  // Step 1: Wait for Assistant to say "Hello..."
  twiml.pause({ length: 2 }); 
  
  // Step 2: Speak intent
  twiml.say("I'd like to buy two VIP tickets for the next event.");
  
  // Step 3: Wait for Assistant to process and ask for card
  twiml.pause({ length: 4 });
  
  // Step 4: Provide payment details
  twiml.say("My card number is 4242 4242 4242 4242...");
  
  res.type('text/xml').send(twiml.toString());
});
```

### B. The Assertion Test (Jest)
The test triggers the call and then checks the side-effects.

```typescript
// test/voice/purchase.test.ts
import { prisma } from '../../src/db/prisma';
import { twilioClient } from '../../src/services/twilio';

describe('End-to-End Voice Purchase', () => {
  it('should successfully process a VIP ticket purchase', async () => {
    // 1. Trigger the call
    const call = await twilioClient.calls.create({
      from: process.env.TEST_PHONE_NUMBER, // A number you own
      to: process.env.SCO_VOICE_NUMBER,    // The Assistant
      url: `${process.env.NGROK_URL}/voice/mock-user` // The script above
    });

    // 2. Wait for call duration (approx 45s)
    await new Promise(r => setTimeout(r, 45000));

    // 3. Verify Database State
    const purchase = await prisma.ticketPurchase.findFirst({
      where: { customerPhone: process.env.TEST_PHONE_NUMBER },
      orderBy: { createdAt: 'desc' }
    });

    expect(purchase).toBeDefined();
    expect(purchase?.ticketType).toBe('VIP');
    expect(purchase?.quantity).toBe(2);
    expect(purchase?.paymentStatus).toBe('completed');
  }, 60000); // 60s timeout
});
```

---

## 4. Advanced Verification (The "Listening" User)

For more complex tests (e.g., ensuring the AI said the correct price), the Mock User can **record** the call.

1.  Enable `record: true` when initiating the test call.
2.  After the call, download the recording.
3.  Use **OpenAI Whisper** API to transcribe the recording.
4.  Assert on the text:
    ```typescript
    const transcript = await whisper.transcribe(recordingUrl);
    expect(transcript).toContain("The total is seventy dollars");
    ```

---

## 5. Benefits

1.  **Confidence on Friday Afternoons**: Deploy without fear. If the test suite passes, the phone lines work.
2.  **Cost Effective**: A 1-minute test call costs ~$0.03. Running 10 tests costs $0.30. Much cheaper than a human tester.
3.  **Latency Monitoring**: You can measure the exact duration of the execution to catch performance regressions.
