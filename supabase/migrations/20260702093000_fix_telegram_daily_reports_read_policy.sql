grant select on public.telegram_daily_reports to authenticated;

drop policy if exists "Members can read generated Telegram digests"
on public.telegram_daily_reports;

create policy "Members can read generated Telegram digests"
on public.telegram_daily_reports for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
  )
);
