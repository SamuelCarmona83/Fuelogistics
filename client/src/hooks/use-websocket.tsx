import { useEffect, useRef } from 'react';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function useWebSocket(onNotification?: (notification: any) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Create WebSocket connection on dedicated path
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use window.location.port or default to 5000 if not set
    const port = window.location.port || '5000';
    const wsUrl = `${protocol}//${window.location.hostname}:${port}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'TRIP_CREATED':
            // Invalidate trips query to refresh data
            queryClient.invalidateQueries({ queryKey: ['/api/viajes'] });
            toast({
              title: 'Nuevo viaje creado',
              description: `Viaje de ${message.data.conductor} ha sido añadido`,
            });
            // Add to notifications
            if (onNotification) {
              onNotification({
                id: Date.now(),
                title: 'Nuevo viaje creado',
                message: `Viaje de ${message.data.conductor} hacia ${message.data.destino}`,
                time: 'ahora',
                read: false
              });
            }
            break;
            
          case 'TRIP_UPDATED':
            // Invalidate trips query to refresh data
            queryClient.invalidateQueries({ queryKey: ['/api/viajes'] });
            toast({
              title: 'Viaje actualizado',
              description: `Viaje de ${message.data.conductor} ha sido modificado`,
            });
            // Add to notifications
            if (onNotification) {
              onNotification({
                id: Date.now(),
                title: 'Viaje actualizado',
                message: `Viaje de ${message.data.conductor} ha sido modificado`,
                time: 'ahora',
                read: false
              });
            }
            break;
            
          case 'TRIP_DELETED':
            // Invalidate trips query to refresh data
            queryClient.invalidateQueries({ queryKey: ['/api/viajes'] });
            toast({
              title: 'Viaje cancelado',
              description: 'Un viaje ha sido cancelado',
            });
            // Add to notifications
            if (onNotification) {
              onNotification({
                id: Date.now(),
                title: 'Viaje cancelado',
                message: 'Un viaje ha sido cancelado por otro usuario',
                time: 'ahora',
                read: false
              });
            }
            break;
            
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [toast]);

  return wsRef.current;
}