-- Index unique partiel PostgreSQL 18 sur users.email (CITEXT) pour les comptes non supprimés
-- Rendu possible après arbitrage des doublons 4755/4756 et 5355/5409 (Sprint 02)
CREATE UNIQUE INDEX "users_email_active_unique_idx" ON "users"("email") WHERE "deleted_at" IS NULL;

