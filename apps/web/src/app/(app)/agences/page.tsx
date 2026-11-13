'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LegacyColumnDef } from '@tanstack/react-table/legacy';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from '@/lib/client-rbac';

interface ZoneRow {
  id: number;
  nom: string;
  code: string;
  actif: boolean;
}

interface AgenceRow {
  id: number;
  nom: string;
  code: string;
  telephone: string | null;
  actif: boolean;
  ville?: { id: number; nameFr: string } | null;
  agenceZones?: Array<{
    zoneId: number;
    livraison: boolean;
    ramassage: boolean;
    zone: { id: number; nom: string; code: string };
  }>;
  _count?: { membres: number; agencePartenaires: number };
}

export default function AgencesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isPlatformAdmin = Boolean(user.accessContext?.isPlatformAdmin || user.isSuperAdmin);

  const [agenceForm, setAgenceForm] = useState({ nom: '', code: '', telephone: '' });
  const [zoneForm, setZoneForm] = useState({ nom: '', code: '' });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const agencesQuery = useQuery({
    queryKey: ['agences'],
    queryFn: () => apiFetch<AgenceRow[]>('/agences'),
  });

  const zonesQuery = useQuery({
    queryKey: ['zones'],
    queryFn: () => apiFetch<ZoneRow[]>('/agences/zones'),
  });

  const createAgenceMutation = useMutation({
    mutationFn: () => apiFetch('/agences', { method: 'POST', body: agenceForm }),
    onSuccess: () => {
      setAgenceForm({ nom: '', code: '', telephone: '' });
      setErrorMsg(null);
      void queryClient.invalidateQueries({ queryKey: ['agences'] });
    },
    onError: (err) => setErrorMsg(err instanceof Error ? err.message : 'Erreur création agence'),
  });

  const createZoneMutation = useMutation({
    mutationFn: () => apiFetch('/agences/zones', { method: 'POST', body: zoneForm }),
    onSuccess: () => {
      setZoneForm({ nom: '', code: '' });
      setErrorMsg(null);
      void queryClient.invalidateQueries({ queryKey: ['zones'] });
    },
    onError: (err) => setErrorMsg(err instanceof Error ? err.message : 'Erreur création zone'),
  });

  const agenceColumns: LegacyColumnDef<AgenceRow, unknown>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <span className="rounded-md bg-sky-50 px-2.5 py-1 font-mono text-xs font-bold text-sky-700">
          {row.original.code}
        </span>
      ),
    },
    { accessorKey: 'nom', header: 'Nom de l’agence' },
    {
      id: 'ville',
      header: 'Ville',
      cell: ({ row }) => row.original.ville?.nameFr ?? '—',
    },
    {
      id: 'zones',
      header: 'Zones couvertes',
      cell: ({ row }) => row.original.agenceZones?.length ?? 0,
    },
    {
      id: 'membres',
      header: 'Membres',
      cell: ({ row }) => row.original._count?.membres ?? 0,
    },
    {
      accessorKey: 'actif',
      header: 'Statut',
      cell: ({ row }) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            row.original.actif ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {row.original.actif ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const handleCreateAgence = (e: FormEvent) => {
    e.preventDefault();
    createAgenceMutation.mutate();
  };

  const handleCreateZone = (e: FormEvent) => {
    e.preventDefault();
    createZoneMutation.mutate();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Agences &amp; Périmètres Zones</h1>
        <p className="mt-1 text-sm text-slate-600">
          Gestion multi-agence, zones livraison/ramassage et rattachement des équipes locales.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorMsg}
        </div>
      )}

      {isPlatformAdmin && (
        <div className="grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={handleCreateAgence}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
          >
            <h2 className="text-base font-bold text-slate-900">Nouvelle Agence</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="agence-code">Code</Label>
                <Input
                  id="agence-code"
                  value={agenceForm.code}
                  onChange={(e) => setAgenceForm((s) => ({ ...s, code: e.target.value }))}
                  placeholder="CASA"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="agence-nom">Nom</Label>
                <Input
                  id="agence-nom"
                  value={agenceForm.nom}
                  onChange={(e) => setAgenceForm((s) => ({ ...s, nom: e.target.value }))}
                  placeholder="Agence Casablanca Nord"
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={createAgenceMutation.isPending}>
              {createAgenceMutation.isPending ? 'Création…' : 'Créer l’agence'}
            </Button>
          </form>

          <form
            onSubmit={handleCreateZone}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
          >
            <h2 className="text-base font-bold text-slate-900">Nouvelle Zone Territoriale</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="zone-code">Code</Label>
                <Input
                  id="zone-code"
                  value={zoneForm.code}
                  onChange={(e) => setZoneForm((s) => ({ ...s, code: e.target.value }))}
                  placeholder="RB-CENTRE"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="zone-nom">Nom de la zone</Label>
                <Input
                  id="zone-nom"
                  value={zoneForm.nom}
                  onChange={(e) => setZoneForm((s) => ({ ...s, nom: e.target.value }))}
                  placeholder="Rabat Centre & Agdal"
                  required
                />
              </div>
            </div>
            <Button type="submit" variant="outline" disabled={createZoneMutation.isPending}>
              {createZoneMutation.isPending ? 'Création…' : 'Ajouter la zone'}
            </Button>
          </form>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">Agences configurées</h2>
        <DataTable
          data={agencesQuery.data ?? []}
          columns={agenceColumns}
          searchPlaceholder="Rechercher une agence par code ou nom…"
          emptyMessage={agencesQuery.isLoading ? 'Chargement…' : 'Aucune agence accessible.'}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">
          Référentiel des Zones ({zonesQuery.data?.length ?? 0})
        </h2>
        <div className="flex flex-wrap gap-2">
          {(zonesQuery.data ?? []).map((zone) => (
            <span
              key={zone.id}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              <strong className="font-mono text-sky-700">{zone.code}</strong> · {zone.nom}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
