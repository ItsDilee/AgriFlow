import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => socket;

export const connectSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io('/', {
    auth: { token },
    withCredentials: true,
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('[socket] connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[socket] disconnected:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('[socket] connection error:', err.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinCentre = (centreId) => {
  if (socket?.connected && centreId) {
    socket.emit('join:centre', { centreId });
  }
};

export const leaveCentre = (centreId) => {
  if (socket?.connected && centreId) {
    socket.emit('leave:centre', { centreId });
  }
};

export const joinUser = (userId) => {
  if (socket?.connected && userId) {
    socket.emit('join:user', { userId });
  }
};

export const leaveUser = (userId) => {
  if (socket?.connected && userId) {
    socket.emit('leave:user', { userId });
  }
};
