import 'dotenv/config';
import mysql from 'mysql2/promise';
import { Pool, type PoolClient } from 'pg';

interface CliOptions {
  dryRun: boolean;
  emailOverrides: Map<number, string>;
  disabledUserIds: Set<number>;
  softDeletedUserIds: Set<number>;
}

interface DuplicateGroup {
  emailNormalized: string;
  users: Array<{
    id: number;
    nomComplet: string;
    emailRaw: string;
    active: boolean;
    deletedAt: Date | null;
  }>;
}

/**
 * Règles validées par le métier (Sprint 02) :
 * - bleurose@gmail.com : conserver 4755, archiver/désactiver 4756 (Ouhmouche nissrine) tout en gardant id=4756
 * - youssef@gmail.com : conserver 5355 (Youssef Salé, livreur, 1 032 colis), désactiver/soft-delete 5409 (admin, 0 colis)
 */
const DEFAULT_EMAIL_OVERRIDES = new Map<number, string>([
  [4756, 'ouhmouche.nissrine+4756@legacy.g4d.local'],
  [5409, 'youssef+5409@legacy.g4d.local'],
]);

const DEFAULT_DISABLED_USER_IDS = new Set<number>([4756, 5409]);
const DEFAULT_SOFT_DELETED_USER_IDS = new Set<number>([5409]);

function parseCliArgs(argv: string[]): CliOptions {
  const emailOverrides = new Map<number, string>(DEFAULT_EMAIL_OVERRIDES);
  const disabledUserIds = new Set<number>(DEFAULT_DISABLED_USER_IDS);
  const softDeletedUserIds = new Set<number>(DEFAULT_SOFT_DELETED_USER_IDS);
  let dryRun = false;

  for (const arg of argv) {
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (arg.startsWith('--email-override=')) {
      const spec = arg.slice('--email-override='.length);
      const sepIdx = spec.indexOf(':');
      if (sepIdx <= 0) {
        throw new Error(`Format invalide pour --email-override (${spec}), attendu id:nouvel_email`);
      }
      const userId = Number(spec.slice(0, sepIdx));
      const newEmail = spec
        .slice(sepIdx + 1)
        .trim()
        .toLowerCase();
      if (!Number.isInteger(userId) || userId <= 0 || !newEmail.includes('@')) {
        throw new Error(`Paramètre --email-override invalide : ${spec}`);
      }
      emailOverrides.set(userId, newEmail);
      continue;
    }
    if (arg.startsWith('--disable-user=')) {
      const userId = Number(arg.slice('--disable-user='.length));
      if (!Number.isInteger(userId) || userId <= 0) {
        throw new Error(`Paramètre --disable-user invalide : ${arg}`);
      }
      disabledUserIds.add(userId);
      continue;
    }
    if (arg.startsWith('--soft-delete-user=')) {
      const userId = Number(arg.slice('--soft-delete-user='.length));
      if (!Number.isInteger(userId) || userId <= 0) {
        throw new Error(`Paramètre --soft-delete-user invalide : ${arg}`);
      }
      softDeletedUserIds.add(userId);
      disabledUserIds.add(userId);
      continue;
    }
    if (arg.trim().length > 0) {
      throw new Error(`Option inconnue : ${arg}`);
    }
  }

  return { dryRun, emailOverrides, disabledUserIds, softDeletedUserIds };
}

function asNullableDate(value: unknown): Date | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function asBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const s = String(value ?? '')
    .trim()
    .toLowerCase();
  return s === '1' || s === 'true' || s === 'yes';
}

function asString(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value);
  return s.length === 0 ? null : s;
}

function asNullableInt(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isInteger(n) ? n : null;
}

function detectPasswordAlgo(hash: string): string {
  if (hash.startsWith('$argon2id$')) return 'argon2id';
  if (hash.startsWith('$2y$') || hash.startsWith('$2a$') || hash.startsWith('$2b$')) {
    return 'bcrypt_2y';
  }
  return 'unknown';
}

function normalizeJsonValue(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string') {
    try {
      JSON.parse(value);
      return value;
    } catch {
      return null;
    }
  }
  return JSON.stringify(value);
}

async function getMysqlTableColumns(
  conn: mysql.Connection,
  dbName: string,
  tableName: string,
): Promise<Set<string>> {
  const [rows] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [dbName, tableName],
  );
  return new Set(rows.map((r) => String(r['COLUMN_NAME'])));
}

