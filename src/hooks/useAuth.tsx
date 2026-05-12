import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  cash_balance?: number;
  role?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signUp: (data: { name: string; username: string; email: string; phone: string; pass: string; otp: string }) => Promise<{ error?: string }>;
  sendOtp: (phone: string, email?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!localStorage.getItem("token")) {
          setLoading(false);
          return;
        }
        const data = await apiFetch("/auth/me");
        setUser(data);
      } catch (error) {
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const signIn = async (email: string, pass: string) => {
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password: pass }),
      });
      localStorage.setItem("token", data.token);
      setUser({ 
        id: data.id, 
        name: data.name, 
        username: data.username, 
        email: data.email, 
        phone: data.phone, 
        cash_balance: data.cash_balance,
        role: data.role
      });
      return {};
    } catch (error: unknown) {
      return { error: (error as Error).message };
    }
  };

  const sendOtp = async (phone: string, email?: string) => {
    try {
      await apiFetch("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ phone, email }),
      });
      return {};
    } catch (error: unknown) {
      return { error: (error as Error).message };
    }
  };

  const signUp = async (registrationData: { name: string; username: string; email: string; phone: string; pass: string; otp: string }) => {
    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ 
          name: registrationData.name,
          username: registrationData.username,
          email: registrationData.email,
          phone: registrationData.phone,
          password: registrationData.pass,
          otp: registrationData.otp
        }),
      });
      localStorage.setItem("token", data.token);
      setUser({ 
        id: data.id, 
        name: data.name, 
        username: data.username, 
        email: data.email, 
        phone: data.phone, 
        cash_balance: data.cash_balance,
        role: data.role
      });
      return {};
    } catch (error: unknown) {
      return { error: (error as Error).message };
    }
  };

  const updateUser = (data: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  const signOut = async () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, sendOtp, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
