create table if not exists membre_fcm_tokens (
  id uuid primary key default uuid_generate_v4(),
  membre_id uuid not null references membres(id) on delete cascade,
  token text not null unique,
  cree_le timestamptz not null default now()
);

create index if not exists membre_fcm_tokens_membre_id_idx on membre_fcm_tokens(membre_id);
alter table membre_fcm_tokens enable row level security;

create or replace function public.est_administrateur()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.administrateurs where user_id = auth.uid()
  );
$$;

revoke all on function public.est_administrateur() from public;
grant execute on function public.est_administrateur() to authenticated;

drop policy if exists "Admin accès total jetons notifications" on membre_fcm_tokens;
create policy "Admin accès total jetons notifications" on membre_fcm_tokens for all to authenticated
  using (public.est_administrateur())
  with check (public.est_administrateur());

notify pgrst, 'reload schema';