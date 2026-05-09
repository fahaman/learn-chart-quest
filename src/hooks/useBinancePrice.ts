import { useEffect, useRef, useState } from "react";

/** Subscribes to Binance live trade stream for one symbol (e.g. BTCUSDT). */
export function useBinancePrice(symbol: string) {
  const [price, setPrice] = useState<number | null>(null);
  const [change24h, setChange24h] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!symbol) return;
    let isActive = true;
    const s = symbol.toLowerCase();

    const cleanup = () => {
      isActive = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    
    // Always clean up existing connections first before starting a new one
    cleanup();
    isActive = true;

    // Helper to generate deterministic price based on symbol name
    const getBasePrice = (sym: string) => {
      let hash = 0;
      for (let i = 0; i < sym.length; i++) hash = sym.charCodeAt(i) + ((hash << 5) - hash);
      return Math.abs(hash % 1000) + 15; // base price between 15 and 1015
    };

    const startSimulation = () => {
      if (!isActive) return;
      const basePrice = getBasePrice(symbol);
      const change = (Math.random() * 4) - 2; 
      
      let currentSimulationPrice = basePrice;
      setPrice(currentSimulationPrice);
      setChange24h(change);

      intervalRef.current = window.setInterval(() => {
        if (!isActive) return;
        const tickMovement = currentSimulationPrice * (Math.random() - 0.5) * 0.001; 
        currentSimulationPrice = currentSimulationPrice + tickMovement;
        setPrice(currentSimulationPrice);
      }, 1500);
    };

    fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol.toUpperCase()}`)
      .then((response) => {
        if (!response.ok) throw new Error("Not a valid Binance pair");
        return response.json();
      })
      .then((tickerData) => {
        if (!isActive) return;
        if (tickerData && tickerData.lastPrice) {
          setPrice(parseFloat(tickerData.lastPrice));
          setChange24h(parseFloat(tickerData.priceChangePercent));
        }

        // Connect to Binance WebSocket for real-time price updates
        const binanceSocket = new WebSocket(`wss://stream.binance.com:9443/ws/${s}@ticker`);
        wsRef.current = binanceSocket;
        
        binanceSocket.onmessage = (event) => {
          if (!isActive) return;
          try {
            const liveTicker = JSON.parse(event.data);
            if (liveTicker.c) setPrice(parseFloat(liveTicker.c));
            if (liveTicker.P) setChange24h(parseFloat(liveTicker.P));
          } catch (error) {
             console.error("Failed to parse Binance websocket data", error);
          }
        };
      })
      .catch(() => {
        startSimulation();
      });

    return cleanup;
  }, [symbol]);

  return { price, change24h };
}
