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
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name should only contain letters"),
  username: z.string().regex(/^[a-zA-Z]+$/, "Username should only contain letters (no numbers or symbols)").min(1, "Username is required"),
  email: z.string().trim().email("Invalid email").regex(/@gmail\.com$/, "Please use a valid Gmail address (@gmail.com)").max(255),
  countryCode: z.string().min(1, "Country code is required"),
  phone: z.string().min(5, "Invalid phone number"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .max(72),
});

const loginSchema = z.object({
  email: z.string().trim().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

const COUNTRY_CODES = [
  { code: "+1", country: "USA", length: 10 },
  { code: "+91", country: "India", length: 10 },
  { code: "+44", country: "UK", length: 10 },
  { code: "+61", country: "Australia", length: 9 },
  { code: "+81", country: "Japan", length: 10 },
  { code: "+49", country: "Germany", length: 11 },
];

const Auth = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(params.get("mode") === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, sendOtp } = useAuth();

  const handleSendOtp = async () => {
    const validationData = { email, password, name, username, phone, countryCode };
    const parsed = schema.safeParse(validationData);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    const country = COUNTRY_CODES.find(c => c.code === countryCode);
    if (country && phone.length !== country.length) {
        toast.error(`Phone number for ${country.country} must be exactly ${country.length} digits.`);
        return;
    }

    setLoading(true);
    try {
      const fullPhone = `${countryCode}${phone}`;
      const { error } = await sendOtp(fullPhone);
      if (error) throw new Error(error);
      setOtpSent(true);
      toast.success("OTP sent to your phone!");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "signup" && !otpSent) {
      handleSendOtp();
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await signUp({ 
            name, 
            username, 
            email, 
            phone: `${countryCode}${phone}`, 
            pass: password,
            otp
        });
        if (error) throw new Error(error);
        toast.success("Account created — welcome aboard!");
        navigate("/workspace");
      } else {
        const parsed = loginSchema.safeParse({ email, password });
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
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
            {mode === "signup" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="John Doe" maxLength={50} />
                  <p className="text-[10px] text-muted-foreground italic">Max 50 characters, letters only.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="johndoe" />
                  <p className="text-[10px] text-muted-foreground italic">Only letters, no numbers or symbols.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex gap-2">
                    <select 
                      id="countryCode" 
                      value={countryCode} 
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="bg-background border border-input rounded-md px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-gold transition"
                    >
                      {COUNTRY_CODES.map(c => (
                        <option key={c.code} value={c.code}>{c.code} ({c.country})</option>
                      ))}
                    </select>
                    <Input 
                      id="phone" 
                      type="tel" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} 
                      required 
                      placeholder="1234567890" 
                      className="flex-1"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">
                    {COUNTRY_CODES.find(c => c.code === countryCode)?.length} digits required for {COUNTRY_CODES.find(c => c.code === countryCode)?.country}.
                  </p>
                </div>

                {otpSent && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-1">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="otp">Verification Code (OTP)</Label>
                      <button type="button" onClick={() => setOtpSent(false)} className="text-[10px] text-gold hover:underline">Change Phone</button>
                    </div>
                    <Input id="otp" type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} required placeholder="123456" maxLength={6} className="text-center tracking-[1em] font-bold text-lg" />
                    <p className="text-[10px] text-muted-foreground italic">Enter the 6-digit code sent to your phone. (Check server logs in demo)</p>
                  </div>
                )}
              </>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@gmail.com" disabled={otpSent} />
              {mode === "signup" && <p className="text-[10px] text-muted-foreground italic">Must be a valid @gmail.com address.</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} disabled={otpSent} />
              {mode === "signup" && (
                <p className="text-[10px] text-muted-foreground italic">At least 8 characters, 1 uppercase, and 1 number.</p>
              )}
              {mode === "signin" && (
                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-gold transition-colors">
                    Forgot password?
                  </Link>
                </div>
              )}
            </div>
            <Button type="submit" variant="hero" className="w-full" size="lg" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : mode === "signup" ? (otpSent ? "Verify & Create Account" : "Get OTP") : "Sign in"}
            </Button>
          </form>
          <div className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Already have an account?" : "New to LearnChart?"}{" "}
            <button onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setOtpSent(false); }} className="text-gold hover:underline font-medium">
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
