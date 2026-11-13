-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtensions PostgreSQL 18.6
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "unaccent";
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- CreateTable
CREATE TABLE "app_boot_checks" (
    "id" TEXT NOT NULL,
    "environment" VARCHAR(32) NOT NULL,
    "service" VARCHAR(64) NOT NULL,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_boot_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "villes" (
    "id" INTEGER NOT NULL,
    "name_fr" VARCHAR(255) NOT NULL,
    "code_zone" VARCHAR(255) NOT NULL,
    "name_ar" VARCHAR(255),
    "zone_id" INTEGER,
    "standard_tarif_id" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "villes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "nom_complet" VARCHAR(255) NOT NULL,
    "civilite" VARCHAR(20),
    "picture" VARCHAR(255) NOT NULL DEFAULT '',
    "email" CITEXT NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "password_algo" VARCHAR(20) NOT NULL DEFAULT 'argon2id',
    "password_reset_at" TIMESTAMPTZ(6),
    "telephone" VARCHAR(255) NOT NULL DEFAULT '',
    "sav" VARCHAR(255) NOT NULL DEFAULT '',
    "ville_name" VARCHAR(255) NOT NULL DEFAULT '',
    "ville_id" INTEGER,
    "cin" VARCHAR(255) NOT NULL DEFAULT '',
    "stockout" VARCHAR(255) NOT NULL DEFAULT '',
    "emailstockout" VARCHAR(255) NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "ramassage_liv" BOOLEAN NOT NULL DEFAULT false,
    "affiliate" VARCHAR(255),
    "lien_localisation_maps" VARCHAR(500) NOT NULL DEFAULT '',
    "affictaion" VARCHAR(255) NOT NULL DEFAULT '',
    "emailsend" VARCHAR(50) NOT NULL DEFAULT 'non',
    "remember_token" VARCHAR(100),
    "api_abilities" JSONB,
    "inscription_statut" VARCHAR(20),
    "inscription_traitee_par" INTEGER,
    "inscription_traitee_le" TIMESTAMPTZ(6),
    "inscription_motif" VARCHAR(500),
    "inscription_refus_nombre" INTEGER NOT NULL DEFAULT 0,
    "inscription_dernier_refus_le" TIMESTAMPTZ(6),
    "parent_id" INTEGER,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "guard_name" VARCHAR(255) NOT NULL DEFAULT 'web',
    "owner_id" INTEGER,
    "libelle" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "guard_name" VARCHAR(255) NOT NULL DEFAULT 'web',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_has_permissions" (
    "permission_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "role_has_permissions_pkey" PRIMARY KEY ("permission_id","role_id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "role_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("role_id","user_id")
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "permission_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("permission_id","user_id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" VARCHAR(64) NOT NULL,
    "user_id" INTEGER NOT NULL,
    "duration_code" VARCHAR(8) NOT NULL DEFAULT '8h',
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "revoked_reason" VARCHAR(64),
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "last_active_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "email" CITEXT NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "authentication_logs" (
    "id" BIGSERIAL NOT NULL,
    "user_id" INTEGER,
    "event" VARCHAR(255) NOT NULL,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "location" VARCHAR(255),
    "device" VARCHAR(255),
    "browser" VARCHAR(255),
    "platform" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "authentication_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_boot_checks_checked_at_idx" ON "app_boot_checks"("checked_at");

-- CreateIndex
CREATE INDEX "villes_name_fr_idx" ON "villes"("name_fr");

-- CreateIndex
CREATE INDEX "villes_zone_id_idx" ON "villes"("zone_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_ville_id_idx" ON "users"("ville_id");

-- CreateIndex
CREATE INDEX "users_parent_id_idx" ON "users"("parent_id");

-- CreateIndex
CREATE INDEX "users_inscription_statut_idx" ON "users"("inscription_statut");

-- CreateIndex
CREATE INDEX "users_active_deleted_at_idx" ON "users"("active", "deleted_at");

-- CreateIndex
CREATE INDEX "roles_owner_id_idx" ON "roles"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_guard_name_key" ON "roles"("name", "guard_name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_guard_name_key" ON "permissions"("name", "guard_name");

-- CreateIndex
CREATE INDEX "role_has_permissions_role_id_idx" ON "role_has_permissions"("role_id");

-- CreateIndex
CREATE INDEX "user_roles_user_id_idx" ON "user_roles"("user_id");

-- CreateIndex
CREATE INDEX "user_permissions_user_id_idx" ON "user_permissions"("user_id");

-- CreateIndex
CREATE INDEX "auth_sessions_user_id_expires_at_idx" ON "auth_sessions"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "auth_sessions_expires_at_idx" ON "auth_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "authentication_logs_user_id_idx" ON "authentication_logs"("user_id");

-- CreateIndex
CREATE INDEX "authentication_logs_event_idx" ON "authentication_logs"("event");

-- CreateIndex
CREATE INDEX "authentication_logs_created_at_idx" ON "authentication_logs"("created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_ville_id_fkey" FOREIGN KEY ("ville_id") REFERENCES "villes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_has_permissions" ADD CONSTRAINT "role_has_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_has_permissions" ADD CONSTRAINT "role_has_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authentication_logs" ADD CONSTRAINT "authentication_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Index partiels & GIN PostgreSQL 18 (HOT updates + recherche floue + sessions actives)
CREATE INDEX "users_active_lookup_idx" ON "users"("email", "id") WHERE "deleted_at" IS NULL AND "active" = true;
CREATE INDEX "auth_sessions_valid_idx" ON "auth_sessions"("id", "expires_at") WHERE "revoked_at" IS NULL;
CREATE INDEX "villes_name_fr_trgm_idx" ON "villes" USING GIN ("name_fr" gin_trgm_ops);
CREATE INDEX "users_nom_complet_trgm_idx" ON "users" USING GIN ("nom_complet" gin_trgm_ops);

ALTER TABLE "users" SET (fillfactor = 85);
ALTER TABLE "auth_sessions" SET (fillfactor = 85);
