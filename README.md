# G4D — Group For Delivery (`Zakaria2` Next.js + NestJS Monorepo)

Plateforme logistique e-commerce nouvelle génération de **G4D — Group For Delivery** (`g4d.ma`), construite sur une architecture **Monorepo Nx** découplée :
- **Frontend (`apps/web`)** : **Next.js 16** (App Router, `src/`), **React 19.3**, **Tailwind CSS v4**, composants `shadcn/ui`, validation `react-hook-form` + `zod` (Port `:3100`).
- **Backend HTTP (`apps/api`)** : **NestJS 12** + **Fastify 5** (`@nestjs/platform-fastify`), `@fastify/cookie`, `@fastify/helmet`, `ValidationPipe` global, préfixe `/api/v1` (Port `:3101`).
- **Backend Jobs (`apps/worker`)** : **NestJS 12** Worker autonome (`createApplicationContext`) pour les files d'attente **BullMQ / Redis**.
- **Contrats & Données (`libs/*`)** :
  - `@zakaria/shared-contracts` (`libs/shared/contracts`) : Schémas `zod` et DTOs partagés entre `apps/web` et `apps/api`.
  - `@zakaria/backend-config` (`libs/backend/config`) : Validation stricte des variables d'environnement serveur au démarrage.
  - `@zakaria/backend-database` (`libs/backend/database`) : **Prisma 7** + `@prisma/adapter-pg` + Pool PostgreSQL (`pg`).

---

## 🎨 Identité Visuelle & Règles Propriétaires G4D

- **Couleurs officielles G4D** :
  - Bleu primaire : `#1B9DD9` (`#3FB4E8` clair, `#0E86C2` foncé)
  - Orange accent : `#F9A03F` (`#E08A2B` foncé)
  - Navy profond : `#0F172A` / `#0c1e2c`
- **Typographie 100 % locale (Zéro Google Fonts)** :
  - `Inter Variable` (`/fonts/InterVariable.woff2`) avec `tabular-nums` pour les montants CRBT et codes de suivi
  - `Droid Arabic Kufi` (`/fonts/DroidKufi-Regular.woff`, `/fonts/DroidKufi-Bold.woff`)
- **Logos officiels intégrés** :
  - `/brand/g4d.png` (Header & fonds clairs)
  - `/brand/logoPro-trim.png` (Login Split-Screen & Footer sombre)

---

## 🚀 Commandes Principales

```powershell
# Démarrer simultanément le Frontend Next.js (:3100) et l'API NestJS/Fastify (:3101)
pnpm dev

# Démarrer uniquement le Frontend Next.js sur http://localhost:3100
pnpm dev:web

# Démarrer uniquement l'API NestJS/Fastify sur http://localhost:3101/api/v1/health
pnpm dev:api

# Vérification TypeScript stricte sur l'ensemble des applications et librairies
pnpm typecheck

# Build de production complet (API, Worker, Web)
pnpm build
```

---

## 🌐 Routes Livrées au Sprint 01

| Route | Description |
|---|---|
| `http://localhost:3100/` | **Landing Page Publique G4D** (Topbar + Header sticky, Hero + Suivi rapide colis, 4 Piliers G4D avec icônes SVG, À propos, 6 Services, Processus 4 étapes, Formulaire Contact & Footer complet) |
| `http://localhost:3100/login` | **Page de Connexion Split-Screen G4D** (Panneau gauche `auth-aside-bg.webp` + 3 cartes glassmorphism, Panneau droit centré avec logo `logoPro-trim.png` et validation Zod) |
| `http://localhost:3101/api/v1/health` | **Healthcheck API & PostgreSQL** (État du service NestJS/Fastify + latence `SELECT 1` PostgreSQL) |

