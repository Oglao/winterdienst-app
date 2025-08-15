// src/hooks/useSocket.js
import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

export const useSocket = (serverPath) => {
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io(serverPath);
    
    return () => {
      socketRef.current.disconnect();
    };
  }, [serverPath]);

  return socketRef.current;
};