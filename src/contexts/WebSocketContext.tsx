import React, { createContext, useContext, useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
// ❌ SockJS REMOVIDO: import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';
// Polyfill para React Native
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

    // 👇 MUDANÇA 1: Use 'ws://' e aponte para '/ws-native'
    // Se seu backend roda na porta 8080, a URL completa é essa:
    const socketUrl = 'ws://https://kairon-api.onrender.com/ws-native'; 

    const client = new Client({
      // 👇 MUDANÇA 2: Use brokerURL em vez de webSocketFactory
      brokerURL: socketUrl,

      // 👇 MUDANÇA 3: Configurações obrigatórias para React Native
      forceBinaryWSFrames: true, 
      appendMissingNULLonIncoming: true,

      reconnectDelay: 5000, // Tenta reconectar a cada 5s se cair
      
      debug: (str) => {
        console.log('STOMP DEBUG:', str);
      },
      
      onConnect: () => {
        console.log('🟢 WebSocket Conectado via Nativo!');

        // Se inscreve no canal da empresa do usuário
        client.subscribe(`/topic/updates/${user.companyId}`, (message) => {
          if (message.body) {
            const data = JSON.parse(message.body);
            console.log('🔔 Notificação recebida:', data.type);
            
            // Atualiza o estado global
            setLastUpdate({ type: data.type, timestamp: Date.now() });
          }
        });
      },
      
      onWebSocketClose: () => {
        console.log('🔴 Conexão Fechada (Close Event)');
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