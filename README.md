# G4D — Group For Delivery (`Zakaria2` Next.js + NestJS Monorepo)

Plateforme logistique e-commerce nouvelle génération de **G4D — Group For Delivery** (`g4d.ma`), construite sur une architecture **Monorepo Nx** découplée :

- **Frontend (`apps/web`)** : **Next.js 16** (App Router, `src/`), **React 19.3**, **Tailwind CSS v4**, composants `shadcn/ui`, validation `react-hook-form` + `zod` (Port `:3100`).
- **Backend HTTP (`apps/api`)** : **NestJS 12** + **Fastify 5** (`@nestjs/platform-fastify`), `@fastify/cookie`, `@fastify/helmet`, `ValidationPipe` global, préfixe `/api/v1` (Port `:3101`).
- **Backend Jobs (`apps/worker`)** : **NestJS 12** Worker autonome (`createApplicationContext`) pour les files d'attente **BullMQ / Redis**.
- **Contrats & Données (`libs/*`)** :
  - `@zakaria/shared-contracts` (`libs/shared/contracts`) : Schémas `zod` et DTOs partagés entre `apps/web` et `apps/api`.
  - `@zakaria/backend-config` (`libs/backend/config`) : Validation stricte des variables d'environnement serveur au démarrage (`DATABASE_URL`, `REDIS_URL`, `CORS_ORIGINS`).
  - `@zakaria/backend-database` (`libs/backend/database`) : **Prisma 7** + `@prisma/adapter-pg` + Pool PostgreSQL (`pg`) + client Redis (`ioredis`).

---

## 💻 1. Pour lancer le projet en développement local

```powershell
cd C:\Users\youssef\Desktop\Project\Zakaria2_Nextjs_nestjs
pnpm dev
```

