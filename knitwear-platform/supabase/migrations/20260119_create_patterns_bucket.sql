-- Create 'patterns' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('patterns', 'patterns', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload files
create policy "Authenticated users can upload patterns"
on storage.objects for insert
with check ( bucket_id = 'patterns' and auth.role() = 'authenticated' );

-- Policy to allow public to view patterns
create policy "Public can view patterns"
on storage.objects for select
using ( bucket_id = 'patterns' );

-- Policy to allow users to update their own patterns
create policy "Users can update own patterns"
on storage.objects for update
using ( bucket_id = 'patterns' and auth.uid() = owner )
with check ( bucket_id = 'patterns' and auth.uid() = owner );

-- Policy to allow users to delete their own patterns
create policy "Users can delete own patterns"
on storage.objects for delete
using ( bucket_id = 'patterns' and auth.uid() = owner );
