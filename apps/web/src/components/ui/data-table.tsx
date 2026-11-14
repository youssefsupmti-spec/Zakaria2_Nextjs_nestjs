'use client';

import { flexRender, type RowData, type SortingState } from '@tanstack/react-table';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useLegacyTable,
  type LegacyColumnDef,
} from '@tanstack/react-table/legacy';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  X,
} from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InlineOperationStatus, OPERATION_LABELS } from '@/components/ui/operation-feedback';
import { cn } from '@/lib/utils';

export type DataTableColumnDef<TData extends RowData, TValue = unknown> = LegacyColumnDef<
  TData,
  TValue
>;

export interface DataTableBulkAction<TData> {
  key: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'outline' | 'destructive' | 'accent' | 'ghost';
  disabled?: boolean;
  onClick: (selectedRows: TData[], clearSelection: () => void) => void | Promise<void>;
}

export interface DataTableProps<TData extends RowData> {
  data: TData[];
  columns: LegacyColumnDef<TData, unknown>[];
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  hideSearch?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  enableSelection?: boolean;
  getRowId?: (row: TData, index: number) => string;
  isRowSelectable?: (row: TData) => boolean;
  bulkActions?: DataTableBulkAction<TData>[];
  toolbarActions?: React.ReactNode;
  toolbarExtra?: React.ReactNode;
  onRowClick?: (row: TData) => void;
  className?: string;
}

export function DataTableColumnHeader({
  title,
  sorted,
  onToggleSort,
  className,
}: {
  title: string;
  sorted?: false | 'asc' | 'desc';
  onToggleSort?: () => void;
  className?: string;
}) {
  if (!onToggleSort) {
    return (
      <span
        className={cn(
          'text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200',
          className,
        )}
      >
        {title}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onToggleSort}
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 -ml-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700 transition-colors hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-700/70 dark:hover:text-white',
        sorted && 'text-[#0E86C2] dark:text-sky-300',
        className,
      )}
    >
      <span>{title}</span>
      {sorted === 'asc' ? (
        <ArrowUp className="size-3.5 text-[#1B9DD9]" />
      ) : sorted === 'desc' ? (
        <ArrowDown className="size-3.5 text-[#1B9DD9]" />
      ) : (
        <ArrowUpDown className="size-3 opacity-60" />
      )}
    </button>
  );
}

function defaultGetRowId<TData>(row: TData, index: number): string {
  if (row && typeof row === 'object' && 'id' in row) {
    const idVal = (row as { id?: unknown }).id;
    if (typeof idVal === 'string' || typeof idVal === 'number') {
      return String(idVal);
    }
  }
  return String(index);
}