- **Landing Page** : [http://localhost:3100/](http://localhost:3100/)
- **Page Login** : [http://localhost:3100/login](http://localhost:3100/login)
- **API Healthcheck** : [http://localhost:3101/api/v1/health](http://localhost:3101/api/v1/health)

### Autres commandes locales utiles

```powershell
# Démarrer uniquement le Frontend Next.js sur http://localhost:3100
pnpm dev:web

# Démarrer uniquement l'API NestJS/Fastify sur http://localhost:3101/api/v1/health
pnpm dev:api

# Démarrer uniquement le Worker BullMQ
pnpm dev:worker

# Vérification TypeScript stricte sur l'ensemble des applications et librairies
pnpm typecheck

# Lint ESLint & vérification Prettier
pnpm lint
pnpm format:check

# Tests unitaires et d'intégration (Vitest)
pnpm test

# Régénération OpenAPI & types frontend
pnpm openapi:generate && pnpm exec openapi-typescript apps/api/openapi.json -o apps/web/src/lib/api-openapi.d.ts

# Build de production complet (API, Worker, Web)
pnpm build
```

---

## 🚀 2. Déploiement en Production sur VPS (Dokploy)

### Accès Serveur VPS

- **SSH** : `ssh root@152.239.116.87`
- **Projet Dokploy** : `NestjsNextjs` (`production`)
- **Dépôt GitHub** : `https://github.com/youssefsupmti-spec/Zakaria2_Nextjs_nestjs.git` (branche `main`)

---

### Architecture des 4 Conteneurs Dokploy (`dokploy-network`)

| Service Dokploy                         | Nom Interne Conteneur          | Domaine Public                                          | Port Interne | Dockerfile / Image                               |
| --------------------------------------- | ------------------------------ | ------------------------------------------------------- | ------------ | ------------------------------------------------ |
| **1. Frontend (`frontend`)**            | `nestjsnextjs-frontend-mrwfoz` | [`https://app.g4dmaroc.xyz`](https://app.g4dmaroc.xyz/) | `3100`       | `Dockerfile.frontend` (ou `apps/web/Dockerfile`) |
| **2. Backend API + Worker (`backend`)** | `nestjsnextjs-backend-1ybpq9`  | [`https://api.g4dmaroc.xyz`](https://api.g4dmaroc.xyz/) | `3101`       | `Dockerfile.backend` (ou `apps/api/Dockerfile`)  |
| **3. PostgreSQL (`database`)**          | `nestjsnextjs-database-mujw4w` | _(Interne)_                                             | `5432`       | `postgres:16`                                    |
| **4. Redis (`reduis`)**                 | `nestjsnextjs-reduis-cksyka`   | _(Interne)_                                             | `6379`       | `redis:7`                                        |

---

### Configuration Dokploy — Service `backend` (`https://api.g4dmaroc.xyz`)

1. **Onglet `General` → `Provider`** :
   - **Source** : `Github` (`Dokploy-2026-06-19-ih3pmy`)
   - **Repository** : `Zakaria2_Nextjs_nestjs`
   - **Branch** : `main`
   - **Build Path** : `/`
   - **Build Type** : `Dockerfile`
   - **Dockerfile Path** : `Dockerfile.backend`
2. **Onglet `Environment`** :
   ```env
   NODE_ENV=production
   PORT=3101
   API_PORT=3101
   API_HOST=0.0.0.0
   RUN_WORKER=true
   CORS_ORIGINS=https://app.g4dmaroc.xyz,https://api.g4dmaroc.xyz
   DATABASE_URL=<SECRET_DOKPLOY_POSTGRES_URL>
   REDIS_CACHE_URL=<SECRET_DOKPLOY_REDIS_CACHE_URL>
   REDIS_QUEUE_URL=<SECRET_DOKPLOY_REDIS_QUEUE_URL>
   REDIS_PREFIX=zakaria2
   AUTH_COOKIE_NAME=__Host-g4d.session
   AUTH_SECRET=<SECRET_DOKPLOY_AUTH_SECRET>
   CSRF_SECRET=<SECRET_DOKPLOY_CSRF_SECRET>
   API_SECRET_PEPPER=<SECRET_DOKPLOY_API_PEPPER>
   STORAGE_LOCAL_PATH=/app/storage/uploads
   MAIL_HOST=<SECRET_DOKPLOY_MAIL_HOST>
   MAIL_PORT=587
   MAIL_SECURE=false
   MAIL_USER=<SECRET_DOKPLOY_MAIL_USER>
   MAIL_PASS=<SECRET_DOKPLOY_MAIL_PASS>
   MAIL_FROM="G4D Delivery <no-reply@g4dmaroc.xyz>"
   ```
3. **Onglet `Domains`** :
   - **Host** : `api.g4dmaroc.xyz`
   - **Path** : `/`
   - **Container Port** : `3101`
   - **HTTPS** : Activé (`Let's Encrypt`)
   - **Healthcheck URL** : `https://api.g4dmaroc.xyz/api/v1/health`

---

### Configuration Dokploy — Service `frontend` (`https://app.g4dmaroc.xyz`)

1. **Onglet `General` → `Provider`** :
   - **Source** : `Github` (`Dokploy-2026-06-19-ih3pmy`)
   - **Repository** : `Zakaria2_Nextjs_nestjs`
   - **Branch** : `main`
   - **Build Path** : `/`
   - **Build Type** : `Dockerfile`
   - **Dockerfile Path** : `Dockerfile.frontend`
2. **Onglet `Environment`** :
   ```env
   NODE_ENV=production
   PORT=3100
   WEB_PORT=3100
   HOSTNAME=0.0.0.0
   NEXT_PUBLIC_API_URL=https://api.g4dmaroc.xyz/api/v1
   ```
3. **Onglet `Domains`** :
   - **Host** : `app.g4dmaroc.xyz`
   - **Path** : `/`
   - **Container Port** : `3100`
   - **HTTPS** : Activé (`Let's Encrypt`)

---

## 🌐 3. Routes & Modules Livrés (Sprints 01 → 02-B)

| Route Locale                             | Route Production                            | Description                                                                                                                                                              |
| ---------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `http://localhost:3100/`                 | `https://app.g4dmaroc.xyz/`                 | **Landing Page Publique G4D** (1:1 avec vidéo Hero, nouveaux logos 3D `nouveau_logo_G4d.png`, Suivi colis, Services, Grille tarifaire 472 villes, Carte Leaflet 20 hubs) |
| `http://localhost:3100/login`            | `https://app.g4dmaroc.xyz/login`            | **Connexion Split-Screen G4D** (sessions opaques PostgreSQL `30m..30d`, réhash `$2y$12$` → Argon2id)                                                                     |
| `http://localhost:3100/dashboard`        | `https://app.g4dmaroc.xyz/dashboard`        | **Tableau de bord & App Shell Multi-Org** (sidebar scopée, sélecteur d'agence)                                                                                           |
| `http://localhost:3100/agences`          | `https://app.g4dmaroc.xyz/agences`          | **Agences & Zones Territoriales** (périmètres livraison/ramassage et membres multi-agence)                                                                               |
| `http://localhost:3100/partenaires`      | `https://app.g4dmaroc.xyz/partenaires`      | **Partenaires B2B & Clés API** (HMAC-SHA256 avec `API_SECRET_PEPPER`, règle `D-09`)                                                                                      |
| `http://localhost:3100/users`            | `https://app.g4dmaroc.xyz/users`            | **Utilisateurs & Équipes** (règle `D-06` cascade sous-comptes & `D-08` flotte locale)                                                                                    |
| `http://localhost:3100/roles`            | `https://app.g4dmaroc.xyz/roles`            | **Rôles & Permissions RBAC** (rôles bornés par portée + anti-escalade)                                                                                                   |
| `http://localhost:3100/account/sessions` | `https://app.g4dmaroc.xyz/account/sessions` | **Sessions Actives** (consultation et révocation à distance)                                                                                                             |
| `http://localhost:3101/api/v1/health`    | `https://api.g4dmaroc.xyz/api/v1/health`    | **Healthcheck API, PostgreSQL, Redis Cache & Redis Queue**                                                                                                               |
| `http://localhost:3101/api/docs`         | _(désactivé en prod)_                       | **Documentation Swagger / OpenAPI 3** (`SWAGGER_ENABLED=true`)                                                                                                           |
