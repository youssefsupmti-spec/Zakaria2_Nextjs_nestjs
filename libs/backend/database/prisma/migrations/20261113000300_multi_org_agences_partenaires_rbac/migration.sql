-- Sprint 02-B : Multi-Organisation, Multi-Agence, Réseau Partenaires & Portées RBAC (Chantier 33)
-- Migration strictement additive et idempotente compatible PostgreSQL 18

-- 1. Référentiel des zones logistiques
CREATE TABLE IF NOT EXISTS "zones" (
  "id" SERIAL NOT NULL,
  "nom" VARCHAR(255) NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "actif" BOOLEAN NOT NULL DEFAULT true,
  "deleted_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6),
  CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "zones_code_key" ON "zones"("code");
CREATE INDEX IF NOT EXISTS "zones_actif_deleted_at_idx" ON "zones"("actif", "deleted_at");

-- 2. Agences physiques G4D
CREATE TABLE IF NOT EXISTS "agences" (
  "id" SERIAL NOT NULL,
  "nom" VARCHAR(255) NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "ville_id" INTEGER,
  "responsable_id" INTEGER,
  "telephone" VARCHAR(50),
  "adresse" VARCHAR(500),
  "actif" BOOLEAN NOT NULL DEFAULT true,
  "deleted_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6),
  CONSTRAINT "agences_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "agences_ville_id_fkey" FOREIGN KEY ("ville_id") REFERENCES "villes"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "agences_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "agences_code_key" ON "agences"("code");
CREATE INDEX IF NOT EXISTS "agences_ville_id_idx" ON "agences"("ville_id");
CREATE INDEX IF NOT EXISTS "agences_responsable_id_idx" ON "agences"("responsable_id");
CREATE INDEX IF NOT EXISTS "agences_actif_deleted_at_idx" ON "agences"("actif", "deleted_at");

-- 3. Zones couvertes par une agence (livraison / ramassage)
CREATE TABLE IF NOT EXISTS "agence_zone" (
  "id" SERIAL NOT NULL,
  "agence_id" INTEGER NOT NULL,
  "zone_id" INTEGER NOT NULL,
  "livraison" BOOLEAN NOT NULL DEFAULT true,
  "ramassage" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6),
  CONSTRAINT "agence_zone_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "agence_zone_agence_id_fkey" FOREIGN KEY ("agence_id") REFERENCES "agences"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "agence_zone_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "agence_zone_agence_id_zone_id_key" ON "agence_zone"("agence_id", "zone_id");
CREATE INDEX IF NOT EXISTS "agence_zone_zone_id_idx" ON "agence_zone"("zone_id");

-- 4. Membres rattachés à une ou plusieurs agences
CREATE TABLE IF NOT EXISTS "agence_membres" (
  "id" SERIAL NOT NULL,
  "agence_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "role" VARCHAR(32) NOT NULL,
  "actif" BOOLEAN NOT NULL DEFAULT true,
  "depuis" DATE,
  "jusqua" DATE,
  "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6),
  CONSTRAINT "agence_membres_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "agence_membres_role_chk" CHECK ("role" IN ('manager', 'suivi', 'agent', 'livreur', 'ramasseur')),
  CONSTRAINT "agence_membres_agence_id_fkey" FOREIGN KEY ("agence_id") REFERENCES "agences"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "agence_membres_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "agence_membres_agence_id_user_id_key" ON "agence_membres"("agence_id", "user_id");
CREATE INDEX IF NOT EXISTS "agence_membres_user_id_actif_idx" ON "agence_membres"("user_id", "actif");
CREATE INDEX IF NOT EXISTS "agence_membres_agence_id_role_actif_idx" ON "agence_membres"("agence_id", "role", "actif");

-- 5. Zones assignées à un membre d'agence (livraison | ramassage)
CREATE TABLE IF NOT EXISTS "membre_zones" (
  "id" SERIAL NOT NULL,
  "agence_membre_id" INTEGER NOT NULL,
  "zone_id" INTEGER NOT NULL,
  "activite" VARCHAR(32) NOT NULL,
  "actif" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6),
  CONSTRAINT "membre_zones_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "membre_zones_activite_chk" CHECK ("activite" IN ('livraison', 'ramassage')),
  CONSTRAINT "membre_zones_agence_membre_id_fkey" FOREIGN KEY ("agence_membre_id") REFERENCES "agence_membres"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "membre_zones_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "membre_zones_agence_membre_id_zone_id_activite_key" ON "membre_zones"("agence_membre_id", "zone_id", "activite");
CREATE INDEX IF NOT EXISTS "membre_zones_zone_id_activite_actif_idx" ON "membre_zones"("zone_id", "activite", "actif");

-- 6. Sociétés partenaires B2B
CREATE TABLE IF NOT EXISTS "partenaires" (
  "id" SERIAL NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "raison_sociale" VARCHAR(255) NOT NULL,
  "ice" VARCHAR(64),
  "telephone" VARCHAR(50),
  "email" CITEXT,
  "actif" BOOLEAN NOT NULL DEFAULT true,
  "deleted_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6),
  CONSTRAINT "partenaires_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "partenaires_code_key" ON "partenaires"("code");
CREATE INDEX IF NOT EXISTS "partenaires_actif_deleted_at_idx" ON "partenaires"("actif", "deleted_at");

-- 7. Contrats agence <-> partenaire
CREATE TABLE IF NOT EXISTS "agence_partenaires" (
  "id" SERIAL NOT NULL,
  "agence_id" INTEGER NOT NULL,
  "partenaire_id" INTEGER NOT NULL,
  "depuis" DATE,
  "jusqua" DATE,
  "actif" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6),
  CONSTRAINT "agence_partenaires_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "agence_partenaires_agence_id_fkey" FOREIGN KEY ("agence_id") REFERENCES "agences"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "agence_partenaires_partenaire_id_fkey" FOREIGN KEY ("partenaire_id") REFERENCES "partenaires"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "agence_partenaires_agence_id_partenaire_id_key" ON "agence_partenaires"("agence_id", "partenaire_id");
CREATE INDEX IF NOT EXISTS "agence_partenaires_partenaire_id_actif_idx" ON "agence_partenaires"("partenaire_id", "actif");

-- 8. Zones déléguées sur un contrat partenaire
CREATE TABLE IF NOT EXISTS "partenaire_zones" (
  "id" SERIAL NOT NULL,
  "agence_partenaire_id" INTEGER NOT NULL,
  "zone_id" INTEGER NOT NULL,
  "actif" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6),
  CONSTRAINT "partenaire_zones_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "partenaire_zones_agence_partenaire_id_fkey" FOREIGN KEY ("agence_partenaire_id") REFERENCES "agence_partenaires"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "partenaire_zones_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "partenaire_zones_agence_partenaire_id_zone_id_key" ON "partenaire_zones"("agence_partenaire_id", "zone_id");
CREATE INDEX IF NOT EXISTS "partenaire_zones_zone_id_actif_idx" ON "partenaire_zones"("zone_id", "actif");

-- 9. Coursiers de société partenaire (+ liaison éventuelle users historique)
CREATE TABLE IF NOT EXISTS "partenaire_coursiers" (
  "id" SERIAL NOT NULL,
  "partenaire_id" INTEGER NOT NULL,
  "nom" VARCHAR(255) NOT NULL,
  "telephone" VARCHAR(50),
  "user_id" INTEGER,
  "actif" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6),
  CONSTRAINT "partenaire_coursiers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "partenaire_coursiers_partenaire_id_fkey" FOREIGN KEY ("partenaire_id") REFERENCES "partenaires"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "partenaire_coursiers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "partenaire_coursiers_user_id_key" ON "partenaire_coursiers"("user_id");
CREATE INDEX IF NOT EXISTS "partenaire_coursiers_partenaire_id_actif_idx" ON "partenaire_coursiers"("partenaire_id", "actif");

-- 10. Membres portail partenaire (espace partenaire multi-utilisateurs)
CREATE TABLE IF NOT EXISTS "partenaire_membres" (
  "id" SERIAL NOT NULL,
  "partenaire_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "role" VARCHAR(32) NOT NULL DEFAULT 'operateur',
  "actif" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6),
  CONSTRAINT "partenaire_membres_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "partenaire_membres_role_chk" CHECK ("role" IN ('admin_partenaire', 'operateur', 'lecture')),
  CONSTRAINT "partenaire_membres_partenaire_id_fkey" FOREIGN KEY ("partenaire_id") REFERENCES "partenaires"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "partenaire_membres_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "partenaire_membres_partenaire_id_user_id_key" ON "partenaire_membres"("partenaire_id", "user_id");
CREATE INDEX IF NOT EXISTS "partenaire_membres_user_id_actif_idx" ON "partenaire_membres"("user_id", "actif");

-- 11. Connexions API sortantes vers partenaires
CREATE TABLE IF NOT EXISTS "partenaire_connexions" (
  "id" SERIAL NOT NULL,
  "partenaire_id" INTEGER NOT NULL,
  "api_type_code" VARCHAR(64) NOT NULL DEFAULT 'custom',
  "base_url" VARCHAR(500) NOT NULL,
  "identifiant_chiffre" TEXT NOT NULL,
  "secret_chiffre" TEXT NOT NULL,
  "actif" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6),
  CONSTRAINT "partenaire_connexions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "partenaire_connexions_partenaire_id_fkey" FOREIGN KEY ("partenaire_id") REFERENCES "partenaires"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "partenaire_connexions_partenaire_id_actif_idx" ON "partenaire_connexions"("partenaire_id", "actif");

-- 12. Identifiants API B2B entrants (HMAC-SHA256 + API_SECRET_PEPPER)
CREATE TABLE IF NOT EXISTS "api_identifiants" (
  "id" SERIAL NOT NULL,
  "partenaire_id" INTEGER,
  "user_id" INTEGER,
  "libelle" VARCHAR(120) NOT NULL,
  "cle_publique" VARCHAR(64) NOT NULL,
  "secret_empreinte" VARCHAR(128) NOT NULL,
  "scopes" JSONB,
  "actif" BOOLEAN NOT NULL DEFAULT true,
  "expires_at" TIMESTAMPTZ(6),
  "last_used_at" TIMESTAMPTZ(6),
  "revoked_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6),
  CONSTRAINT "api_identifiants_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "api_identifiants_titulaire_chk" CHECK (num_nonnulls("partenaire_id", "user_id") = 1),
  CONSTRAINT "api_identifiants_partenaire_id_fkey" FOREIGN KEY ("partenaire_id") REFERENCES "partenaires"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "api_identifiants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "api_identifiants_cle_publique_key" ON "api_identifiants"("cle_publique");
CREATE INDEX IF NOT EXISTS "api_identifiants_partenaire_id_actif_idx" ON "api_identifiants"("partenaire_id", "actif");
CREATE INDEX IF NOT EXISTS "api_identifiants_user_id_actif_idx" ON "api_identifiants"("user_id", "actif");

-- 13. Enrichissement portée multi-organisation sur roles
ALTER TABLE "roles"
  ADD COLUMN IF NOT EXISTS "portee" VARCHAR(32) NOT NULL DEFAULT 'plateforme',
  ADD COLUMN IF NOT EXISTS "agence_id" INTEGER,
  ADD COLUMN IF NOT EXISTS "compte_client_id" INTEGER,
  ADD COLUMN IF NOT EXISTS "partenaire_id" INTEGER,
  ADD COLUMN IF NOT EXISTS "systeme" BOOLEAN NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'roles_portee_chk') THEN
    ALTER TABLE "roles"
      ADD CONSTRAINT "roles_portee_chk" CHECK ("portee" IN ('plateforme', 'agence', 'client', 'partenaire'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'roles_agence_id_fkey') THEN
    ALTER TABLE "roles"
      ADD CONSTRAINT "roles_agence_id_fkey" FOREIGN KEY ("agence_id") REFERENCES "agences"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'roles_compte_client_id_fkey') THEN
    ALTER TABLE "roles"
      ADD CONSTRAINT "roles_compte_client_id_fkey" FOREIGN KEY ("compte_client_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'roles_partenaire_id_fkey') THEN
    ALTER TABLE "roles"
      ADD CONSTRAINT "roles_partenaire_id_fkey" FOREIGN KEY ("partenaire_id") REFERENCES "partenaires"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "roles_portee_idx" ON "roles"("portee");
CREATE INDEX IF NOT EXISTS "roles_agence_id_idx" ON "roles"("agence_id");
CREATE INDEX IF NOT EXISTS "roles_compte_client_id_idx" ON "roles"("compte_client_id");
CREATE INDEX IF NOT EXISTS "roles_partenaire_id_idx" ON "roles"("partenaire_id");

-- 14. FK optionnelle villes.zone_id -> zones.id (création sécurisée si aucune valeur orpheline)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'villes_zone_id_fkey')
     AND NOT EXISTS (
       SELECT 1 FROM "villes" v
       WHERE v."zone_id" IS NOT NULL
         AND NOT EXISTS (SELECT 1 FROM "zones" z WHERE z."id" = v."zone_id")
     ) THEN
    ALTER TABLE "villes"
      ADD CONSTRAINT "villes_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

