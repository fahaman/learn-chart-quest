import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LineChart, Loader2, ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      
      setSubmitted(true);
      toast.success("Reset link sent!");
    } catch (err: any) {
      toast.error(err.message);
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
          {!submitted ? (
            <>
              <h1 className="text-2xl font-display font-bold text-center">Forgot Password?</h1>
              <p className="text-sm text-muted-foreground text-center mt-1">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                  />
                </div>
                <Button type="submit" variant="hero" className="w-full" size="lg" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : "Send Reset Link"}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gold/10 text-gold rounded-full flex items-center justify-center mx-auto mb-4">
                <LineChart className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-display font-bold">Check your email</h1>
              <p className="text-sm text-muted-foreground">
                We've sent a password reset link to <strong>{email}</strong>.
              </p>
              <p className="text-xs text-muted-foreground italic">
                (Note: In this demo, check the server console for the link)
              </p>
            </div>
          )}
          <div className="mt-6">
            <Link to="/auth" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-gold transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
