import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import pino from 'pino';
import http from 'http';
import { WebSocketServer } from 'ws';
import { parse } from 'url';
import healthRouter from './routes/health.js';
import twilioWebhook from './routes/twilioWebhook.js';
import stripeWebhook from './routes/stripeWebhook.js';
import localTestRouter from './routes/localTest.js';
import { handleMediaConnection } from './realtime/mediaServer.js';
import { handleLocalTestConnection } from './routes/localTest.js';

const app = express();
const logger = pino();

app.use(cors());

// Stripe webhook needs raw body
app.use('/stripe/webhook', bodyParser.raw({ type: 'application/json' }));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.set('views', 'views');
app.set('view engine', 'ejs');

// Routes (Admin routes moved to adminServer.ts on port 8006)
app.use('/healthz', healthRouter);
app.use('/', twilioWebhook);
app.use('/stripe', stripeWebhook);
app.use('/', localTestRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 8005;
const server = http.createServer(app);

// Create WebSocket servers with noServer mode
const mediaWss = new WebSocketServer({ noServer: true });
const localTestWss = new WebSocketServer({ noServer: true });

// Handle WebSocket upgrades manually
server.on('upgrade', (request, socket, head) => {
  const { pathname } = parse(request.url || '');

  if (pathname === '/media') {
    mediaWss.handleUpgrade(request, socket, head, (ws) => {
      mediaWss.emit('connection', ws, request);
    });
  } else if (pathname === '/ws/local-test') {
    localTestWss.handleUpgrade(request, socket, head, (ws) => {
      localTestWss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Attach connection handlers
mediaWss.on('connection', handleMediaConnection);
localTestWss.on('connection', handleLocalTestConnection);

server.listen(port, () => {
  logger.info(`Soup Cookoff Voice Assistant running on :${port}`);
  logger.info(`Local test interface: http://localhost:${port}/test`);
});
