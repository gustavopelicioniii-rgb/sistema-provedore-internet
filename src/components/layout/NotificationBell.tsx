import { useState, useCallback, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  useRealtimeNotifications,
  RealtimeNotification,
} from "@/hooks/useRealtimeNotifications";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const typeColors: Record<string, string> = {
  ticket: "bg-primary/10 text-primary",
  invoice: "bg-warning/10 text-warning",
  service_order: "bg-accent/10 text-accent-foreground",
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [open, setOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotification = useCallback((n: RealtimeNotification) => {
    setNotifications((prev) => {
      const exists = prev.some((p) => p.id === n.id);
      if (exists) return prev;
      return [n, ...prev].slice(0, 50);
    });
  }, []);

  useRealtimeNotifications(handleNotification);

  // Load persisted alerts on mount
  useEffect(() => {
    const loadAlerts = async () => {
      const { data } = await supabase
        .from("notification_alerts")
        .select("*")
        .eq("channel", "in_app")
        .order("created_at", { ascending: false })
        .limit(30);

      if (data && data.length > 0) {
        const mapped: RealtimeNotification[] = data.map((row: any) => ({
          id: row.id,
          type: row.reference_type === "invoice_due" ? "invoice" as const : "ticket" as const,
          title: row.title,
          description: row.description || "",
          createdAt: new Date(row.created_at),
          read: row.read,
        }));
        setNotifications((prev) => {
          const ids = new Set(prev.map((p) => p.id));
          const newOnes = mapped.filter((m) => !ids.has(m.id));
          return [...prev, ...newOnes].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 50);
        });
      }
    };
    loadAlerts();
  }, []);

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    // Mark persisted alerts as read
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length > 0) {
      await supabase
        .from("notification_alerts")
        .update({ read: true })
        .in("id", unreadIds);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <h4 className="text-sm font-semibold">Notificações</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}>
              Marcar tudo como lido
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-72">
          {notifications.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma notificação ainda
            </p>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
                <div
                  key={n.id + n.createdAt.getTime()}
                  className={cn(
                    "px-4 py-3 text-sm transition-colors",
                    !n.read && "bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", typeColors[n.type])}>
                      {n.title}
                    </Badge>
                    {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-1 text-muted-foreground text-xs">{n.description}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                    {n.createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
