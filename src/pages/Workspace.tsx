import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "@/lib/api";
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

type Position = { _id: string; symbol: string; quantity: number; avg_price: number };
type Trade = { _id: string; symbol: string; side: string; quantity: number; price: number; total: number; created_at: string };
type Watch = { _id: string; symbol: string };

/**
 * Formats a number as a standard USD currency string.
 */
const formatMoney = (amount: number) =>
  amount.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatNumber = (amount: number, decimals = 2) => 
  amount.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const Workspace = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  // State for the active symbol currently loaded in the charting layout
  const [activeSymbol, setActiveSymbol] = useState("BTCUSDT");
  
  // Portfolio state
  const [watchlist, setWatchlist] = useState<Watch[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [cashBalance, setCashBalance] = useState<number>(0);
  
  // Trade execution state
  const [orderQuantity, setOrderQuantity] = useState("0.01");
  const [newWatchlistSymbol, setNewWatchlistSymbol] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live market data
  const { price: livePrice, change24h } = useBinancePrice(activeSymbol);

  /**
   * Refreshes the user's entire portfolio state from the backend.
   */
  const refreshPortfolio = async () => {
    if (!user) return;
    try {
      const data = await apiFetch("/trade/portfolio");
      setCashBalance(data.cash_balance);
      setPositions(data.positions);
      setTrades(data.trades);
      setWatchlist(data.watchlist);
    } catch (error: unknown) {
      toast.error("Error refreshing portfolio: " + (error as Error).message);
    }
  };

  // Fetch initial portfolio state on load
  useEffect(() => { 
    refreshPortfolio(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Determine the user's current open position for the actively viewed symbol
  const currentPosition = useMemo(() => 
    positions.find((position) => position.symbol === activeSymbol), 
  [positions, activeSymbol]);

  /**
   * Computes the total net liquidation value of the portfolio.
   * It calculates the live P&L for the currently viewed asset, and falls back to
   * average price for background assets.
   */
  const portfolioValue = useMemo(() => {
    let totalValue = cashBalance;
    for (const position of positions) {
      const currentPrice = position.symbol === activeSymbol && livePrice ? livePrice : position.avg_price;
      totalValue += position.quantity * currentPrice;
    }
    return totalValue;
  }, [cashBalance, positions, activeSymbol, livePrice]);

  /**
   * Executes a paper trade.
   */
  const handleOrderSubmission = async (tradeSide: "BUY" | "SELL") => {
    if (!livePrice) { 
      toast.error("Waiting for real-time price feed to connect..."); 
      return; 
    }
    
    // Validate the order quantity
    const parsedQuantity = Number(orderQuantity);
    if (!parsedQuantity || parsedQuantity <= 0) { 
      toast.error("Please enter a valid numeric quantity."); 
      return; 
    }
    
    setIsSubmitting(true);
    try {
      // Send trade execution request to the Node.js backend
      await apiFetch("/trade/execute", {
        method: "POST",
        body: JSON.stringify({ 
          symbol: activeSymbol, 
          side: tradeSide, 
          quantity: parsedQuantity, 
          price: livePrice 
        }),
      });
      
      toast.success(`Successfully executed ${tradeSide} for ${parsedQuantity} ${activeSymbol} @ ${formatMoney(livePrice)}`);
      refreshPortfolio(); // Sync new balances immediately
    } catch (error: unknown) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Adds a new symbol to the user's permanent watchlist.
   */
  const handleAddToWatchlist = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanSymbol = newWatchlistSymbol.trim().toUpperCase();
    
    // Validate basic alphanumeric exchange prefix constraints (e.g. NSE:TCS)
    if (!/^[A-Z0-9.\-:]{2,20}$/.test(cleanSymbol)) { 
      toast.error("Invalid symbol format provided. Please check and try again."); 
      return; 
    }
    
    try {
      await apiFetch("/trade/watchlist", {
        method: "POST",
        body: JSON.stringify({ symbol: cleanSymbol }),
      });
      setNewWatchlistSymbol(""); // Clear the input field
      refreshPortfolio(); // Update the UI watchlist
    } catch (error: unknown) {
       toast.error((error as Error).message);
    }
  };

  /**
   * Removes a tracking item from the watchlist.
   */
  const handleRemoveFromWatchlist = async (idToRemove: string) => {
    try {
      await apiFetch(`/trade/watchlist/${idToRemove}`, { method: "DELETE" });
      refreshPortfolio();
    } catch (error: unknown) {
      toast.error((error as Error).message);
    }
  };

  const handleSignOut = async () => { 
    await signOut(); 
    navigate("/"); 
  };

  const restoreBalance = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await apiFetch("/trade/restore-balance", { method: "POST" });
      toast.success("Demo balance restored to $10,000!");
      setCashBalance(10000);
    } catch (error: unknown) {
      toast.error("Failed to restore balance");
    } finally {
      setIsSubmitting(false);
    }
  };

  const positionPnL = currentPosition && livePrice
    ? (livePrice - currentPosition.avg_price) * currentPosition.quantity
    : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNav />
      <div className="h-10 border-b border-border/60 bg-card/30 flex items-center px-4 gap-3 shrink-0">
        <div className="ml-auto flex items-center gap-2 px-3 py-1 rounded-md bg-muted/40 border border-border/60">
          <Wallet className="w-3.5 h-3.5 text-gold" />
          <span className="text-[11px] text-muted-foreground">Portfolio</span>
          <span className="font-mono-num font-semibold text-xs">{formatMoney(portfolioValue)}</span>
        </div>
      </div>

      {/* Main grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[260px_1fr_320px] gap-px bg-border/60 min-h-0">
        {/* Watchlist */}
        <aside className="bg-card/40 p-4 overflow-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Watchlist</h2>
          </div>
          <form onSubmit={handleAddToWatchlist} className="relative mb-3">
            <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-muted-foreground" />
            <Input 
              value={newWatchlistSymbol} 
              onChange={(e) => setNewWatchlistSymbol(e.target.value.toUpperCase())} 
              placeholder="Search or add (e.g. NSE:TCS, AAPL, BTCUSDT)" 
              className="h-8 pl-8 pr-8 text-[11px] font-mono bg-background" 
            />
            <Button type="submit" size="sm" variant="ghost" className="absolute right-0 top-0 h-8 px-2 text-muted-foreground">
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </form>
          <div className="space-y-1">
            {watchlist.map((watchlistItem) => (
              <WatchRow 
                key={watchlistItem._id} 
                item={watchlistItem} 
                active={watchlistItem.symbol === activeSymbol} 
                onSelect={() => setActiveSymbol(watchlistItem.symbol)} 
                onRemove={() => handleRemoveFromWatchlist(watchlistItem._id)} 
              />
            ))}
            {watchlist.length === 0 && <div className="text-xs text-muted-foreground">Add a Binance pair to start.</div>}
          </div>
        </aside>

        {/* Chart */}
        <main className="bg-background flex flex-col min-h-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <div>
              <div className="font-display font-bold text-lg">{activeSymbol}</div>
              <div className="text-xs text-muted-foreground">{activeSymbol.endsWith("USDT") ? "Crypto" : "Equities"} · Live</div>
            </div>
            <div className="text-right">
              <div className="font-mono-num font-semibold text-xl">{livePrice ? formatMoney(livePrice) : "—"}</div>
              {change24h !== null && (
                <div className={`text-xs font-mono-num flex items-center gap-1 justify-end ${change24h >= 0 ? "text-success" : "text-destructive"}`}>
                  {change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {change24h >= 0 ? "+" : ""}{change24h.toFixed(2)}% 24h
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 min-h-[420px]">
            <TradingViewChart symbol={activeSymbol} />
          </div>
        </main>

        {/* Trade panel */}
        <aside className="bg-card/40 p-4 overflow-auto space-y-4">
          <AISignal symbol={activeSymbol} />
          <div>

            <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Paper Trade</h2>
            <div className="rounded-lg bg-background/50 border border-border/60 p-3 space-y-3">
              <div className="flex justify-between text-xs items-center">
                <span className="text-muted-foreground">Cash</span>
                <span className="font-mono-num">{formatMoney(cashBalance)}</span>
              </div>
              {cashBalance < 1 && (
                <Button size="sm" variant="outline" className="w-full text-xs h-7 text-gold border-gold/30 hover:bg-gold/10" disabled={isSubmitting} onClick={restoreBalance}>
                  <RefreshCw className="w-3 h-3 mr-1.5" /> Restore Balance
                </Button>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Live price</span>
                <span className="font-mono-num">{livePrice ? formatMoney(livePrice) : "—"}</span>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qty" className="text-xs">Quantity</Label>
                <Input id="qty" type="number" step="0.0001" min="0" value={orderQuantity} onChange={(e) => setOrderQuantity(e.target.value)} className="font-mono h-9" />
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-border/60">
                <span className="text-muted-foreground">Order value</span>
                <span className="font-mono-num">{livePrice ? formatMoney(Number(orderQuantity || 0) * livePrice) : "—"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button variant="success" disabled={isSubmitting} onClick={() => handleOrderSubmission("BUY")}>Buy</Button>
                <Button variant="destructive" disabled={isSubmitting} onClick={() => handleOrderSubmission("SELL")}>Sell</Button>
              </div>
            </div>
          </div>

          {currentPosition && (
            <div>
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Open Position</h2>
              <div className="rounded-lg bg-background/50 border border-border/60 p-3 text-sm space-y-1.5">
                <Row label="Quantity" value={formatNumber(currentPosition.quantity, 4)} />
                <Row label="Avg price" value={formatMoney(currentPosition.avg_price)} />
                <Row label="Mark" value={livePrice ? formatMoney(livePrice) : "—"} />
                <div className="flex justify-between pt-1 border-t border-border/60">
                  <span className="text-muted-foreground text-xs">Unrealized P&L</span>
                  <span className={`font-mono-num font-semibold ${positionPnL >= 0 ? "text-success" : "text-destructive"}`}>
                    {positionPnL >= 0 ? "+" : ""}{formatMoney(positionPnL)}
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
                  const px = p.symbol === activeSymbol && livePrice ? livePrice : p.avg_price;
                  return (
                    <tr key={p._id} className="border-t border-border/60 hover:bg-muted/20 cursor-pointer" onClick={() => setActiveSymbol(p.symbol)}>
                      <td className="p-2 font-mono">{p.symbol}</td>
                      <td className="p-2 text-right font-mono-num">{formatNumber(p.quantity, 4)}</td>
                      <td className="p-2 text-right font-mono-num">{formatMoney(p.avg_price)}</td>
                      <td className="p-2 text-right font-mono-num">{formatMoney(p.quantity * px)}</td>
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
                  <tr key={t._id} className="border-t border-border/60">
                    <td className="p-2 text-xs text-muted-foreground">{new Date(t.created_at).toLocaleTimeString()}</td>
                    <td className="p-2 font-mono">{t.symbol}</td>
                    <td className={`p-2 font-semibold text-xs ${t.side === "BUY" ? "text-success" : "text-destructive"}`}>{t.side}</td>
                    <td className="p-2 text-right font-mono-num">{formatNumber(t.quantity, 4)}</td>
                    <td className="p-2 text-right font-mono-num">{formatMoney(t.price)}</td>
                  </tr>
                ))}
                {trades.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-muted-foreground text-xs">No trades yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      <AIChat symbol={activeSymbol} />
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
        <div className="text-[10px] text-muted-foreground font-mono-num">{price ? formatMoney(price) : "—"}</div>
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
