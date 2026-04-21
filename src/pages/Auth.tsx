import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { LineChart, Loader2 } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

const Auth = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(params.get("mode") === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await signUp(parsed.data.email, parsed.data.password);
        if (error) throw new Error(error);
        toast.success("Account created — welcome aboard!");
        navigate("/workspace");
      } else {
        const { error } = await signIn(parsed.data.email, parsed.data.password);
        if (error) throw new Error(error);
        toast.success("Signed in");
        navigate("/workspace");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero grid-bg grid place-items-center px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-lg bg-gold grid place-items-center shadow-gold">
            <LineChart className="w-5 h-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-xl">LearnChart</span>
        </Link>
        <div className="rounded-2xl bg-card-grad border border-border/60 p-8 shadow-elevated">
          <h1 className="text-2xl font-display font-bold text-center">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="text-sm text-muted-foreground text-center mt-1">
            {mode === "signup" ? "Start with $100,000 virtual capital." : "Sign in to your trading workspace."}
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              {mode === "signin" && (
                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-gold transition-colors">
                    Forgot password?
                  </Link>
                </div>
              )}
            </div>
            <Button type="submit" variant="hero" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : mode === "signup" ? "Create account" : "Sign in"}
            </Button>
          </form>
          <div className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Already have an account?" : "New to LearnChart?"}{" "}
            <button onClick={() => setMode(mode === "signup" ? "signin" : "signup")} className="text-gold hover:underline font-medium">
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
