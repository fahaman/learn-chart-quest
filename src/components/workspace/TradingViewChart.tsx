import { useEffect, useRef } from "react";

declare global {
  interface Window { TradingView?: any }
}

let scriptPromise: Promise<void> | null = null;
const loadTV = () => {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (window.TradingView) return resolve();
    const s = document.createElement("script");
    s.src = "https://s3.tradingview.com/tv.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return scriptPromise;
};

export const TradingViewChart = ({ symbol }: { symbol: string }) => {
  const containerId = useRef(`tv_${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    let mounted = true;
    loadTV().then(() => {
      if (!mounted || !window.TradingView) return;
      const el = document.getElementById(containerId.current);
      if (el) el.innerHTML = "";
      new window.TradingView.widget({
        autosize: true,
        symbol: symbol.endsWith("USDT") ? `BINANCE:${symbol}` : symbol,
        interval: symbol.endsWith("USDT") ? "1" : "D",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#222831",
        enable_publishing: false,
        allow_symbol_change: false,
        container_id: containerId.current,
        studies: ["RSI@tv-basicstudies", "MAExp@tv-basicstudies", "MACD@tv-basicstudies"],
        backgroundColor: "rgba(34, 40, 49, 1)",
        gridColor: "rgba(57, 62, 70, 0.5)",
      });
    });
    return () => { mounted = false; };
  }, [symbol]);

  return <div id={containerId.current} className="w-full h-full min-h-[420px]" />;
};
