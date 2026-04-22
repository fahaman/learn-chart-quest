import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { AppNav } from "@/components/AppNav";
import { Users, Activity, DollarSign, TrendingUp, TrendingDown, BookOpen, GraduationCap, BarChart3, Trash2, ShieldAlert, User as UserIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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

type UserProfile = {
  _id: string;
  name?: string;
  username?: string;
  email: string;
  phone?: string;
  cash_balance: number;
  role: string;
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
  
  const [userList, setUserList] = useState<UserProfile[]>([]);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [topCrypto, setTopCrypto] = useState<{symbol: string, count: number}[]>([]);
  const [topStocks, setTopStocks] = useState<{symbol: string, count: number}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const adminData = await apiFetch("/admin/stats");
      
      const userProfiles = adminData.profiles || [];
      const tradeHistory = adminData.trades || [];
      const userWatchlists = adminData.watchlist || [];
      const learningProgress = adminData.progress || [];
      
      const globalPaperWealth = userProfiles.reduce((sum: number, profile: any) => sum + Number(profile.cash_balance || 0), 0);
      const globalTradingVolume = tradeHistory.reduce((sum: number, trade: any) => sum + Number(trade.total || 0), 0);
    
      const uniqueActiveTraders = new Set(tradeHistory.map((trade: any) => trade.user_id));
      const uniqueActiveLearners = new Set(learningProgress.map((lesson: any) => lesson.user_id));

      const isCryptoAsset = (s: string) => s.endsWith("USDT") || s.endsWith("USD") || s.endsWith("BTC");
      const cryptoMap: Record<string, number> = {};
      const stockMap: Record<string, number> = {};
      
      tradeHistory.forEach((t: any) => { 
        const target = isCryptoAsset(t.symbol) ? cryptoMap : stockMap;
        target[t.symbol] = (target[t.symbol] || 0) + 1; 
      });
      
      setStats({
        users: userProfiles.length,
        activeTraders: uniqueActiveTraders.size,
        activeLearners: uniqueActiveLearners.size,
        totalTrades: tradeHistory.length, 
        totalVolume: globalTradingVolume,
        totalWealth: globalPaperWealth,
        totalLessons: learningProgress.length
      });
      
      setUserList(userProfiles);
      setTopCrypto(Object.entries(cryptoMap).map(([symbol, count]) => ({ symbol, count })).sort((a, b) => b.count - a.count).slice(0, 5));
      setTopStocks(Object.entries(stockMap).map(([symbol, count]) => ({ symbol, count })).sort((a, b) => b.count - a.count).slice(0, 5));
      setRecentTrades(tradeHistory.slice(0, 15));
      setIsLoading(false);
    } catch (error: unknown) {
      console.error("Failed to fetch admin statistics", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "admin") return;
    fetchAdminData();
  }, [user]);

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${name}" and all their trading/learning history? This action cannot be undone.`)) return;
    
    try {
      await apiFetch(`/admin/users/${id}`, { method: "DELETE" });
      toast.success("User deleted successfully");
      fetchAdminData(); // Refresh data
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    }
  };

  if (!user || user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppNav />
      <main className="flex-1 container py-8">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-2">
              <Activity className="text-gold w-8 h-8" /> Platform Admin
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Deep analytics and user management dashboard.</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAdminData} disabled={isLoading}>Refresh Data</Button>
        </div>

        {isLoading ? (
          <div className="animate-pulse space-y-8">
            <div className="grid md:grid-cols-4 lg:grid-cols-7 gap-4"><div className="h-24 bg-card-grad rounded-2xl" /><div className="h-24 bg-card-grad rounded-2xl" /><div className="h-24 bg-card-grad rounded-2xl" /><div className="h-24 bg-card-grad rounded-2xl" /></div>
            <div className="h-64 bg-card-grad rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* KPI Cards Row */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-card-grad border border-border/60 p-5 shadow-elevated">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary grid place-items-center"><Users className="w-4 h-4" /></div>
                  <h3 className="text-xs lg:text-sm font-semibold text-muted-foreground">Total Users</h3>
                </div>
                <div className="text-2xl font-display font-bold">{stats.users}</div>
              </div>
              <div className="rounded-2xl bg-card-grad border border-border/60 p-5 shadow-elevated">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gold/10 text-gold grid place-items-center"><BarChart3 className="w-4 h-4" /></div>
                  <h3 className="text-xs lg:text-sm font-semibold text-muted-foreground">Volume</h3>
                </div>
                <div className="text-2xl font-display font-bold font-mono-num">${stats.totalVolume.toLocaleString(undefined, { notation: "compact" })}</div>
              </div>
              <div className="rounded-2xl bg-card-grad border border-border/60 p-5 shadow-elevated">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-success/10 text-success grid place-items-center"><TrendingUp className="w-4 h-4" /></div>
                  <h3 className="text-xs lg:text-sm font-semibold text-muted-foreground">Trades</h3>
                </div>
                <div className="text-2xl font-display font-bold font-mono-num">{stats.totalTrades}</div>
              </div>
              <div className="rounded-2xl bg-card-grad border border-border/60 p-5 shadow-elevated">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 grid place-items-center"><GraduationCap className="w-4 h-4" /></div>
                  <h3 className="text-xs lg:text-sm font-semibold text-muted-foreground">Wealth</h3>
                </div>
                <div className="text-2xl font-display font-bold font-mono-num">${stats.totalWealth.toLocaleString(undefined, { notation: "compact" })}</div>
              </div>
            </div>

            {/* User Management Section */}
            <div className="rounded-2xl bg-card-grad border border-border/60 p-6 shadow-elevated overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-xl flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-destructive" /> User Management
                </h2>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Total: {userList.length} Accounts</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground border-b border-border/20">
                    <tr>
                      <th className="pb-3 px-4 font-normal">User Info</th>
                      <th className="pb-3 px-4 font-normal">Handle</th>
                      <th className="pb-3 px-4 font-normal">Contact</th>
                      <th className="pb-3 px-4 font-normal">Balance</th>
                      <th className="pb-3 px-4 font-normal text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userList.map(u => (
                      <tr key={u._id} className="border-b border-border/10 last:border-0 hover:bg-muted/10 transition-colors group">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted grid place-items-center"><UserIcon className="w-4 h-4" /></div>
                            <div>
                              <div className="font-bold flex items-center gap-1.5">
                                {u.name || "Anonymous"} 
                                {u.role === 'admin' && <span className="text-[8px] bg-gold/20 text-gold px-1 rounded">ADMIN</span>}
                              </div>
                              <div className="text-xs text-muted-foreground">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono text-xs text-muted-foreground">@{u.username || "unset"}</td>
                        <td className="py-4 px-4 text-xs text-muted-foreground">{u.phone || "—"}</td>
                        <td className="py-4 px-4 font-mono-num font-bold text-gold">${u.cash_balance?.toLocaleString()}</td>
                        <td className="py-4 px-4 text-right">
                          {u._id !== user.id && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteUser(u._id, u.name || u.email)}
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
              {/* Asset Charts - Simplified for this layout */}
              <div className="rounded-2xl bg-card-grad border border-border/60 p-5 shadow-elevated lg:col-span-1">
                <h3 className="font-display font-semibold mb-4 border-b border-border/40 pb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-success" /> Popular Crypto</h3>
                <div className="space-y-3">
                  {topCrypto.map((asset, i) => (
                    <div key={asset.symbol} className="flex items-center justify-between">
                      <span className="font-mono text-sm font-semibold text-gold">{asset.symbol}</span>
                      <span className="text-xs font-mono-num text-muted-foreground">{asset.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="rounded-2xl bg-card-grad border border-border/60 p-5 shadow-elevated lg:col-span-3 overflow-x-auto">
                <h3 className="font-display font-semibold mb-4 border-b border-border/40 pb-2 flex items-center gap-2"><Activity className="w-4 h-4 text-gold" /> Global Trade Log</h3>
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground border-b border-border/20">
                    <tr>
                      <th className="pb-2 font-normal">Time</th>
                      <th className="pb-2 font-normal">Asset</th>
                      <th className="pb-2 font-normal">Action</th>
                      <th className="pb-2 font-normal text-right">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTrades.map(t => (
                      <tr key={t.id} className="border-b border-border/10 last:border-0 hover:bg-muted/10 transition-colors">
                        <td className="py-2 text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</td>
                        <td className="py-2 font-bold font-mono">{t.symbol}</td>
                        <td className="py-2">
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${t.side === 'BUY' ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10'}`}>
                            {t.side}
                          </span>
                        </td>
                        <td className="py-2 text-right font-mono-num">${t.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
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
