// AI Trading Signal: pulls Binance klines, computes RSI/EMA20/EMA50/MACD,
// then asks Lovable AI to label the regime and return a Buy/Sell/Hold call
// with a beginner-friendly explanation.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  let prev = values[0];
  out.push(prev);
  for (let i = 1; i < values.length; i++) {
    const v = values[i] * k + prev * (1 - k);
    out.push(v);
    prev = v;
  }
  return out;
}

function rsi(values: number[], period = 14): number {
  if (values.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1];
    if (d >= 0) gains += d; else losses -= d;
  }
  let avgG = gains / period, avgL = losses / period;
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    const g = d > 0 ? d : 0;
    const l = d < 0 ? -d : 0;
    avgG = (avgG * (period - 1) + g) / period;
    avgL = (avgL * (period - 1) + l) / period;
  }
  if (avgL === 0) return 100;
  const rs = avgG / avgL;
  return 100 - 100 / (1 + rs);
}

function macd(values: number[]) {
  const ema12 = ema(values, 12);
  const ema26 = ema(values, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = ema(macdLine.slice(-50), 9);
  const last = macdLine[macdLine.length - 1];
  const sig = signalLine[signalLine.length - 1];
  return { macd: last, signal: sig, hist: last - sig };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { symbol = "BTCUSDT" } = await req.json().catch(() => ({}));
    const sym = String(symbol).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
    if (!sym) throw new Error("Invalid symbol");

    const klRes = await fetch(`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=1h&limit=200`);
    if (!klRes.ok) throw new Error(`Binance error: ${klRes.status}`);
    const kl = await klRes.json() as any[][];
    const closes = kl.map((c) => parseFloat(c[4]));
    const last = closes[closes.length - 1];

    const ema20 = ema(closes, 20);
    const ema50 = ema(closes, 50);
    const e20 = ema20[ema20.length - 1];
    const e50 = ema50[ema50.length - 1];
    const r = rsi(closes);
    const m = macd(closes);

    let trend: "bullish" | "bearish" | "sideways" = "sideways";
    if (e20 > e50 && last > e20) trend = "bullish";
    else if (e20 < e50 && last < e20) trend = "bearish";

    let bias: "BUY" | "SELL" | "HOLD" = "HOLD";
    let confidence = 50;
    if (trend === "bullish" && r < 70 && m.hist > 0) { bias = "BUY"; confidence = 60 + Math.min(25, Math.round((70 - r))); }
    else if (trend === "bearish" && r > 30 && m.hist < 0) { bias = "SELL"; confidence = 60 + Math.min(25, Math.round(r - 30)); }
    else if (r >= 70) { bias = "SELL"; confidence = 60; }
    else if (r <= 30) { bias = "BUY"; confidence = 60; }
    confidence = Math.max(40, Math.min(92, confidence));

    const indicators = {
      price: last, rsi: +r.toFixed(1), ema20: +e20.toFixed(4), ema50: +e50.toFixed(4),
      macd: +m.macd.toFixed(4), signal: +m.signal.toFixed(4), hist: +m.hist.toFixed(4), trend,
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let explanation = `Trend is ${trend}. RSI ${indicators.rsi}, MACD histogram ${indicators.hist}. Suggested action: ${bias}.`;
    if (LOVABLE_API_KEY) {
      const prompt = `You are a friendly trading tutor. The user is a beginner.
Symbol: ${sym}
Indicators: ${JSON.stringify(indicators)}
Computed bias: ${bias} (${confidence}% confidence)

Write a 2-3 sentence plain-English explanation of *why* this bias makes sense given the indicators. Avoid jargon. Do not give financial advice; this is for educational paper trading.`;
      try {
        const ai = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You explain trading signals simply, in 2-3 sentences." },
              { role: "user", content: prompt },
            ],
          }),
        });
        if (ai.ok) {
          const j = await ai.json();
          explanation = j.choices?.[0]?.message?.content?.trim() || explanation;
        } else if (ai.status === 429) {
          explanation += " (AI explanation unavailable: rate limit)";
        } else if (ai.status === 402) {
          explanation += " (AI explanation unavailable: add credits in Settings → Workspace → Usage)";
        }
      } catch (_) { /* fall back to local explanation */ }
    }

    return new Response(JSON.stringify({ symbol: sym, bias, confidence, indicators, explanation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
