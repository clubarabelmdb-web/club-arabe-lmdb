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

Pour une base de données déjà installée, exécute également
`supabase/administrateurs.sql` dans le SQL Editor de Supabase. Une fois connecté
avec un compte `super_admin`, ouvre **Administrateurs** depuis le tableau de
bord pour créer un compte administrateur en renseignant son e-mail et son mot
de passe. Aucun e-mail d'invitation n'est envoyé. Si l'adresse correspond à un
compte déjà existant, son mot de passe est remplacé par celui défini ici.
Un super-administrateur peut aussi retirer l'accès d'un autre administrateur
depuis la même page; cela ne supprime pas son compte utilisateur. Son propre
accès et le dernier super-administrateur ne peuvent pas être supprimés.
Ajoute `SUPABASE_SERVICE_ROLE_KEY` dans les variables d'environnement de
déploiement : cette clé est utilisée uniquement par le serveur pour créer les
comptes et ne doit jamais être exposée dans le navigateur.

Les assistants IA utilisent l'API Gemini. Pour les activer, crée
une clé API dans Google AI Studio puis ajoute-la dans les variables
d'environnement Vercel sous `GEMINI_API_KEY` (sans préfixe `NEXT_PUBLIC_`).
Cette clé reste côté serveur. L'assistant est réservé aux administrateurs,
répond aux questions générales sur le site et ne consulte ni ne modifie les
données des membres. Dans l'espace membre, l'assistant peut répondre à partir
de la fiche et des paiements du seul membre connecté; il ne modifie aucun
compte ni paiement. Pour ce service personnalisé, le nom, le numéro de membre,
la classe, le statut et jusqu'aux 20 paiements récents sont transmis à Google
Gemini. Le site ne conserve pas les conversations. Ne partage pas de mot de
passe, de clé ou d'information personnelle supplémentaire dans les questions.
L'espace membre affiche également les 100 paiements les plus récents du membre
connecté, sans permettre leur modification. Chaque paiement dispose d'un reçu
imprimable ou enregistrable en PDF depuis le navigateur.
Les administrateurs peuvent envoyer une annonce à tous les membres ou à une
classe précise; les notifications push sont limitées aux abonnés de cette
audience, tandis que l'annonce est aussi enregistrée dans leur espace membre.

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
`NEXT_PUBLIC_SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY`). La clé
`SUPABASE_SERVICE_ROLE_KEY` ne doit jamais être préfixée par `NEXT_PUBLIC_`.
4. Clique **Deploy**. Ton site sera en ligne sur une adresse du type
   `club-arabe-lmdb.vercel.app` (tu pourras ajouter un nom de domaine plus
   tard si tu en achètes un).

Pour une base Supabase déjà en service, exécute d'abord
`supabase/administrateurs.sql`, puis `supabase/push_notifications.sql`, dans
**SQL Editor**. Chaque membre doit ensuite autoriser les notifications sur
chaque appareil depuis son espace membre pour recevoir les annonces lorsque le
site est fermé.

---

## Ce qui est déjà fonctionnel dans cette première version

- ✅ Page d'accueil, À propos, Actualités, Galerie, Contact
- ✅ Formulaire d'inscription en ligne (avec photo facultative)
- ✅ Flux de validation : demande → en attente → admin accepte/refuse
- ✅ Génération automatique du numéro de membre (`CA-LMDB-0001`, ...)
- ✅ Création automatique de la carte de membre + notification
- ✅ Tableau de bord admin (statistiques, demandes, liste des membres)
- ✅ Espace membre avec carte numérique + QR code + notifications
- ✅ Historique personnel des cotisations et paiements dans l'espace membre
- ✅ Reçus de paiement imprimables / enregistrables en PDF
- ✅ Notifications administrateur ciblées sur tous les membres ou une classe
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
