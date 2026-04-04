import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

interface SubscriberCustomer {
  id: string;
  name: string;
  email: string | null;
  cpf: string;
}

interface SubscriberOrganization {
  id: string;
  name: string;
  logo_url: string | null;
}

interface SubscriberAuthContextType {
  customer: SubscriberCustomer | null;
  organization: SubscriberOrganization | null;
  token: string | null;
  loading: boolean;
  login: (cpf: string, password: string, organizationSlug: string) => Promise<{ error: string | null }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const SubscriberAuthContext = createContext<SubscriberAuthContextType | undefined>(undefined);

const STORAGE_KEY = "subscriber_session";
const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/subscriber-auth`;

export function SubscriberAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<SubscriberCustomer | null>(null);
  const [organization, setOrganization] = useState<SubscriberOrganization | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        // Check if token is expired (decode JWT payload)
        const payload = JSON.parse(atob(session.token.split(".")[1]));
        if (payload.exp * 1000 > Date.now()) {
          setToken(session.token);
          setCustomer(session.customer);
          setOrganization(session.organization);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (cpf: string, password: string, organizationSlug: string) => {
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ cpf, password, organization_slug: organizationSlug }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { error: data.error || "Erro ao fazer login" };
      }

      setToken(data.token);
      setCustomer(data.customer);
      setOrganization(data.organization);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      return { error: null };
    } catch {
      return { error: "Erro de conexão. Tente novamente." };
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setCustomer(null);
    setOrganization(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <SubscriberAuthContext.Provider
      value={{
        customer,
        organization,
        token,
        loading,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </SubscriberAuthContext.Provider>
  );
}

export function useSubscriberAuth() {
  const context = useContext(SubscriberAuthContext);
  if (!context) throw new Error("useSubscriberAuth must be used within SubscriberAuthProvider");
  return context;
}
