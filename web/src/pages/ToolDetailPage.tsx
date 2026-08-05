import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { api } from '@/api/client';
import { PageHeader } from '@/components/PageHeader';
import {
  EmptyState,
  ErrorState,
  KindBadge,
  Loading,
  Panel,
  SeverityBadge,
  StatusDot,
  formatRelative,
  formatTime,
} from '@/components/primitives';

/**
 * Ficha de una tool: su contrato, donde corre y que ha publicado.
 *
 * Responde la pregunta operativa de verdad, que no es "existe" sino "esta viva y
 * publicando lo que declara publicar". Por eso se contrastan los tipos DECLARADOS
 * en el catalogo contra los OBSERVADOS en los eventos.
 */
export function ToolDetailPage() {
  const { toolId } = useParams<{ toolId: string }>();
  const detail = useQuery({
    queryKey: ['tool', toolId],
    queryFn: () => api.tool(toolId!),
    enabled: Boolean(toolId),
    refetchInterval: 30_000,
  });

  if (detail.isPending) return <Loading label="Cargando herramienta" />;

  if (detail.isError) {
    return (
      <div className="p-6">
        <ErrorState
          title={`No se pudo cargar '${toolId}'`}
          detail={detail.error instanceof Error ? detail.error.message : undefined}
        />
      </div>
    );
  }

  const { tool, recentEvents } = detail.data;
  const observed = new Set(recentEvents.map((event) => event.event_type));

  return (
    <>
      <PageHeader
        eyebrow={tool.agentLabel ?? 'Herramienta'}
        title={tool.name}
        description={tool.description ?? undefined}
        actions={
          tool.url && tool.accessible ? (
            <a
              href={tool.url}
              className="inline-flex shrink-0 items-center gap-1.5 rounded bg-brass px-3 py-1.5 text-2xs font-medium text-bg hover:opacity-90"
            >
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
              Abrir herramienta
            </a>
          ) : undefined
        }
      />

      <div className="space-y-4 p-6">
        <div className="grid gap-4 lg:grid-cols-[2fr_3fr]">
          <Panel title="Despliegue">
            <dl className="divide-y divide-border text-2xs">
              <Row label="Identificador">
                <span className="font-mono text-text">{tool.id}</span>
              </Row>
              <Row label="Modo">
                <KindBadge kind={tool.kind} />
              </Row>
              <Row label="Estado">
                <StatusDot state={tool.health?.state ?? 'unknown'} showLabel />
                {tool.health?.latencyMs != null && (
                  <span className="ml-2 font-mono text-faint">{tool.health.latencyMs} ms</span>
                )}
              </Row>
              <Row label="URL">
                {tool.url ? (
                  <a href={tool.url} className="font-mono text-brass hover:underline">
                    {tool.url}
                  </a>
                ) : (
                  <span className="text-faint">
                    {tool.kind === 'native' ? 'corre dentro del core' : 'sin desplegar'}
                  </span>
                )}
              </Row>
              <Row label="Responsable">
                <span className="text-muted">{tool.owner ?? '—'}</span>
              </Row>
              <Row label="Clausula ISO">
                <span className="font-mono text-muted">{tool.isoClause ?? '—'}</span>
              </Row>
              <Row label="Roles requeridos">
                <span className="font-mono text-muted">
                  {tool.requiredRoles.length ? tool.requiredRoles.join(', ') : 'abierta'}
                </span>
              </Row>
            </dl>
          </Panel>

          <Panel
            title="Contrato de eventos"
            subtitle="Lo declarado en el catalogo, contrastado con lo observado"
          >
            <div className="grid gap-px bg-border sm:grid-cols-2">
              <div className="bg-surface p-4">
                <p className="mb-2 text-2xs uppercase tracking-wide text-faint">Produce</p>
                {tool.produces.length === 0 ? (
                  <p className="text-2xs text-faint">nada declarado</p>
                ) : (
                  <ul className="space-y-1">
                    {tool.produces.map((type) => (
                      <li key={type} className="flex items-center gap-2">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${observed.has(type) ? 'bg-ok' : 'bg-faint'}`}
                          aria-hidden="true"
                        />
                        <span className="font-mono text-2xs text-muted">{type}</span>
                        {!observed.has(type) && (
                          <span className="text-2xs text-faint">sin registros recientes</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="bg-surface p-4">
                <p className="mb-2 text-2xs uppercase tracking-wide text-faint">Consume</p>
                {tool.consumes.length === 0 ? (
                  <p className="text-2xs text-faint">nada declarado</p>
                ) : (
                  <ul className="space-y-1">
                    {tool.consumes.map((type) => (
                      <li key={type} className="font-mono text-2xs text-muted">
                        {type}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Panel>
        </div>

        <Panel
          title="Eventos publicados"
          subtitle="Los ultimos 25 registros con este module_id"
        >
          {recentEvents.length === 0 ? (
            <EmptyState
              title="Esta herramienta no ha publicado nada"
              detail="Para una tool desplegada, es un hallazgo de auditoria"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[42rem] text-2xs">
                <thead className="bg-surface2 text-left text-faint">
                  <tr>
                    <th className="px-4 py-2 font-medium">Tipo</th>
                    <th className="px-3 py-2 font-medium">Severidad</th>
                    <th className="px-3 py-2 font-medium">Activo</th>
                    <th className="px-3 py-2 font-medium">Recibido</th>
                    <th className="px-3 py-2 font-medium">Cadena</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentEvents.map((event) => (
                    <tr key={event.event_id} className="hover:bg-surface2/60">
                      <td className="px-4 py-2 font-mono text-text">{event.event_type}</td>
                      <td className="px-3 py-2">
                        <SeverityBadge severity={event.severity} />
                      </td>
                      <td className="px-3 py-2 font-mono text-muted">{event.asset_id ?? '—'}</td>
                      <td
                        className="px-3 py-2 text-muted"
                        title={formatTime(event.received_at)}
                      >
                        {formatRelative(event.received_at)}
                      </td>
                      <td className="px-3 py-2">
                        <Link
                          to={`/eventos/cadena/${event.correlation_id}`}
                          className="font-mono text-brass hover:underline"
                        >
                          ver
                        </Link>
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

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <dt className="w-32 shrink-0 text-faint">{label}</dt>
      <dd className="min-w-0 flex-1 break-words">{children}</dd>
    </div>
  );
}
