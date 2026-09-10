-- ============================================================
-- Schéma de base de données — Club Arabe LMDB
-- À exécuter dans Supabase : SQL Editor > New query > Run
-- ============================================================

-- Extension pour générer des UUID
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- 1. INSCRIPTIONS (demandes en attente de validation)
-- ------------------------------------------------------------
create table if not exists inscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  prenom text not null,
  nom text not null,
  classe text not null,
  telephone text not null,
  email text not null,
  annee_scolaire text not null,
  photo_url text,
  statut text not null default 'en_attente' check (statut in ('en_attente', 'accepte', 'refuse')),
  cree_le timestamptz not null default now(),
  traite_le timestamptz
);

alter table inscriptions add column if not exists user_id uuid references auth.users(id) on delete set null;

-- ------------------------------------------------------------
-- 2. MEMBRES (créés automatiquement après validation)
-- ------------------------------------------------------------
create table if not exists membres (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  numero_membre text unique not null, -- ex: CA-LMDB-0001
  prenom text not null,
  nom text not null,
  classe text not null,
  telephone text not null,
  email text not null,
  annee_scolaire text not null,
  photo_url text,
  statut text not null default 'actif' check (statut in ('actif', 'inactif')),
  inscription_id uuid references inscriptions(id),
  cree_le timestamptz not null default now()
);

-- Compteur pour générer les numéros de membre sans doublon
create table if not exists compteur_membres (
  id int primary key default 1,
  dernier_numero int not null default 0
);
insert into compteur_membres (id, dernier_numero) values (1, 0)
  on conflict (id) do nothing;

-- Fonction : génère le prochain numéro de membre (CA-LMDB-0001, 0002, ...)
create or replace function generer_numero_membre()
returns text
language plpgsql
as $$
declare
  nouveau_numero int;
begin
  update compteur_membres
    set dernier_numero = dernier_numero + 1
    where id = 1
    returning dernier_numero into nouveau_numero;
  return 'CA-LMDB-' || lpad(nouveau_numero::text, 4, '0');
end;
$$;

-- Fonction : valide une inscription -> crée le membre + numéro + carte
create or replace function valider_inscription(inscription_id_param uuid)
returns membres
language plpgsql
security definer
as $$
declare
  insc inscriptions;
  nouveau_membre membres;
begin
  select * into insc from inscriptions where id = inscription_id_param;

  if insc is null then
    raise exception 'Inscription introuvable';
  end if;

  if insc.statut != 'en_attente' then
    raise exception 'Cette inscription a déjà été traitée';
  end if;

  insert into membres (numero_membre, prenom, nom, classe, telephone, email, annee_scolaire, photo_url, inscription_id)
  values (generer_numero_membre(), insc.prenom, insc.nom, insc.classe, insc.telephone, insc.email, insc.annee_scolaire, insc.photo_url, insc.id)
  returning * into nouveau_membre;

  update membres set user_id = insc.user_id where id = nouveau_membre.id;

  update inscriptions set statut = 'accepte', traite_le = now() where id = inscription_id_param;

  insert into notifications (membre_id, titre, message)
  values (nouveau_membre.id, 'Inscription validée', 'Félicitations ! Votre inscription au Club Arabe a été validée. Votre numéro de membre est ' || nouveau_membre.numero_membre || '.');

  return nouveau_membre;
end;
$$;

-- Fonction : refuse une inscription
create or replace function refuser_inscription(inscription_id_param uuid)
returns void
language plpgsql
security definer
as $$
begin
  update inscriptions set statut = 'refuse', traite_le = now() where id = inscription_id_param;
end;
$$;

-- ------------------------------------------------------------
-- 3. ADMINISTRATEURS
-- ------------------------------------------------------------
create table if not exists administrateurs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  nom text not null,
  role text not null default 'admin' check (role in ('admin', 'super_admin')),
  cree_le timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 4. ACTUALITÉS
