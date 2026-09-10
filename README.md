# Club Arabe — Lycée Maba Diakhou Ba

Site web du Club Arabe : présentation, inscription en ligne, validation des
membres, numéros de membre automatiques, cartes numériques avec QR code,
espace membre, tableau de bord admin, actualités et galerie.

**Stack (100% gratuite) :**
- [Next.js](https://nextjs.org) — site + pages
- [Supabase](https://supabase.com) — base de données PostgreSQL + authentification + stockage photos
- [Vercel](https://vercel.com) — hébergement du site

---

## 1. Installer le projet en local

```bash
npm install
cp .env.local.example .env.local
```

## 2. Créer le projet Supabase (gratuit)

1. Va sur [supabase.com](https://supabase.com) → crée un compte → **New project**.
2. Une fois le projet créé, va dans **Project Settings > API**.
3. Copie **Project URL** et **anon public key** dans ton fichier `.env.local` :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxxxx
```

## 3. Créer les tables de la base de données

1. Dans Supabase, ouvre **SQL Editor > New query**.
2. Colle tout le contenu du fichier `supabase/schema.sql` de ce projet.
3. Clique **Run**. Toutes les tables, fonctions et sécurités sont créées
   automatiquement.

## 4. Créer le stockage pour les photos

1. Dans Supabase, va dans **Storage > New bucket**.
2. Crée un bucket nommé exactement `photos-membres`, et coche **Public bucket**.
3. (Optionnel) Crée un second bucket `galerie` pour les photos d'activités.

## 5. Créer ton premier compte administrateur

1. Dans Supabase, va dans **Authentication > Users > Add user**.
2. Crée un utilisateur avec ton e-mail et un mot de passe.
3. Copie son **UID** (identifiant affiché dans la liste).
4. Retourne dans **SQL Editor** et exécute (en remplaçant l'UID et ton nom) :

```sql
insert into administrateurs (user_id, nom, role)
values ('UID-COPIÉ-ICI', 'Ton Nom', 'super_admin');
```

5. Tu peux maintenant te connecter sur `/admin` avec cet e-mail et ce mot de
   passe.

## 6. Lancer le site en local

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000).

---

## 7. Mettre le site en ligne gratuitement (Vercel)

1. Mets ce projet sur GitHub (crée un dépôt, `git init`, `git add .`,
   `git commit`, `git push`).
2. Va sur [vercel.com](https://vercel.com) → connecte-toi avec GitHub →
   **Add New Project** → sélectionne ton dépôt.
3. Dans les réglages du projet Vercel, ajoute les mêmes variables
d'environnement que dans `.env.local` (`NEXT_PUBLIC_SUPABASE_URL` et
`NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Clique **Deploy**. Ton site sera en ligne sur une adresse du type
   `club-arabe-lmdb.vercel.app` (tu pourras ajouter un nom de domaine plus
   tard si tu en achètes un).

---

## Ce qui est déjà fonctionnel dans cette première version

- ✅ Page d'accueil, À propos, Actualités, Galerie, Contact
- ✅ Formulaire d'inscription en ligne (avec photo facultative)
- ✅ Flux de validation : demande → en attente → admin accepte/refuse
- ✅ Génération automatique du numéro de membre (`CA-LMDB-0001`, ...)
- ✅ Création automatique de la carte de membre + notification
- ✅ Tableau de bord admin (statistiques, demandes, liste des membres)
- ✅ Espace membre avec carte numérique + QR code + notifications
- ✅ Base de données complète (actualités, activités, galerie, messages)
- ✅ Sécurité par Row Level Security (RLS) sur toutes les tables

## Prochaines étapes possibles

- Publication/édition des actualités et albums photos depuis le tableau de
  bord admin (actuellement à faire directement dans Supabase, en attendant
  une interface dédiée)
- Export PDF de la carte de membre
- Messagerie ciblée (par classe / membres choisis) depuis l'admin
- Page « Activités et événements » avec archives

N'hésite pas à revenir vers moi pour construire une de ces parties.
