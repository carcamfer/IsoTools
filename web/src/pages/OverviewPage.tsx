import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Lock, RefreshCw } from 'lucide-react';
import { api } from '@/api/client';
import type { AgentGroup, Bootstrap, ToolView } from '@/api/types';
import { PageHeader } from '@/components/PageHeader';
import {
  EmptyState,
  ErrorState,
  KindBadge,
  Loading,
  Metric,
  Panel,
  SeverityBadge,
  StatusDot,
  formatRelative,
} from '@/components/primitives';

/**
 * La portada del orquestador: que esta desplegado, si responde, y que ha pasado.
 *
 * Solo aparecen aqui las tools que EXISTEN de verdad (federadas y nativas). Las 109
 * planeadas viven en el catalogo; meterlas en la portada haria que una plataforma
 * con 16 tools corriendo pareciera una con 125 y la portada dejaria de responder a
 * su unica pregunta: esto esta sano?
 */
export function OverviewPage({
  agents,
  counts,
  platform,
}: {
  agents: AgentGroup[];
  counts: Bootstrap['counts'];
  platform: Bootstrap['platform'];
}) {
  const summary = useQuery({
    queryKey: ['summary', 24],
    queryFn: () => api.summary(24),
    refetchInterval: 30_000,
  });
  const recent = useQuery({
    queryKey: ['events', 'overview'],
    queryFn: () => api.events({ limit: 12 }),
    refetchInterval: 15_000,
  });

  const deployed = agents.flatMap((group) => group.tools).filter((t) => t.kind !== 'planned');
  const down = deployed.filter((t) => t.health?.state === 'down');
  const undeployed = deployed.filter((t) => t.health?.state === 'unknown');

  return (
    <>
      <PageHeader
        eyebrow="Plataforma"
        title="Resumen operativo"
        description={
          platform.domain
            ? `Dominio ${platform.domain} · ${counts.federated} federadas, ${counts.native} nativas, ${counts.planned} en catalogo`
            : `${counts.federated} federadas, ${counts.native} nativas, ${counts.planned} en catalogo`
        }
        actions={
          <button
            type="button"
            onClick={() => {
              void summary.refetch();
              void recent.refetch();
            }}
            className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1.5 text-2xs text-muted hover:bg-surface2 hover:text-text"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            Actualizar
          </button>
        }
      />

      <div className="space-y-4 p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Herramientas activas"
            value={`${deployed.length - down.length - undeployed.length}/${deployed.length}`}
            hint={down.length > 0 ? `${down.length} sin responder` : 'todas responden'}
            tone={down.length > 0 ? 'danger' : 'ok'}
          />
          <Metric
            label="Eventos (24 h)"
            value={summary.data ? summary.data.totals.events.toLocaleString('es-MX') : '—'}
            hint={
              summary.data?.totals.last_event_at
                ? `ultimo ${formatRelative(summary.data.totals.last_event_at)}`
                : 'sin actividad'
            }
          />
          <Metric
            label="Cadenas causales"
            value={summary.data ? summary.data.totals.chains.toLocaleString('es-MX') : '—'}
            hint="correlation_id distintos"
          />
          <Metric
            label="Criticos / altos"
            value={
              summary.data
                ? summary.data.bySeverity
                    .filter((s) => s.severity === 'critical' || s.severity === 'high')
                    .reduce((sum, s) => sum + s.events, 0)
                    .toLocaleString('es-MX')
                : '—'
            }
            tone="warn"
            hint="requieren atencion"
          />
        </div>

        {down.length > 0 && (
          <ErrorState
            title={`${down.length} herramienta(s) desplegada(s) no responden`}
            detail={down.map((t) => `${t.id}: ${t.health?.detail ?? 'sin detalle'}`).join(' · ')}
          />
        )}

        <Panel
          title="Herramientas desplegadas"
          subtitle="Federadas abren su subdominio; nativas corren dentro del core"
        >
          {deployed.length === 0 ? (
            <EmptyState title="Ninguna herramienta registrada todavia" />
          ) : (
            <ul className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-3">
              {deployed.map((tool) => (
                <li key={tool.id} className="bg-surface">
                  <ToolTile tool={tool} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
          <Panel title="Actividad reciente" subtitle="Ultimos eventos publicados en la plataforma">
            {recent.isPending ? (
              <Loading />
            ) : recent.isError ? (
              <div className="p-4">
                <ErrorState
                  title="No se pudo leer el flujo de eventos"
                  detail={recent.error instanceof Error ? recent.error.message : undefined}
                />
              </div>
            ) : recent.data.events.length === 0 ? (
              <EmptyState
                title="Sin eventos todavia"
                detail="Publica uno con POST /api/v1/events o corre `npm run sim:iso`"
              />
            ) : (
              <ul className="divide-y divide-border">
                {recent.data.events.map((event) => (
                  <li key={event.event_id} className="flex items-center gap-3 px-4 py-2">
                    <SeverityBadge severity={event.severity} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-2xs text-text">{event.event_type}</p>
                      <p className="truncate text-2xs text-faint">{event.module_id}</p>
                    </div>
                    <Link
                      to={`/eventos/cadena/${event.correlation_id}`}
                      className="shrink-0 font-mono text-2xs text-faint hover:text-brass"
                      title="Ver cadena causal"
                    >
                      {formatRelative(event.received_at)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Volumen por herramienta" subtitle="Ultimas 24 horas">
            {summary.isPending ? (
              <Loading />
            ) : summary.isError ? (
              <div className="p-4">
                <ErrorState
                  title="Sin agregados disponibles"
                  detail={summary.error instanceof Error ? summary.error.message : undefined}
                />
              </div>
            ) : summary.data.byTool.length === 0 ? (
              <EmptyState title="Sin actividad en la ventana" />
            ) : (
              <ul className="space-y-2 p-4">
                {summary.data.byTool.map((row) => {
                  const max = summary.data.byTool[0]?.events || 1;
                  return (
                    <li key={row.tool_id}>
                      <div className="flex items-baseline justify-between gap-2">
                        <Link
                          to={`/herramientas/${row.tool_id}`}
                          className="truncate font-mono text-2xs text-muted hover:text-brass"
                        >
                          {row.tool_id}
                        </Link>
                        <span className="shrink-0 font-mono text-2xs text-faint">{row.events}</span>
                      </div>
                      <div className="mt-1 h-1 rounded-full bg-surface2">
                        <div
                          className="h-1 rounded-full bg-brass"
                          style={{ width: `${Math.max(4, (row.events / max) * 100)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}

function ToolTile({ tool }: { tool: ToolView }) {
  const inner = (
    <>
      <div className="flex items-start gap-2">
        <StatusDot state={tool.health?.state ?? 'unknown'} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-text">{tool.name}</p>
          <p className="truncate font-mono text-2xs text-faint">{tool.id}</p>
        </div>
        <KindBadge kind={tool.kind} />
      </div>
      <p className="mt-2 line-clamp-2 text-2xs text-muted">
        {tool.summary ?? tool.description ?? 'Sin descripcion'}
      </p>
      <div className="mt-2 flex items-center gap-2 text-2xs text-faint">
        {tool.isoClause && <span className="font-mono">ISO {tool.isoClause}</span>}
        {tool.owner && <span className="truncate">· {tool.owner}</span>}
        {tool.health?.latencyMs != null && (
          <span className="ml-auto shrink-0 font-mono">{tool.health.latencyMs} ms</span>
        )}
      </div>
    </>
  );

  if (!tool.accessible) {
    return (
      <div
        className="h-full cursor-not-allowed p-4 opacity-60"
        title={`Requiere uno de: ${tool.requiredRoles.join(', ')}`}
      >
        <div className="mb-1 flex items-center gap-1 text-2xs text-faint">
          <Lock className="h-3 w-3" aria-hidden="true" />
          sin acceso
        </div>
        {inner}
      </div>
    );
  }

  if (tool.kind === 'federated' && tool.url) {
    return (
      <a href={tool.url} className="block h-full p-4 hover:bg-surface2" title={`Abrir ${tool.url}`}>
        <div className="mb-1 flex items-center gap-1 text-2xs text-brass">
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
          {new URL(tool.url).host}
        </div>
        {inner}
      </a>
    );
  }

  return (
    <Link to={`/herramientas/${tool.id}`} className="block h-full p-4 hover:bg-surface2">
      <div className="mb-1 text-2xs text-faint">
        {tool.kind === 'federated' ? 'registrada, sin desplegar' : 'en el core'}
      </div>
      {inner}
    </Link>
  );
}
