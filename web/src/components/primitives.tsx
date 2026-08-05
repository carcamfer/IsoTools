import type { ReactNode } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { HealthState, ToolKind } from '@/api/types';

/** Piezas visuales compartidas. Planas, industriales, sin degradados. */

export function Panel({
  title,
  subtitle,
  actions,
  children,
  className = '',
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-md border border-border bg-surface ${className}`}>
      {(title || actions) && (
        <header className="flex items-center gap-3 border-b border-border px-4 py-2.5">
          <div className="min-w-0 flex-1">
            {title && <h2 className="truncate text-sm font-medium text-text">{title}</h2>}
            {subtitle && <p className="truncate text-2xs text-faint">{subtitle}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}

export function Metric({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'default' | 'ok' | 'warn' | 'danger';
}) {
  const toneClass = {
    default: 'text-text',
    ok: 'text-ok',
    warn: 'text-warn',
    danger: 'text-danger',
  }[tone];
  return (
    <div className="rounded-md border border-border bg-surface px-4 py-3">
      <p className="text-2xs uppercase tracking-wide text-faint">{label}</p>
      <p className={`mt-1 font-mono text-2xl leading-tight ${toneClass}`}>{value}</p>
      {hint && <p className="mt-1 text-2xs text-muted">{hint}</p>}
    </div>
  );
}

const HEALTH_STYLE: Record<HealthState, { dot: string; label: string }> = {
  up: { dot: 'bg-ok', label: 'en linea' },
  down: { dot: 'bg-danger', label: 'no responde' },
  unknown: { dot: 'bg-faint', label: 'sin desplegar' },
};

export function StatusDot({ state, showLabel = false }: { state: HealthState; showLabel?: boolean }) {
  const style = HEALTH_STYLE[state];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`}
        aria-hidden="true"
      />
      <span className="sr-only">{style.label}</span>
      {showLabel && <span className="text-2xs text-muted">{style.label}</span>}
    </span>
  );
}

const KIND_STYLE: Record<ToolKind, { label: string; className: string; title: string }> = {
  federated: {
    label: 'federada',
    className: 'border-brass/40 text-brass',
    title: 'Corre en su propio servicio y subdominio, mantenida por su equipo',
  },
  native: {
    label: 'nativa',
    className: 'border-info/40 text-info',
    title: 'Corre en proceso dentro del core; no tiene interfaz propia',
  },
  planned: {
    label: 'planeada',
    className: 'border-border text-faint',
    title: 'En el catalogo, sin despliegue todavia',
  },
};

export function KindBadge({ kind }: { kind: ToolKind }) {
  const style = KIND_STYLE[kind];
  return (
    <span
      title={style.title}
      className={`inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 font-mono text-2xs ${style.className}`}
    >
      {style.label}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string | null }) {
  if (!severity) return <span className="font-mono text-2xs text-faint">—</span>;
  const tone =
    severity === 'critical' || severity === 'high'
      ? 'border-danger/40 text-danger'
      : severity === 'medium'
        ? 'border-warn/40 text-warn'
        : 'border-border text-muted';
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-2xs ${tone}`}>
      {severity}
    </span>
  );
}

export function Loading({ label = 'Cargando' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-10 text-2xs text-faint">
      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}

export function ErrorState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-danger/40 bg-danger/5 px-4 py-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm text-text">{title}</p>
        {detail && <p className="mt-0.5 break-words font-mono text-2xs text-muted">{detail}</p>}
      </div>
    </div>
  );
}

export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="px-4 py-10 text-center">
      <p className="text-sm text-muted">{title}</p>
      {detail && <p className="mt-1 text-2xs text-faint">{detail}</p>}
    </div>
  );
}

/** Fecha corta y estable. `Intl` con locale fijo evita que la captura de pantalla
 *  de un auditor dependa de la configuracion regional de su maquina. */
export function formatTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatRelative(value: string | null | undefined): string {
  if (!value) return 'sin registros';
  const delta = Date.now() - new Date(value).getTime();
  if (Number.isNaN(delta)) return 'sin registros';
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) return 'hace segundos';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.floor(hours / 24)} d`;
}
