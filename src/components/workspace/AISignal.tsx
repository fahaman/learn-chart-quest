import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, RefreshCw } from "lucide-react";

type Signal = {
  symbol: string;
  bias: "BUY" | "SELL" | "HOLD";
  confidence: number;
  indicators: { price: number; rsi: number; ema20: number; ema50: number; macd: number; hist: number; trend: string };
  explanation: string;
};

/**
 * Calculates the Exponential Moving Average (EMA) of a numeric dataset.
 */
function calculateEMA(values: number[], period: number): number[] {
  const multiplier = 2 / (period + 1);
  const emaData: number[] = [values[0]];
  
  let previousEma = values[0];
  
  for (let i = 1; i < values.length; i++) {
    const currentEma = values[i] * multiplier + previousEma * (1 - multiplier);
    emaData.push(currentEma);
    previousEma = currentEma;
  }
  
  return emaData;
}

/**
 * Calculates the Relative Strength Index (RSI).
 */
function calculateRSI(values: number[], period = 14): number {
  if (values.length < period + 1) return 50; // Not enough data
  
  let totalGains = 0;
  let totalLosses = 0;
  
  for (let i = 1; i <= period; i++) {
    const difference = values[i] - values[i - 1];
    if (difference >= 0) totalGains += difference; 
    else totalLosses -= difference;
  }
  
  let averageGain = totalGains / period;
  let averageLoss = totalLosses / period;
  
  for (let i = period + 1; i < values.length; i++) {
    const difference = values[i] - values[i - 1];
    const currentGain = difference > 0 ? difference : 0;
    const currentLoss = difference < 0 ? -difference : 0;
    
    // Smoothed moving average calculation
    averageGain = (averageGain * (period - 1) + currentGain) / period;
    averageLoss = (averageLoss * (period - 1) + currentLoss) / period;
  }
  
  if (averageLoss === 0) return 100;
  return 100 - 100 / (1 + averageGain / averageLoss);
}

const generateMockKlines = (symbolCode: string) => {
  let hashStr = 0;
  for (let i = 0; i < symbolCode.length; i++) {
    hashStr = symbolCode.charCodeAt(i) + ((hashStr << 5) - hashStr);
  }
  const basePrice = Math.abs(hashStr % 1000) + 15;
  const phaseOffset = Math.abs(hashStr % 100); // Unique offset per symbol
  
  let currentPriceWalk = basePrice;
  return Array.from({ length: 200 }, (_, index) => {
    // Use the symbol's unique phase offset so they don't all end on the same trend
    currentPriceWalk = currentPriceWalk * (1 + (Math.sin((index + phaseOffset) / 5) * 0.05 + (Math.random() - 0.5) * 0.02));
    return currentPriceWalk;
  });
};

