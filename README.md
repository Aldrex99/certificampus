# CertifiCampus

Plateforme de **certification numérique** pour les établissements d'enseignement. CertifiCampus permet aux écoles de gérer leurs formations, spécialités et étudiants, puis de générer des **diplômes numériques** signés par un **QR code** dont l'authenticité peut être vérifiée publiquement.

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Stack technique](#stack-technique)
- [Démarrage rapide (Docker)](#démarrage-rapide-docker)
- [Démarrage manuel](#démarrage-manuel)
- [Comptes de démonstration](#comptes-de-démonstration)
- [Variables d'environnement](#variables-denvironnement)
- [Scripts disponibles](#scripts-disponibles)
- [Documentation de l'API](#documentation-de-lapi)
- [Tests](#tests)
- [Déploiement](#déploiement)

## Fonctionnalités

- **Trois rôles** : administrateur de la plateforme, école et public (vérification).
- **Gestion école** : formations, spécialités, étudiants, modèles de diplômes.
- **Génération de diplômes** au format PDF avec QR code unique.
- **Vérification publique** d'un diplôme via son QR code (`/verify/:token`).
- **Abonnements** : catalogue de formules avec quotas de certificats, paiement géré via **Stripe** (avec un mode « mock » intégré pour les démos).
- **Authentification** par JWT (access + refresh tokens en cookies), activation de compte et réinitialisation de mot de passe par e-mail (**SparkPost**).
- **Espace admin** : gestion des écoles, des formules d'abonnement, des souscriptions et des modèles de diplômes.

## Architecture

Le projet est un monorepo composé de deux applications :

```
certificampus/
├── backend/                 # API REST (Node.js + Express + TypeScript)
│   └── src/
│       ├── config/          # env, base de données, Swagger, Stripe
│       ├── controllers/     # Contrôleurs HTTP
│       ├── services/        # Logique métier
│       ├── models/          # Modèles Mongoose
│       ├── routes/          # Définition des routes (/api/v1)
│       ├── middleware/      # Auth, validation, upload, erreurs
│       ├── validators/      # Schémas Zod
│       ├── utils/           # PDF, QR code, e-mail, JWT, etc.
│       └── scripts/seed.ts  # Peuplement de la base
├── frontend/                # SPA (React + Vite + TypeScript)
│   └── src/
│       ├── pages/           # Pages (auth, school, admin, public)
│       ├── components/      # Composants partagés + UI
│       ├── store/           # Redux Toolkit
│       └── lib/             # Client axios, helpers
├── docker-compose.yml       # Stack de développement
└── docker-compose.prod.yml  # Stack de production
```

## Stack technique

| Côté         | Technologies                                                                                                                      |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| **Backend**  | Node.js, Express, TypeScript, MongoDB (Mongoose), JWT, Zod, Puppeteer/PDFKit (génération PDF), QRCode, Stripe, SparkPost, Swagger |
| **Frontend** | React 18, Vite, TypeScript, Redux Toolkit, React Router, Tailwind CSS, Recharts, Axios                                            |
| **Infra**    | Docker / Docker Compose, MongoDB 8                                                                                                |

## Démarrage rapide (Docker)

Prérequis : Docker et Docker Compose.

```bash
# Lance MongoDB, le backend (hot-reload) et le frontend (Vite)
docker compose up --build
```

Services exposés :

| Service  | URL                   |
| -------- | --------------------- |
| Frontend | http://localhost:5001 |
| Backend  | http://localhost:5002 |
| MongoDB  | localhost:27017       |

La base est automatiquement peuplée au premier démarrage (voir [Comptes de démonstration](#comptes-de-démonstration)).

## Démarrage manuel

Prérequis : Node.js 20+, une instance MongoDB accessible.

### Backend

```bash
cd backend
npm install
cp .env.example .env   # à créer/adapter (voir variables d'environnement)
npm run seed           # peuple la base (optionnel)
npm run dev            # démarre l'API sur le port 4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # démarre Vite sur le port 5173
```

Le frontend cible l'API via la variable `VITE_API_URL` (par défaut `http://localhost:4000`).

## Comptes de démonstration

Après le `seed`, les comptes suivants sont disponibles :

| Rôle  | E-mail                         | Mot de passe  |
| ----- | ------------------------------ | ------------- |
| Admin | `admin@certificampus.com`      | `Admin1234!`  |
| École | `marie.dupont@ecole-tech.fr`   | `School1234!` |
| École | `jp.renard@business-school.fr` | `School1234!` |
| École | `f.ouali@sante-formation.fr`   | `School1234!` |

## Variables d'environnement

Les principales variables du **backend** :

| Variable                         | Description                           | Valeur par défaut (dev)                        |
| -------------------------------- | ------------------------------------- | ---------------------------------------------- |
| `PORT`                           | Port d'écoute de l'API                | `4000`                                         |
| `CLIENT_URL`                     | URL du frontend (CORS)                | `http://localhost:5173`                        |
| `PUBLIC_URL`                     | URL publique du backend               | `http://localhost:4000`                        |
| `MONGO_URI`                      | Chaîne de connexion MongoDB           | `mongodb://127.0.0.1:27017/certificampus`      |
| `JWT_ACCESS_SECRET`              | Secret du token d'accès               | `dev-access-secret-change-me`                  |
| `JWT_REFRESH_SECRET`             | Secret du refresh token               | `dev-refresh-secret-change-me`                 |
| `SPARKPOST_API_KEY`              | Clé API SparkPost (e-mails)           | _vide_                                         |
| `EMAIL_FROM` / `EMAIL_FROM_NAME` | Expéditeur des e-mails                | `no-reply@certificampus.app` / `CertifiCampus` |
| `DIPLOMA_DIR`                    | Dossier de stockage des PDF           | `storage/diplomas`                             |
| `STRIPE_SECRET_KEY`              | Clé secrète Stripe (vide = mode mock) | _vide_                                         |
| `STRIPE_PUBLISHABLE_KEY`         | Clé publique Stripe                   | _vide_                                         |
| `STRIPE_WEBHOOK_SECRET`          | Secret du webhook Stripe              | _vide_                                         |

> Voir [`.env.prod.example`](.env.prod.example) pour la configuration de production.
> Lorsque `STRIPE_SECRET_KEY` est vide, la facturation tourne en mode « mock » : les abonnements s'activent instantanément sans appel à Stripe.

Variable du **frontend** :

| Variable       | Description          | Défaut                  |
| -------------- | -------------------- | ----------------------- |
| `VITE_API_URL` | URL de l'API backend | `http://localhost:4000` |

## Scripts disponibles

### Backend (`/backend`)

| Script              | Description                        |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Démarre l'API en mode hot-reload   |
| `npm run build`     | Compile le TypeScript vers `dist/` |
| `npm start`         | Lance l'API compilée               |
| `npm run seed`      | Peuple la base de données          |
| `npm run typecheck` | Vérification de types              |
| `npm run lint`      | Analyse ESLint                     |
| `npm test`          | Lance les tests Jest               |

### Frontend (`/frontend`)

| Script              | Description             |
| ------------------- | ----------------------- |
| `npm run dev`       | Démarre le serveur Vite |
| `npm run build`     | Build de production     |
| `npm run preview`   | Prévisualise le build   |
| `npm run typecheck` | Vérification de types   |
| `npm run lint`      | Analyse ESLint          |

## Documentation de l'API

L'API est exposée sous le préfixe `/api/v1`. En dehors de la production, une documentation **Swagger** interactive est disponible sur :

```
http://localhost:4000/docs
```

Endpoint de santé : `GET /api/v1/health`.

## Tests

```bash
cd backend
npm test
```

Les tests utilisent **Jest**, **Supertest** et **mongodb-memory-server** (base MongoDB en mémoire, aucune instance externe requise).

## Déploiement

La stack de production est décrite dans [`docker-compose.prod.yml`](docker-compose.prod.yml). Les images sont construites par la CI puis récupérées depuis le registre.

```bash
docker compose -f docker-compose.prod.yml up -d
```

En production, MongoDB n'est pas exposé à l'hôte, et le backend/frontend sont publiés en loopback pour être servis derrière un reverse proxy (nginx).

---

_Projet réalisé dans le cadre d'un Master 1._
