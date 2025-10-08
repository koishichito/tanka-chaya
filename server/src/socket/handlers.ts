import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthSocket extends Socket {
  userId?: string;
}

export const setupSocketHandlers = (io: Server) => {
  // Authentication middleware
  io.use((socket: AuthSocket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join room
    socket.on('join-room', (roomId: string) => {
      socket.join(`room-${roomId}`);
      console.log(`User ${socket.userId} joined room ${roomId}`);

      // Notify others in the room
      socket.to(`room-${roomId}`).emit('user-joined', {
        userId: socket.userId
      });

      // Send current participant count
      const room = io.sockets.adapter.rooms.get(`room-${roomId}`);
      io.to(`room-${roomId}`).emit('participant-count', {
        count: room?.size || 0
      });
    });

    // Leave room
    socket.on('leave-room', (roomId: string) => {
      socket.leave(`room-${roomId}`);
      console.log(`User ${socket.userId} left room ${roomId}`);

      const room = io.sockets.adapter.rooms.get(`room-${roomId}`);
      io.to(`room-${roomId}`).emit('participant-count', {
        count: room?.size || 0
      });
    });

    // Phase change notifications
    socket.on('phase-change', (data: { roomId: string; phase: string; timeRemaining?: number }) => {
      io.to(`room-${data.roomId}`).emit('phase-update', {
        phase: data.phase,
        timeRemaining: data.timeRemaining
      });
    });

    // Submission notification
    socket.on('submission-complete', (roomId: string) => {
      socket.to(`room-${roomId}`).emit('submission-received', {
        userId: socket.userId
      });
    });

    // Vote notification
    socket.on('vote-complete', (roomId: string) => {
      socket.to(`room-${roomId}`).emit('vote-received', {
        userId: socket.userId
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  // Helper function to broadcast phase changes
  const broadcastPhaseChange = (roomId: string, phase: string, timeRemaining?: number) => {
    io.to(`room-${roomId}`).emit('phase-update', {
      phase,
      timeRemaining
    });
  };

  return { broadcastPhaseChange };
};