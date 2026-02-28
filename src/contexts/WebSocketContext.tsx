import React, { createContext, useContext, useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { useAuth } from './AuthContext';
import 'text-encoding'; 

interface WebSocketContextData {
  lastUpdate: { type: string; timestamp: number } | null;
}

const WebSocketContext = createContext<WebSocketContextData>({} as WebSocketContextData);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [lastUpdate, setLastUpdate] = useState<{ type: string; timestamp: number } | null>(null);

  useEffect(() => {
    if (!user?.companyId) return;

    // 👇 CORREÇÃO 1: Usar wss:// (Seguro) e remover o https:// do meio
    const socketUrl = 'wss://kairon-api.onrender.com/ws-native'; 

    const client = new Client({
      brokerURL: socketUrl,

      forceBinaryWSFrames: true, 
      appendMissingNULLonIncoming: true,

      reconnectDelay: 5000, // Tenta reconectar a cada 5s se cair
      
      // 👇 CORREÇÃO 2: Heartbeats! Impede que o Render feche a conexão por inatividade
      heartbeatIncoming: 10000, // Espera um ping do servidor a cada 10s
      heartbeatOutgoing: 10000, // Manda um ping pro servidor a cada 10s
      
      debug: (str) => {
        console.log('STOMP DEBUG:', str);
      },
      
      onConnect: () => {
        console.log('🟢 WebSocket Conectado via Nativo (WSS)!');

        client.subscribe(`/topic/updates/${user.companyId}`, (message) => {
          if (message.body) {
            const data = JSON.parse(message.body);
            console.log('🔔 Notificação recebida:', data.type);
            
            setLastUpdate({ type: data.type, timestamp: Date.now() });
          }
        });
      },
      
      onWebSocketClose: () => {
        console.log('🔴 Conexão Fechada (Close Event). Tentando reconectar em breve...');
      },
      
      onStompError: (frame) => {
        console.error('🔴 Erro no WebSocket (STOMP):', frame.headers['message']);
      },
    });

    client.activate();

    return () => {
      console.log("Desconectando WebSocket...");
      client.deactivate();
    };
  }, [user?.companyId]);

  return (
    <WebSocketContext.Provider value={{ lastUpdate }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}