import { useEffect, useRef, useCallback } from "react";
import { Job } from "../types/job";
import { useAuth } from "../context/AuthContext";

interface UseWebsocketProps {
  url: string; 
  onJobReceived: (job: Job) => void;
}

export function useWebsocket({ url, onJobReceived }: UseWebsocketProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isAuthenticated } = useAuth();

  const connect = useCallback(() => {
    if (!isAuthenticated) return;
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) return;

    try {
      const authenticatedUrl = `${url}?token=${accessToken}`;
      
      // Beautiful Console Telemetry - Initialization Status Badge
      console.log(
        "%c⚡ [WebSocket] Initializing security streaming connection pipeline...",
        "color: #10b981; font-weight: bold; background: rgba(16,185,129,0.1); padding: 3px 6px; border-radius: 6px; border: 1px solid rgba(16,185,129,0.2);"
      );

      const ws = new WebSocket(authenticatedUrl);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const jobData: Job = JSON.parse(event.data);
          onJobReceived(jobData);
        } catch (error) {
          console.error("❌ Live packet structure parsing error:", error);
        }
      };

      ws.onerror = (event) => {
        // Silences the red error dump in the browser console cleanly
      };

      ws.onclose = (event) => {
        // Only log if it's a real backend rejection, not a React unmount (code 1000)
        if (event.code !== 1000) {
          console.log(
            `%c🔌 [WebSocket] Closed natively by remote host. Code: ${event.code}. Reason: ${event.reason || "No broadcast description provided"}`,
            "color: #f59e0b; font-weight: bold; background: rgba(245,158,11,0.05); padding: 2px 4px; border-radius: 4px;"
          );
        } else {
          console.log(
            "%c🔌 [WebSocket] Disconnected cleanly via teardown cleanup context.",
            "color: #94a3b8; font-style: italic;"
          );
        }
        
        wsRef.current = null;
        
        // Background Reconnection Loop
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          // Extra safety check: confirm token exists and user is authenticated before scheduling reconnect attempts
          if (localStorage.getItem("access_token") && isAuthenticated) {
            console.log(
              "%c🔄 [WebSocket] Reconnection threshold interval hit. Re-establishing socket feed channel...",
              "color: #3b82f6; font-weight: bold;"
            );
            connect();
          }
        }, 3000); 
      };

    } catch (err) {
      console.error("❌ Failed to construct WebSocket pipeline secure handshake instance:", err);
    }
  }, [url, isAuthenticated, onJobReceived]);

  useEffect(() => {
    let isMounted = true;

    // Wait 500ms before connecting. This completely bypasses the React Strict Mode 
    // double-mount bug, ensuring ghost connections are never opened!
    const initTimer = setTimeout(() => {
      if (isMounted) {
        connect();
      }
    }, 500);
    
    return () => {
      isMounted = false;
      clearTimeout(initTimer);
      
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        // Detach closure triggers immediately before calling close sequence to prevent accidental cyclic reconnection execution storms
        wsRef.current.onclose = null; 
        wsRef.current.onerror = null;
        wsRef.current.close(1000, "Component unmounting");
        wsRef.current = null;
      }
    };
  }, [connect]);

  return { socket: wsRef.current };
}