import { useCallback } from "react";
import { useSubscriberAuth } from "@/hooks/useSubscriberAuth";

const PORTAL_API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/portal-data`;

export function usePortalApi() {
  const { token } = useSubscriberAuth();

  const portalFetch = useCallback(
    async <T = unknown>(endpoint: string, options?: { method?: string; body?: unknown }): Promise<T> => {
      if (!token) throw new Error("Não autenticado");

      const res = await fetch(`${PORTAL_API_BASE}/${endpoint}`, {
        method: options?.method ?? "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao buscar dados");
      return json.data !== undefined ? json.data : json;
    },
    [token]
  );

  return { portalFetch };
}
