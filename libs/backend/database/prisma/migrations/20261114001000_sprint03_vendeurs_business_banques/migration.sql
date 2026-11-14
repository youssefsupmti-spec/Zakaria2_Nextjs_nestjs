-- Sprint 03 : Vendeurs, Business, Banques, Inscription & Profil (DDD + PostgreSQL 18)

-- 1. Référentiel des banques marocaines
CREATE TABLE IF NOT EXISTS "banques" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "swift_code" VARCHAR(255),
    "logo" VARCHAR(255),
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    CONSTRAINT "banques_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "banques_status_deleted_at_idx" ON "banques"("status", "deleted_at");

-- 2. Préfixes RIB à 3 chiffres par banque
CREATE TABLE IF NOT EXISTS "banque_codes" (
    "id" SERIAL NOT NULL,
    "bank_id" INTEGER NOT NULL,
    "code" VARCHAR(3) NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    CONSTRAINT "banque_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "banque_codes_code_key" ON "banque_codes"("code");
CREATE INDEX IF NOT EXISTS "banque_codes_bank_id_idx" ON "banque_codes"("bank_id");

DO $$ BEGIN
    ALTER TABLE "banque_codes" ADD CONSTRAINT "banque_codes_bank_id_fkey"
        FOREIGN KEY ("bank_id") REFERENCES "banques"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 3. Enseignes commerciales / Business d'un vendeur
CREATE TABLE IF NOT EXISTS "businesses" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(255),
    "logo" VARCHAR(255),
    "adresse" VARCHAR(255),
    "email" VARCHAR(150),
    "ICE" VARCHAR(50),
    "RC" VARCHAR(50),
    "telephone" VARCHAR(50),
    "ville_id" INTEGER,
    "agency_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "mode_paiement" VARCHAR(30),
    "default_fragile" BOOLEAN NOT NULL DEFAULT false,
    "default_openpackage" BOOLEAN NOT NULL DEFAULT true,
    "default_essayage" BOOLEAN NOT NULL DEFAULT false,
    "label_message" VARCHAR(255),
    "auto_send_preparation" BOOLEAN NOT NULL DEFAULT false,
    "return_type" VARCHAR(50),
    "return_recipient" VARCHAR(255),
    "return_phone" VARCHAR(30),
    "return_ville_id" INTEGER,
    "return_address" TEXT,
    "return_note" TEXT,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "businesses_user_id_idx" ON "businesses"("user_id");
CREATE INDEX IF NOT EXISTS "businesses_ville_id_idx" ON "businesses"("ville_id");
CREATE INDEX IF NOT EXISTS "businesses_agency_id_idx" ON "businesses"("agency_id");
CREATE INDEX IF NOT EXISTS "businesses_is_active_deleted_at_idx" ON "businesses"("is_active", "deleted_at");

DO $$ BEGIN
    ALTER TABLE "businesses" ADD CONSTRAINT "businesses_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "businesses" ADD CONSTRAINT "businesses_ville_id_fkey"
        FOREIGN KEY ("ville_id") REFERENCES "villes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "businesses" ADD CONSTRAINT "businesses_agency_id_fkey"
        FOREIGN KEY ("agency_id") REFERENCES "agences"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "businesses" ADD CONSTRAINT "businesses_return_ville_id_fkey"
        FOREIGN KEY ("return_ville_id") REFERENCES "villes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 4. Comptes bancaires polymorphiques (1 seul compte actif non supprimé par propriétaire)
CREATE TABLE IF NOT EXISTS "comptes_bancaires" (
    "id" SERIAL NOT NULL,
    "owner_type" VARCHAR(16) NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "banque_id" INTEGER,
    "banque_nom_custom" VARCHAR(255),
    "rib" VARCHAR(34) NOT NULL,
    "titulaire_nom" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    CONSTRAINT "comptes_bancaires_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "comptes_bancaires_owner_type_owner_id_idx" ON "comptes_bancaires"("owner_type", "owner_id");
CREATE INDEX IF NOT EXISTS "comptes_bancaires_banque_id_idx" ON "comptes_bancaires"("banque_id");
CREATE INDEX IF NOT EXISTS "comptes_bancaires_is_active_deleted_at_idx" ON "comptes_bancaires"("is_active", "deleted_at");
CREATE UNIQUE INDEX IF NOT EXISTS "comptes_bancaires_one_active_per_owner_idx"
    ON "comptes_bancaires"("owner_type", "owner_id")
    WHERE "is_active" = true AND "deleted_at" IS NULL;

DO $$ BEGIN
    ALTER TABLE "comptes_bancaires" ADD CONSTRAINT "comptes_bancaires_banque_id_fkey"
        FOREIGN KEY ("banque_id") REFERENCES "banques"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

