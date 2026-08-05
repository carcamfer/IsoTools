import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Lock } from 'lucide-react';
import { api } from '@/api/client';
import type { ToolKind } from '@/api/types';
import { agentIcon } from '@/components/agent-icons';
import { PageHeader } from '@/components/PageHeader';
import {
  EmptyState,
  ErrorState,
  KindBadge,
  Loading,
  Panel,
  StatusDot,
} from '@/components/primitives';

const FILTERS: { value: ToolKind | 'all'; label: string; hint: string }[] = [
  { value: 'all', label: 'Todas', hint: 'el catalogo completo' },
  { value: 'federated', label: 'Federadas', hint: 'servicio propio, subdominio propio' },
  { value: 'native', label: 'Nativas', hint: 'corren dentro del core' },
  { value: 'planned', label: 'Planeadas', hint: 'en el contrato, sin despliegue' },
];

/** El catalogo completo: las 125 tools, con su estado real de despliegue. */
export function ToolsPage() {
  const [kind, setKind] = useState<ToolKind | 'all'>('all');
  const [q, setQ] = useState('');

  const tools = useQuery({
    queryKey: ['tools', kind, q],
    queryFn: () => api.tools({ ...(kind !== 'all' && { kind }), ...(q && { q }) }),
  });

  return (
    <>
      <PageHeader
        eyebrow="Catalogo"
        title="Herramientas"
        description="Todo lo que la plataforma declara, y donde corre cada cosa"
      />

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded border border-border">
            {FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                title={filter.hint}
                onClick={() => setKind(filter.value)}
                className={`px-3 py-1.5 text-2xs transition-colors first:rounded-l last:rounded-r ${
                  kind === filter.value
                    ? 'bg-surface2 text-text'
                    : 'text-muted hover:bg-surface2 hover:text-text'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Buscar por nombre, id o descripcion"
            className="min-w-0 flex-1 rounded border border-border bg-surface px-3 py-1.5 text-2xs text-text placeholder:text-faint focus:border-brass/60 focus:outline-none"
          />
        </div>

        <Panel
          title={tools.data ? `${tools.data.count} herramientas` : 'Herramientas'}
          subtitle="Una fila por tool; el punto es el resultado de la sonda de salud del servidor"
        >
          {tools.isPending ? (
            <Loading />
          ) : tools.isError ? (
            <div className="p-4">
              <ErrorState
                title="No se pudo leer el catalogo"
                detail={tools.error instanceof Error ? tools.error.message : undefined}
              />
            </div>
          ) : tools.data.tools.length === 0 ? (
            <EmptyState title="Sin coincidencias" detail="Prueba con otro filtro o termino" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[52rem] text-2xs">
                <thead className="bg-surface2 text-left text-faint">
                  <tr>
                    <th className="px-4 py-2 font-medium">Herramienta</th>
                    <th className="px-3 py-2 font-medium">Agente</th>
                    <th className="px-3 py-2 font-medium">Tipo</th>
                    <th className="px-3 py-2 font-medium">ISO</th>
                    <th className="px-3 py-2 font-medium">Produce</th>
                    <th className="px-3 py-2 font-medium">Consume</th>
                    <th className="px-3 py-2 font-medium">Destino</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tools.data.tools.map((tool) => {
                    const AgentIcon = agentIcon(tool.agentId);
                    return (
                    <tr key={tool.id} className="hover:bg-surface2/60">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <StatusDot state={tool.health?.state ?? 'unknown'} />
                          <div className="min-w-0">
                            <Link
                              to={`/herramientas/${tool.id}`}
                              className="block truncate text-text hover:text-brass"
                            >
                              {tool.name}
                            </Link>
                            <span className="block truncate font-mono text-faint">{tool.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-muted">
                        {tool.agentLabel ? (
                          <span className="inline-flex items-center gap-1.5">
                            <AgentIcon className="h-3 w-3 shrink-0 text-faint" aria-hidden="true" />
                            {tool.agentLabel}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <KindBadge kind={tool.kind} />
                      </td>
                      <td className="px-3 py-2 font-mono text-muted">{tool.isoClause ?? '—'}</td>
                      <td className="px-3 py-2 font-mono text-faint">
                        {tool.produces.join(', ') || '—'}
                      </td>
                      <td className="px-3 py-2 font-mono text-faint">
                        {tool.consumes.join(', ') || '—'}
                      </td>
                      <td className="px-3 py-2">
                        {!tool.accessible ? (
                          <span
                            className="inline-flex items-center gap-1 text-faint"
                            title={`Requiere uno de: ${tool.requiredRoles.join(', ')}`}
                          >
                            <Lock className="h-3 w-3" aria-hidden="true" />
                            sin acceso
                          </span>
                        ) : tool.url ? (
                          <a
                            href={tool.url}
                            className="inline-flex items-center gap-1 text-brass hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                            {new URL(tool.url).host}
                          </a>
                        ) : (
                          <span className="text-faint">
                            {tool.kind === 'native' ? 'en el core' : 'sin desplegar'}
                          </span>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
