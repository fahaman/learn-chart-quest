import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBinancePrice } from "@/hooks/useBinancePrice";
import { AppNav } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, BookOpen, GraduationCap, TrendingDown, TrendingUp, Wallet } from "lucide-react";

const fmtMoney = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

const StatCard = ({ icon: Icon, label, value, hint, accent }: any) => (
  <div className="rounded-2xl bg-card-grad border border-border/60 p-5 shadow-elevated">
    <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="w-4 h-4 text-gold" /> {label}</div>
    <div className={`mt-2 font-display text-3xl font-bold font-mono-num ${accent ?? ""}`}>{value}</div>
    {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
  </div>
);

const MarketRow = ({ symbol }: { symbol: string }) => {
  const { price, change24h } = useBinancePrice(symbol);
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
      <div className="font-mono text-sm">{symbol}</div>
      <div className="flex items-center gap-3">
        <span className="font-mono-num text-sm">{price ? fmtMoney(price) : "—"}</span>
        <span className={`text-xs font-mono-num flex items-center gap-0.5 w-16 justify-end ${change24h !== null && change24h >= 0 ? "text-success" : "text-destructive"}`}>
          {change24h !== null ? (change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />) : null}
          {change24h !== null ? `${change24h >= 0 ? "+" : ""}${change24h.toFixed(2)}%` : "—"}
        </span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [cash, setCash] = useState(0);
  const [holdingsValue, setHoldingsValue] = useState(0);
  const [tradesCount, setTradesCount] = useState(0);
  const [doneLessons, setDoneLessons] = useState(0);
  const [totalLessons, setTotalLessons] = useState(0);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: prof }, { data: pos }, { count: tradeCount }, { data: rec }, { data: lessons }, { data: prog }] = await Promise.all([
        supabase.from("profiles").select("cash_balance").eq("id", user.id).maybeSingle(),
        supabase.from("positions").select("symbol,quantity,avg_price"),
        supabase.from("trades").select("*", { count: "exact", head: true }),
        supabase.from("trades").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("lessons").select("id"),
        supabase.from("lesson_progress").select("completed").eq("completed", true),
      ]);
      if (prof) setCash(Number(prof.cash_balance));
      const value = (pos ?? []).reduce((s, p: any) => s + Number(p.quantity) * Number(p.avg_price), 0);
      setHoldingsValue(value);
      setTradesCount(tradeCount ?? 0);
      setRecent(rec ?? []);
      setTotalLessons(lessons?.length ?? 0);
      setDoneLessons(prog?.length ?? 0);
    })();
  }, [user]);

  const portfolio = cash + holdingsValue;
  const pct = totalLessons ? Math.round((doneLessons / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNav />
      <main className="flex-1 container py-8 space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Your trading overview at a glance.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Wallet} label="Portfolio Value" value={fmtMoney(portfolio)} hint={`Cash ${fmtMoney(cash)} + Holdings ${fmtMoney(holdingsValue)}`} accent="text-gold" />
          <StatCard icon={BarChart3} label="Total Trades" value={tradesCount} hint="All-time executed" />
          <StatCard icon={GraduationCap} label="Learning" value={`${pct}%`} hint={`${doneLessons} / ${totalLessons} lessons`} />
          <StatCard icon={BookOpen} label="Free Cash" value={fmtMoney(cash)} hint="Available to deploy" />
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl bg-card-grad border border-border/60 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold">Recent trades</h2>
              <Link to="/workspace" className="text-xs text-gold hover:underline flex items-center gap-1">Open workspace <ArrowRight className="w-3 h-3" /></Link>
            </div>
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr><th className="text-left p-2">Time</th><th className="text-left p-2">Symbol</th><th className="text-left p-2">Side</th><th className="text-right p-2">Qty</th><th className="text-right p-2">Price</th></tr>
                </thead>
                <tbody>
                  {recent.map((t) => (
                    <tr key={t.id} className="border-t border-border/60">
                      <td className="p-2 text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString()}</td>
                      <td className="p-2 font-mono">{t.symbol}</td>
                      <td className={`p-2 font-semibold text-xs ${t.side === "BUY" ? "text-success" : "text-destructive"}`}>{t.side}</td>
                      <td className="p-2 text-right font-mono-num">{Number(t.quantity).toFixed(4)}</td>
                      <td className="p-2 text-right font-mono-num">{fmtMoney(Number(t.price))}</td>
                    </tr>
                  ))}
                  {recent.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground text-xs">No trades yet — head to the workspace to place your first paper trade.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded-2xl bg-card-grad border border-border/60 p-6">
            <h2 className="font-display font-semibold mb-3">Market snapshot</h2>
            <div>
              {["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"].map((s) => <MarketRow key={s} symbol={s} />)}
            </div>
            <Button asChild variant="hero" className="w-full mt-4"><Link to="/workspace">Trade now</Link></Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
