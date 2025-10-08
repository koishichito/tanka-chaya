import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import eventRoutes from './routes/events';
import submissionRoutes from './routes/submissions';
import voteRoutes from './routes/votes';
import rankingRoutes from './routes/rankings';
import adminRoutes from './routes/admin';
import { setupSocketHandlers } from './socket/handlers';
import { eventManager } from './services/eventManager';
import { scheduledEventManager } from './services/scheduledEventManager';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.CLIENT_URL
      : 'http://localhost:5173',
    credentials: true
  }
});

// Initialize event managers with Socket.IO
eventManager.setSocketIO(io);
scheduledEventManager.setSocketIO(io);
scheduledEventManager.start();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL
    : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Socket.IO setup
setupSocketHandlers(io);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
});