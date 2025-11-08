import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Detect if we're on mobile (IP address instead of localhost)
      const hostname = window.location.hostname;
      const socketURL = (hostname !== 'localhost' && hostname !== '127.0.0.1') 
        ? `http://${hostname}:5000` 
        : 'http://localhost:5000';
      
      const newSocket = io(socketURL, {
        transports: ['websocket']
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        // Join room with user ID for targeted notifications
        const userId = user.id || user._id;
        if (userId) {
          newSocket.emit('join-room', userId.toString());
          console.log(`Joined room for user: ${userId}`);
        }
        
        // Join role-specific rooms for broadcast notifications
        if (user.role === 'admin') {
          newSocket.emit('join-admin-room');
        } else if (user.role === 'examController') {
          newSocket.emit('join-exam-controller-room');
        }
      });

      newSocket.on('allocation-updated', (data) => {
        setNotifications(prev => [...prev, { type: 'info', ...data }]);
        // Trigger dashboard refresh for admin and exam controller
        if (user.role === 'admin' || user.role === 'examController') {
          window.dispatchEvent(new CustomEvent('refresh-dashboard'));
        }
      });

      newSocket.on('duty-assigned', (data) => {
        setNotifications(prev => [...prev, { type: 'success', ...data }]);
        // Trigger dashboard refresh for faculty
        if (user.role === 'faculty') {
          window.dispatchEvent(new CustomEvent('refresh-dashboard'));
        }
      });

      newSocket.on('duty-updated', (data) => {
        setNotifications(prev => [...prev, { type: 'success', ...data }]);
        // Trigger dashboard refresh
        window.dispatchEvent(new CustomEvent('refresh-dashboard'));
      });

      newSocket.on('duty-cancelled', (data) => {
        setNotifications(prev => [...prev, { type: 'warning', ...data }]);
        // Trigger dashboard refresh
        window.dispatchEvent(new CustomEvent('refresh-dashboard'));
      });

      newSocket.on('request-updated', (data) => {
        setNotifications(prev => [...prev, { type: 'info', ...data }]);
        // Trigger dashboard refresh
        window.dispatchEvent(new CustomEvent('refresh-dashboard'));
      });

      newSocket.on('new-change-request', (data) => {
        if (user.role === 'admin' || user.role === 'examController') {
          setNotifications(prev => [...prev, { type: 'info', ...data }]);
          // Trigger dashboard refresh
          window.dispatchEvent(new CustomEvent('refresh-dashboard'));
        }
      });

      newSocket.on('allocation-conflicts', (data) => {
        if (user.role === 'admin') {
          setNotifications(prev => [...prev, { type: 'warning', ...data }]);
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, user]);

  const clearNotifications = () => {
    setNotifications([]);
  };

  const removeNotification = (index) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  const refreshDashboard = () => {
    window.dispatchEvent(new CustomEvent('refresh-dashboard'));
  };

  return (
    <SocketContext.Provider value={{ socket, notifications, clearNotifications, removeNotification, refreshDashboard }}>
      {children}
    </SocketContext.Provider>
  );
};

