-- Create the chat-media storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-media',
  'chat-media',
  true,
  20971520, -- 20MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/mp4',
    'video/mp4', 'video/webm',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv'
  ]
);

-- Public read access
CREATE POLICY "Chat media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-media');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload chat media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-media');

-- Authenticated users can update their uploads
CREATE POLICY "Authenticated users can update chat media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'chat-media');

-- Authenticated users can delete their uploads
CREATE POLICY "Authenticated users can delete chat media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-media');