export function DataTable<TData extends RowData>({
  data,
  columns,
  searchPlaceholder = 'Rechercher dans le tableau...',
  searchValue,
  onSearchChange,
  hideSearch = false,
  emptyMessage = 'Aucune donnée trouvée.',
  emptyDescription = 'Modifiez vos filtres ou ajoutez un nouvel élément.',
  initialPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  isLoading = false,
  isRefreshing = false,
  enableSelection,
  getRowId = defaultGetRowId,
  isRowSelectable,
  bulkActions = [],
  toolbarActions,
  toolbarExtra,
  onRowClick,
  className,
}: DataTableProps<TData>) {
  const selectionEnabled = enableSelection ?? bulkActions.length > 0;
  const [internalSearch, setInternalSearch] = React.useState('');
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pageSize, setPageSize] = React.useState(initialPageSize);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(() => new Set());

  const activeSearch = searchValue !== undefined ? searchValue : internalSearch;
  const setActiveSearch = React.useCallback(
    (next: string) => {
      setPageIndex(0);
      if (onSearchChange) {
        onSearchChange(next);
      } else {
        setInternalSearch(next);
      }
    },
    [onSearchChange],
  );

  // Construire la map id -> row sur les données courantes et purger les IDs obsolètes
  const rowEntries = React.useMemo(
    () =>
      data.map((row, idx) => ({
        id: getRowId(row, idx),
        row,
        selectable: isRowSelectable ? isRowSelectable(row) : true,
      })),
    [data, getRowId, isRowSelectable],
  );

  React.useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const validIds = new Set(rowEntries.filter((e) => e.selectable).map((e) => e.id));
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (validIds.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [rowEntries]);

  const idByRowRef = React.useMemo(() => {
    const map = new Map<TData, { id: string; selectable: boolean }>();
    for (const entry of rowEntries) {
      map.set(entry.row, { id: entry.id, selectable: entry.selectable });
    }
    return map;
  }, [rowEntries]);

  const selectedRows = React.useMemo(
    () => rowEntries.filter((entry) => selectedIds.has(entry.id)).map((entry) => entry.row),
    [rowEntries, selectedIds],
  );

  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const table = useLegacyTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter: searchValue !== undefined ? '' : activeSearch,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater({ pageIndex, pageSize }) : updater;
      setPageIndex(next.pageIndex);
      setPageSize(next.pageSize);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const pageRows = table.getRowModel().rows;
  const filteredTotal = table.getFilteredRowModel().rows.length;
  const pageCount = Math.max(1, table.getPageCount());

  // Garde la pageIndex dans les bornes après filtrage
  React.useEffect(() => {
    if (pageIndex >= pageCount) {
      setPageIndex(Math.max(0, pageCount - 1));
    }
  }, [pageIndex, pageCount]);

  const selectablePageEntries = React.useMemo(
    () =>
      pageRows
        .map(
          (row, idx) =>
            idByRowRef.get(row.original) ?? { id: getRowId(row.original, idx), selectable: true },
        )
        .filter((item) => item.selectable),
    [pageRows, idByRowRef, getRowId],
  );

  const allPageSelected =
    selectablePageEntries.length > 0 &&
    selectablePageEntries.every((item) => selectedIds.has(item.id));
  const somePageSelected =
    selectablePageEntries.some((item) => selectedIds.has(item.id)) && !allPageSelected;

  const headerCheckboxRef = React.useRef<HTMLInputElement | null>(null);
  React.useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = somePageSelected;
    }
  }, [somePageSelected]);

  const toggleAllOnPage = React.useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        for (const item of selectablePageEntries) {
          next.delete(item.id);
        }
      } else {
        for (const item of selectablePageEntries) {
          next.add(item.id);
        }
      }
      return next;
    });
  }, [allPageSelected, selectablePageEntries]);

  const toggleRow = React.useCallback((rowId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }, []);

  const showToolbar =
    !hideSearch || Boolean(toolbarActions) || Boolean(toolbarExtra) || isRefreshing;
  const fromItem = filteredTotal === 0 ? 0 : pageIndex * pageSize + 1;
  const toItem = Math.min(filteredTotal, (pageIndex + 1) * pageSize);

  return (
    <div
      data-slot="data-table-card"
      className={cn(
        'overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
    >
      {/* Barre supérieure unifiée dans la même card (juste au-dessus des colonnes) */}
      {showToolbar && (
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-1 flex-wrap items-center gap-2.5">
            {!hideSearch && (
              <div className="relative w-full sm:max-w-sm">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="search"
                  value={activeSearch}
                  onChange={(e) => setActiveSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  className="pl-9 pr-8"
                />
                {activeSearch.length > 0 && (
                  <button
                    type="button"
                    aria-label="Effacer la recherche"
                    onClick={() => setActiveSearch('')}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            )}
            {toolbarExtra}
            {isRefreshing && !isLoading && <InlineOperationStatus operation="refreshing" />}
          </div>

          {toolbarActions && (
            <div className="flex flex-wrap items-center gap-2">{toolbarActions}</div>
          )}
        </div>
      )}

      {/* Bandeau d'actions groupées (lorsque >= 1 ligne est cochée) */}
      {selectionEnabled && selectedRows.length > 0 && (
        <div
          role="region"
          aria-label="Actions groupées sur la sélection"
          className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1B9DD9]/25 bg-[#1B9DD9]/8 px-4 py-2.5 dark:border-sky-800/70 dark:bg-sky-950/50"
        >
          <div className="flex items-center gap-2.5">
            <span className="tabular-nums rounded-md bg-[#1B9DD9] px-2 py-0.5 text-xs font-bold text-white">
              {selectedRows.length}
            </span>
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
              élément{selectedRows.length > 1 ? 's' : ''} sélectionné
              {selectedRows.length > 1 ? 's' : ''}
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs font-semibold text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline dark:text-slate-300 dark:hover:text-white cursor-pointer"
            >
              Tout désélectionner
            </button>
          </div>

          {bulkActions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {bulkActions.map((action) => (
                <Button
                  key={action.key}
                  type="button"
                  size="sm"
                  variant={action.variant ?? 'outline'}
                  disabled={action.disabled}
                  onClick={() => action.onClick(selectedRows, clearSelection)}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tableau principal */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-slate-200 bg-slate-100/90 dark:border-slate-800 dark:bg-slate-800/80"
              >
                {selectionEnabled && (
                  <th className="w-10 px-3 py-2.5 text-center">
                    <input
                      ref={headerCheckboxRef}
                      type="checkbox"
                      aria-label="Tout sélectionner sur cette page"
                      checked={allPageSelected}
                      disabled={selectablePageEntries.length === 0 || isLoading}
                      onChange={toggleAllOnPage}
                      className="size-4 cursor-pointer rounded border-slate-300 accent-[#1B9DD9] disabled:cursor-not-allowed disabled:opacity-40"
                    />
                  </th>
                )}
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      className="px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200"
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            'inline-flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 -ml-1 transition-colors hover:bg-slate-200/80 hover:text-slate-950 dark:hover:bg-slate-700/80 dark:hover:text-white',
                            sorted && 'text-[#0E86C2] dark:text-sky-300',
                          )}
                        >
                          <span>
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          {sorted === 'asc' ? (
                            <ArrowUp className="size-3.5 text-[#1B9DD9]" />
                          ) : sorted === 'desc' ? (
                            <ArrowDown className="size-3.5 text-[#1B9DD9]" />
                          ) : (
                            <ArrowUpDown className="size-3 opacity-55" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, rowIdx) => (
                <tr key={`skeleton-${rowIdx}`} className="animate-pulse">
                  {selectionEnabled && (
                    <td className="px-3 py-3 text-center">
                      <div className="mx-auto size-4 rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                  )}
                  {columns.map((_, colIdx) => (
                    <td key={`skeleton-${rowIdx}-${colIdx}`} className="px-3.5 py-3">
                      <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                  ))}
                </tr>
              ))
            ) : pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectionEnabled ? 1 : 0)}
                  className="px-4 py-10 text-center"
                >
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {emptyMessage}
                  </p>
                  {emptyDescription && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {emptyDescription}
                    </p>
                  )}
                </td>
              </tr>
            ) : (
              pageRows.map((row, rowIdx) => {
                const entry = idByRowRef.get(row.original) ?? {
                  id: getRowId(row.original, rowIdx),
                  selectable: true,
                };
                const isSelected = selectedIds.has(entry.id);

                return (
                  <tr
                    key={row.id}
                    data-state={isSelected ? 'selected' : undefined}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                    className={cn(
                      'transition-colors hover:bg-slate-50/90 dark:hover:bg-slate-800/40',
                      isSelected && 'bg-[#1B9DD9]/6 dark:bg-sky-950/35',
                      onRowClick && 'cursor-pointer',
                    )}
                  >
                    {selectionEnabled && (
                      <td
                        className="w-10 px-3 py-2.5 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          aria-label={`Sélectionner la ligne ${entry.id}`}
                          checked={isSelected}
                          disabled={!entry.selectable}
                          onChange={() => toggleRow(entry.id)}
                          className="size-4 cursor-pointer rounded border-slate-300 accent-[#1B9DD9] disabled:cursor-not-allowed disabled:opacity-35"
                        />
                      </td>
                    )}
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-3.5 py-2.5 align-middle text-slate-700 dark:text-slate-200"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pied de card : Pagination + sélecteur de taille de page */}
      <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/60 px-4 py-2.5 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
        <div className="flex flex-wrap items-center gap-3">
          {isLoading ? (
            <span className="font-semibold text-sky-700 dark:text-sky-300">
              {OPERATION_LABELS.loading}
            </span>
          ) : (
            <span className="tabular-nums font-medium">
              {filteredTotal === 0
                ? '0 résultat'
                : `Affichage ${fromItem} à ${toItem} sur ${filteredTotal} résultat${filteredTotal > 1 ? 's' : ''}`}
            </span>
          )}

          <label className="inline-flex items-center gap-1.5">
            <span>Lignes :</span>
            <select
              aria-label="Nombre de lignes par page"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPageIndex(0);
              }}
              className="h-7 rounded border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <span className="mr-2 tabular-nums font-semibold text-slate-700 dark:text-slate-300">
            Page {pageIndex + 1} / {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7"
            disabled={!table.getCanPreviousPage() || isLoading}
            onClick={() => table.setPageIndex(0)}
            aria-label="Première page"
          >
            <ChevronsLeft className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7"
            disabled={!table.getCanPreviousPage() || isLoading}
            onClick={() => table.previousPage()}
            aria-label="Page précédente"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7"
            disabled={!table.getCanNextPage() || isLoading}
            onClick={() => table.nextPage()}
            aria-label="Page suivante"
          >
            <ChevronRight className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-7"
            disabled={!table.getCanNextPage() || isLoading}
            onClick={() => table.setPageIndex(pageCount - 1)}
            aria-label="Dernière page"
          >
            <ChevronsRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
