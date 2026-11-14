import 'dotenv/config';
import mysql from 'mysql2/promise';
import { Pool, type PoolClient } from 'pg';

interface CliOptions {
  dryRun: boolean;
}

function parseCliArgs(argv: string[]): CliOptions {
  let dryRun = false;
  for (const arg of argv) {
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (arg.trim().length > 0) {
      throw new Error(`Option inconnue : ${arg}`);
    }
  }
  return { dryRun };
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

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function asBoolean(value: unknown, fallback = false): boolean {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  const normalized = String(value).trim().toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'oui') {
    return true;
  }
  if (normalized === '0' || normalized === 'false' || normalized === 'non') {
    return false;
  }
  return fallback;
}

async function upsertBatch(
  client: PoolClient,
  table: string,
  columns: string[],
  rows: unknown[][],
  conflictColumns: string[],
): Promise<void> {
  if (rows.length === 0) {
    return;
  }

  const chunkSize = 200;
  for (let start = 0; start < rows.length; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize);
    const values: unknown[] = [];
    const placeholders = chunk
      .map((row, rowIdx) => {
        const tuple = columns
          .map((_, colIdx) => {
            values.push(row[colIdx]);
            return `$${rowIdx * columns.length + colIdx + 1}`;
          })
          .join(', ');
        return `(${tuple})`;
      })
      .join(', ');

    const colSql = columns.map((col) => `"${col}"`).join(', ');
    const conflictSql = conflictColumns.map((col) => `"${col}"`).join(', ');
    const updateCols = columns
      .filter((col) => !conflictColumns.includes(col))
      .map((col) => `"${col}" = EXCLUDED."${col}"`)
      .join(', ');

    const sql = updateCols
      ? `INSERT INTO "${table}" (${colSql}) VALUES ${placeholders} ON CONFLICT (${conflictSql}) DO UPDATE SET ${updateCols}`
      : `INSERT INTO "${table}" (${colSql}) VALUES ${placeholders} ON CONFLICT (${conflictSql}) DO NOTHING`;

    await client.query(sql, values);
  }
}

async function syncSequence(client: PoolClient, table: string): Promise<void> {
  await client.query(
    `SELECT setval(pg_get_serial_sequence('${table}', 'id'), COALESCE((SELECT MAX("id") FROM "${table}"), 1), COALESCE((SELECT MAX("id") FROM "${table}"), 0) > 0)`,
  );
}

