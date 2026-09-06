do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'payments'
      and column_name = 'receipt_url'
  ) then
    alter table public.payments
      rename column receipt_url to receipt_path;
  end if;
end $$;
