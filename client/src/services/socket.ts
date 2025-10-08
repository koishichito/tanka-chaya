import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export const initSocket = (token: string) => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token }
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinRoom = (roomId: string) => {
  socket?.emit('join-room', roomId);
};

export const leaveRoom = (roomId: string) => {
  socket?.emit('leave-room', roomId);
};

export const notifySubmissionComplete = (roomId: string) => {
  socket?.emit('submission-complete', roomId);
};

export const notifyVoteComplete = (roomId: string) => {
  socket?.emit('vote-complete', roomId);
};