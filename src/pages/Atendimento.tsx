import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Plus, Search, MoreHorizontal, Pencil, Trash2, Loader2,
  MessageSquare, Send, User, Bot, Globe, Phone,
  Instagram, Facebook, Mail, CheckCheck, Check, Clock, XCircle, AlertCircle,
  Paperclip, Image, Mic, FileText, X, File, Download,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { useTickets, useDeleteTicket, type TicketRecord } from "@/hooks/useTickets";
import TicketFormDialog from "@/components/tickets/TicketFormDialog";
import {
  useConversations, useChatMessages, useSendMessage, useUpdateConversation, useCannedResponses,
  type Conversation, type ChatChannel, type ConversationStatus, type ChatMessage, type CannedResponse, type DeliveryStatus,
} from "@/hooks/useChat";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// --- Ticket section maps ---
const statusMap: Record<string, { label: string; className: string }> = {
  open: { label: "Aberto", className: "bg-primary/10 text-primary border-primary/20" },
  in_progress: { label: "Em Andamento", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  waiting: { label: "Aguardando", className: "bg-muted text-muted-foreground border-muted" },
  resolved: { label: "Resolvido", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  closed: { label: "Fechado", className: "bg-muted text-muted-foreground border-muted" },
};

const priorityMap: Record<string, { label: string; className: string }> = {
  low: { label: "Baixa", className: "bg-muted text-muted-foreground border-muted" },
  medium: { label: "Média", className: "bg-primary/10 text-primary border-primary/20" },
  high: { label: "Alta", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  urgent: { label: "Urgente", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

// --- Chat channel config ---
const channelConfig: Record<ChatChannel, { label: string; icon: React.ElementType; color: string }> = {
  whatsapp: { label: "WhatsApp", icon: Phone, color: "text-emerald-500" },
  instagram: { label: "Instagram", icon: Instagram, color: "text-pink-500" },
  facebook: { label: "Facebook", icon: Facebook, color: "text-blue-600" },
  website: { label: "Site", icon: Globe, color: "text-primary" },
  telegram: { label: "Telegram", icon: Send, color: "text-sky-500" },
  email: { label: "Email", icon: Mail, color: "text-amber-600" },
};

const convStatusConfig: Record<ConversationStatus, { label: string; icon: React.ElementType; className: string }> = {
  open: { label: "Aberto", icon: MessageSquare, className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  waiting: { label: "Aguardando", icon: Clock, className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  resolved: { label: "Resolvido", icon: CheckCheck, className: "bg-primary/10 text-primary border-primary/20" },
  closed: { label: "Fechado", icon: XCircle, className: "bg-muted text-muted-foreground border-muted" },
};

// --- Conversation List Item ---
function ConversationItem({ conv, active, onClick, unreadCount }: { conv: Conversation; active: boolean; onClick: () => void; unreadCount?: number }) {
  const ch = channelConfig[conv.channel];
  const ChIcon = ch.icon;
  const timeAgo = conv.last_message_at
    ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true, locale: ptBR })
    : "";
  const hasUnread = (unreadCount ?? 0) > 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 border-b border-border transition-colors hover:bg-muted/50 ${active ? "bg-muted" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="relative mt-0.5">
          <div className={`flex size-9 shrink-0 items-center justify-center rounded-full bg-muted ${ch.color}`}>
            <ChIcon className="size-4" />
          </div>
          {hasUnread && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground animate-pulse">
              {unreadCount! > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className={`truncate text-sm ${hasUnread ? "font-bold" : "font-medium"}`}>
              {(conv.customers as any)?.name || conv.channel_contact_id || "Desconhecido"}
            </p>
            <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo}</span>
          </div>
          <p className={`truncate text-xs mt-0.5 ${hasUnread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
            {conv.last_message_preview || "Sem mensagens"}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${convStatusConfig[conv.status].className}`}>
              {convStatusConfig[conv.status].label}
            </Badge>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{ch.label}</Badge>
          </div>
        </div>
      </div>
    </button>
  );
}

// --- Media rendering helpers ---
function MediaContent({ msg }: { msg: ChatMessage }) {
  const isAgent = msg.sender_type === "agent";
  const linkClass = isAgent ? "text-primary-foreground/80 underline" : "text-primary underline";

  if (!msg.media_url) return null;

  switch (msg.content_type) {
    case "image":
      return (
        <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="block mb-1">
          <img
            src={msg.media_url}
            alt={msg.content || "Imagem"}
            className="max-w-full max-h-60 rounded-lg object-cover"
            loading="lazy"
          />
        </a>
      );
    case "audio":
      return (
        <audio controls className="max-w-full mb-1" preload="metadata">
          <source src={msg.media_url} />
        </audio>
      );
    case "video":
      return (
        <video controls className="max-w-full max-h-60 rounded-lg mb-1" preload="metadata">
          <source src={msg.media_url} />
        </video>
      );
    case "document":
      return (
        <a href={msg.media_url} target="_blank" rel="noopener noreferrer"
          className={`flex items-center gap-2 mb-1 text-xs ${linkClass}`}>
          <FileText className="size-4 shrink-0" />
          <span className="truncate">{msg.content || "Documento"}</span>
          <Download className="size-3 shrink-0" />
        </a>
      );
    default:
      return (
        <a href={msg.media_url} target="_blank" rel="noopener noreferrer"
          className={`text-xs ${linkClass} mb-1 block`}>
          [{msg.content_type}] Abrir arquivo
        </a>
      );
  }
}

// --- Delivery status indicator ---
function DeliveryStatusIcon({ status, isAgent }: { status: DeliveryStatus; isAgent: boolean }) {
  if (!isAgent) return null;
  const base = isAgent ? "text-primary-foreground/60" : "text-muted-foreground";
  switch (status) {
    case "sent":
      return <Check className={`size-3 ${base}`} />;
    case "delivered":
      return <CheckCheck className={`size-3 ${base}`} />;
    case "read":
      return <CheckCheck className="size-3 text-sky-400" />;
    case "failed":
      return <AlertCircle className="size-3 text-destructive" />;
    default:
      return <Clock className={`size-3 ${base}`} />;
  }
}

// --- Chat Message Bubble ---
function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isAgent = msg.sender_type === "agent";
  const isSystem = msg.sender_type === "system" || msg.sender_type === "bot";

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[11px] text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {msg.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isAgent ? "justify-end" : "justify-start"} mb-2`}>
      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
        isAgent
          ? "bg-primary text-primary-foreground rounded-br-md"
          : "bg-muted text-foreground rounded-bl-md"
      }`}>
        <MediaContent msg={msg} />
        {msg.content && msg.content_type === "text" && (
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        )}
        {msg.content && msg.content_type !== "text" && msg.content_type !== "document" && (
          <p className="whitespace-pre-wrap break-words text-xs mt-1">{msg.content}</p>
        )}
        <div className={`flex items-center gap-1 mt-1 ${isAgent ? "justify-end" : ""}`}>
          <p className={`text-[10px] ${isAgent ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
            {format(new Date(msg.created_at), "HH:mm")}
          </p>
          <DeliveryStatusIcon status={msg.delivery_status} isAgent={isAgent} />
        </div>
      </div>
    </div>
  );
}
// --- Chat Panel ---
function ChatPanel({ conversation }: { conversation: Conversation | null }) {
  const { play: playSound } = useNotificationSound();

  const handleNewIncoming = useCallback((msg: ChatMessage) => {
    playSound();
    const preview = msg.content?.substring(0, 80) || `[${msg.content_type}]`;
    toast.info("Nova mensagem recebida", { description: preview, duration: 5000 });
  }, [playSound]);

  const { data: messages, isLoading } = useChatMessages(conversation?.id ?? null, { onNewIncoming: handleNewIncoming });
  const { data: cannedResponses } = useCannedResponses();
  const sendMsg = useSendMessage();
  const updateConv = useUpdateConversation();
  const [text, setText] = useState("");
  const [showCanned, setShowCanned] = useState(false);
  const [cannedFilter, setCannedFilter] = useState("");
  const [cannedIndex, setCannedIndex] = useState(0);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Detect "/" trigger for canned responses
  useEffect(() => {
    if (text.startsWith("/")) {
      const filter = text.slice(1).toLowerCase();
      setCannedFilter(filter);
      setShowCanned(true);
      setCannedIndex(0);
    } else {
      setShowCanned(false);
      setCannedFilter("");
    }
  }, [text]);

  const filteredCanned = cannedResponses?.filter((r) =>
    !cannedFilter ||
    r.shortcut.toLowerCase().includes(cannedFilter) ||
    r.title.toLowerCase().includes(cannedFilter) ||
    r.content.toLowerCase().includes(cannedFilter)
  ) ?? [];

  const selectCannedResponse = (response: CannedResponse) => {
    setText(response.content);
    setShowCanned(false);
    setCannedFilter("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showCanned || !filteredCanned.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setCannedIndex((i) => Math.min(i + 1, filteredCanned.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCannedIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); selectCannedResponse(filteredCanned[cannedIndex]); }
    else if (e.key === "Escape") { setShowCanned(false); }
  };

  const getContentType = (mime: string): string => {
    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("audio/")) return "audio";
    if (mime.startsWith("video/")) return "video";
    return "document";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPendingPreview(url);
    } else {
      setPendingPreview(null);
    }
    e.target.value = "";
  };

  const clearPendingFile = () => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(null);
    setPendingPreview(null);
  };

  const uploadFile = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop() || "bin";
    const path = `${conversation!.organization_id}/${conversation!.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("chat-media").upload(path, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("chat-media").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSend = async () => {
    if (!text.trim() && !pendingFile) return;

    if (pendingFile) {
      setUploading(true);
      try {
        const mediaUrl = await uploadFile(pendingFile);
        const contentType = getContentType(pendingFile.type);
        sendMsg.mutate({
          conversation_id: conversation!.id,
          content: text.trim() || pendingFile.name,
          content_type: contentType as any,
          media_url: mediaUrl,
          channel: conversation!.channel,
          channel_contact_id: conversation!.channel_contact_id,
        });
        clearPendingFile();
      } catch (err) {
        console.error("Upload failed:", err);
      } finally {
        setUploading(false);
      }
    } else {
      sendMsg.mutate({
        conversation_id: conversation!.id,
        content: text.trim(),
        channel: conversation!.channel,
        channel_contact_id: conversation!.channel_contact_id,
      });
    }
    setText("");
    setShowCanned(false);
  };

  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Selecione uma conversa para iniciar
      </div>
    );
  }

  const ch = channelConfig[conversation.channel];
  const ChIcon = ch.icon;
  const customerName = (conversation.customers as any)?.name || conversation.channel_contact_id || "Desconhecido";

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`flex size-9 items-center justify-center rounded-full bg-muted ${ch.color}`}>
            <ChIcon className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">{customerName}</p>
            <p className="text-xs text-muted-foreground">{ch.label} • {convStatusConfig[conversation.status].label}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Select
            value={conversation.status}
            onValueChange={(v) => updateConv.mutate({ id: conversation.id, status: v as ConversationStatus })}
          >
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(convStatusConfig).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : !messages?.length ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            Nenhuma mensagem ainda
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} msg={m} />)
        )}
        <div ref={bottomRef} />
      </ScrollArea>

      {/* Input with canned responses */}
      <div className="border-t px-4 py-3">
        {/* Canned responses popup */}
        {showCanned && filteredCanned.length > 0 && (
          <div className="mb-2 max-h-48 overflow-y-auto rounded-lg border bg-popover shadow-md">
            <div className="px-3 py-1.5 border-b">
              <p className="text-[10px] font-medium text-muted-foreground">Respostas rápidas — ↑↓ navegar • Enter selecionar • Esc fechar</p>
            </div>
            {filteredCanned.map((r, i) => (
              <button
                key={r.id}
                onClick={() => selectCannedResponse(r)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-muted/50 ${
                  i === cannedIndex ? "bg-muted" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 font-mono">/{r.shortcut}</Badge>
                  <span className="font-medium text-xs">{r.title}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.content}</p>
              </button>
            ))}
          </div>
        )}

        {/* Pending file preview */}
        {pendingFile && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border bg-muted/50 p-2">
            {pendingPreview ? (
              <img src={pendingPreview} alt="Preview" className="size-14 rounded object-cover" />
            ) : (
              <div className="flex size-14 items-center justify-center rounded bg-muted">
                {pendingFile.type.startsWith("audio/") ? <Mic className="size-5 text-muted-foreground" /> :
                 pendingFile.type.startsWith("video/") ? <File className="size-5 text-muted-foreground" /> :
                 <FileText className="size-5 text-muted-foreground" />}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{pendingFile.name}</p>
              <p className="text-[10px] text-muted-foreground">{(pendingFile.size / 1024).toFixed(1)} KB</p>
            </div>
            <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={clearPendingFile}>
              <X className="size-3.5" />
            </Button>
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); if (!showCanned) handleSend(); }}
          className="flex items-center gap-2"
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
            onChange={handleFileSelect}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            disabled={conversation.status === "closed" || uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="size-4" />
          </Button>
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              placeholder='Digite "/" para respostas rápidas...'
              className="flex-1"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={conversation.status === "closed"}
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={(!text.trim() && !pendingFile) || sendMsg.isPending || uploading || conversation.status === "closed"}
          >
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}

// --- Main Atendimento Page ---
export default function Atendimento() {
  // Ticket state
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketDebounced, setTicketDebounced] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TicketRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data: tickets, isLoading: ticketsLoading, error: ticketsError } = useTickets(ticketDebounced);
  const deleteMut = useDeleteTicket();

  useEffect(() => {
    const t = setTimeout(() => setTicketDebounced(ticketSearch), 300);
    return () => clearTimeout(t);
  }, [ticketSearch]);

  // Chat state
  const [chatSearch, setChatSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<ChatChannel | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | "all">("all");
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);

  const { data: conversations, isLoading: convsLoading } = useConversations({
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(channelFilter !== "all" ? { channel: channelFilter } : {}),
  });
  const { data: unreadData } = useUnreadMessages();

  const filteredConvs = conversations?.filter((c) => {
    if (!chatSearch) return true;
    const name = (c.customers as any)?.name || c.channel_contact_id || "";
    return name.toLowerCase().includes(chatSearch.toLowerCase()) ||
      (c.last_message_preview || "").toLowerCase().includes(chatSearch.toLowerCase());
  });

  // Ticket handlers
  const handleEdit = (t: TicketRecord) => { setEditing(t); setFormOpen(true); };
  const handleNew = () => { setEditing(null); setFormOpen(true); };
  const handleDelete = async () => { if (deleteId) { await deleteMut.mutateAsync(deleteId); setDeleteId(null); } };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Atendimento</h1>
        <p className="text-muted-foreground text-sm">Chat omnichannel e tickets de suporte</p>
      </div>

      <Tabs defaultValue="chat">
        <TabsList>
          <TabsTrigger value="chat">
            <MessageSquare className="mr-2 size-4" /> Chat Omnichannel
          </TabsTrigger>
          <TabsTrigger value="tickets">
            <Pencil className="mr-2 size-4" /> Tickets
          </TabsTrigger>
        </TabsList>

        {/* ============ CHAT TAB ============ */}
        <TabsContent value="chat" className="mt-4">
          <Card className="overflow-hidden">
            <div className="flex h-[600px]">
              {/* Sidebar - conversations list */}
              <div className="w-80 shrink-0 border-r flex flex-col">
                <div className="p-3 space-y-2 border-b">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                    <Input placeholder="Buscar conversa..." className="pl-9 h-9 text-sm"
                      value={chatSearch} onChange={(e) => setChatSearch(e.target.value)} />
                  </div>
                  <div className="flex gap-1.5">
                    <Select value={channelFilter} onValueChange={(v) => setChannelFilter(v as any)}>
                      <SelectTrigger className="h-7 text-xs flex-1">
                        <SelectValue placeholder="Canal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {Object.entries(channelConfig).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                      <SelectTrigger className="h-7 text-xs flex-1">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {Object.entries(convStatusConfig).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  {convsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="size-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : !filteredConvs?.length ? (
                    <div className="py-12 text-center">
                      <MessageSquare className="mx-auto size-8 text-muted-foreground/30 mb-2" />
                      <p className="text-xs text-muted-foreground">Nenhuma conversa encontrada</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-1 px-4">
                        As conversas aparecerão aqui quando as integrações de canais forem configuradas.
                      </p>
                    </div>
                  ) : (
                    filteredConvs.map((c) => (
                      <ConversationItem
                        key={c.id}
                        conv={c}
                        active={selectedConv?.id === c.id}
                        onClick={() => setSelectedConv(c)}
                        unreadCount={unreadData?.byConversation[c.id] || 0}
                      />
                    ))
                  )}
                </ScrollArea>
              </div>

              {/* Chat panel */}
              <ChatPanel conversation={selectedConv} />
            </div>
          </Card>

          {/* Channel status cards */}
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mt-4">
            {Object.entries(channelConfig).map(([key, cfg]) => {
              const ChIcon = cfg.icon;
              return (
                <Card key={key}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={`flex size-8 items-center justify-center rounded-lg bg-muted ${cfg.color}`}>
                      <ChIcon className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium">{cfg.label}</p>
                      <p className="text-[10px] text-muted-foreground">Aguardando API</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ============ TICKETS TAB ============ */}
        <TabsContent value="tickets" className="mt-4">
          <div className="flex justify-end mb-4">
            <Button onClick={handleNew}><Plus className="mr-2 size-4" />Novo Ticket</Button>
          </div>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">
                  Todos os Tickets
                  {tickets && <span className="ml-2 text-sm font-normal text-muted-foreground">({tickets.length})</span>}
                </CardTitle>
                <div className="relative flex-1 sm:w-64 sm:flex-initial">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input placeholder="Buscar por assunto..." className="pl-9" value={ticketSearch} onChange={(e) => setTicketSearch(e.target.value)} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {ticketsLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
              ) : ticketsError ? (
                <div className="py-12 text-center text-sm text-destructive">Não foi possível carregar os tickets.</div>
              ) : !tickets?.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground">Nenhum ticket encontrado</p>
                  <Button variant="outline" className="mt-4" onClick={handleNew}><Plus className="mr-2 size-4" />Criar primeiro ticket</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assunto</TableHead>
                      <TableHead className="hidden md:table-cell">Cliente</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Criado em</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((t) => {
                      const st = statusMap[t.status] || statusMap.open;
                      const pr = priorityMap[t.priority] || priorityMap.medium;
                      return (
                        <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(t)}>
                          <TableCell className="font-medium">{t.subject}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">{(t.customers as any)?.name || "—"}</TableCell>
                          <TableCell><Badge variant="outline" className={pr.className}>{pr.label}</Badge></TableCell>
                          <TableCell><Badge variant="outline" className={st.className}>{st.label}</Badge></TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">{format(new Date(t.created_at), "dd/MM/yyyy")}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="size-8"><MoreHorizontal className="size-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(t); }}><Pencil className="mr-2 size-4" />Editar</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteId(t.id); }}><Trash2 className="mr-2 size-4" />Excluir</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <TicketFormDialog open={formOpen} onOpenChange={setFormOpen} editing={editing} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ticket?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
