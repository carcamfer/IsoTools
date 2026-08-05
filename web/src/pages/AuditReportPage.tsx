import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Printer, ShieldAlert } from 'lucide-react';
import { ApiError, api } from '@/api/client';
import type { SessionInfo } from '@/api/types';
import { PageHeader } from '@/components/PageHeader';
import {
  EmptyState,
  ErrorState,
  Loading,
  Metric,
  Panel,
  SeverityBadge,
  formatTime,
} from '@/components/primitives';

/**
 * REPORTE DE AUDITORIA ISO 9001:2015.
 *
 * Vive en el dashboard y no en una tool porque el orquestador es el UNICO punto que
 * ve los eventos de todas las herramientas, incluidas las de equipos ajenos. Una
 * tool solo puede testificar sobre si misma.
 *
 * La fila que importa no es la que tiene muchos registros: es la que tiene CERO.
 * Una herramienta desplegada que no publico evidencia en el periodo es un hallazgo,
 * y se presenta como tal en vez de desaparecer en una tabla vacia.
 */
export function AuditReportPage({ session }: { session: SessionInfo }) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const report = useQuery({
    queryKey: ['audit-report', start, end],
    queryFn: () => api.auditReport({ ...(start && { start }), ...(end && { end }) }),
  });

  const forbidden = report.error instanceof ApiError && report.error.status === 403;

  return (
    <>
      <PageHeader
        eyebrow="ISO 9001:2015"
        title="Reporte de auditoria"
        description="Evidencia transversal: que herramienta dejo registros, de que tipo y cuando"
        actions={
          report.data ? (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded border border-border px-2.5 py-1.5 text-2xs text-muted hover:bg-surface2 hover:text-text"
            >
              <Printer className="h-3 w-3" aria-hidden="true" />
              Imprimir
            </button>
          ) : undefined
        }
      />

      <div className="space-y-4 p-6">
        {forbidden ? (
          <div className="flex items-start gap-3 rounded-md border border-border bg-surface px-4 py-4">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden="true" />
            <div>
              <p className="text-sm text-text">Este reporte requiere rol de auditor</p>
              <p className="mt-1 text-2xs text-muted">
                Cruza evidencia de todas las herramientas, incluidas las de otros equipos, asi que
                esta restringido a <span className="font-mono">platform.auditor</span> o{' '}
                <span className="font-mono">platform.admin</span>.
                {session.user?.roles.length
                  ? ` Tu sesion tiene: ${session.user.roles.join(', ')}.`
                  : ' Tu sesion no trae ningun rol asignado.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-2xs text-faint">
                <span className="mb-1 block">Desde</span>
                <input
                  type="date"
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                  className="rounded border border-border bg-surface px-2 py-1.5 text-2xs text-text focus:border-brass/60 focus:outline-none"
                />
              </label>
              <label className="text-2xs text-faint">
                <span className="mb-1 block">Hasta</span>
                <input
                  type="date"
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                  className="rounded border border-border bg-surface px-2 py-1.5 text-2xs text-text focus:border-brass/60 focus:outline-none"
                />
              </label>
              {(start || end) && (
                <button
                  type="button"
                  onClick={() => {
                    setStart('');
                    setEnd('');
                  }}
                  className="rounded border border-border px-2.5 py-1.5 text-2xs text-muted hover:bg-surface2 hover:text-text"
                >
                  Todo el historico
                </button>
              )}
            </div>

            {report.isPending ? (
              <Loading label="Reuniendo evidencia" />
            ) : report.isError ? (
              <ErrorState
                title="No se pudo generar el reporte"
                detail={report.error instanceof Error ? report.error.message : undefined}
              />
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Metric
                    label="Herramientas desplegadas"
                    value={report.data.coverage.toolsDeployed}
                  />
                  <Metric
                    label="Con evidencia"
                    value={report.data.coverage.toolsWithEvidence}
                    tone="ok"
                    hint={`generado ${formatTime(report.data.generatedAt)}`}
                  />
                  <Metric
                    label="Hallazgos"
                    value={report.data.coverage.findings.length}
                    tone={report.data.coverage.findings.length > 0 ? 'danger' : 'ok'}
                    hint="sin registros en el periodo"
                  />
                </div>

                <Panel
                  title="Evidencia por herramienta"
                  subtitle="Declarado en el catalogo contra observado en los eventos"
                >
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[54rem] text-2xs">
                      <thead className="bg-surface2 text-left text-faint">
                        <tr>
                          <th className="px-4 py-2 font-medium">Herramienta</th>
                          <th className="px-3 py-2 font-medium">ISO</th>
                          <th className="px-3 py-2 font-medium">Responsable</th>
                          <th className="px-3 py-2 font-medium">Declara producir</th>
                          <th className="px-3 py-2 font-medium">Registros</th>
                          <th className="px-3 py-2 font-medium">Ultimo</th>
                          <th className="px-3 py-2 font-medium">Veredicto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {report.data.tools.map((row) => (
                          <tr
                            key={row.toolId}
                            className={row.records === 0 ? 'bg-danger/5' : 'hover:bg-surface2/60'}
                          >
                            <td className="px-4 py-2">
                              <Link
                                to={`/herramientas/${row.toolId}`}
                                className="text-text hover:text-brass"
                              >
                                {row.name}
                              </Link>
                              <span className="block font-mono text-faint">{row.toolId}</span>
                            </td>
                            <td className="px-3 py-2 font-mono text-muted">
                              {row.isoClause ?? '—'}
                            </td>
                            <td className="px-3 py-2 text-muted">{row.owner ?? '—'}</td>
                            <td className="px-3 py-2 font-mono text-faint">
                              {row.declaredProduces.join(', ') || '—'}
                            </td>
                            <td className="px-3 py-2 font-mono text-text">{row.records}</td>
                            <td className="px-3 py-2 text-muted">{formatTime(row.lastRecordAt)}</td>
                            <td className="px-3 py-2">
                              <span
                                className={
                                  row.records === 0 ? 'text-danger' : 'text-ok'
                                }
                              >
                                {row.verdict}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>

                <Panel
                  title="Trazabilidad de no conformidades"
                  subtitle="Cadenas causales que pasaron por un defecto, una senal fuera de control o una NC"
                >
                  {report.data.traceability.length === 0 ? (
                    <EmptyState
                      title="Sin cadenas de no conformidad en el periodo"
                      detail="No es necesariamente bueno: puede significar que nadie esta publicando"
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[48rem] text-2xs">
                        <thead className="bg-surface2 text-left text-faint">
                          <tr>
                            <th className="px-4 py-2 font-medium">Cadena</th>
                            <th className="px-3 py-2 font-medium">Pasos</th>
                            <th className="px-3 py-2 font-medium">Herramientas</th>
                            <th className="px-3 py-2 font-medium">Severidad</th>
                            <th className="px-3 py-2 font-medium">Inicio</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {report.data.traceability.map((chain) => (
                            <tr key={chain.correlation_id} className="hover:bg-surface2/60">
                              <td className="px-4 py-2">
                                <Link
                                  to={`/eventos/cadena/${chain.correlation_id}`}
                                  className="font-mono text-brass hover:underline"
                                  title={chain.correlation_id}
                                >
                                  {chain.correlation_id.slice(0, 12)}
                                </Link>
                              </td>
                              <td className="px-3 py-2 font-mono text-text">{chain.steps}</td>
                              <td className="px-3 py-2 font-mono text-muted">
                                {chain.tools.join(' → ')}
                              </td>
                              <td className="px-3 py-2">
                                <SeverityBadge severity={chain.max_severity} />
                              </td>
                              <td className="px-3 py-2 text-muted">
                                {formatTime(chain.started_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Panel>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