function extractMysqlDbName(urlString: string): string {
  const parsed = new URL(urlString);
  const dbName = parsed.pathname.replace(/^\//, '').trim();
  if (!dbName) {
    throw new Error('Nom de base MySQL absent dans LEGACY_MYSQL_URL');
  }
  return dbName;
}

async function upsertBatch(
  client: PoolClient,
  sqlPrefix: string,
  colCount: number,
  rows: unknown[][],
  sqlSuffix: string,
  chunkSize = 400,
): Promise<void> {
  for (let offset = 0; offset < rows.length; offset += chunkSize) {
    const chunk = rows.slice(offset, offset + chunkSize);
    const values: unknown[] = [];
    const placeholders: string[] = [];

    for (let r = 0; r < chunk.length; r++) {
      const row = chunk[r];
      const rowPlaceholders: string[] = [];
      for (let c = 0; c < colCount; c++) {
        values.push(row[c]);
        rowPlaceholders.push(`$${values.length}`);
      }
      placeholders.push(`(${rowPlaceholders.join(', ')})`);
    }

    const query = `${sqlPrefix} ${placeholders.join(', ')} ${sqlSuffix}`;
    await client.query(query, values);
  }
}

async function main(): Promise<void> {
  const options = parseCliArgs(process.argv.slice(2));
  const legacyMysqlUrl = process.env['LEGACY_MYSQL_URL']?.trim();
  const databaseUrl = process.env['DATABASE_URL']?.trim();

  if (!legacyMysqlUrl) {
    throw new Error('Variable LEGACY_MYSQL_URL manquante.');
  }
  if (!databaseUrl) {
    throw new Error('Variable DATABASE_URL manquante.');
  }

  const mysqlDbName = extractMysqlDbName(legacyMysqlUrl);
  const mysqlConn = await mysql.createConnection(legacyMysqlUrl);
  const pgPool = new Pool({ connectionString: databaseUrl, max: 5 });

  try {
    console.log(
      `[ETL G4D] Connexion établie (${options.dryRun ? 'MODE DRY-RUN LECTURE SEULE' : 'MODE ÉCRITURE'}).`,
    );

    const userCols = await getMysqlTableColumns(mysqlConn, mysqlDbName, 'users');
    const roleCols = await getMysqlTableColumns(mysqlConn, mysqlDbName, 'roles');
    const villeCols = await getMysqlTableColumns(mysqlConn, mysqlDbName, 'villes');
    const agenceCols = await getMysqlTableColumns(mysqlConn, mysqlDbName, 'agences');

    const [zonesRows] = await mysqlConn.query<mysql.RowDataPacket[]>(
      `SELECT id, name, code, deleted_at, created_at, updated_at
       FROM zones
       ORDER BY id ASC`,
    );

    const [villesRows] = await mysqlConn.query<mysql.RowDataPacket[]>(
      `SELECT id, name_fr, code_zone, name_ar, zone_id, deleted_at, created_at, updated_at
       ${villeCols.has('standard_tarif_id') ? ', standard_tarif_id' : ''}
       FROM villes
       ORDER BY id ASC`,
    );

    const [rolesRows] = await mysqlConn.query<mysql.RowDataPacket[]>(
      `SELECT id, name, guard_name, created_at, updated_at
       ${roleCols.has('owner_id') ? ', owner_id' : ''}
       ${roleCols.has('libelle') ? ', libelle' : ''}
       FROM roles
       ORDER BY id ASC`,
    );

    const [permRows] = await mysqlConn.query<mysql.RowDataPacket[]>(
      `SELECT id, name, guard_name, created_at, updated_at
       FROM permissions
       ORDER BY id ASC`,
    );

    const [rolePermRows] = await mysqlConn.query<mysql.RowDataPacket[]>(
      `SELECT permission_id, role_id
       FROM role_has_permissions`,
    );

    const optionalUserSelects = [
      userCols.has('password_reset_at') ? 'password_reset_at' : 'NULL AS password_reset_at',
      userCols.has('api_abilities') ? 'api_abilities' : 'NULL AS api_abilities',
      userCols.has('inscription_statut') ? 'inscription_statut' : 'NULL AS inscription_statut',
      userCols.has('inscription_traitee_par')
        ? 'inscription_traitee_par'
        : 'NULL AS inscription_traitee_par',
      userCols.has('inscription_traitee_le')
        ? 'inscription_traitee_le'
        : 'NULL AS inscription_traitee_le',
      userCols.has('inscription_motif') ? 'inscription_motif' : 'NULL AS inscription_motif',
      userCols.has('inscription_refus_nombre')
        ? 'inscription_refus_nombre'
        : '0 AS inscription_refus_nombre',
      userCols.has('inscription_dernier_refus_le')
        ? 'inscription_dernier_refus_le'
        : 'NULL AS inscription_dernier_refus_le',
      userCols.has('parent_id') ? 'parent_id' : 'NULL AS parent_id',
    ];

    const [userRows] = await mysqlConn.query<mysql.RowDataPacket[]>(
      `SELECT
        id, nom_complet, civilite, picture, email, password, telephone, sav,
        ville_name, ville_id, cin, stockout, emailstockout, active, ramassage_liv,
        affiliate, lien_localisation_maps, affictaion, emailsend, remember_token,
        deleted_at, created_at, updated_at,
        ${optionalUserSelects.join(', ')}
       FROM users
       ORDER BY id ASC`,
    );

    const [userRoleRows] = await mysqlConn.query<mysql.RowDataPacket[]>(
      `SELECT role_id, model_id, model_type
       FROM model_has_roles`,
    );

    const [userPermRows] = await mysqlConn.query<mysql.RowDataPacket[]>(
      `SELECT permission_id, model_id, model_type
       FROM model_has_permissions`,
    );

    const [resetTokenRows] = await mysqlConn.query<mysql.RowDataPacket[]>(
      `SELECT email, token, created_at
       FROM password_reset_tokens`,
    );

    const [authLogRows] = await mysqlConn.query<mysql.RowDataPacket[]>(
      `SELECT id, user_id, event, ip_address, user_agent, location, device, browser, platform, created_at
       FROM authentication_logs
       ORDER BY id ASC`,
    );

    const [agencesRows] = await mysqlConn.query<mysql.RowDataPacket[]>(
      `SELECT id, name, code,
              ${agenceCols.has('ville_id') ? 'ville_id,' : 'NULL AS ville_id,'}
              responsable_id, telephone, adresse, active, deleted_at, created_at, updated_at
       FROM agences
       ORDER BY id ASC`,
    );

    const [agenceZoneRows] = await mysqlConn.query<mysql.RowDataPacket[]>(
      `SELECT id, agence_id, zone_id, livraison, ramassage, created_at, updated_at
       FROM agence_zone
       ORDER BY id ASC`,
    );

    const [agenceMembreRows] = await mysqlConn.query<mysql.RowDataPacket[]>(
      `SELECT id, agence_id, user_id, role, actif, depuis, jusqua, created_at, updated_at
       FROM agence_membres
       ORDER BY id ASC`,
    );

    const [membreZoneRows] = await mysqlConn.query<mysql.RowDataPacket[]>(
      `SELECT id, agence_membre_id, zone_id, activite, actif, created_at, updated_at
       FROM membre_zones
       ORDER BY id ASC`,
    );

    const [partenairesRows] = await mysqlConn.query<mysql.RowDataPacket[]>(
      `SELECT id, code, raison_sociale, ice, telephone, email, actif, deleted_at, created_at, updated_at
       FROM partenaires
       ORDER BY id ASC`,
    );

    const [agencePartenaireRows] = await mysqlConn.query<mysql.RowDataPacket[]>(
      `SELECT id, agence_id, partenaire_id, depuis, jusqua, actif, created_at, updated_at
       FROM agence_partenaires
       ORDER BY id ASC`,
    );

    const [partenaireZoneRows] = await mysqlConn.query<mysql.RowDataPacket[]>(
      `SELECT id, agence_partenaire_id, zone_id, actif, created_at, updated_at
       FROM partenaire_zones
       ORDER BY id ASC`,
    );

    const [partenaireCoursierRows] = await mysqlConn.query<mysql.RowDataPacket[]>(
      `SELECT id, partenaire_id, nom, telephone, user_id, actif, created_at, updated_at
       FROM partenaire_coursiers
       ORDER BY id ASC`,
    );

    const [partenaireConnexionRows] = await mysqlConn.query<mysql.RowDataPacket[]>(
      `SELECT pc.id, pc.partenaire_id, COALESCE(at.cle, 'custom') AS api_type_code,
              pc.base_url, pc.identifiant, pc.secret, pc.actif, pc.created_at, pc.updated_at
       FROM partenaire_connexions pc
       LEFT JOIN api_types at ON at.id = pc.api_type_id
       ORDER BY pc.id ASC`,
    );

    const [apiIdentifiantRows] = await mysqlConn.query<mysql.RowDataPacket[]>(
      `SELECT id, partenaire_id, user_id, libelle, cle_publique, secret_empreinte,
              droits, expire_le, revoque_le, dernier_usage_le, created_at, updated_at
       FROM api_identifiants
       ORDER BY id ASC`,
    );

    // Détection et résolution des doublons d'e-mails
    const byNormalizedEmail = new Map<string, DuplicateGroup['users']>();
    const unresolvedSoftDeletedIgnored = new Map<string, number>();

    for (const u of userRows) {
      const id = Number(u['id']);
      const rawEmail = asString(u['email']).trim();
      const effectiveEmail = (options.emailOverrides.get(id) ?? rawEmail).trim().toLowerCase();
      const deletedAt = options.softDeletedUserIds.has(id)
        ? (asNullableDate(u['deleted_at']) ?? new Date())
        : asNullableDate(u['deleted_at']);
      const active = options.disabledUserIds.has(id) ? false : asBoolean(u['active']);

      const bucket = byNormalizedEmail.get(effectiveEmail) ?? [];
      bucket.push({
        id,
        nomComplet: asString(u['nom_complet']),
        emailRaw: rawEmail,
        active,
        deletedAt,
      });
      byNormalizedEmail.set(effectiveEmail, bucket);
      if (deletedAt) {
        unresolvedSoftDeletedIgnored.set(
          effectiveEmail,
          (unresolvedSoftDeletedIgnored.get(effectiveEmail) ?? 0) + 1,
        );
      }
    }

    const duplicateGroups: DuplicateGroup[] = [];
    for (const [emailNormalized, bucket] of byNormalizedEmail.entries()) {
      const nonDeleted = bucket.filter((entry) => entry.deletedAt === null);
      if (nonDeleted.length > 1) {
        duplicateGroups.push({ emailNormalized, users: nonDeleted });
      }
    }

    console.log(
      JSON.stringify(
        {
          sourceCounts: {
            zones: zonesRows.length,
            villes: villesRows.length,
            roles: rolesRows.length,
            permissions: permRows.length,
            roleHasPermissions: rolePermRows.length,
            users: userRows.length,
            modelHasRoles: userRoleRows.length,
            modelHasPermissions: userPermRows.length,
            passwordResetTokens: resetTokenRows.length,
            authenticationLogs: authLogRows.length,
            agences: agencesRows.length,
            agenceZone: agenceZoneRows.length,
            agenceMembres: agenceMembreRows.length,
            membreZones: membreZoneRows.length,
            partenaires: partenairesRows.length,
            agencePartenaires: agencePartenaireRows.length,
            partenaireZones: partenaireZoneRows.length,
            partenaireCoursiers: partenaireCoursierRows.length,
            partenaireConnexions: partenaireConnexionRows.length,
            apiIdentifiants: apiIdentifiantRows.length,
          },
          appliedEmailOverrides: Array.from(options.emailOverrides.entries()).map(
            ([id, email]) => ({
              id,
              email,
            }),
          ),
          disabledUserIds: Array.from(options.disabledUserIds.values()),
          softDeletedUserIds: Array.from(options.softDeletedUserIds.values()),
          remainingActiveDuplicates: duplicateGroups,
        },
        null,
        2,
      ),
    );

    if (duplicateGroups.length > 0) {
      const details = duplicateGroups
        .map(
          (g) =>
            `${g.emailNormalized}: [${g.users.map((u) => `${u.id} (${u.nomComplet})`).join(', ')}]`,
        )
        .join(' ; ');
      if (options.dryRun) {
        console.warn(
          `[DRY-RUN AVERTISSEMENT] Doublons actifs non encore résolus : ${details}. Utiliser --email-override=<id>:<email> ou --soft-delete-user=<id> avant la migration réelle.`,
        );
        return;
      }
      throw new Error(
        `Migration interrompue : doublons actifs d'e-mails non résolus -> ${details}. Passez --email-override=<id>:<email> ou --soft-delete-user=<id>.`,
      );
    }

    if (options.dryRun) {
      console.log('[DRY-RUN] Aucun doublon actif bloquant, prêt pour l’exécution.');
      return;
    }

    const zoneIdSet = new Set(zonesRows.map((z) => Number(z['id'])));
    const villeIdSet = new Set(villesRows.map((v) => Number(v['id'])));
    const roleIdSet = new Set(rolesRows.map((r) => Number(r['id'])));
    const permIdSet = new Set(permRows.map((p) => Number(p['id'])));
    const userIdSet = new Set(userRows.map((u) => Number(u['id'])));
    const agenceIdSet = new Set(agencesRows.map((a) => Number(a['id'])));
    const partenaireIdSet = new Set(partenairesRows.map((p) => Number(p['id'])));

    const pgClient = await pgPool.connect();
    try {
      await pgClient.query('BEGIN');

      // 0. Zones (avant Villes pour respecter FK villes.zone_id -> zones.id)
      if (zonesRows.length > 0) {
        await upsertBatch(
          pgClient,
          `INSERT INTO "zones" ("id", "nom", "code", "actif", "deleted_at", "created_at", "updated_at") VALUES`,
          7,
          zonesRows.map((z) => {
            const deletedAt = asNullableDate(z['deleted_at']);
            return [
              Number(z['id']),
              asString(z['name']).trim(),
              asString(z['code']).trim(),
              deletedAt === null,
              deletedAt,
              asNullableDate(z['created_at']),
              asNullableDate(z['updated_at']),
            ];
          }),
          `ON CONFLICT ("id") DO UPDATE SET
            "nom" = EXCLUDED."nom",
            "code" = EXCLUDED."code",
            "actif" = EXCLUDED."actif",
            "deleted_at" = EXCLUDED."deleted_at",
            "created_at" = EXCLUDED."created_at",
            "updated_at" = EXCLUDED."updated_at"`,
        );
      }

      // 1. Villes
      await upsertBatch(
        pgClient,
        `INSERT INTO "villes" ("id", "name_fr", "code_zone", "name_ar", "zone_id", "standard_tarif_id", "deleted_at", "created_at", "updated_at") VALUES`,
        9,
        villesRows.map((v) => {
          const rawZoneId = asNullableInt(v['zone_id']);
          const safeZoneId = rawZoneId && zoneIdSet.has(rawZoneId) ? rawZoneId : null;
          return [
            Number(v['id']),
            asString(v['name_fr']),
            asString(v['code_zone']),
            asNullableString(v['name_ar']),
            safeZoneId,
            asNullableInt(v['standard_tarif_id']),
            asNullableDate(v['deleted_at']),
            asNullableDate(v['created_at']),
            asNullableDate(v['updated_at']),
          ];
        }),
        `ON CONFLICT ("id") DO UPDATE SET
          "name_fr" = EXCLUDED."name_fr",
          "code_zone" = EXCLUDED."code_zone",
          "name_ar" = EXCLUDED."name_ar",
          "zone_id" = EXCLUDED."zone_id",
          "standard_tarif_id" = EXCLUDED."standard_tarif_id",
          "deleted_at" = EXCLUDED."deleted_at",
          "created_at" = EXCLUDED."created_at",
          "updated_at" = EXCLUDED."updated_at"`,
      );

      // 2. Roles (owner_id posé en passe 2 après insertion des users)
      await upsertBatch(
        pgClient,
        `INSERT INTO "roles" ("id", "name", "guard_name", "owner_id", "libelle", "created_at", "updated_at") VALUES`,
        7,
        rolesRows.map((r) => [
          Number(r['id']),
          asString(r['name']),
          asString(r['guard_name'], 'web'),
          null,
          asNullableString(r['libelle']),
          asNullableDate(r['created_at']),
          asNullableDate(r['updated_at']),
        ]),
        `ON CONFLICT ("id") DO UPDATE SET
          "name" = EXCLUDED."name",
          "guard_name" = EXCLUDED."guard_name",
          "libelle" = EXCLUDED."libelle",
          "created_at" = EXCLUDED."created_at",
          "updated_at" = EXCLUDED."updated_at"`,
      );

      // 3. Permissions
      await upsertBatch(
        pgClient,
        `INSERT INTO "permissions" ("id", "name", "guard_name", "created_at", "updated_at") VALUES`,
        5,
        permRows.map((p) => [
          Number(p['id']),
          asString(p['name']),
          asString(p['guard_name'], 'web'),
          asNullableDate(p['created_at']),
          asNullableDate(p['updated_at']),
        ]),
        `ON CONFLICT ("id") DO UPDATE SET
          "name" = EXCLUDED."name",
          "guard_name" = EXCLUDED."guard_name",
          "created_at" = EXCLUDED."created_at",
          "updated_at" = EXCLUDED."updated_at"`,
      );

      // 4. RoleHasPermissions
      const validRolePerms = rolePermRows.filter(
        (rp) => permIdSet.has(Number(rp['permission_id'])) && roleIdSet.has(Number(rp['role_id'])),
      );
      await upsertBatch(
        pgClient,
        `INSERT INTO "role_has_permissions" ("permission_id", "role_id") VALUES`,
        2,
        validRolePerms.map((rp) => [Number(rp['permission_id']), Number(rp['role_id'])]),
        `ON CONFLICT ("permission_id", "role_id") DO NOTHING`,
      );

      // 5. Users (Passe 1 sans parent_id pour éviter les dépendances circulaires)
      let orphanVilleCount = 0;
      const now = new Date();
      await upsertBatch(
        pgClient,
        `INSERT INTO "users" (
          "id", "nom_complet", "civilite", "picture", "email", "password", "password_algo",
          "password_reset_at", "telephone", "sav", "ville_name", "ville_id", "cin",
          "stockout", "emailstockout", "active", "ramassage_liv", "affiliate",
          "lien_localisation_maps", "affictaion", "emailsend", "remember_token", "api_abilities",
          "inscription_statut", "inscription_traitee_par", "inscription_traitee_le",
          "inscription_motif", "inscription_refus_nombre", "inscription_dernier_refus_le",
          "parent_id", "deleted_at", "created_at", "updated_at"
        ) VALUES`,
        33,
        userRows.map((u) => {
          const id = Number(u['id']);
          const rawEmail = asString(u['email']).trim();
          const finalEmail = (options.emailOverrides.get(id) ?? rawEmail).trim();
          const passwordHash = asString(u['password']);
          const rawVilleId = asNullableInt(u['ville_id']);
          const safeVilleId = rawVilleId && villeIdSet.has(rawVilleId) ? rawVilleId : null;
          if (rawVilleId && !safeVilleId) orphanVilleCount++;

          const deletedAt = options.softDeletedUserIds.has(id)
            ? (asNullableDate(u['deleted_at']) ?? now)
            : asNullableDate(u['deleted_at']);
          const active = options.disabledUserIds.has(id) ? false : asBoolean(u['active']);

          return [
            id,
            asString(u['nom_complet']),
            asNullableString(u['civilite']),
            asString(u['picture']),
            finalEmail,
            passwordHash,
            detectPasswordAlgo(passwordHash),
            asNullableDate(u['password_reset_at']),
            asString(u['telephone']),
            asString(u['sav']),
            asString(u['ville_name']),
            safeVilleId,
            asString(u['cin']),
            asString(u['stockout']),
            asString(u['emailstockout']),
            active,
            asBoolean(u['ramassage_liv']),
            asNullableString(u['affiliate']),
            asString(u['lien_localisation_maps']),
            asString(u['affictaion']),
            asString(u['emailsend'], 'non'),
            asNullableString(u['remember_token']),
            normalizeJsonValue(u['api_abilities']),
            asNullableString(u['inscription_statut']),
            asNullableInt(u['inscription_traitee_par']),
            asNullableDate(u['inscription_traitee_le']),
            asNullableString(u['inscription_motif']),
            Number(u['inscription_refus_nombre'] ?? 0) || 0,
            asNullableDate(u['inscription_dernier_refus_le']),
            null,
            deletedAt,
            asNullableDate(u['created_at']),
            asNullableDate(u['updated_at']),
          ];
        }),
        `ON CONFLICT ("id") DO UPDATE SET
          "nom_complet" = EXCLUDED."nom_complet",
          "civilite" = EXCLUDED."civilite",
          "picture" = CASE
            WHEN "users"."picture" LIKE 'avatars/2026-%' THEN "users"."picture"
            ELSE EXCLUDED."picture"
          END,
          "email" = EXCLUDED."email",
          "password" = CASE
            WHEN "users"."password_algo" = 'argon2id' THEN "users"."password"
            ELSE EXCLUDED."password"
          END,
          "password_algo" = CASE
            WHEN "users"."password_algo" = 'argon2id' THEN "users"."password_algo"
            ELSE EXCLUDED."password_algo"
          END,
          "password_reset_at" = CASE
            WHEN "users"."password_algo" = 'argon2id' THEN "users"."password_reset_at"
            ELSE EXCLUDED."password_reset_at"
          END,
          "telephone" = EXCLUDED."telephone",
          "sav" = EXCLUDED."sav",
          "ville_name" = EXCLUDED."ville_name",
          "ville_id" = EXCLUDED."ville_id",
          "cin" = EXCLUDED."cin",
          "stockout" = EXCLUDED."stockout",
          "emailstockout" = EXCLUDED."emailstockout",
          "active" = EXCLUDED."active",
          "ramassage_liv" = EXCLUDED."ramassage_liv",
          "affiliate" = EXCLUDED."affiliate",
          "lien_localisation_maps" = EXCLUDED."lien_localisation_maps",
          "affictaion" = EXCLUDED."affictaion",
          "emailsend" = EXCLUDED."emailsend",
          "remember_token" = EXCLUDED."remember_token",
          "api_abilities" = EXCLUDED."api_abilities",
          "inscription_statut" = EXCLUDED."inscription_statut",
          "inscription_traitee_par" = EXCLUDED."inscription_traitee_par",
          "inscription_traitee_le" = EXCLUDED."inscription_traitee_le",
          "inscription_motif" = EXCLUDED."inscription_motif",
          "inscription_refus_nombre" = EXCLUDED."inscription_refus_nombre",
          "inscription_dernier_refus_le" = EXCLUDED."inscription_dernier_refus_le",
          "deleted_at" = EXCLUDED."deleted_at",
          "created_at" = EXCLUDED."created_at",
          "updated_at" = EXCLUDED."updated_at"`,
        150,
      );

      // 6. Passe 2 : parent_id sur users + owner_id sur roles
      for (const u of userRows) {
        const id = Number(u['id']);
        const parentId = asNullableInt(u['parent_id']);
        if (parentId && userIdSet.has(parentId) && parentId !== id) {
          await pgClient.query(`UPDATE "users" SET "parent_id" = $1 WHERE "id" = $2`, [
            parentId,
            id,
          ]);
        }
      }
      for (const r of rolesRows) {
        const id = Number(r['id']);
        const ownerId = asNullableInt(r['owner_id']);
        if (ownerId && userIdSet.has(ownerId)) {
          await pgClient.query(`UPDATE "roles" SET "owner_id" = $1 WHERE "id" = $2`, [ownerId, id]);
        }
      }

      // 7. UserRoles (filtré model_type='user' ou 'App\\Models\\User')
      const validUserRoles = userRoleRows.filter((ur) => {
        const modelType = asString(ur['model_type']).toLowerCase();
        return (
          (modelType === 'user' || modelType === 'app\\models\\user') &&
          roleIdSet.has(Number(ur['role_id'])) &&
          userIdSet.has(Number(ur['model_id']))
        );
      });
      await upsertBatch(
        pgClient,
        `INSERT INTO "user_roles" ("role_id", "user_id") VALUES`,
        2,
        validUserRoles.map((ur) => [Number(ur['role_id']), Number(ur['model_id'])]),
        `ON CONFLICT ("role_id", "user_id") DO NOTHING`,
      );

      // 8. UserPermissions
      const validUserPerms = userPermRows.filter((up) => {
        const modelType = asString(up['model_type']).toLowerCase();
        return (
          (modelType === 'user' || modelType === 'app\\models\\user') &&
          permIdSet.has(Number(up['permission_id'])) &&
          userIdSet.has(Number(up['model_id']))
        );
      });
      await upsertBatch(
        pgClient,
        `INSERT INTO "user_permissions" ("permission_id", "user_id") VALUES`,
        2,
        validUserPerms.map((up) => [Number(up['permission_id']), Number(up['model_id'])]),
        `ON CONFLICT ("permission_id", "user_id") DO NOTHING`,
      );

      // 9. PasswordResetTokens (dédoublonnage insensible à la casse pour citext)
      const dedupTokens = new Map<
        string,
        { email: string; token: string; expiresAt: Date | null; createdAt: Date | null }
      >();
      for (const t of resetTokenRows) {
        const email = asString(t['email']).trim().toLowerCase();
        const createdAt = asNullableDate(t['created_at']);
        const existing = dedupTokens.get(email);
        if (
          !existing ||
          (createdAt && (!existing.createdAt || createdAt.getTime() > existing.createdAt.getTime()))
        ) {
          const expiresAt = createdAt ? new Date(createdAt.getTime() + 60 * 60 * 1000) : null;
          dedupTokens.set(email, {
            email,
            token: asString(t['token']),
            expiresAt,
            createdAt,
          });
        }
      }
      if (dedupTokens.size > 0) {
        await upsertBatch(
          pgClient,
          `INSERT INTO "password_reset_tokens" ("email", "token", "expires_at", "created_at") VALUES`,
          4,
          Array.from(dedupTokens.values()).map((t) => [t.email, t.token, t.expiresAt, t.createdAt]),
          `ON CONFLICT ("email") DO UPDATE SET
            "token" = EXCLUDED."token",
            "expires_at" = EXCLUDED."expires_at",
            "created_at" = EXCLUDED."created_at"`,
        );
      }

      // 10. AuthenticationLogs (par lots de 800)
      await upsertBatch(
        pgClient,
        `INSERT INTO "authentication_logs" ("id", "user_id", "event", "ip_address", "user_agent", "location", "device", "browser", "platform", "created_at") VALUES`,
        10,
        authLogRows.map((l) => {
          const rawUserId = asNullableInt(l['user_id']);
          const safeUserId = rawUserId && userIdSet.has(rawUserId) ? rawUserId : null;
          return [
            String(l['id']),
            safeUserId,
            asString(l['event']),
            asNullableString(l['ip_address']),
            asNullableString(l['user_agent']),
            asNullableString(l['location']),
            asNullableString(l['device']),
            asNullableString(l['browser']),
            asNullableString(l['platform']),
            asNullableDate(l['created_at']),
          ];
        }),
        `ON CONFLICT ("id") DO UPDATE SET
          "user_id" = EXCLUDED."user_id",
          "event" = EXCLUDED."event",
          "ip_address" = EXCLUDED."ip_address",
          "user_agent" = EXCLUDED."user_agent",
          "location" = EXCLUDED."location",
          "device" = EXCLUDED."device",
          "browser" = EXCLUDED."browser",
          "platform" = EXCLUDED."platform",
          "created_at" = EXCLUDED."created_at"`,
        800,
      );

      // 11. Multi-Organisations (Agences, Zones Agence/Membres, Partenaires, Connexions & Clés API)
      if (agencesRows.length > 0) {
        await upsertBatch(
          pgClient,
          `INSERT INTO "agences" ("id", "nom", "code", "ville_id", "responsable_id", "telephone", "adresse", "actif", "deleted_at", "created_at", "updated_at") VALUES`,
          11,
          agencesRows.map((a) => {
            const rawVilleId = asNullableInt(a['ville_id']);
            const safeVilleId = rawVilleId && villeIdSet.has(rawVilleId) ? rawVilleId : null;
            const rawRespId = asNullableInt(a['responsable_id']);
            const safeRespId = rawRespId && userIdSet.has(rawRespId) ? rawRespId : null;
            return [
              Number(a['id']),
              asString(a['name']).trim(),
              asString(a['code']).trim(),
              safeVilleId,
              safeRespId,
              asNullableString(a['telephone']),
              asNullableString(a['adresse']),
              asBoolean(a['active']),
              asNullableDate(a['deleted_at']),
              asNullableDate(a['created_at']),
              asNullableDate(a['updated_at']),
            ];
          }),
          `ON CONFLICT ("id") DO UPDATE SET
            "nom" = EXCLUDED."nom",
            "code" = EXCLUDED."code",
            "ville_id" = COALESCE(EXCLUDED."ville_id", "agences"."ville_id"),
            "responsable_id" = EXCLUDED."responsable_id",
            "telephone" = EXCLUDED."telephone",
            "adresse" = EXCLUDED."adresse",
            "actif" = EXCLUDED."actif",
            "deleted_at" = EXCLUDED."deleted_at",
            "created_at" = EXCLUDED."created_at",
            "updated_at" = EXCLUDED."updated_at"`,
        );
      }

      const validAgenceZones = agenceZoneRows.filter(
        (az) => agenceIdSet.has(Number(az['agence_id'])) && zoneIdSet.has(Number(az['zone_id'])),
      );
      if (validAgenceZones.length > 0) {
        await upsertBatch(
          pgClient,
          `INSERT INTO "agence_zone" ("id", "agence_id", "zone_id", "livraison", "ramassage", "created_at", "updated_at") VALUES`,
          7,
          validAgenceZones.map((az) => [
            Number(az['id']),
            Number(az['agence_id']),
            Number(az['zone_id']),
            asBoolean(az['livraison']),
            asBoolean(az['ramassage']),
            asNullableDate(az['created_at']),
            asNullableDate(az['updated_at']),
          ]),
          `ON CONFLICT ("id") DO UPDATE SET
            "agence_id" = EXCLUDED."agence_id",
            "zone_id" = EXCLUDED."zone_id",
            "livraison" = EXCLUDED."livraison",
            "ramassage" = EXCLUDED."ramassage",
            "created_at" = EXCLUDED."created_at",
            "updated_at" = EXCLUDED."updated_at"`,
        );
      }

      const validAgenceMembres = agenceMembreRows.filter(
        (am) => agenceIdSet.has(Number(am['agence_id'])) && userIdSet.has(Number(am['user_id'])),
      );
      const agenceMembreIdSet = new Set(validAgenceMembres.map((am) => Number(am['id'])));
      if (validAgenceMembres.length > 0) {
        await upsertBatch(
          pgClient,
          `INSERT INTO "agence_membres" ("id", "agence_id", "user_id", "role", "actif", "depuis", "jusqua", "created_at", "updated_at") VALUES`,
          9,
          validAgenceMembres.map((am) => [
            Number(am['id']),
            Number(am['agence_id']),
            Number(am['user_id']),
            asString(am['role']).trim(),
            asBoolean(am['actif']),
            asNullableDate(am['depuis']),
            asNullableDate(am['jusqua']),
            asNullableDate(am['created_at']),
            asNullableDate(am['updated_at']),
          ]),
          `ON CONFLICT ("id") DO UPDATE SET
            "agence_id" = EXCLUDED."agence_id",
            "user_id" = EXCLUDED."user_id",
            "role" = EXCLUDED."role",
            "actif" = EXCLUDED."actif",
            "depuis" = EXCLUDED."depuis",
            "jusqua" = EXCLUDED."jusqua",
            "created_at" = EXCLUDED."created_at",
            "updated_at" = EXCLUDED."updated_at"`,
        );
      }

      const validMembreZones = membreZoneRows.filter(
        (mz) =>
          agenceMembreIdSet.has(Number(mz['agence_membre_id'])) &&
          zoneIdSet.has(Number(mz['zone_id'])),
      );
      if (validMembreZones.length > 0) {
        await upsertBatch(
          pgClient,
          `INSERT INTO "membre_zones" ("id", "agence_membre_id", "zone_id", "activite", "actif", "created_at", "updated_at") VALUES`,
          7,
          validMembreZones.map((mz) => [
            Number(mz['id']),
            Number(mz['agence_membre_id']),
            Number(mz['zone_id']),
            asString(mz['activite']).trim(),
            asBoolean(mz['actif']),
            asNullableDate(mz['created_at']),
            asNullableDate(mz['updated_at']),
          ]),
          `ON CONFLICT ("id") DO UPDATE SET
            "agence_membre_id" = EXCLUDED."agence_membre_id",
            "zone_id" = EXCLUDED."zone_id",
            "activite" = EXCLUDED."activite",
            "actif" = EXCLUDED."actif",
            "created_at" = EXCLUDED."created_at",
            "updated_at" = EXCLUDED."updated_at"`,
        );
      }

      if (partenairesRows.length > 0) {
        await upsertBatch(
          pgClient,
          `INSERT INTO "partenaires" ("id", "code", "raison_sociale", "ice", "telephone", "email", "actif", "deleted_at", "created_at", "updated_at") VALUES`,
          10,
          partenairesRows.map((p) => [
            Number(p['id']),
            asString(p['code']).trim(),
            asString(p['raison_sociale']).trim(),
            asNullableString(p['ice']),
            asNullableString(p['telephone']),
            asNullableString(p['email']),
            asBoolean(p['actif']),
            asNullableDate(p['deleted_at']),
            asNullableDate(p['created_at']),
            asNullableDate(p['updated_at']),
          ]),
          `ON CONFLICT ("id") DO UPDATE SET
            "code" = EXCLUDED."code",
            "raison_sociale" = EXCLUDED."raison_sociale",
            "ice" = EXCLUDED."ice",
            "telephone" = EXCLUDED."telephone",
            "email" = EXCLUDED."email",
            "actif" = EXCLUDED."actif",
            "deleted_at" = EXCLUDED."deleted_at",
            "created_at" = EXCLUDED."created_at",
            "updated_at" = EXCLUDED."updated_at"`,
        );
      }

      const validAgencePartenaires = agencePartenaireRows.filter(
        (ap) =>
          agenceIdSet.has(Number(ap['agence_id'])) &&
          partenaireIdSet.has(Number(ap['partenaire_id'])),
      );
      const agencePartenaireIdSet = new Set(validAgencePartenaires.map((ap) => Number(ap['id'])));
      if (validAgencePartenaires.length > 0) {
        await upsertBatch(
          pgClient,
          `INSERT INTO "agence_partenaires" ("id", "agence_id", "partenaire_id", "depuis", "jusqua", "actif", "created_at", "updated_at") VALUES`,
          8,
          validAgencePartenaires.map((ap) => [
            Number(ap['id']),
            Number(ap['agence_id']),
            Number(ap['partenaire_id']),
            asNullableDate(ap['depuis']),
            asNullableDate(ap['jusqua']),
            asBoolean(ap['actif']),
            asNullableDate(ap['created_at']),
            asNullableDate(ap['updated_at']),
          ]),
          `ON CONFLICT ("id") DO UPDATE SET
            "agence_id" = EXCLUDED."agence_id",
            "partenaire_id" = EXCLUDED."partenaire_id",
            "depuis" = EXCLUDED."depuis",
            "jusqua" = EXCLUDED."jusqua",
            "actif" = EXCLUDED."actif",
            "created_at" = EXCLUDED."created_at",
            "updated_at" = EXCLUDED."updated_at"`,
        );
      }

      const validPartenaireZones = partenaireZoneRows.filter(
        (pz) =>
          agencePartenaireIdSet.has(Number(pz['agence_partenaire_id'])) &&
          zoneIdSet.has(Number(pz['zone_id'])),
      );
      if (validPartenaireZones.length > 0) {
        await upsertBatch(
          pgClient,
          `INSERT INTO "partenaire_zones" ("id", "agence_partenaire_id", "zone_id", "actif", "created_at", "updated_at") VALUES`,
          6,
          validPartenaireZones.map((pz) => [
            Number(pz['id']),
            Number(pz['agence_partenaire_id']),
            Number(pz['zone_id']),
            asBoolean(pz['actif']),
            asNullableDate(pz['created_at']),
            asNullableDate(pz['updated_at']),
          ]),
          `ON CONFLICT ("id") DO UPDATE SET
            "agence_partenaire_id" = EXCLUDED."agence_partenaire_id",
            "zone_id" = EXCLUDED."zone_id",
            "actif" = EXCLUDED."actif",
            "created_at" = EXCLUDED."created_at",
            "updated_at" = EXCLUDED."updated_at"`,
        );
      }

      const seenCoursierUsers = new Set<number>();
      const validPartenaireCoursiers = partenaireCoursierRows.filter((pc) =>
        partenaireIdSet.has(Number(pc['partenaire_id'])),
      );
      if (validPartenaireCoursiers.length > 0) {
        await upsertBatch(
          pgClient,
          `INSERT INTO "partenaire_coursiers" ("id", "partenaire_id", "nom", "telephone", "user_id", "actif", "created_at", "updated_at") VALUES`,
          8,
          validPartenaireCoursiers.map((pc) => {
            const rawUid = asNullableInt(pc['user_id']);
            let safeUid: number | null = null;
            if (rawUid && userIdSet.has(rawUid) && !seenCoursierUsers.has(rawUid)) {
              safeUid = rawUid;
              seenCoursierUsers.add(rawUid);
            }
            return [
              Number(pc['id']),
              Number(pc['partenaire_id']),
              asString(pc['nom']).trim(),
              asNullableString(pc['telephone']),
              safeUid,
              asBoolean(pc['actif']),
              asNullableDate(pc['created_at']),
              asNullableDate(pc['updated_at']),
            ];
          }),
          `ON CONFLICT ("id") DO UPDATE SET
            "partenaire_id" = EXCLUDED."partenaire_id",
            "nom" = EXCLUDED."nom",
            "telephone" = EXCLUDED."telephone",
            "user_id" = EXCLUDED."user_id",
            "actif" = EXCLUDED."actif",
            "created_at" = EXCLUDED."created_at",
            "updated_at" = EXCLUDED."updated_at"`,
        );
      }

      const validPartenaireConnexions = partenaireConnexionRows.filter((conn) =>
        partenaireIdSet.has(Number(conn['partenaire_id'])),
      );
      if (validPartenaireConnexions.length > 0) {
        await upsertBatch(
          pgClient,
          `INSERT INTO "partenaire_connexions" ("id", "partenaire_id", "api_type_code", "base_url", "identifiant_chiffre", "secret_chiffre", "actif", "created_at", "updated_at") VALUES`,
          9,
          validPartenaireConnexions.map((conn) => [
            Number(conn['id']),
            Number(conn['partenaire_id']),
            asString(conn['api_type_code'], 'custom').trim(),
            asString(conn['base_url']).trim(),
            asString(conn['identifiant']),
            asString(conn['secret']),
            asBoolean(conn['actif']),
            asNullableDate(conn['created_at']),
            asNullableDate(conn['updated_at']),
          ]),
          `ON CONFLICT ("id") DO UPDATE SET
            "partenaire_id" = EXCLUDED."partenaire_id",
            "api_type_code" = EXCLUDED."api_type_code",
            "base_url" = EXCLUDED."base_url",
            "identifiant_chiffre" = EXCLUDED."identifiant_chiffre",
            "secret_chiffre" = EXCLUDED."secret_chiffre",
            "actif" = EXCLUDED."actif",
            "created_at" = EXCLUDED."created_at",
            "updated_at" = EXCLUDED."updated_at"`,
        );
      }

      if (apiIdentifiantRows.length > 0) {
        await upsertBatch(
          pgClient,
          `INSERT INTO "api_identifiants" ("id", "partenaire_id", "user_id", "libelle", "cle_publique", "secret_empreinte", "scopes", "actif", "expires_at", "last_used_at", "revoked_at", "created_at", "updated_at") VALUES`,
          13,
          apiIdentifiantRows.map((apiKey) => {
            const rawPid = asNullableInt(apiKey['partenaire_id']);
            const safePid = rawPid && partenaireIdSet.has(rawPid) ? rawPid : null;
            const rawUid = asNullableInt(apiKey['user_id']);
            const safeUid = rawUid && userIdSet.has(rawUid) ? rawUid : null;
            const revokedAt = asNullableDate(apiKey['revoque_le']);
            return [
              Number(apiKey['id']),
              safePid,
              safeUid,
              asString(apiKey['libelle']).trim(),
              asString(apiKey['cle_publique']).trim(),
              asString(apiKey['secret_empreinte']).trim(),
              normalizeJsonValue(apiKey['droits']),
              revokedAt === null,
              asNullableDate(apiKey['expire_le']),
              asNullableDate(apiKey['dernier_usage_le']),
              revokedAt,
              asNullableDate(apiKey['created_at']),
              asNullableDate(apiKey['updated_at']),
            ];
          }),
          `ON CONFLICT ("id") DO UPDATE SET
            "partenaire_id" = EXCLUDED."partenaire_id",
            "user_id" = EXCLUDED."user_id",
            "libelle" = EXCLUDED."libelle",
            "cle_publique" = EXCLUDED."cle_publique",
            "secret_empreinte" = EXCLUDED."secret_empreinte",
            "scopes" = EXCLUDED."scopes",
            "actif" = EXCLUDED."actif",
            "expires_at" = EXCLUDED."expires_at",
            "last_used_at" = EXCLUDED."last_used_at",
            "revoked_at" = EXCLUDED."revoked_at",
            "created_at" = EXCLUDED."created_at",
            "updated_at" = EXCLUDED."updated_at"`,
        );
      }

      // 12. Resynchronisation des séquences PostgreSQL
      for (const table of [
        'zones',
        'users',
        'roles',
        'permissions',
        'authentication_logs',
        'agences',
        'agence_zone',
        'agence_membres',
        'membre_zones',
        'partenaires',
        'agence_partenaires',
        'partenaire_zones',
        'partenaire_coursiers',
        'partenaire_connexions',
        'api_identifiants',
      ]) {
        await pgClient.query(
          `SELECT setval(pg_get_serial_sequence($1, 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1), COALESCE((SELECT MAX(id) FROM "${table}"), 0) > 0)`,
          [table],
        );
      }

      await pgClient.query('COMMIT');

      // 13. Contrôle de parité post-migration
      const countRes = await pgClient.query<{
        zones: string;
        villes: string;
        roles: string;
        permissions: string;
        role_perms: string;
        users: string;
        user_roles: string;
        user_perms: string;
        reset_tokens: string;
        auth_logs: string;
        agences: string;
        agence_zone: string;
        agence_membres: string;
        membre_zones: string;
        partenaires: string;
        agence_partenaires: string;
        partenaire_zones: string;
        partenaire_coursiers: string;
        partenaire_connexions: string;
        api_identifiants: string;
        active_users_without_role: string;
      }>(`
        SELECT
          (SELECT COUNT(*) FROM "zones") AS zones,
          (SELECT COUNT(*) FROM "villes") AS villes,
          (SELECT COUNT(*) FROM "roles") AS roles,
          (SELECT COUNT(*) FROM "permissions") AS permissions,
          (SELECT COUNT(*) FROM "role_has_permissions") AS role_perms,
          (SELECT COUNT(*) FROM "users") AS users,
          (SELECT COUNT(*) FROM "user_roles") AS user_roles,
          (SELECT COUNT(*) FROM "user_permissions") AS user_perms,
          (SELECT COUNT(*) FROM "password_reset_tokens") AS reset_tokens,
          (SELECT COUNT(*) FROM "authentication_logs") AS auth_logs,
          (SELECT COUNT(*) FROM "agences") AS agences,
          (SELECT COUNT(*) FROM "agence_zone") AS agence_zone,
          (SELECT COUNT(*) FROM "agence_membres") AS agence_membres,
          (SELECT COUNT(*) FROM "membre_zones") AS membre_zones,
          (SELECT COUNT(*) FROM "partenaires") AS partenaires,
          (SELECT COUNT(*) FROM "agence_partenaires") AS agence_partenaires,
          (SELECT COUNT(*) FROM "partenaire_zones") AS partenaire_zones,
          (SELECT COUNT(*) FROM "partenaire_coursiers") AS partenaire_coursiers,
          (SELECT COUNT(*) FROM "partenaire_connexions") AS partenaire_connexions,
          (SELECT COUNT(*) FROM "api_identifiants") AS api_identifiants,
          (SELECT COUNT(*) FROM "users" u
           WHERE u."deleted_at" IS NULL AND u."active" = true
             AND NOT EXISTS (SELECT 1 FROM "user_roles" ur WHERE ur."user_id" = u."id")) AS active_users_without_role
      `);

      console.log(
        '[ETL G4D] Migration terminée avec succès. Parité cible PostgreSQL :',
        JSON.stringify(
          {
            orphanVilleCount,
            pgCounts: countRes.rows[0],
          },
          null,
          2,
        ),
      );
    } catch (err) {
      await pgClient.query('ROLLBACK');
      throw err;
    } finally {
      pgClient.release();
    }
  } finally {
    await mysqlConn.end();
    await pgPool.end();
  }
}

main().catch((error) => {
  console.error('[ETL G4D] Échec de la migration :', error);
  process.exit(1);
});
