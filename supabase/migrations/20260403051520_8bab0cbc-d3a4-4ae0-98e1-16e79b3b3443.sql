
-- Enum for chat channels
CREATE TYPE public.chat_channel AS ENUM ('whatsapp', 'instagram', 'facebook', 'website', 'telegram', 'email');

-- Enum for conversation status
CREATE TYPE public.conversation_status AS ENUM ('open', 'waiting', 'resolved', 'closed');

-- Conversations table (one per customer+channel)
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  channel chat_channel NOT NULL,
  channel_contact_id TEXT, -- external contact ID (phone, ig_id, fb_id, etc)
  channel_conversation_id TEXT, -- external thread/conversation ID from the platform
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status conversation_status NOT NULL DEFAULT 'open',
  subject TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'agent', 'system', 'bot')),
  sender_id UUID, -- profile id if agent, null if customer/system
  content TEXT,
  content_type TEXT NOT NULL DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'audio', 'video', 'document', 'location', 'sticker')),
  media_url TEXT,
  external_message_id TEXT, -- ID from the external platform
  metadata JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quick replies / canned responses
CREATE TABLE public.canned_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  shortcut TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Channel configurations (API keys, webhooks per org)
CREATE TABLE public.channel_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  channel chat_channel NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB DEFAULT '{}', -- API keys, webhook URLs, etc
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, channel)
);

-- Indexes
CREATE INDEX idx_conversations_org ON public.conversations(organization_id);
CREATE INDEX idx_conversations_status ON public.conversations(organization_id, status);
CREATE INDEX idx_conversations_assigned ON public.conversations(assigned_to);
CREATE INDEX idx_conversations_channel ON public.conversations(organization_id, channel);
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id, created_at);
CREATE INDEX idx_chat_messages_org ON public.chat_messages(organization_id);

-- Triggers for updated_at
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_channel_configs_updated_at BEFORE UPDATE ON public.channel_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canned_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: org members can CRUD their own data
CREATE POLICY "Org members can manage conversations" ON public.conversations
  FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org members can manage messages" ON public.chat_messages
  FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org members can manage canned responses" ON public.canned_responses
  FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Org members can manage channel configs" ON public.channel_configs
  FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
