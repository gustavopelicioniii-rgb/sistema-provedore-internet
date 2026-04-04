import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface RealtimeNotification {
  id: string;
  type: "ticket" | "invoice" | "service_order";
  title: string;
  description: string;
  createdAt: Date;
  read: boolean;
}

type NotificationListener = (notification: RealtimeNotification) => void;

export function useRealtimeNotifications(onNotification?: NotificationListener) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const listenerRef = useRef(onNotification);
  listenerRef.current = onNotification;

  const emit = useCallback((n: RealtimeNotification) => {
    listenerRef.current?.(n);
  }, []);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tickets" },
        (payload) => {
          const row = payload.new as any;
          const n: RealtimeNotification = {
            id: row.id,
            type: "ticket",
            title: "Novo Ticket",
            description: `"${row.subject}" — Prioridade: ${row.priority}`,
            createdAt: new Date(),
            read: false,
          };
          toast.info(n.title, { description: n.description });
          emit(n);
          queryClient.invalidateQueries({ queryKey: ["tickets"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "invoices" },
        (payload) => {
          const row = payload.new as any;
          if (row.status === "overdue" || (!row.paid_date && new Date(row.due_date) < new Date())) {
            const n: RealtimeNotification = {
              id: row.id,
              type: "invoice",
              title: "Fatura Vencida",
              description: `Fatura de R$ ${Number(row.amount).toFixed(2)} venceu em ${new Date(row.due_date).toLocaleDateString("pt-BR")}`,
              createdAt: new Date(),
              read: false,
            };
            toast.warning(n.title, { description: n.description });
            emit(n);
          }
          queryClient.invalidateQueries({ queryKey: ["invoices"] });
          queryClient.invalidateQueries({ queryKey: ["financeiro"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "invoices" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["invoices"] });
          queryClient.invalidateQueries({ queryKey: ["financeiro"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "service_orders" },
        (payload) => {
          const row = payload.new as any;
          const typeLabels: Record<string, string> = {
            installation: "Instalação",
            maintenance: "Manutenção",
            technical_visit: "Visita Técnica",
            repair: "Reparo",
          };
          const n: RealtimeNotification = {
            id: row.id,
            type: "service_order",
            title: "Nova Ordem de Serviço",
            description: `Tipo: ${typeLabels[row.type] || row.type}`,
            createdAt: new Date(),
            read: false,
          };
          toast.info(n.title, { description: n.description });
          emit(n);
          queryClient.invalidateQueries({ queryKey: ["service-orders"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "service_orders" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["service-orders"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tickets" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["tickets"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notification_alerts" },
        (payload) => {
          const row = payload.new as any;
          if (row.channel === "in_app") {
            const n: RealtimeNotification = {
              id: row.id,
              type: row.reference_type === "invoice_due" ? "invoice" : "ticket",
              title: row.title,
              description: row.description || "",
              createdAt: new Date(row.created_at),
              read: false,
            };
            if (row.type === "warning") {
              toast.warning(n.title, { description: n.description });
            } else {
              toast.info(n.title, { description: n.description });
            }
            emit(n);
            queryClient.invalidateQueries({ queryKey: ["notification-alerts"] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient, emit]);
}
