import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/api/client';
import { PageHeader } from '@/components/PageHeader';
import {
  EmptyState,
  ErrorState,
  Loading,
  Panel,
  SeverityBadge,
  formatTime,
} from '@/components/primitives';

/**
 * La cadena causal completa de un `correlation_id`.
 *
 * Es la pantalla que un auditor pide de verdad: de que hallazgo salio, que tool lo
 * proceso, que produjo, y en que orden. ISO 9001 8.7.2 y 10.2.2 no piden un conteo
 * de eventos, piden poder seguir el hilo desde la deteccion hasta la accion.
 */
export function ChainPage() {
  const { correlationId } = useParams<{ correlationId: string }>();
  const chain = useQuery({
    queryKey: ['chain', correlationId],
    queryFn: () => api.chain(correlationId!),
    enabled: Boolean(correlationId),
  });

  return (
    <>
      <PageHeader
        eyebrow="Trazabilidad"
        title="Cadena causal"
        description={correlationId}
        actions={
          <Link
            to="/eventos"
            className="inline-flex shrink-0 items-center gap-1.5 rounded border border-border px-2.5 py-1.5 text-2xs text-muted hover:bg-surface2 hover:text-text"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden="true" />
            Volver
          </Link>
        }
      />

      <div className="p-6">
        <Panel
          title={chain.data ? `${chain.data.count} pasos` : 'Cadena'}
          subtitle="En orden de ocurrencia; cada paso apunta al evento que lo causo"
        >
          {chain.isPending ? (
            <Loading />
          ) : chain.isError ? (
            <div className="p-4">
              <ErrorState
                title="No se pudo cargar la cadena"
                detail={chain.error instanceof Error ? chain.error.message : undefined}
              />
            </div>
          ) : chain.data.events.length === 0 ? (
            <EmptyState title="No hay eventos con ese correlation_id" />
          ) : (
            <ol className="p-4">
              {chain.data.events.map((step, index) => {
                const last = index === chain.data.events.length - 1;
                return (
                  <li key={step.event_id} className="flex gap-3">
                    {/* Rail vertical: hace legible el orden sin numerar nada. */}
                    <div className="flex flex-col items-center">
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          step.severity === 'critical' || step.severity === 'high'
                            ? 'bg-danger'
                            : 'bg-brass'
                        }`}
                        aria-hidden="true"
                      />
                      {!last && <span className="w-px flex-1 bg-border" aria-hidden="true" />}
                    </div>
                    <div className={`min-w-0 flex-1 ${last ? 'pb-0' : 'pb-5'}`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-2xs text-text">{step.event}</span>
                        <SeverityBadge severity={step.severity} />
                        <span className="text-2xs text-faint">{formatTime(step.received_at)}</span>
                      </div>
                      <p className="mt-0.5 text-2xs text-muted">
                        producido por{' '}
                        <Link
                          to={`/herramientas/${step.tool}`}
                          className="font-mono text-muted hover:text-brass"
                        >
                          {step.tool}
                        </Link>
                        {step.causation_id && (
                          <span className="text-faint"> · causado por {step.causation_id.slice(0, 8)}</span>
                        )}
                      </p>
                      {Object.keys(step.data ?? {}).length > 0 && (
                        <details className="mt-1.5">
                          <summary className="cursor-pointer text-2xs text-faint hover:text-muted">
                            datos
                          </summary>
                          <pre className="mt-1 overflow-x-auto rounded border border-border bg-bg p-2 font-mono text-2xs text-muted">
                            {JSON.stringify(step.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>
      </div>
    </>
  );
}
