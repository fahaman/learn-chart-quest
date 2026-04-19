import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppNav } from "@/components/AppNav";
import { Users, Activity, DollarSign, TrendingUp, TrendingDown, BookOpen, GraduationCap, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

type Trade = {
  id: string;
  user_id: string;
  symbol: string;
  side: string;
  quantity: number;
  price: number;
  total: number;
  created_at: string;
};

const Admin = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    users: 0,
    activeTraders: 0,
    activeLearners: 0,
    totalTrades: 0,
    totalVolume: 0,
    totalWealth: 0,
    totalLessons: 0,
  });
  
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [topCrypto, setTopCrypto] = useState<{symbol: string, count: number}[]>([]);
  const [topStocks, setTopStocks] = useState<{symbol: string, count: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email !== "admin@learnchart.com") return;
    const fetchAdminData = async () => {
      // Execute queries covering all users (assuming RLS allows, else returns logged in user data only)
      const [
        { data: profiles },
        { data: trades },
        { data: watchlist },
        { data: progress }
      ] = await Promise.all([
        supabase.from("profiles").select("id, cash_balance"),
        supabase.from("trades").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("watchlist").select("symbol"),
        supabase.from("lesson_progress").select("user_id, completed").eq("completed", true)
      ]);

      const profs = profiles || [];
      const trs = (trades as Trade[]) || [];
      const wl = watchlist || [];
      const lessons = progress || [];

      // Calculate Stats
      const totalWealth = profs.reduce((sum, p) => sum + Number(p.cash_balance || 0), 0);
      const totalVolume = trs.reduce((sum, t) => sum + Number(t.total || 0), 0);
      
      const activeTraderSet = new Set(trs.map(t => t.user_id));
      const activeLearnerSet = new Set(lessons.map((l: any) => l.user_id));

      // Calculate Top Assets Split
      const isCrypto = (sym: string) => sym.endsWith("USDT") || sym.endsWith("USD") || sym.endsWith("BTC");
      const cryptoCounts: Record<string, number> = {};
      const stockCounts: Record<string, number> = {};
      
      trs.forEach(t => { 
        const c = isCrypto(t.symbol) ? cryptoCounts : stockCounts;
        c[t.symbol] = (c[t.symbol] || 0) + 1; 
      });
      wl.forEach(w => { 
        const c = isCrypto(w.symbol) ? cryptoCounts : stockCounts;
        c[w.symbol] = (c[w.symbol] || 0) + 1; 
      });
      
      const tc = Object.entries(cryptoCounts).map(([symbol, count]) => ({ symbol, count })).sort((a, b) => b.count - a.count).slice(0, 5);
      const ts = Object.entries(stockCounts).map(([symbol, count]) => ({ symbol, count })).sort((a, b) => b.count - a.count).slice(0, 5);

      setStats({
        users: profs.length,
        activeTraders: activeTraderSet.size,
        activeLearners: activeLearnerSet.size,
        totalTrades: trs.length, 
        totalVolume,
        totalWealth,
        totalLessons: lessons.length
      });
      setTopCrypto(tc);
      setTopStocks(ts);
      setRecentTrades(trs.slice(0, 15)); // Display 15 most recent
      setLoading(false);
    };

    fetchAdminData();
  }, [user]);

  if (!user || user.email !== "admin@learnchart.com") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNav />
      <main className="flex-1 container py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold flex items-center gap-2">
            <Activity className="text-gold w-8 h-8" />
            Platform Admin
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Deep analytics across trading volume, user engagement, and assets.</p>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-8">
            <div className="grid md:grid-cols-4 lg:grid-cols-7 gap-4"><div className="h-24 bg-card-grad rounded-2xl" /><div className="h-24 bg-card-grad rounded-2xl" /><div className="h-24 bg-card-grad rounded-2xl" /><div className="h-24 bg-card-grad rounded-2xl" /></div>
            <div className="h-64 bg-card-grad rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards Row 1 */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-card-grad border border-border/60 p-5 shadow-elevated">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary grid place-items-center"><Users className="w-4 h-4" /></div>
                  <h3 className="text-xs lg:text-sm font-semibold text-muted-foreground whitespace-nowrap">Total Registered Users</h3>
                </div>
                <div className="text-2xl font-display font-bold">{stats.users}</div>
              </div>
              <div className="rounded-2xl bg-card-grad border border-border/60 p-5 shadow-elevated">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gold/10 text-gold grid place-items-center"><BarChart3 className="w-4 h-4" /></div>
                  <h3 className="text-xs lg:text-sm font-semibold text-muted-foreground whitespace-nowrap">Active Traders</h3>
                </div>
                <div className="text-2xl font-display font-bold">{stats.activeTraders}</div>
              </div>
              <div className="rounded-2xl bg-card-grad border border-border/60 p-5 shadow-elevated">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 grid place-items-center"><GraduationCap className="w-4 h-4" /></div>
                  <h3 className="text-xs lg:text-sm font-semibold text-muted-foreground whitespace-nowrap">Active Learners</h3>
                </div>
                <div className="text-2xl font-display font-bold">{stats.activeLearners}</div>
              </div>
              <div className="rounded-2xl bg-card-grad border border-border/60 p-5 shadow-elevated">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 grid place-items-center"><BookOpen className="w-4 h-4" /></div>
                  <h3 className="text-xs lg:text-sm font-semibold text-muted-foreground whitespace-nowrap">Lessons Completed</h3>
                </div>
                <div className="text-2xl font-display font-bold font-mono-num">{stats.totalLessons}</div>
              </div>
            </div>

            {/* KPI Cards Row 2 */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-card-grad border border-border/60 p-5 shadow-elevated">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 grid place-items-center"><Activity className="w-4 h-4" /></div>
                  <h3 className="text-xs lg:text-sm font-semibold text-muted-foreground whitespace-nowrap">Total Executed Trades</h3>
                </div>
                <div className="text-2xl font-display font-bold font-mono-num">{stats.totalTrades}</div>
              </div>
              <div className="rounded-2xl bg-card-grad border border-border/60 p-5 shadow-elevated">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-success/10 text-success grid place-items-center"><TrendingUp className="w-4 h-4" /></div>
                  <h3 className="text-xs lg:text-sm font-semibold text-muted-foreground whitespace-nowrap">Total Platform Volume</h3>
                </div>
                <div className="text-2xl font-display font-bold font-mono-num">
                  ${stats.totalVolume.toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 1 })}
                </div>
              </div>
              <div className="rounded-2xl bg-card-grad border border-border/60 p-5 shadow-elevated">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-400/10 text-blue-400 grid place-items-center"><DollarSign className="w-4 h-4" /></div>
                  <h3 className="text-xs lg:text-sm font-semibold text-muted-foreground whitespace-nowrap">Global Paper Wealth</h3>
                </div>
                <div className="text-2xl font-display font-bold font-mono-num">
                  ${stats.totalWealth.toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 1 })}
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
              {/* Top Crypto Assets */}
              <div className="rounded-2xl bg-card-grad border border-border/60 p-5 shadow-elevated lg:col-span-1">
                <h3 className="font-display font-semibold mb-4 border-b border-border/40 pb-2">Top Crypto</h3>
                <div className="space-y-3">
                  {topCrypto.length > 0 ? topCrypto.map((asset, i) => (
                    <div key={asset.symbol} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-mono text-xs w-4">{i + 1}.</span>
                        <span className="font-mono text-sm font-semibold text-gold">{asset.symbol}</span>
                      </div>
                      <span className="text-xs font-mono-num text-muted-foreground">{asset.count}</span>
                    </div>
                  )) : (
                    <div className="text-xs text-muted-foreground text-center py-4">No crypto data.</div>
                  )}
                </div>
              </div>

              {/* Top Stock Assets */}
              <div className="rounded-2xl bg-card-grad border border-border/60 p-5 shadow-elevated lg:col-span-1">
                <h3 className="font-display font-semibold mb-4 border-b border-border/40 pb-2">Top Stocks</h3>
                <div className="space-y-3">
                  {topStocks.length > 0 ? topStocks.map((asset, i) => (
                    <div key={asset.symbol} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-mono text-xs w-4">{i + 1}.</span>
                        <span className="font-mono text-sm font-semibold text-blue-400">{asset.symbol}</span>
                      </div>
                      <span className="text-xs font-mono-num text-muted-foreground">{asset.count}</span>
                    </div>
                  )) : (
                    <div className="text-xs text-muted-foreground text-center py-4">No stock data.</div>
                  )}
                </div>
              </div>

              {/* Recent Trades Table */}
              <div className="rounded-2xl bg-card-grad border border-border/60 p-5 shadow-elevated lg:col-span-2 overflow-x-auto min-h-[300px]">
                <h3 className="font-display font-semibold mb-4 border-b border-border/40 pb-2">Recent Platform Actions</h3>
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground border-b border-border/20">
                    <tr>
                      <th className="pb-2 font-normal">Time</th>
                      <th className="pb-2 font-normal">Network User ID</th>
                      <th className="pb-2 font-normal">Asset</th>
                      <th className="pb-2 font-normal">Action</th>
                      <th className="pb-2 font-normal text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTrades.length > 0 ? recentTrades.map(t => (
                      <tr key={t.id} className="border-b border-border/10 last:border-0 hover:bg-muted/10 transition-colors">
                        <td className="py-2 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2 font-mono text-xs text-muted-foreground truncate max-w-[100px]">
                          {t.user_id.split('-')[0]}***
                        </td>
                        <td className="py-2 font-bold font-mono">{t.symbol}</td>
                        <td className="py-2">
                          <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${t.side === 'BUY' ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10'}`}>
                            {t.side === 'BUY' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {t.side}
                          </span>
                        </td>
                        <td className="py-2 text-right font-mono-num">
                          ${t.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={5} className="py-8 text-center text-xs text-muted-foreground">No recent trades found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