-- ------------------------------------------------------------
create table if not exists actualites (
  id uuid primary key default uuid_generate_v4(),
  titre text not null,
  description text not null,
  image_url text,
  auteur text,
  publie_le timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5. ACTIVITÉS / ÉVÉNEMENTS
-- ------------------------------------------------------------
create table if not exists activites (
  id uuid primary key default uuid_generate_v4(),
  titre text not null,
  description text,
  date_activite date not null,
  heure text,
  lieu text,
  affiche_url text,
  programme text,
  cree_le timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 6. GALERIE (albums + photos)
-- ------------------------------------------------------------
create table if not exists albums (
  id uuid primary key default uuid_generate_v4(),
  titre text not null,
  description text,
  cree_le timestamptz not null default now()
);

create table if not exists photos (
  id uuid primary key default uuid_generate_v4(),
  album_id uuid references albums(id) on delete cascade,
  url text not null,
  legende text,
  ajoutee_le timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 7. MESSAGES (administration -> membres)
-- ------------------------------------------------------------
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  titre text not null,
  contenu text not null,
  cible_type text not null check (cible_type in ('tous', 'classe', 'membres')),
  cible_valeur text, -- ex: nom de la classe, ou liste d'ids séparés par virgule
  envoye_le timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 8. NOTIFICATIONS (par membre)
-- ------------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  membre_id uuid references membres(id) on delete cascade,
  titre text not null,
  message text not null,
  lue boolean not null default false,
  cree_le timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 9. CONTACT (messages envoyés depuis la page contact)
-- ------------------------------------------------------------
create table if not exists messages_contact (
  id uuid primary key default uuid_generate_v4(),
  nom text not null,
  email text not null,
  sujet text,
  contenu text not null,
  cree_le timestamptz not null default now()
);

-- ============================================================
-- SÉCURITÉ (Row Level Security)
-- ============================================================
alter table inscriptions enable row level security;
alter table membres enable row level security;
alter table administrateurs enable row level security;
alter table actualites enable row level security;
alter table activites enable row level security;
alter table albums enable row level security;
alter table photos enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;
alter table messages_contact enable row level security;

-- Permet de relancer ce fichier sans erreur si les policies existent déjà.
drop policy if exists "Inscription publique" on inscriptions;
drop policy if exists "Contact public" on messages_contact;
drop policy if exists "Actualités visibles par tous" on actualites;
drop policy if exists "Activités visibles par tous" on activites;
drop policy if exists "Albums visibles par tous" on albums;
drop policy if exists "Photos visibles par tous" on photos;
drop policy if exists "Un membre voit son profil" on membres;
drop policy if exists "Un membre voit ses notifications" on notifications;
drop policy if exists "Admin accès total inscriptions" on inscriptions;
drop policy if exists "Admin accès total membres" on membres;
drop policy if exists "Admin accès total actualites" on actualites;
drop policy if exists "Admin accès total activites" on activites;
drop policy if exists "Admin accès total albums" on albums;
drop policy if exists "Admin accès total photos" on photos;
drop policy if exists "Admin accès total messages" on messages;
drop policy if exists "Admin accès total contact" on messages_contact;
drop policy if exists "Admin voit tous les admins" on administrateurs;

-- Tout le monde peut créer une demande d'inscription et envoyer un message contact
create policy "Inscription publique" on inscriptions for insert to anon, authenticated with check (true);
create policy "Contact public" on messages_contact for insert to anon, authenticated with check (true);

-- Contenu public en lecture (vitrine du site)
create policy "Actualités visibles par tous" on actualites for select to anon, authenticated using (true);
create policy "Activités visibles par tous" on activites for select to anon, authenticated using (true);
create policy "Albums visibles par tous" on albums for select to anon, authenticated using (true);
create policy "Photos visibles par tous" on photos for select to anon, authenticated using (true);

-- Un membre connecté ne voit que sa propre fiche et ses propres notifications
create policy "Un membre voit son profil" on membres for select to authenticated using (auth.uid() = user_id);
create policy "Un membre voit ses notifications" on notifications for select to authenticated
  using (membre_id in (select id from membres where user_id = auth.uid()));

-- Les administrateurs ont un accès complet (vérifié via la table administrateurs)
create policy "Admin accès total inscriptions" on inscriptions for all to authenticated
  using (exists (select 1 from administrateurs where user_id = auth.uid()));
create policy "Admin accès total membres" on membres for all to authenticated
  using (exists (select 1 from administrateurs where user_id = auth.uid()));
create policy "Admin accès total actualites" on actualites for all to authenticated
  using (exists (select 1 from administrateurs where user_id = auth.uid()));
create policy "Admin accès total activites" on activites for all to authenticated
  using (exists (select 1 from administrateurs where user_id = auth.uid()));
create policy "Admin accès total albums" on albums for all to authenticated
  using (exists (select 1 from administrateurs where user_id = auth.uid()));
create policy "Admin accès total photos" on photos for all to authenticated
  using (exists (select 1 from administrateurs where user_id = auth.uid()));
create policy "Admin accès total messages" on messages for all to authenticated
  using (exists (select 1 from administrateurs where user_id = auth.uid()));
create policy "Admin accès total contact" on messages_contact for all to authenticated
  using (exists (select 1 from administrateurs where user_id = auth.uid()));
create policy "Admin voit tous les admins" on administrateurs for select to authenticated
  using (exists (select 1 from administrateurs where user_id = auth.uid()));

-- Recharger le cache PostgREST après les changements de structure.
notify pgrst, 'reload schema';

-- ============================================================
-- Pour créer ton premier compte admin :
-- 1. Crée un utilisateur dans Authentication > Users (email + mot de passe)
-- 2. Récupère son UUID
-- 3. Exécute :
--    insert into administrateurs (user_id, nom, role)
--    values ('UUID-COPIÉ-ICI', 'Nom Prénom', 'super_admin');
-- ============================================================
