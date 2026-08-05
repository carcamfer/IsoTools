import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState, ErrorState, Loading, Panel } from '@/components/primitives';

/**
 * El catalogo de eventos: por cada tipo, quien lo produce y quien lo consume.
 *
 * Es el acoplamiento real del sistema, y el unico que existe: las tools no se
 * importan ni se llaman entre si, se encuentran por tipo de evento. Un tipo con
 * productores y sin consumidores es dato que nadie usa; uno con consumidores y sin
 * productores es un consumidor esperando algo que jamas llegara. Ambos se marcan.
 */
export function CatalogPage() {
  const [q, setQ] = useState('');
  const catalog = useQuery({ queryKey: ['catalog'], queryFn: api.catalog });

  const needle = q.trim().toUpperCase();
  const entries = (catalog.data?.events ?? []).filter(
    (entry) =>
      !needle ||
      entry.type.includes(needle) ||
      entry.producers.some((p) => p.toUpperCase().includes(needle)) ||
      entry.consumers.some((c) => c.toUpperCase().includes(needle)),
  );

  const orphans = entries.filter((e) => e.producers.length === 0 || e.consumers.length === 0);

  return (
    <>
      <PageHeader
        eyebrow="Contrato"
        title="Catalogo de eventos"
        description="Como se acoplan las herramientas: por tipo de evento, nunca por codigo"
      />

      <div className="space-y-4 p-6">
        <input
          type="search"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Buscar por tipo de evento o herramienta"
          className="w-full rounded border border-border bg-surface px-3 py-1.5 font-mono text-2xs text-text placeholder:text-faint focus:border-brass/60 focus:outline-none"
        />

        {orphans.length > 0 && !needle && (
          <p className="rounded border border-warn/40 bg-warn/10 px-3 py-2 text-2xs text-warn">
            {orphans.length} tipo(s) con un solo extremo conectado: producidos y sin consumir, o
            declarados como consumo y sin nadie que los emita.
          </p>
        )}

        <Panel
          title={catalog.data ? `${entries.length} tipos de evento` : 'Tipos de evento'}
          subtitle="Derivado de `produces` y `consumes` en tools.json"
        >
          {catalog.isPending ? (
            <Loading />
          ) : catalog.isError ? (
            <div className="p-4">
              <ErrorState
                title="No se pudo leer el catalogo"
                detail={catalog.error instanceof Error ? catalog.error.message : undefined}
              />
            </div>
          ) : entries.length === 0 ? (
            <EmptyState title="Sin coincidencias" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[48rem] text-2xs">
                <thead className="bg-surface2 text-left text-faint">
                  <tr>
                    <th className="px-4 py-2 font-medium">Tipo de evento</th>
                    <th className="px-3 py-2 font-medium">Productores</th>
                    <th className="px-3 py-2 font-medium">Consumidores</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {entries.map((entry) => (
                    <tr key={entry.type} className="hover:bg-surface2/60">
                      <td className="px-4 py-2 font-mono text-text">{entry.type}</td>
                      <td className="px-3 py-2">
                        <ToolList ids={entry.producers} emptyLabel="nadie lo emite" />
                      </td>
                      <td className="px-3 py-2">
                        <ToolList ids={entry.consumers} emptyLabel="nadie lo consume" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

function ToolList({ ids, emptyLabel }: { ids: string[]; emptyLabel: string }) {
  if (ids.length === 0) return <span className="text-warn">{emptyLabel}</span>;
  return (
    <span className="flex flex-wrap gap-x-2 gap-y-0.5">
      {ids.map((id) => (
        <Link
          key={id}
          to={`/herramientas/${id}`}
          className="font-mono text-muted hover:text-brass"
        >
          {id}
        </Link>
      ))}
    </span>
  );
}
