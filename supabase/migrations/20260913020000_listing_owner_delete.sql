-- Posters could not delist their own room/job listing at all — everything
-- required an admin. Add owner-scoped delete policies so a poster can take
-- down a room already rented or a job already filled themselves. Full
-- content editing stays admin-only: a published listing has already been
-- moderated, and letting the poster silently rewrite it after approval
-- would bypass that review.

drop policy if exists "Posters can delete own room listings" on public.room_listings;
create policy "Posters can delete own room listings"
  on public.room_listings for delete
  to authenticated
  using (poster_id = auth.uid());

drop policy if exists "Posters can delete own job listings" on public.job_listings;
create policy "Posters can delete own job listings"
  on public.job_listings for delete
  to authenticated
  using (poster_id = auth.uid());
