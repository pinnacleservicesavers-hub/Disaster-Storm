import { createContext, useContext, useEffect, useState } from "react";
import { websocketManager } from "@/lib/websocket";

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: any;
  sendMessage: (message: any) => void;
  subscribe: (channel: string, callback: (data: any) => void) => void;
  unsubscribe: (channel: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    const handleMessage = (data: any) => setLastMessage(data);

    websocketManager.on('connect', handleConnect);
    websocketManager.on('disconnect', handleDisconnect);
    websocketManager.on('message', handleMessage);

    // Initialize connection
    websocketManager.connect();

    return () => {
      websocketManager.off('connect', handleConnect);
      websocketManager.off('disconnect', handleDisconnect);
      websocketManager.off('message', handleMessage);
      websocketManager.disconnect();
    };
  }, []);

  const sendMessage = (message: any) => {
    websocketManager.send(message);
  };

  const subscribe = (channel: string, callback: (data: any) => void) => {
    websocketManager.subscribe(channel, callback);
  };

  const unsubscribe = (channel: string) => {
    websocketManager.unsubscribe(channel);
  };

  return (
    <WebSocketContext.Provider value={{
      isConnected,
      lastMessage,
      sendMessage,
      subscribe,
      unsubscribe
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}
