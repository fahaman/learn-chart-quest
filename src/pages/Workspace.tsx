import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBinancePrice } from "@/hooks/useBinancePrice";
import { TradingViewChart } from "@/components/workspace/TradingViewChart";
import { AISignal } from "@/components/workspace/AISignal";
import { AIChat } from "@/components/workspace/AIChat";
import { AppNav } from "@/components/AppNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Search, Trash2, TrendingDown, TrendingUp, Wallet, RefreshCw } from "lucide-react";

type Position = { id: string; symbol: string; quantity: number; avg_price: number };
type Trade = { id: string; symbol: string; side: string; quantity: number; price: number; total: number; created_at: string };
type Watch = { id: string; symbol: string };

const fmtMoney = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtNum = (n: number, d = 2) => n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

const Workspace = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [watchlist, setWatchlist] = useState<Watch[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [cash, setCash] = useState<number>(0);
  const [qty, setQty] = useState("0.01");
  const [newSym, setNewSym] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { price, change24h } = useBinancePrice(symbol);

  const refresh = async () => {
    if (!user) return;
    const [{ data: prof }, { data: pos }, { data: tr }, { data: wl }] = await Promise.all([
      supabase.from("profiles").select("cash_balance").eq("id", user.id).maybeSingle(),
      supabase.from("positions").select("*").order("updated_at", { ascending: false }),
      supabase.from("trades").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("watchlist").select("*").order("created_at"),
    ]);
    if (prof) setCash(Number(prof.cash_balance));
    setPositions((pos ?? []).map((p: any) => ({ ...p, quantity: Number(p.quantity), avg_price: Number(p.avg_price) })));
    setTrades((tr ?? []).map((t: any) => ({ ...t, quantity: Number(t.quantity), price: Number(t.price), total: Number(t.total) })));
    setWatchlist(wl ?? []);
  };

  useEffect(() => { refresh(); }, [user]);

  const currentPosition = useMemo(() => positions.find((p) => p.symbol === symbol), [positions, symbol]);

  // Compute live P&L per position for the active symbol; for others fall back to avg_price
  const portfolioValue = useMemo(() => {
    let total = cash;
    for (const p of positions) {
      const px = p.symbol === symbol && price ? price : p.avg_price;
      total += p.quantity * px;
    }
    return total;
  }, [cash, positions, symbol, price]);

  const submitOrder = async (side: "BUY" | "SELL") => {
    if (!price) { toast.error("Waiting for live price…"); return; }
    const q = Number(qty);
    if (!q || q <= 0) { toast.error("Enter a valid quantity"); return; }
    setSubmitting(true);
    const { error } = await supabase.rpc("execute_trade", {
      _symbol: symbol, _side: side, _quantity: q, _price: price,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${side} ${q} ${symbol} @ ${fmtMoney(price)}`);
    refresh();
  };

  const addSymbol = async (e: React.FormEvent) => {
    e.preventDefault();
    const s = newSym.trim().toUpperCase();
    if (!/^[A-Z0-9.\-]{2,15}$/.test(s)) { toast.error("Invalid symbol format"); return; }
    const { error } = await supabase.from("watchlist").insert({ user_id: user!.id, symbol: s });
    if (error) { toast.error(error.message); return; }
    setNewSym("");
    refresh();
  };

  const removeSymbol = async (id: string) => {
    await supabase.from("watchlist").delete().eq("id", id);
    refresh();
  };

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const restoreBalance = async () => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("profiles").update({ cash_balance: 10000 }).eq("id", user.id);
    setSubmitting(false);
    if (error) { toast.error("Failed to restore balance"); return; }
    toast.success("Demo balance restored to $10,000!");
    setCash(10000);
    // don't completely wipe trades just reset cash to give them a lifeline
  };

  const positionPnL = currentPosition && price
    ? (price - currentPosition.avg_price) * currentPosition.quantity
    : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNav />
      <div className="h-10 border-b border-border/60 bg-card/30 flex items-center px-4 gap-3 shrink-0">
        <div className="ml-auto flex items-center gap-2 px-3 py-1 rounded-md bg-muted/40 border border-border/60">
          <Wallet className="w-3.5 h-3.5 text-gold" />
          <span className="text-[11px] text-muted-foreground">Portfolio</span>
          <span className="font-mono-num font-semibold text-xs">{fmtMoney(portfolioValue)}</span>
        </div>
      </div>

      {/* Main grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[260px_1fr_320px] gap-px bg-border/60 min-h-0">
        {/* Watchlist */}
        <aside className="bg-card/40 p-4 overflow-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Watchlist</h2>
          </div>
          <form onSubmit={addSymbol} className="relative mb-3">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
            <Input 
              value={newSym} 
              onChange={(e) => setNewSym(e.target.value.toUpperCase())} 
              placeholder="Search or add (e.g. AAPL, BTCUSDT)" 
              className="h-8 pl-8 pr-8 text-[11px] font-mono bg-background" 
            />
            <Button type="submit" size="sm" variant="ghost" className="absolute right-0 top-0 h-8 px-2 text-muted-foreground">
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </form>
          <div className="space-y-1">
            {watchlist.map((w) => (
              <WatchRow key={w.id} item={w} active={w.symbol === symbol} onSelect={() => setSymbol(w.symbol)} onRemove={() => removeSymbol(w.id)} />
            ))}
            {watchlist.length === 0 && <div className="text-xs text-muted-foreground">Add a Binance pair to start.</div>}
          </div>
        </aside>

        {/* Chart */}
        <main className="bg-background flex flex-col min-h-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <div>
              <div className="font-display font-bold text-lg">{symbol}</div>
              <div className="text-xs text-muted-foreground">Binance · Live</div>
            </div>
            <div className="text-right">
              <div className="font-mono-num font-semibold text-xl">{price ? fmtMoney(price) : "—"}</div>
              {change24h !== null && (
                <div className={`text-xs font-mono-num flex items-center gap-1 justify-end ${change24h >= 0 ? "text-success" : "text-destructive"}`}>
                  {change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {change24h >= 0 ? "+" : ""}{change24h.toFixed(2)}% 24h
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 min-h-[420px]">
            <TradingViewChart symbol={symbol} />
          </div>
        </main>

        {/* Trade panel */}
        <aside className="bg-card/40 p-4 overflow-auto space-y-4">
          <AISignal symbol={symbol} />
          <div>

            <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Paper Trade</h2>
            <div className="rounded-lg bg-background/50 border border-border/60 p-3 space-y-3">
              <div className="flex justify-between text-xs items-center">
                <span className="text-muted-foreground">Cash</span>
                <span className="font-mono-num">{fmtMoney(cash)}</span>
              </div>
              {cash < 1 && (
                <Button size="sm" variant="outline" className="w-full text-xs h-7 text-gold border-gold/30 hover:bg-gold/10" disabled={submitting} onClick={restoreBalance}>
                  <RefreshCw className="w-3 h-3 mr-1.5" /> Restore Balance
                </Button>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Live price</span>
                <span className="font-mono-num">{price ? fmtMoney(price) : "—"}</span>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qty" className="text-xs">Quantity</Label>
                <Input id="qty" type="number" step="0.0001" min="0" value={qty} onChange={(e) => setQty(e.target.value)} className="font-mono h-9" />
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-border/60">
                <span className="text-muted-foreground">Order value</span>
                <span className="font-mono-num">{price ? fmtMoney(Number(qty || 0) * price) : "—"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button variant="success" disabled={submitting} onClick={() => submitOrder("BUY")}>Buy</Button>
                <Button variant="destructive" disabled={submitting} onClick={() => submitOrder("SELL")}>Sell</Button>
              </div>
            </div>
          </div>

          {currentPosition && (
            <div>
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Open Position</h2>
              <div className="rounded-lg bg-background/50 border border-border/60 p-3 text-sm space-y-1.5">
                <Row label="Quantity" value={fmtNum(currentPosition.quantity, 4)} />
                <Row label="Avg price" value={fmtMoney(currentPosition.avg_price)} />
                <Row label="Mark" value={price ? fmtMoney(price) : "—"} />
                <div className="flex justify-between pt-1 border-t border-border/60">
                  <span className="text-muted-foreground text-xs">Unrealized P&L</span>
                  <span className={`font-mono-num font-semibold ${positionPnL >= 0 ? "text-success" : "text-destructive"}`}>
                    {positionPnL >= 0 ? "+" : ""}{fmtMoney(positionPnL)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Bottom: positions + trade history */}
      <section className="border-t border-border/60 bg-card/30 p-4 grid md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Holdings ({positions.length})</h3>
          <div className="rounded-lg border border-border/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr><th className="text-left p-2">Symbol</th><th className="text-right p-2">Qty</th><th className="text-right p-2">Avg</th><th className="text-right p-2">Value</th></tr>
              </thead>
              <tbody>
                {positions.map((p) => {
                  const px = p.symbol === symbol && price ? price : p.avg_price;
                  return (
                    <tr key={p.id} className="border-t border-border/60 hover:bg-muted/20 cursor-pointer" onClick={() => setSymbol(p.symbol)}>
                      <td className="p-2 font-mono">{p.symbol}</td>
                      <td className="p-2 text-right font-mono-num">{fmtNum(p.quantity, 4)}</td>
                      <td className="p-2 text-right font-mono-num">{fmtMoney(p.avg_price)}</td>
                      <td className="p-2 text-right font-mono-num">{fmtMoney(p.quantity * px)}</td>
                    </tr>
                  );
                })}
                {positions.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground text-xs">No open positions yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Trade History</h3>
          <div className="rounded-lg border border-border/60 overflow-hidden max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground sticky top-0">
                <tr><th className="text-left p-2">Time</th><th className="text-left p-2">Symbol</th><th className="text-left p-2">Side</th><th className="text-right p-2">Qty</th><th className="text-right p-2">Price</th></tr>
              </thead>
              <tbody>
                {trades.map((t) => (
                  <tr key={t.id} className="border-t border-border/60">
                    <td className="p-2 text-xs text-muted-foreground">{new Date(t.created_at).toLocaleTimeString()}</td>
                    <td className="p-2 font-mono">{t.symbol}</td>
                    <td className={`p-2 font-semibold text-xs ${t.side === "BUY" ? "text-success" : "text-destructive"}`}>{t.side}</td>
                    <td className="p-2 text-right font-mono-num">{fmtNum(t.quantity, 4)}</td>
                    <td className="p-2 text-right font-mono-num">{fmtMoney(t.price)}</td>
                  </tr>
                ))}
                {trades.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground text-xs">No trades yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <AIChat symbol={symbol} />
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between"><span className="text-muted-foreground text-xs">{label}</span><span className="font-mono-num">{value}</span></div>
);

const WatchRow = ({ item, active, onSelect, onRemove }: { item: Watch; active: boolean; onSelect: () => void; onRemove: () => void }) => {
  const { price, change24h } = useBinancePrice(item.symbol);
  return (
    <div className={`group flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition ${active ? "bg-primary/10 ring-gold" : "hover:bg-muted/40"}`} onClick={onSelect}>
      <div className="flex-1 min-w-0">
        <div className="font-mono text-xs">{item.symbol}</div>
        <div className="text-[10px] text-muted-foreground font-mono-num">{price ? fmtMoney(price) : "—"}</div>
      </div>
      <div className={`text-[11px] font-mono-num ${change24h !== null && change24h >= 0 ? "text-success" : "text-destructive"}`}>
        {change24h !== null ? `${change24h >= 0 ? "+" : ""}${change24h.toFixed(1)}%` : "—"}
      </div>
      <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default Workspace;
