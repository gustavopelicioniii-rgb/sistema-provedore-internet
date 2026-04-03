import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface UnreadCounts {
  total: number;
  byConversation: Record<string, number>;
}

export function useUnreadMessages() {
  const queryClient = useQueryClient();

  // Listen for new messages to invalidate
  useEffect(() => {
    const channelName = `unread-global-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
      }, (payload) => {
        const msg = payload.new as any;
        if (msg.sender_type === "customer") {
          queryClient.invalidateQueries({ queryKey: ["unread-counts"] });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return useQuery({
    queryKey: ["unread-counts"],
    queryFn: async (): Promise<UnreadCounts> => {
      // Get all unread customer messages (no read_at, sender_type = customer)
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, conversation_id")
        .eq("sender_type", "customer")
        .is("read_at", null);

      if (error) throw error;

      const messages = data ?? [];
      const byConversation: Record<string, number> = {};

      messages.forEach((msg) => {
        byConversation[msg.conversation_id] = (byConversation[msg.conversation_id] || 0) + 1;
      });

      return {
        total: messages.length,
        byConversation,
      };
    },
    refetchInterval: 30000, // also poll every 30s as backup
  });
}
