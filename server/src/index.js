import http from 'http';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { setSocketServer } from './realtime.js';
import { initializeWorkflowQueue } from './services/workflowQueue.js';

const app = createApp();
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: env.CLIENT_ORIGIN,
    credentials: true
  }
});

setSocketServer(io);

io.on('connection', (socket) => {
  console.log(`NxtBiz Socket.IO client connected: ${socket.id}`);
});

await connectDatabase();
await initializeWorkflowQueue();

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${env.PORT} is already in use.`);
    console.error('Stop the existing server process, or set PORT to another value in server/.env.');
    console.error(`Windows helper: netstat -ano | findstr :${env.PORT}`);
    console.error('Then stop the matching process with: taskkill /PID <PID> /F');
    process.exit(1);
  }

  throw error;
});

server.listen(env.PORT, () => {
  console.log(`NxtBiz API listening on http://localhost:${env.PORT}`);
});