async function main(): Promise<void> {
  const { dryRun } = parseCliArgs(process.argv.slice(2));
  const mysqlUrl = process.env['LEGACY_MYSQL_URL'];
  const pgUrl = process.env['DATABASE_URL'];

  if (!mysqlUrl) {
    throw new Error('LEGACY_MYSQL_URL est requis pour exécuter ETL Sprint 03.');
  }
  if (!pgUrl) {
    throw new Error('DATABASE_URL est requis pour exécuter ETL Sprint 03.');
  }

  const mysqlConn = await mysql.createConnection(mysqlUrl);
  const pgPool = new Pool({ connectionString: pgUrl });

  try {
    const [banquesRaw] = await mysqlConn.query<mysql.RowDataPacket[]>(
      'SELECT id, name, swift_code, logo, status, deleted_at, created_at, updated_at FROM banques ORDER BY id ASC',
    );
    const [banqueCodesRaw] = await mysqlConn.query<mysql.RowDataPacket[]>(
      'SELECT id, bank_id, code, created_at, updated_at FROM banque_codes ORDER BY id ASC',
    );
    const [businessesRaw] = await mysqlConn.query<mysql.RowDataPacket[]>(
      `SELECT id, user_id, name, type, logo, adresse, email, ICE, RC, telephone,
              ville_id, agency_id, is_active, mode_paiement, default_fragile,
              default_openpackage, default_essayage, label_message, auto_send_preparation,
              return_type, return_recipient, return_phone, return_ville_id,
              return_address, return_note, deleted_at, created_at, updated_at
       FROM businesses ORDER BY id ASC`,
    );
    const [comptesRaw] = await mysqlConn.query<mysql.RowDataPacket[]>(
      `SELECT id, owner_type, owner_id, banque_id, banque_nom_custom, rib,
              titulaire_nom, is_active, deleted_at, created_at, updated_at
       FROM comptes_bancaires ORDER BY id ASC`,
    );

    const pgClient = await pgPool.connect();
    try {
      const existingUsersRes = await pgClient.query<{ id: number }>('SELECT id FROM "users"');
      const validUserIds = new Set(existingUsersRes.rows.map((r) => Number(r.id)));
      const existingVillesRes = await pgClient.query<{ id: number }>('SELECT id FROM "villes"');
      const validVilleIds = new Set(existingVillesRes.rows.map((r) => Number(r.id)));
      const existingAgencesRes = await pgClient.query<{ id: number }>('SELECT id FROM "agences"');
      const validAgenceIds = new Set(existingAgencesRes.rows.map((r) => Number(r.id)));

      const validBanqueIds = new Set(banquesRaw.map((b) => Number(b['id'])));

      let skippedOrphanBusinessUsers = 0;
      let nullifiedVilleCount = 0;
      let nullifiedReturnVilleCount = 0;
      let nullifiedAgencyCount = 0;
      let nullifiedCompteBanqueCount = 0;
      let deduplicatedActiveComptes = 0;

      const banqueRows = banquesRaw.map((row) => [
        Number(row['id']),
        String(row['name'] ?? '').trim(),
        asNullableString(row['swift_code']),
        asNullableString(row['logo']),
        asNullableString(row['status']) ?? 'active',
        asNullableDate(row['deleted_at']),
        asNullableDate(row['created_at']) ?? new Date(),
        asNullableDate(row['updated_at']),
      ]);

      const banqueCodeRows = banqueCodesRaw
        .filter((row) => validBanqueIds.has(Number(row['bank_id'])))
        .map((row) => [
          Number(row['id']),
          Number(row['bank_id']),
          String(row['code'] ?? '')
            .trim()
            .padStart(3, '0')
            .slice(0, 3),
          asNullableDate(row['created_at']) ?? new Date(),
          asNullableDate(row['updated_at']),
        ]);

      const businessRows: unknown[][] = [];
      for (const row of businessesRaw) {
        const userId = Number(row['user_id']);
        if (!validUserIds.has(userId)) {
          skippedOrphanBusinessUsers += 1;
          continue;
        }

        const rawVilleId =
          row['ville_id'] !== null && row['ville_id'] !== undefined
            ? Number(row['ville_id'])
            : null;
        const villeId = rawVilleId && validVilleIds.has(rawVilleId) ? rawVilleId : null;
        if (rawVilleId && !villeId) {
          nullifiedVilleCount += 1;
        }

        const rawReturnVilleId =
          row['return_ville_id'] !== null && row['return_ville_id'] !== undefined
            ? Number(row['return_ville_id'])
            : null;
        const returnVilleId =
          rawReturnVilleId && validVilleIds.has(rawReturnVilleId) ? rawReturnVilleId : null;
        if (rawReturnVilleId && !returnVilleId) {
          nullifiedReturnVilleCount += 1;
        }

        const rawAgencyId =
          row['agency_id'] !== null && row['agency_id'] !== undefined
            ? Number(row['agency_id'])
            : null;
        const agencyId = rawAgencyId && validAgenceIds.has(rawAgencyId) ? rawAgencyId : null;
        if (rawAgencyId && !agencyId) {
          nullifiedAgencyCount += 1;
        }

        businessRows.push([
          Number(row['id']),
          userId,
          String(row['name'] ?? '').trim(),
          asNullableString(row['type']),
          asNullableString(row['logo']),
          asNullableString(row['adresse']),
          asNullableString(row['email']),
          asNullableString(row['ICE']),
          asNullableString(row['RC']),
          asNullableString(row['telephone']),
          villeId,
          agencyId,
          asBoolean(row['is_active'], true),
          asNullableString(row['mode_paiement']),
          asBoolean(row['default_fragile'], false),
          asBoolean(row['default_openpackage'], true),
          asBoolean(row['default_essayage'], false),
          asNullableString(row['label_message']),
          asBoolean(row['auto_send_preparation'], false),
          asNullableString(row['return_type']),
          asNullableString(row['return_recipient']),
          asNullableString(row['return_phone']),
          returnVilleId,
          asNullableString(row['return_address']),
          asNullableString(row['return_note']),
          asNullableDate(row['deleted_at']),
          asNullableDate(row['created_at']) ?? new Date(),
          asNullableDate(row['updated_at']),
        ]);
      }

      const activeOwnersSeen = new Set<string>();
      const compteRows: unknown[][] = [];
      for (const row of comptesRaw) {
        const ownerType = String(row['owner_type'] ?? 'BUSINESS').trim();
        const ownerId = Number(row['owner_id']);
        const deletedAt = asNullableDate(row['deleted_at']);
        let isActive = asBoolean(row['is_active'], false);
        if (isActive && deletedAt === null) {
          const ownerKey = `${ownerType}:${ownerId}`;
          if (activeOwnersSeen.has(ownerKey)) {
            isActive = false;
            deduplicatedActiveComptes += 1;
          } else {
            activeOwnersSeen.add(ownerKey);
          }
        }

        const rawBanqueId =
          row['banque_id'] !== null && row['banque_id'] !== undefined
            ? Number(row['banque_id'])
            : null;
        const banqueId = rawBanqueId && validBanqueIds.has(rawBanqueId) ? rawBanqueId : null;
        if (rawBanqueId && !banqueId) {
          nullifiedCompteBanqueCount += 1;
        }

        compteRows.push([
          Number(row['id']),
          ownerType,
          ownerId,
          banqueId,
          asNullableString(row['banque_nom_custom']),
          String(row['rib'] ?? '').replace(/[^0-9A-Za-z]/g, ''),
          asNullableString(row['titulaire_nom']),
          isActive,
          deletedAt,
          asNullableDate(row['created_at']) ?? new Date(),
          asNullableDate(row['updated_at']),
        ]);
      }

      const summary = {
        dryRun,
        sourceCounts: {
          banques: banquesRaw.length,
          banqueCodes: banqueCodesRaw.length,
          businesses: businessesRaw.length,
          comptesBancaires: comptesRaw.length,
        },
        preparedCounts: {
          banques: banqueRows.length,
          banqueCodes: banqueCodeRows.length,
          businesses: businessRows.length,
          comptesBancaires: compteRows.length,
        },
        anomalies: {
          skippedOrphanBusinessUsers,
          nullifiedVilleCount,
          nullifiedReturnVilleCount,
          nullifiedAgencyCount,
          nullifiedCompteBanqueCount,
          deduplicatedActiveComptes,
        },
      };

      if (dryRun) {
        console.log(
          '[ETL Sprint 03] Mode --dry-run (aucune écriture PG) :',
          JSON.stringify(summary, null, 2),
        );
        return;
      }

      await pgClient.query('BEGIN');
      try {
        await upsertBatch(
          pgClient,
          'banques',
          ['id', 'name', 'swift_code', 'logo', 'status', 'deleted_at', 'created_at', 'updated_at'],
          banqueRows,
          ['id'],
        );
        await upsertBatch(
          pgClient,
          'banque_codes',
          ['id', 'bank_id', 'code', 'created_at', 'updated_at'],
          banqueCodeRows,
          ['id'],
        );
        await upsertBatch(
          pgClient,
          'businesses',
          [
            'id',
            'user_id',
            'name',
            'type',
            'logo',
            'adresse',
            'email',
            'ICE',
            'RC',
            'telephone',
            'ville_id',
            'agency_id',
            'is_active',
            'mode_paiement',
            'default_fragile',
            'default_openpackage',
            'default_essayage',
            'label_message',
            'auto_send_preparation',
            'return_type',
            'return_recipient',
            'return_phone',
            'return_ville_id',
            'return_address',
            'return_note',
            'deleted_at',
            'created_at',
            'updated_at',
          ],
          businessRows,
          ['id'],
        );
        await upsertBatch(
          pgClient,
          'comptes_bancaires',
          [
            'id',
            'owner_type',
            'owner_id',
            'banque_id',
            'banque_nom_custom',
            'rib',
            'titulaire_nom',
            'is_active',
            'deleted_at',
            'created_at',
            'updated_at',
          ],
          compteRows,
          ['id'],
        );

        await syncSequence(pgClient, 'banques');
        await syncSequence(pgClient, 'banque_codes');
        await syncSequence(pgClient, 'businesses');
        await syncSequence(pgClient, 'comptes_bancaires');

        await pgClient.query('COMMIT');
      } catch (err) {
        await pgClient.query('ROLLBACK');
        throw err;
      }

      const pgCountsRes = await pgClient.query<{
        banques: string;
        banque_codes: string;
        businesses: string;
        comptes_bancaires: string;
      }>(`
        SELECT
          (SELECT COUNT(*) FROM "banques") AS banques,
          (SELECT COUNT(*) FROM "banque_codes") AS banque_codes,
          (SELECT COUNT(*) FROM "businesses") AS businesses,
          (SELECT COUNT(*) FROM "comptes_bancaires") AS comptes_bancaires
      `);

      console.log(
        '[ETL Sprint 03] Migration réussie :',
        JSON.stringify({ ...summary, pgCounts: pgCountsRes.rows[0] }, null, 2),
      );
    } finally {
      pgClient.release();
    }
  } finally {
    await mysqlConn.end();
    await pgPool.end();
  }
}

main().catch((error) => {
  console.error('[ETL Sprint 03] Échec :', error);
  process.exit(1);
});
