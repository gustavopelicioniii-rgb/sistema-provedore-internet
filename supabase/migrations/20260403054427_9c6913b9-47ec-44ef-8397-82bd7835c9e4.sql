ALTER TABLE public.chat_messages
ADD COLUMN delivery_status text NOT NULL DEFAULT 'sent';
