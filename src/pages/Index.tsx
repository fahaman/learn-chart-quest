import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, BarChart3, Brain, GraduationCap, LineChart, ShieldCheck, Sparkles, TrendingUp, Wallet, Zap } from "lucide-react";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/60">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gold grid place-items-center shadow-gold">
              <LineChart className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">
              LearnChart <span className="text-gold"></span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#how" className="hover:text-foreground transition">How it works</a>
            <a href="#preview" className="hover:text-foreground transition">Preview</a>
          </nav>
          <div className="flex items-center gap-3">
            {user ? (
              <Button asChild variant="hero"><Link to="/workspace">Open workspace</Link></Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link to="/auth">Sign in</Link></Button>
                <Button asChild variant="hero"><Link to="/auth?mode=signup">Get started</Link></Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-hero overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="container relative py-24 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-xs font-medium text-gold animate-float-up">
            <Sparkles className="w-3.5 h-3.5" /> AI-powered trading playground
          </div>
          <h1 className="mt-6 text-4xl sm:text-6xl md:text-7xl font-display font-bold tracking-tight animate-float-up [animation-delay:80ms]">
            Master Trading with AI<br className="hidden sm:block" />
            <span className="bg-transparent bg-clip-text text-gold">Zero Risk Learning</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground animate-float-up [animation-delay:160ms]">
            Live charts, paper trading with $100,000 virtual cash, AI insights, and a structured curriculum — everything you need to learn the markets without burning capital.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center animate-float-up [animation-delay:240ms]">
            <Button asChild variant="hero" size="lg">
              <Link to={user ? "/workspace" : "/auth?mode=signup"}>
                Get started <ArrowRight className="ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#features">Explore features</a>
            </Button>
          </div>

          {/* Stat strip */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto animate-float-up [animation-delay:320ms]">
            {[
              { v: "$100K", l: "Virtual capital" },
              { v: "Live", l: "Binance feed" },
              { v: "RSI · EMA · MACD", l: "AI signals" },
              { v: "0", l: "Real-money risk" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl bg-card-grad border border-border/60 px-4 py-4">
                <div className="font-display text-xl text-gold font-mono-num">{s.v}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs uppercase tracking-[0.2em] text-gold mb-3">Features</div>
          <h2 className="text-3xl md:text-5xl font-display font-bold">A complete trading lab.</h2>
          <p className="mt-4 text-muted-foreground">Built for traders who want to learn fast — and keep their wallet intact.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { i: Brain, t: "AI Insights", d: "Buy / Sell / Hold signals from RSI, EMA & MACD with plain-English explanations." },
            { i: BarChart3, t: "Live Charts", d: "TradingView Advanced charts with 1m–1D timeframes & technical indicators." },
            { i: Wallet, t: "Paper Trading", d: "Execute real-style orders against live prices with a virtual $100K balance." },
            { i: GraduationCap, t: "Structured Learning", d: "Beginner → Advanced curriculum with progress tracking. (coming soon)" },
          ].map(({ i: Icon, t, d }) => (
            <div key={t} className="group rounded-2xl bg-card-grad border border-border/60 p-6 hover:border-primary/40 transition shadow-elevated">
              <div className="w-11 h-11 rounded-lg bg-primary/10 grid place-items-center mb-4 group-hover:bg-primary/20 transition">
                <Icon className="w-5 h-5 text-gold" />
              </div>
              <h3 className="font-display font-semibold text-lg">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="container py-24 border-t border-border/60">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-xs uppercase tracking-[0.2em] text-gold mb-3">Workflow</div>
          <h2 className="text-3xl md:text-5xl font-display font-bold">Learn → Analyze → Practice</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { n: "01", i: GraduationCap, t: "Learn", d: "Walk through structured lessons covering markets, indicators and risk." },
            { n: "02", i: TrendingUp, t: "Analyze", d: "Open the workspace, study live charts, ask the AI for context." },
            { n: "03", i: Zap, t: "Practice", d: "Place paper trades, track P&L, refine your edge — risk-free." },
          ].map(({ n, i: Icon, t, d }) => (
            <div key={n} className="relative rounded-2xl bg-card-grad border border-border/60 p-8">
              <div className="absolute -top-3 left-6 text-xs font-mono px-2 py-0.5 rounded bg-primary text-primary-foreground">{n}</div>
              <Icon className="w-7 h-7 text-gold mb-4" />
              <h3 className="font-display font-semibold text-xl">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Preview */}
      <section id="preview" className="container py-24">
        <div className="rounded-3xl bg-card-grad border border-border/60 overflow-hidden shadow-elevated">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60 bg-background/50">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-primary/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-success/70" />
            <div className="ml-3 text-xs text-muted-foreground font-mono">learnchart/ workspace</div>
          </div>
          <div className="grid md:grid-cols-[200px_1fr_240px] gap-px bg-border/60">
            <div className="bg-card p-4 space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Watchlist</div>
              {["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"].map((s, i) => (
                <div key={s} className="flex justify-between text-xs py-1.5 px-2 rounded hover:bg-muted/40">
                  <span className="font-mono">{s}</span>
                  <span className={i % 2 ? "text-success font-mono-num" : "text-destructive font-mono-num"}>{i % 2 ? "+2.4%" : "-0.8%"}</span>
                </div>
              ))}
            </div>
            <div className="bg-background p-6 grid-bg min-h-[280px] flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gold mx-auto opacity-60" />
                <div className="mt-2 text-xs text-muted-foreground">Live TradingView chart</div>
              </div>
            </div>
            <div className="bg-card p-4 space-y-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">AI Signal</div>
              <div className="rounded-lg bg-success/10 border border-success/30 p-3">
                <div className="text-success font-display font-semibold">BUY</div>
                <div className="text-[11px] text-muted-foreground mt-1">RSI 38 · EMA bullish cross</div>
              </div>
              <button className="w-full bg-gold text-primary-foreground font-semibold rounded-lg py-2 text-sm">Buy</button>
              <button className="w-full bg-muted text-foreground font-semibold rounded-lg py-2 text-sm">Sell</button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-24 text-center">
        <ShieldCheck className="w-10 h-10 text-gold mx-auto mb-4" />
        <h2 className="text-3xl md:text-5xl font-display font-bold max-w-2xl mx-auto">
          Trade your way to confidence — <span className="text-gold">without risk</span>.
        </h2>
        <Button asChild variant="hero" size="lg" className="mt-8">
          <Link to={user ? "/workspace" : "/auth?mode=signup"}>Open the workspace <ArrowRight className="ml-1" /></Link>
        </Button>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} LearnChart. Educational simulation only.</div>
          <div>Not financial advice.</div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
