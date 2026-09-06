import { io } from 'socket.io-client';
import { getAdminToken } from './api';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
const SOCKET_BASE_URL = API_URL.replace(/\/api\/v1\/?$/, '');

let socket = null;

export const connectAdminSocket = () => {
  const token = getAdminToken();

  if (!token) {
    console.warn('Admin socket cannot connect: admin token missing');
    return null;
  }

  if (socket) {
    if (!socket.connected) {
      socket.auth = { token };
      socket.connect();
    }

    return socket;
  }

  socket = io(SOCKET_BASE_URL || window.location.origin, {
    auth: {
      token
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000
  });

  socket.on('connect', () => {
    console.log('✅ Admin Socket.IO connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.warn('⚠️ Admin Socket.IO disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Admin Socket.IO connection error:', error.message);
  });

  return socket;
};

export const getAdminSocket = () => socket;

export const joinSupportConversation = (conversationId) => {
  const currentSocket = connectAdminSocket();

  if (currentSocket && conversationId) {
    currentSocket.emit('join_conversation', conversationId);
  }
};

export const leaveSupportConversation = (conversationId) => {
  if (socket && conversationId) {
    socket.emit('leave_conversation', conversationId);
  }
};

export const disconnectAdminSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};