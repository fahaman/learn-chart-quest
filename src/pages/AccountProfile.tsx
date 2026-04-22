import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { User, Phone, Mail, UserCircle, Shield, Loader2, Save } from "lucide-react";
import { Link } from "react-router-dom";

const COUNTRY_CODES = [
  { code: "+1", country: "USA", length: 10 },
  { code: "+91", country: "India", length: 10 },
  { code: "+44", country: "UK", length: 10 },
  { code: "+61", country: "Australia", length: 9 },
  { code: "+81", country: "Japan", length: 10 },
  { code: "+49", country: "Germany", length: 11 },
];

const AccountProfile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Extract country code if present in existing phone number
  const initialCountryCode = COUNTRY_CODES.find(c => user?.phone?.startsWith(c.code))?.code || "+91";
  const initialPhone = user?.phone?.startsWith(initialCountryCode) 
    ? user.phone.slice(initialCountryCode.length) 
    : user?.phone || "";

  const [formData, setFormData] = useState({
    name: user?.name || "",
    username: user?.username || "",
    email: user?.email || "",
    phone: initialPhone,
    countryCode: initialCountryCode,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (formData.name.length > 50) {
      toast.error("Name cannot exceed 50 characters");
      return;
    }

    const country = COUNTRY_CODES.find(c => c.code === formData.countryCode);
    if (country && formData.phone.length !== country.length) {
      toast.error(`Phone number for ${country.country} must be exactly ${country.length} digits.`);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        phone: `${formData.countryCode}${formData.phone}`,
      };
      const data = await apiFetch("/user/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      updateUser(data);
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-hero grid-bg p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Profile Settings</h1>
            <p className="text-muted-foreground mt-1">Manage your account details and security.</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/workspace">Back to Workspace</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Overview Card */}
          <div className="md:col-span-1 space-y-6">
            <div className="rounded-2xl bg-card-grad border border-border/60 p-6 shadow-elevated text-center">
              <div className="w-24 h-24 rounded-full bg-gold/10 border-2 border-gold/30 mx-auto grid place-items-center mb-4">
                <UserCircle className="w-16 h-16 text-gold" />
              </div>
              <h2 className="text-xl font-bold">{user.name || "User"}</h2>
              <p className="text-sm text-muted-foreground">@{user.username || "username"}</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Shield className="w-4 h-4 text-gold" />
                <span className="text-xs font-medium uppercase tracking-wider">{user.role}</span>
              </div>
              <div className="mt-6 pt-6 border-t border-border/60">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Balance</span>
                  <span className="font-mono font-bold text-gold">${user.cash_balance?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Profile Card */}
          <div className="md:col-span-2">
            <div className="rounded-2xl bg-card-grad border border-border/60 p-8 shadow-elevated">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gold" /> Full Name
                    </Label>
                    <Input id="name" value={formData.name} onChange={handleChange} placeholder="John Doe" maxLength={50} />
                    <p className="text-[10px] text-muted-foreground italic">Max 50 characters, letters only.</p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="username" className="flex items-center gap-2">
                      <UserCircle className="w-4 h-4 text-gold" /> Username
                    </Label>
                    <Input id="username" value={formData.username} onChange={handleChange} placeholder="johndoe" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gold" /> Email Address
                    </Label>
                    <Input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="john@gmail.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gold" /> Phone Number
                    </Label>
                    <div className="flex gap-2">
                      <select 
                        id="countryCode" 
                        value={formData.countryCode} 
                        onChange={handleChange}
                        className="bg-background border border-input rounded-md px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-gold transition"
                      >
                        {COUNTRY_CODES.map(c => (
                          <option key={c.code} value={c.code}>{c.code} ({c.country})</option>
                        ))}
                      </select>
                      <Input 
                        id="phone" 
                        type="tel" 
                        value={formData.phone} 
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })} 
                        required 
                        placeholder="1234567890" 
                        className="flex-1"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">
                      {COUNTRY_CODES.find(c => c.code === formData.countryCode)?.length} digits required for {COUNTRY_CODES.find(c => c.code === formData.countryCode)?.country}.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" variant="hero" disabled={loading} className="gap-2">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountProfile;
