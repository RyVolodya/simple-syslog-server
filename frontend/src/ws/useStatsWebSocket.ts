import { useEffect } from "react";

export function useStatsWebSocket(onUpdate: (data: any[]) => void) {
  const ws = new WebSocket(`${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws`);

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === "last24h_stats" && Array.isArray(msg.data)) {
        onUpdate(msg.data);
      }
    } catch (err) {
      console.error("WebSocket parse error", err);
    }
  };

  return ws;
}
