/**
 * Libellés stricts en 2 mots pour les états de chargement et d'opération.
 */
export const OPERATION_LABELS = {
  loading: 'Chargement...',
  refreshing: 'Actualisation...',
  saving: 'Enregistrement...',
  updating: 'Mise à jour...',
  deleting: 'Suppression...',
  exporting: 'Exportation...',
} as const;

export type OperationLabelKey = keyof typeof OPERATION_LABELS;

export interface OperationMessage {
  type: 'ok' | 'err';
  text: string;
}

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const raw = String(value).replace(/\r?\n/g, ' ');
  return `"${raw.replaceAll('"', '""')}"`;
}

export function buildCsvContent(
  headers: string[],
  rows: Array<Array<string | number | boolean | null | undefined>>,
): string {
  const headerLine = headers.map((h) => escapeCsvCell(h)).join(';');
  const bodyLines = rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(';'));
  return `\uFEFF${[headerLine, ...bodyLines].join('\n')}`;
}

export function exportRowsToCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | boolean | null | undefined>>,
): void {
  if (typeof window === 'undefined') return;
  const csv = buildCsvContent(headers, rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
