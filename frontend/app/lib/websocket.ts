import { useEffect, useRef, useCallback } from "react";
import { Job } from "../types/job";
import { useAuth } from "../context/AuthContext";

interface UseWebsocketProps {
  url: string; 
  onJobReceived: (job: Job) => void;
}

export function useWebsocket({ url, onJobReceived }: UseWebsocketProps) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Fortified: Track reconnect timers to prevent memory leaks
  const { isAuthenticated } = useAuth();

  const connect = useCallback(() => {
    // 1. Hard check: If the user is not authenticated, abort instantly.
    if (!isAuthenticated) return;
    
    // 2. Prevent duplicate connections if one is already open or connecting.
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) return;

    try {
      // 3. Attach token securely
      const authenticatedUrl = `${url}?token=${accessToken}`;
      
      // Premium Console Visual telemetry formatting
      console.log(
        "%c⚡ [WebSocket] Connecting to Core Pipeline Cache Stream...",
        "color: #10b981; font-weight: bold; background: rgba(16,185,129,0.1); padding: 2px 6px; rounded: 4px;"
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

      ws.onerror = () => {
        // Suppress the React stack crash by catching the error silently here
        console.warn(
          "%c⚠️ [WebSocket] Connection Interrupted or Aborted. Check server CORS configuration.",
          "color: #f59e0b; font-weight: bold;"
        );
      };

      ws.onclose = (event) => {
        console.log(
          `%c🔌 [WebSocket] Disconnected natively. Code: ${event.code}`,
          "color: #ef4444; font-weight: bold;"
        );
        
        // Clear the current reference so a new one can be built safely
        wsRef.current = null;

        // Clear any orphaned reconnect timers before spawning a new loop schedule
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        // 4. Fallback Reconnection Loop (3 seconds)
        reconnectTimeoutRef.current = setTimeout(() => {
          if (localStorage.getItem("access_token") && isAuthenticated) {
            console.log("%c🔄 [WebSocket] Attempting background reconnect...", "color: #3b82f6; font-weight: bold;");
            connect();
          }
        }, 3000); 
      };

    } catch (err) {
      console.error("❌ Failed to construct WebSocket pipeline initialization context:", err);
    }
  }, [url, isAuthenticated, onJobReceived]);

  useEffect(() => {
    // 5. Add a 500ms delay before initial connection to let React finish mounting safely
    const initTimer = setTimeout(() => {
      connect();
    }, 500);
    
    // Strict Teardown Lifecycle: Completely neutralizes all active and scheduled connections on unmount
    return () => {
      clearTimeout(initTimer);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (wsRef.current) {
        // Detach loop handlers instantly so the manual close action doesn't fire an auto-reconnect trigger cycle
        wsRef.current.onclose = null; 
        wsRef.current.onerror = null;
        wsRef.current.close(1000, "Component unmounting");
        wsRef.current = null;
      }
    };
  }, [connect]);

  return { socket: wsRef.current };
}