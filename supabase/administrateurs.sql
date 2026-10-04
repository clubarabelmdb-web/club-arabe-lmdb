-- À exécuter dans Supabase SQL Editor pour les projets déjà installés.
-- Évite la récursion RLS lors de la vérification du rôle administrateur.
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

drop policy if exists "Admin accès total inscriptions" on inscriptions;
drop policy if exists "Admin accès total membres" on membres;
drop policy if exists "Admin accès total actualites" on actualites;
drop policy if exists "Admin accès total activites" on activites;
drop policy if exists "Admin accès total albums" on albums;
drop policy if exists "Admin accès total photos" on photos;
drop policy if exists "Admin accès total messages" on messages;
drop policy if exists "Admin accès total contact" on messages_contact;
drop policy if exists "Admin voit tous les admins" on administrateurs;
drop policy if exists "Admin accès total jetons notifications" on membre_fcm_tokens;

create policy "Admin accès total inscriptions" on inscriptions for all to authenticated
  using (public.est_administrateur());
create policy "Admin accès total membres" on membres for all to authenticated
  using (public.est_administrateur());
create policy "Admin accès total actualites" on actualites for all to authenticated
  using (public.est_administrateur());
create policy "Admin accès total activites" on activites for all to authenticated
  using (public.est_administrateur());
create policy "Admin accès total albums" on albums for all to authenticated
  using (public.est_administrateur());
create policy "Admin accès total photos" on photos for all to authenticated
  using (public.est_administrateur());
create policy "Admin accès total messages" on messages for all to authenticated
  using (public.est_administrateur());
create policy "Admin accès total contact" on messages_contact for all to authenticated
  using (public.est_administrateur());
create policy "Admin voit tous les admins" on administrateurs for select to authenticated
  using (public.est_administrateur());
create policy "Admin accès total jetons notifications" on membre_fcm_tokens for all to authenticated
  using (public.est_administrateur());

notify pgrst, 'reload schema';
