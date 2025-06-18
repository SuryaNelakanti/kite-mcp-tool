import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

const useWebSocket = () => {
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectInterval = 5000; // 5 seconds
  const queryClient = useQueryClient();

  const connect = useCallback(() => {
    if (ws.current) {
      return;
    }

    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket connected');
      reconnectAttempts.current = 0; // Reset reconnect attempts on successful connection
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        // Handle different types of messages
        switch (message.type) {
          case 'ping':
            // Respond to ping with pong
            if (ws.current?.readyState === WebSocket.OPEN) {
              ws.current.send(JSON.stringify({ type: 'pong' }));
            }
            break;
            
          case 'notification':
            // Handle different notification types
            handleNotification(message.data);
            break;
            
          case 'order_update':
            // Invalidate orders query to refetch fresh data
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            // Show toast notification
            toast.success(`Order ${message.data.status}: ${message.data.tradingsymbol}`);
            break;
            
          case 'position_update':
            // Invalidate positions query
            queryClient.invalidateQueries({ queryKey: ['positions'] });
            break;
            
          default:
            console.log('Unhandled WebSocket message:', message);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    ws.current.onclose = (event) => {
      console.log('WebSocket disconnected:', event.reason);
      ws.current = null;
      
      // Attempt to reconnect if we haven't exceeded max attempts
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current += 1;
        const delay = reconnectInterval * Math.pow(2, reconnectAttempts.current - 1);
        console.log(`Attempting to reconnect in ${delay}ms...`);
        
        setTimeout(() => {
          if (reconnectAttempts.current <= maxReconnectAttempts) {
            connect();
          }
        }, delay);
      } else {
        console.error('Max reconnection attempts reached');
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [queryClient]);

  // Handle different types of notifications
  const handleNotification = useCallback((data: any) => {
    // Show toast notification based on notification type
    switch (data.type) {
      case 'error':
        toast.error(data.message || 'An error occurred');
        break;
        
      case 'success':
        toast.success(data.message || 'Operation successful');
        break;
        
      case 'warning':
        toast(data.message || 'Warning', { icon: '⚠️' });
        break;
        
      default:
        console.log('Unhandled notification:', data);
    }
  }, []);

  // Set up WebSocket connection on mount
  useEffect(() => {
    connect();
    
    // Clean up on unmount
    return () => {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [connect]);

  // Return WebSocket instance if needed by components
  return ws.current;
};

export default useWebSocket;
