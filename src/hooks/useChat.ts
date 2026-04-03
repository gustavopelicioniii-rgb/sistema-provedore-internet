import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export type ChatChannel = "whatsapp" | "instagram" | "facebook" | "website" | "telegram" | "email";
export type ConversationStatus = "open" | "waiting" | "resolved" | "closed";
export type SenderType = "customer" | "agent" | "system" | "bot";
export type ContentType = "text" | "image" | "audio" | "video" | "document" | "location" | "sticker";

export interface Conversation {
  id: string;
  organization_id: string;
  customer_id: string | null;
  channel: ChatChannel;
  channel_contact_id: string | null;
  channel_conversation_id: string | null;
  assigned_to: string | null;
  status: ConversationStatus;
  subject: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  customers?: { name: string; phone?: string; whatsapp?: string } | null;
  profiles?: { full_name: string | null } | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  organization_id: string;
  sender_type: SenderType;
  sender_id: string | null;
  content: string | null;
  content_type: ContentType;
  media_url: string | null;
  external_message_id: string | null;
  metadata: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface CannedResponse {
  id: string;
  organization_id: string;
  shortcut: string;
  title: string;
  content: string;
}

export function useConversations(filters?: { status?: ConversationStatus; channel?: ChatChannel }) {
  return useQuery({
    queryKey: ["conversations", filters],
    queryFn: async () => {
      let query = supabase
        .from("conversations")
        .select("*, customers(name, phone, whatsapp), profiles!conversations_assigned_to_fkey(full_name)")
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.channel) query = query.eq("channel", filters.channel);

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Conversation[];
    },
  });
}

export function useChatMessages(conversationId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        queryClient.setQueryData<ChatMessage[]>(["chat-messages", conversationId], (old) => {
          if (!old) return [payload.new as ChatMessage];
          const exists = old.some((m) => m.id === (payload.new as ChatMessage).id);
          if (exists) return old;
          return [...old, payload.new as ChatMessage];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, queryClient]);

  return useQuery({
    queryKey: ["chat-messages", conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as ChatMessage[];
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (msg: { conversation_id: string; content: string; content_type?: ContentType; media_url?: string }) => {
      const orgId = (await supabase.rpc("get_user_organization_id")).data;
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { error } = await supabase.from("chat_messages").insert({
        conversation_id: msg.conversation_id,
        organization_id: orgId!,
        sender_type: "agent" as any,
        sender_id: userId,
        content: msg.content,
        content_type: (msg.content_type || "text") as any,
        media_url: msg.media_url,
      } as any);
      if (error) throw error;

      // Update conversation preview
      await supabase.from("conversations").update({
        last_message_at: new Date().toISOString(),
        last_message_preview: msg.content?.substring(0, 100),
      } as any).eq("id", msg.conversation_id);
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", vars.conversation_id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useUpdateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: ConversationStatus; assigned_to?: string | null }) => {
      const { error } = await supabase.from("conversations").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useCannedResponses() {
  return useQuery({
    queryKey: ["canned-responses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("canned_responses").select("*").order("shortcut");
      if (error) throw error;
      return data as unknown as CannedResponse[];
    },
  });
}
