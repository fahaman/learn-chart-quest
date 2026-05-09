import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain, Loader2, RefreshCw } from "lucide-react";
import { analyzeSymbol, SignalResult } from "@/lib/technicalAnalysis";

export const AISignal = ({ symbol }: { symbol: string }) => {
  const [signal, setSignal] = useState<SignalResult | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setSignal(null);

    try {
      const result = await analyzeSymbol(symbol);
      setSignal(result);
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
          <div className="grid grid-cols-4 gap-1 text-[10px] font-mono-num text-foreground/70 pt-2 border-t border-current/20">
            <div>RSI <span className="text-foreground">{signal.indicators.rsi}</span></div>
            <div>MACD <span className="text-foreground">{signal.indicators.hist >= 0 ? "+" : ""}{signal.indicators.hist}</span></div>
            <div>Trend <span className="text-foreground capitalize">{signal.indicators.trend}</span></div>
            <div>Pattern <span className="text-foreground">{signal.indicators.pattern !== "None" ? signal.indicators.pattern : "—"}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};
