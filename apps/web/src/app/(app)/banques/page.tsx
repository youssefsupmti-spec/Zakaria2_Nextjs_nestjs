'use client';

import { Icon } from '@iconify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import '@/components/ui/solar-icons';
import { apiFetch } from '@/lib/api-client';

interface BanqueItem {
  id: number;
  name: string;
  swiftCode: string | null;
  logo: string | null;
  status: 'active' | 'inactive';
  codes: string[];
  comptesCount: number;
}

interface BanquesResponse {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  items: BanqueItem[];
}

export default function BanquesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [editing, setEditing] = useState<BanqueItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [logo, setLogo] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [codesText, setCodesText] = useState('');

  const query = useQuery({
    queryKey: ['banques', search],
    queryFn: () => {
      const qs = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
      return apiFetch<BanquesResponse>(`/banques${qs}`);
    },
  });

  const openCreateModal = () => {
    setEditing(null);
    setName('');
    setSwiftCode('');
    setLogo('');
    setStatus('active');
    setCodesText('');
    setModalOpen(true);
  };

  const openEditModal = (b: BanqueItem) => {
    setEditing(b);
    setName(b.name);
    setSwiftCode(b.swiftCode ?? '');
    setLogo(b.logo ?? '');
    setStatus(b.status === 'inactive' ? 'inactive' : 'active');
    setCodesText(b.codes.join(', '));
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const parsedCodes = codesText
        .split(/[\s,;]+/)
        .map((c) => c.trim())
        .filter(Boolean);
      const body = {
        name: name.trim(),
        swiftCode: swiftCode.trim() || null,
        logo: logo.trim() || null,
        status,
        codes: parsedCodes,
      };
      if (editing) {
        return apiFetch(`/banques/${editing.id}`, { method: 'PATCH', body });
      }
      return apiFetch('/banques', { method: 'POST', body });
    },
    onSuccess: () => {
      setModalOpen(false);
      setFeedback({
        type: 'ok',
        text: editing ? 'Banque mise à jour.' : 'Banque créée avec ses codes RIB.',
      });
      void queryClient.invalidateQueries({ queryKey: ['banques'] });
    },
    onError: (err) => {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Erreur lors de la sauvegarde.',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/banques/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      setFeedback({ type: 'ok', text: 'Banque archivée avec succès.' });
      void queryClient.invalidateQueries({ queryKey: ['banques'] });
    },
    onError: (err) => {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Suppression impossible.',
      });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  const data = query.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Référentiel des banques &amp; préfixes RIB
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Attribution des codes RIB à 3 chiffres permettant la résolution automatique des
            virements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, SWIFT ou code 3 chiffres…"
            className="h-9 w-56 bg-white dark:bg-slate-900"
          />
          {data?.canCreate && (
            <Button onClick={openCreateModal} size="sm">
              + Nouvelle banque
            </Button>
          )}
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium ${
            feedback.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {query.isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          Chargement du référentiel bancaire…
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data?.items.map((bank) => (
            <div
              key={bank.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-primary dark:bg-sky-950/60">
                      <Icon icon="solar:banknote-2-bold-duotone" width={22} height={22} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {bank.name}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        SWIFT : {bank.swiftCode || '—'} · {bank.comptesCount} compte(s)
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      bank.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {bank.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Codes RIB (3 chiffres)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {bank.codes.length > 0 ? (
                      bank.codes.map((code) => (
                        <span
                          key={code}
                          className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          {code}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400">Aucun préfixe attribué</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                {data.canUpdate && (
                  <Button size="sm" variant="outline" onClick={() => openEditModal(bank)}>
                    Modifier
                  </Button>
                )}
                {data.canDelete && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(bank.id)}
                    className="border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/50"
                  >
                    Archiver
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          >
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {editing ? `Modifier ${editing.name}` : 'Nouvelle banque marocaine'}
            </h2>

            <div className="space-y-1.5">
              <Label htmlFor="bank-name">Nom de la banque *</Label>
              <Input
                id="bank-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Attijariwafa Bank"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="bank-swift">Code SWIFT / BIC</Label>
                <Input
                  id="bank-swift"
                  value={swiftCode}
                  onChange={(e) => setSwiftCode(e.target.value)}
                  placeholder="Ex: BCMAMAMC"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bank-status">Statut</Label>
                <select
                  id="bank-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value === 'inactive' ? 'inactive' : 'active')}
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bank-codes">Préfixes RIB à 3 chiffres (séparés par virgule)</Label>
              <Input
                id="bank-codes"
                value={codesText}
                onChange={(e) => setCodesText(e.target.value)}
                placeholder="Ex: 007, 011, 230"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bank-logo">Chemin logo (optionnel)</Label>
              <Input
                id="bank-logo"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder="banques/logo.png"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
