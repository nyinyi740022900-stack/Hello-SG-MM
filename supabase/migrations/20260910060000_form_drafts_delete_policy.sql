-- Allow users to delete their own passport (and other) form drafts from Account.

create policy "Users can delete own drafts"
  on public.form_drafts
  for delete
  using (auth.uid() = user_id);
