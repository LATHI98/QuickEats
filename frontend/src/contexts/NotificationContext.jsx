import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { notificationAPI } from '../services/api';
import config from '../config/config';
import { toast } from 'react-toastify';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const response = await notificationAPI.getNotifications();
      setNotifications(response.data);
      setUnreadCount(response.data.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();

      console.log('Connecting to socket at:', config.API_URL);
      const newSocket = io(config.API_URL, {
        transports: ['polling', 'websocket'],
        reconnection: true,
        withCredentials: true
      });
      
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        newSocket.emit('join', user._id);
        console.log('Joined room:', user._id);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      newSocket.on('notification', (notification) => {
        console.log('Notification received via socket:', notification);
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show Toast
        if (notification.type === 'budget_exceeded') {
          toast.error(notification.title + ': ' + notification.message, {
            position: "top-right",
            autoClose: 5000,
          });
        } else if (notification.type === 'pass_verified') {
          toast.success(notification.title + ': ' + notification.message, {
            position: "top-right",
            autoClose: 5000,
          });
        } else if (notification.type === 'pass_rejected') {
          toast.error(notification.title + ': ' + notification.message, {
            position: "top-right",
            autoClose: 5000,
          });
        } else {
          toast.info(notification.title + ': ' + notification.message);
        }

        // Browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new window.Notification(notification.title, {
              body: notification.message,
              icon: '/logo.svg'
            });
          } catch (err) {
            console.error('Error showing browser notification:', err);
          }
        }
      });

      return () => {
        console.log('Closing socket connection');
        newSocket.close();
      };
    } else {
      setNotifications([]);
      setUnreadCount(0);
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [user, fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationAPI.deleteNotification(id);
      const deletedNotification = notifications.find(n => n._id === id);
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markAsRead, 
      markAllAsRead, 
      deleteNotification,
      fetchNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
