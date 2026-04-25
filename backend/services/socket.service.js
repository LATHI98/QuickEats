import { Server } from 'socket.io';
import Notification from '../models/Notification.model.js';

let io;

export const initSocket = (server) => {
  io = new Server({
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    },
    allowEIO3: true,
    path: '/socket.io/'
  });

  io.attach(server);
  console.log('✅ Socket.io initialized and attached to server');

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their notification room`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export const sendNotification = async (userId, title, message, type = 'info') => {
  try {
    // Save to database
    const notification = new Notification({
      userId,
      title,
      message,
      type
    });
    await notification.save();

    // Emit real-time if user is connected
    if (io) {
      io.to(userId.toString()).emit('notification', notification);
    }
    
    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};
