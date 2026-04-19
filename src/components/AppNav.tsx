import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { BarChart3, GraduationCap, LayoutDashboard, LineChart, LogOut } from "lucide-react";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/workspace", label: "Workspace", icon: BarChart3 },
  { to: "/learn", label: "Learn", icon: GraduationCap },
];

export const AppNav = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();

  return (
    <header className="h-14 border-b border-border/60 bg-card/40 backdrop-blur flex items-center px-4 gap-2 shrink-0">
      <Link to="/" className="flex items-center gap-2 mr-4">
        <div className="w-8 h-8 rounded-md bg-gold grid place-items-center"><LineChart className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} /></div>
        <span className="font-display font-bold hidden sm:inline">LearnChart</span>
      </Link>
      <nav className="flex items-center gap-1">
        {items.map(({ to, label, icon: Icon }) => {
          const active = loc.pathname === to || (to === "/workspace" && loc.pathname.startsWith("/workspace"));
          return (
            <Link key={to} to={to} className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition ${active ? "bg-primary/10 text-gold" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"}`}>
              <Icon className="w-4 h-4" /> <span className="hidden sm:inline">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="ml-auto">
        <Button size="sm" variant="ghost" onClick={async () => { await signOut(); navigate("/"); }}><LogOut className="w-4 h-4" /></Button>
      </div>
    </header>
  );
};
