import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Loader2, MessageSquare, Send, X } from "lucide-react";
import { toast } from "sonner";
import { analyzeSymbol } from "@/lib/technicalAnalysis";

type Msg = { role: "user" | "assistant"; content: string };

export const AIChat = ({ symbol }: { symbol: string }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(() => {
    const saved = localStorage.getItem(`ai_chat_history_${symbol}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Ignore JSON parse errors
      }
    }
    return [
      { role: "assistant", content: "Hi! I'm your trading tutor. Ask me anything — RSI, MACD, candlestick patterns, risk management…" },
    ];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(`ai_chat_history_${symbol}`, JSON.stringify(messages));
  }, [messages, symbol]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content === assistantSoFar.slice(0, last.content.length) && prev.length > next.length) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        if (prev.length === next.length) return [...prev, { role: "assistant", content: assistantSoFar }];
        return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
      });
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }));
    };

    try {
      const analysis = await analyzeSymbol(symbol);
      
      // Simulated AI Tutor Response
      await new Promise(resolve => setTimeout(resolve, 500)); // Network delay

      let reply = "";
      const lowerInput = text.toLowerCase();
      
      if (lowerInput.includes("buy") || lowerInput.includes("sell") || lowerInput.includes("hold") || lowerInput.includes("analyze") || lowerInput.includes("analysis") || lowerInput.includes("what to do") || lowerInput.includes("when to")) {
        reply = `Analyzing ${symbol}... ${analysis.explanation} 

Based on the data:
- The RSI is at ${analysis.indicators.rsi}
- The MACD histogram is ${analysis.indicators.hist}
- Current trend is ${analysis.indicators.trend}
${analysis.indicators.pattern !== "None" ? `- Detected pattern: ${analysis.indicators.pattern}\n` : ""}
The mathematical model and indicators align for a **${analysis.bias}** with ${analysis.confidence}% confidence. I highly recommend following this signal and using proper risk management!`;
      } else if (lowerInput.includes("rsi") || lowerInput.includes("macd")) {
        reply = `RSI (Relative Strength Index) measures momentum. A value > 70 is overbought (consider selling), < 30 is oversold (consider buying). Current RSI for ${symbol} is ${analysis.indicators.rsi}. MACD shows trend direction. Current MACD histogram is ${analysis.indicators.hist}.`;
      } else if (lowerInput.includes("risk")) {
        reply = "Risk management is critical. Never risk more than 1-2% of your total account balance on a single trade. Set strict stop-losses to protect your capital.";
      } else if (lowerInput.includes("hello") || lowerInput.includes("hi")) {
        reply = `Hello! I am your AI Trading Tutor. I can help you analyze ${symbol} or explain trading concepts. What would you like to know?`;
      } else {
        reply = `I'm analyzing ${symbol} for you... Based on the current mathematical models and chart patterns, here are the possibilities:
- Upwards (Bullish Breakout): If the price breaks above recent resistance with strong volume, it indicates upward momentum. A golden cross (EMA 20 crossing above EMA 50) and RSI > 50 would confirm this.
- Downwards (Bearish Breakdown): If the price breaks below current support, it could trigger a downtrend. Look for a death cross (EMA 20 below EMA 50) and MACD histogram turning negative.
- Sideways (Consolidation): If the price remains range-bound between support and resistance, with RSI hovering around 50, the market is consolidating. Wait for a clear breakout signal before taking a position to minimize risk.`;
      }

      // Simulate streaming response
      const words = reply.split(" ");
      for (let i = 0; i < words.length; i++) {
        await new Promise(r => setTimeout(r, 40)); // Stream delay
        upsert(words[i] + (i === words.length - 1 ? "" : " "));
      }
    } catch (e: any) {
      toast.error(e.message ?? "Chat failed");
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry — I couldn't reach the AI. Try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear the chat history?")) {
      const initialMessages: Msg[] = [{ role: "assistant", content: "Hi! I'm your trading tutor. Ask me anything — RSI, MACD, candlestick patterns, risk management…" }];
      setMessages(initialMessages);
      localStorage.setItem(`ai_chat_history_${symbol}`, JSON.stringify(initialMessages));
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-gold text-primary-foreground grid place-items-center shadow-gold animate-pulse-gold hover:scale-105 transition"
        aria-label="Open AI tutor"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 w-[min(380px,calc(100vw-2rem))] h-[min(560px,calc(100vh-2rem))] rounded-2xl bg-card border border-border/60 shadow-elevated flex flex-col overflow-hidden">
      <div className="h-12 flex items-center justify-between px-4 border-b border-border/60 bg-card-grad">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gold grid place-items-center"><Bot className="w-4 h-4 text-primary-foreground" /></div>
          <div>
            <div className="text-sm font-display font-semibold leading-none">AI Tutor</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Context: {symbol}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={clearHistory} className="text-xs text-muted-foreground hover:text-destructive">Clear</button>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] text-sm rounded-2xl px-3 py-2 leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/60 text-foreground"}`}>
              {m.content || (loading && i === messages.length - 1 ? "…" : "")}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="p-3 border-t border-border/60 flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about RSI, MACD, candles…" disabled={loading} />
        <Button type="submit" variant="hero" size="icon" disabled={loading || !input.trim()}>
          {loading ? <Loader2 className="animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>
    </div>
  );
};
