import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activityFeed, setActivityFeed] = useState([
    {
      id: 'init-1',
      text: 'Campus Event Ticketing live network initialized.',
      type: 'info',
      timestamp: new Date().toISOString()
    }
  ]);
  const [latestSeatUpdate, setLatestSeatUpdate] = useState(null);
  const [latestCheckIn, setLatestCheckIn] = useState(null);

  useEffect(() => {
    // Socket.io auto-detects current host/port or connects to backend
    const s = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    s.on('connect', () => {
      console.log('⚡ Connected to Campus Event Ticketing WebSocket Server!');
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      setIsConnected(false);
    });

    s.on('event:seat_updated', (data) => {
      setLatestSeatUpdate(data);
    });

    s.on('checkin:verified', (data) => {
      setLatestCheckIn(data);
    });

    s.on('activity:feed', (item) => {
      setActivityFeed((prev) => [
        {
          id: Math.random().toString(36).substr(2, 9),
          ...item
        },
        ...prev.slice(0, 19) // keep recent 20 activities
      ]);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        activityFeed,
        latestSeatUpdate,
        latestCheckIn
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
