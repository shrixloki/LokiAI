/**
 * Socket.IO Hook for Real-time Updates
 */

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5050';

export function useSocket(walletAddress?: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!walletAddress) return;

    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('🔌 Connected to AI Agents Socket server');
      // Join wallet-specific room
      socket.emit('join-wallet', walletAddress);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from Socket.IO server');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [walletAddress]);

  const subscribeToAgentUpdates = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('agent-update', callback);
    }
  };

  const runAgent = (agentType: string, config?: any) => {
    if (socketRef.current && walletAddress) {
      socketRef.current.emit('run-agent', {
        walletAddress,
        agentType,
        config: config || {}
      });
    }
  };

  const subscribeToAgentResults = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('agent-result', callback);
    }
  };

  const subscribeToAgentErrors = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('agent-error', callback);
    }
  };

  const subscribeToPortfolioUpdates = (callback: (data: any) => void) => {
    if (socketRef.current) {
      socketRef.current.on('portfolio:update', callback);
    }
  };

  const unsubscribe = (event: string) => {
    if (socketRef.current) {
      socketRef.current.off(event);
    }
  };

  return {
    socket: socketRef.current,
    subscribeToAgentUpdates,
    subscribeToPortfolioUpdates,
    subscribeToAgentResults,
    subscribeToAgentErrors,
    runAgent,
    unsubscribe,
  };
}