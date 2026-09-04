import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Pause, Play } from 'lucide-react';
import { api } from '@/api/client';
import { PageHeader } from '@/components/PageHeader';
import {
  EmptyState,
  ErrorState,
  Loading,
  Panel,
  SeverityBadge,
  formatRelative,
  formatTime,
} from '@/components/primitives';

/**
 * Flujo de eventos de toda la plataforma.
 *
 * Es poll, no push: la plataforma no expone websockets ni webhooks, y el dashboard
 * no iba a ser la excepcion que obligara a mantener una segunda forma de entregar
 * eventos. El boton de pausa existe porque leer una tabla que se mueve sola
 * mientras investigas algo es imposible.
 */
export function EventsPage() {
  const [live, setLive] = useState(true);
  const [severity, setSeverity] = useState('');
  const [type, setType] = useState('');

  const events = useQuery({
    queryKey: ['events', 'feed', severity, type],
    queryFn: () =>
      api.events({ limit: 100, ...(severity && { severity }), ...(type && { type }) }),
    refetchInterval: live ? 5_000 : false,
  });

  return (
    <>
      <PageHeader
        eyebrow="Plataforma"
        title="Eventos"
        description="Todo lo publicado en el core, de la mas reciente hacia atras"
        actions={
          <button
            type="button"
            onClick={() => setLive((value) => !value)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded border border-border px-2.5 py-1.5 text-2xs text-muted hover:bg-surface2 hover:text-text"
          >
            {live ? (
              <>
                <Pause className="h-3 w-3" aria-hidden="true" />
                Pausar
              </>
            ) : (
              <>
                <Play className="h-3 w-3" aria-hidden="true" />
                Reanudar
              </>
            )}
          </button>
        }
      />

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            value={type}
            onChange={(event) => setType(event.target.value)}
            placeholder="Filtrar por tipo de evento (p. ej. DEFECT_FOUND)"
            className="min-w-0 flex-1 rounded border border-border bg-surface px-3 py-1.5 font-mono text-2xs text-text placeholder:text-faint focus:border-brass/60 focus:outline-none"
          />
          <select
            value={severity}
            onChange={(event) => setSeverity(event.target.value)}
            className="rounded border border-border bg-surface px-3 py-1.5 text-2xs text-text focus:border-brass/60 focus:outline-none"
          >
            <option value="">Toda severidad</option>
            <option value="critical">critical</option>
            <option value="high">high</option>
            <option value="medium">medium</option>
            <option value="low">low</option>
          </select>
        </div>

        <Panel
          title={events.data ? `${events.data.count} eventos` : 'Eventos'}
          subtitle={live ? 'actualizando cada 5 s' : 'pausado'}
        >
          {events.isPending ? (
            <Loading />
          ) : events.isError ? (
            <div className="p-4">
              <ErrorState
                title="No se pudo leer el flujo"
                detail={events.error instanceof Error ? events.error.message : undefined}
              />
            </div>
          ) : events.data.events.length === 0 ? (
            <EmptyState
              title="Sin eventos que coincidan"
              detail="Limpia los filtros o publica uno con POST /api/v1/events"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[56rem] text-2xs">
                <thead className="bg-surface2 text-left text-faint">
                  <tr>
                    <th className="px-4 py-2 font-medium">Recibido</th>
                    <th className="px-3 py-2 font-medium">Tipo</th>
                    <th className="px-3 py-2 font-medium">Herramienta</th>
                    <th className="px-3 py-2 font-medium">Sev.</th>
                    <th className="px-3 py-2 font-medium">Activo</th>
                    <th className="px-3 py-2 font-medium">Cadena</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {events.data.events.map((event) => (
                    <tr key={event.event_id} className="hover:bg-surface2/60">
                      <td className="px-4 py-2 text-muted" title={formatTime(event.received_at)}>
                        {formatRelative(event.received_at)}
                      </td>
                      <td className="px-3 py-2 font-mono text-text">{event.event_type}</td>
                      <td className="px-3 py-2">
                        <Link
                          to={`/herramientas/${event.module_id}`}
                          className="font-mono text-muted hover:text-brass"
                        >
                          {event.module_id}
                        </Link>
                      </td>
                      <td className="px-3 py-2">
                        <SeverityBadge severity={event.severity} />
                      </td>
                      <td className="px-3 py-2 font-mono text-faint">{event.asset_id ?? '—'}</td>
                      <td className="px-3 py-2">
                        <Link
                          to={`/eventos/cadena/${event.correlation_id}`}
                          className="font-mono text-brass hover:underline"
                          title={event.correlation_id}
                        >
                          {event.correlation_id.slice(0, 8)}
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