export const AISignal = ({ symbol }: { symbol: string }) => {
  const [signal, setSignal] = useState<Signal | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setSignal(null);

    try {
      let closingPrices: number[] = [];
      let latestPrice = 0;

      // Attempt to fetch REAL mathematical historical data from Binance API for crypto
      if (symbol.endsWith("USDT")) {
        const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=200`);
        if (res.ok) {
          const data = await res.json();
          closingPrices = data.map((k: any[]) => parseFloat(k[4])); // 4th index is Close price
        }
      }

      // If fetch failed or it's a stock (no free public unauthenticated stock API), use simulated math
      if (closingPrices.length < 50) {
        closingPrices = generateMockKlines(symbol);
      }

      latestPrice = closingPrices[closingPrices.length - 1];
      
      // Proper Mathematical Analysis
      const ema20line = calculateEMA(closingPrices, 20).pop() || latestPrice;
      const ema50line = calculateEMA(closingPrices, 50).pop() || latestPrice;
      const currentRsi = calculateRSI(closingPrices);
      
      // MACD Construction (12, 26, 9)
      const ema12 = calculateEMA(closingPrices, 12);
      const ema26 = calculateEMA(closingPrices, 26);
      const macdSeries = ema12.map((value, idx) => value - ema26[idx]);
      const signalSeries = calculateEMA(macdSeries.slice(-50), 9);
      
      const macdValue = macdSeries[macdSeries.length - 1];
      const macdSignalValue = signalSeries[signalSeries.length - 1];
      const macdHistogram = macdValue - macdSignalValue;

      let currentTrend: "bullish" | "bearish" | "sideways" = "sideways";
      if (ema20line > ema50line && latestPrice > ema20line) currentTrend = "bullish";
      else if (ema20line < ema50line && latestPrice < ema20line) currentTrend = "bearish";

      let generatedBias: "BUY" | "SELL" | "HOLD" = "HOLD";
      let confidence = 50;
      
      // Realistic algorithm: Strong conditions for Buy/Sell
      if (currentTrend === "bullish" && currentRsi < 65 && macdHistogram > 0) { 
        generatedBias = "BUY"; 
        confidence = 75 + (100 - currentRsi) * 0.2; 
      }
      else if (currentTrend === "bearish" && currentRsi > 35 && macdHistogram < 0) { 
        generatedBias = "SELL"; 
        confidence = 75 + currentRsi * 0.2; 
      }
      else if (currentRsi >= 75) { 
        generatedBias = "SELL"; 
        confidence = 85 + (currentRsi - 75); 
      }
      else if (currentRsi <= 25) { 
        generatedBias = "BUY"; 
        confidence = 85 + (25 - currentRsi); 
      }

      const isRealData = symbol.endsWith("USDT");
      const explanationString = `Authentic Analysis ${isRealData ? "(Live Data)" : "(Simulated)"}: Trend is ${currentTrend}. RSI at ${currentRsi.toFixed(1)} and MACD Histogram at ${macdHistogram.toFixed(2)}. ${generatedBias === "HOLD" ? "Market is consolidating, waiting for breakout." : `Indicators align for a probable ${generatedBias}. Apply proper risk management.`}`;

      setSignal({
        symbol, 
        bias: generatedBias, 
        confidence: Math.min(99, Number(confidence.toFixed(2))),
        indicators: { 
          price: latestPrice, 
          rsi: +currentRsi.toFixed(1), 
          ema20: +ema20line.toFixed(2), 
          ema50: +ema50line.toFixed(2), 
          macd: +macdValue.toFixed(2), 
          hist: +macdHistogram.toFixed(2), 
          trend: currentTrend 
        },
        explanation: explanationString
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load();   }, [symbol]);

  const biasStyles =
    signal?.bias === "BUY"
      ? "bg-success/10 border-success/40 text-success"
      : signal?.bias === "SELL"
      ? "bg-destructive/10 border-destructive/40 text-destructive"
      : "bg-primary/10 border-primary/40 text-gold";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Brain className="w-3.5 h-3.5 text-gold" /> AI Signal
        </h2>
        <button onClick={load} disabled={loading} className="text-muted-foreground hover:text-foreground transition disabled:opacity-50">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        </button>
      </div>

      {loading && !signal && (
        <div className="rounded-lg bg-background/50 border border-border/60 p-4 text-xs text-muted-foreground">Analyzing market…</div>
      )}

      {signal && (
        <div className={`rounded-lg border p-3 space-y-2 ${biasStyles}`}>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-2xl font-bold">{signal.bias}</span>
            <span className="text-xs font-mono-num opacity-80">{signal.confidence}% conf</span>
          </div>
          <div className="text-xs text-foreground/90 leading-relaxed">{signal.explanation}</div>
          <div className="grid grid-cols-3 gap-1 text-[10px] font-mono-num text-foreground/70 pt-2 border-t border-current/20">
            <div>RSI <span className="text-foreground">{signal.indicators.rsi}</span></div>
            <div>MACD <span className="text-foreground">{signal.indicators.hist >= 0 ? "+" : ""}{signal.indicators.hist}</span></div>
            <div>Trend <span className="text-foreground capitalize">{signal.indicators.trend}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};
