import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

/**
 * =============================================================================
 * COPIA ESTE ARCHIVO. Es el vocabulario visual de la plataforma.
 * =============================================================================
 *
 * Piezas planas, industriales, sin degradados ni sombras. Son las mismas del
 * dashboard orquestador: si tu tool las usa, un operador que cruza de un
 * subdominio a otro no percibe el salto.
 *
 * La regla practica: ANTES de escribir un `<div className="rounded border …">`,
 * busca aqui. Casi todo lo que una pantalla de operacion necesita —un panel, una
 * cifra, un estado, una tabla, un vacio, un error— ya esta. Cuando de verdad
 * falte algo, agregalo AQUI y usalo desde tus pantallas; un estilo suelto en una
 * pagina es el primer paso para que la siguiente pantalla invente otro.
 *
 * Solo depende de react y lucide-react.
 */

/* ── Accion ────────────────────────────────────────────────────────────────── */

/**
 * Tres variantes y no mas. `primary` es UNA por pantalla: si todo destaca, nada
 * destaca, y en una pantalla donde una accion cambia un registro de calidad
 * conviene mucho que se vea cual es esa accion.
 */
export function Button({
  variant = 'ghost',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger';
  loading?: boolean;
}) {
  const styles = {
    primary: 'border-info bg-info/15 text-info hover:bg-info/25',
    ghost: 'border-border bg-surface2 text-muted hover:text-text',
    danger: 'border-danger/50 bg-danger/10 text-danger hover:bg-danger/20',
  }[variant];
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded border px-2.5 py-1.5 text-2xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

/* ── Contenedores ──────────────────────────────────────────────────────────── */

/**
 * El contenedor de todo. Un borde de 1px y una superficie — no una sombra: en un
 * tema oscuro la sombra no se ve y acaba siendo un halo sucio.
 *
 * Ritmo fijo: cabecera `px-4 py-2.5`, cuerpo `px-4 py-3`. No lo ajustes por
 * panel; dos paneles lado a lado con padding distinto se ven rotos.
 */
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

/** Cifra grande. En mono, siempre: los digitos alinean entre tarjetas contiguas. */
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

/* ── Estado ────────────────────────────────────────────────────────────────── */

export type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral';

const DOT: Record<Tone, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger',
  info: 'bg-info',
  neutral: 'bg-faint',
};

/**
 * Punto + etiqueta. Punto, no fondo de color: un chip relleno de rojo entre
 * treinta filas convierte la tabla en un semaforo ilegible.
 *
 * El color NUNCA es lo unico que informa — la etiqueta va al lado. Un 8% de los
 * hombres no distingue rojo de verde, y aqui se decide si un producto sale o no.
 *
 * Mapea los estados de TU dominio en `tone`, no inventes colores nuevos:
 *   conforme / aprobado / en linea      -> ok
 *   vence pronto / requiere revision    -> warn
 *   no conforme / caido / rechazado     -> danger
 *   en proceso / informativo            -> info
 *   borrador / retirado / desconocido   -> neutral
 */
export function StatusChip({ status, tone = 'neutral' }: { status: string; tone?: Tone }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 rounded border border-border bg-surface2 px-1.5 py-0.5 text-2xs text-text">
      <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[tone]}`} aria-hidden="true" />
      {status}
    </span>
  );
}

/** Solo el punto, para tablas densas donde la etiqueta ya esta en otra columna. */
export function StatusDot({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[tone]}`} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Etiqueta de clasificacion: severidad, tipo, version. Borde teñido, sin relleno. */
export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  const styles: Record<Tone, string> = {
    ok: 'border-ok/40 text-ok',
    warn: 'border-warn/40 text-warn',
    danger: 'border-danger/40 text-danger',
    info: 'border-info/40 text-info',
    neutral: 'border-border text-muted',
  };
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 font-mono text-2xs ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

/* ── Datos ─────────────────────────────────────────────────────────────────── */

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

/**
 * Tabla de la plataforma. Cabecera hundida (`surface2`), filas separadas por
 * borde, sin cebrado: el rayado gris compite con los colores de estado, que son
 * los que hay que ver.
 *
 * `empty` no es opcional en la practica. Una tabla vacia sin explicacion es
 * indistinguible de una tabla que fallo al cargar.
 */
export function Table<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty?: ReactNode;
}) {
  if (rows.length === 0) return <>{empty ?? <EmptyState title="Sin registros" />}</>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-2xs">
        <thead>
          <tr className="border-b border-border bg-surface2">
            {columns.map((c) => (
              <th
                key={c.key}
                className="px-4 py-2 text-left font-medium uppercase tracking-wide text-faint"
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-border/60 last:border-0 ${
                onRowClick ? 'cursor-pointer hover:bg-surface2' : ''
              }`}
            >
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-2 align-middle ${c.className ?? ''}`}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Dato que un auditor puede tener que comparar caracter por caracter. */
export function Mono({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`font-mono ${className}`}>{children}</span>;
}

/* ── Formularios ───────────────────────────────────────────────────────────── */

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded border border-border bg-bg px-2 py-1.5 text-2xs text-text placeholder:text-faint focus:border-info/60 focus:outline-none ${className}`}
    />
  );
}

/** Etiqueta + control + una sola linea de ayuda o error. Nunca las dos a la vez. */
export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-2xs font-medium text-muted">
        {label}
        {required && (
          <span className="text-danger" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p className="text-2xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-2xs text-faint">{hint}</p>
      ) : null}
    </div>
  );
}

/* ── Los tres estados que se olvidan ───────────────────────────────────────── */

export function Loading({ label = 'Cargando' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-10 text-2xs text-faint">
      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}

/**
 * El detalle tecnico va en mono y visible, no escondido en la consola: quien
 * reporta el fallo casi nunca es quien puede abrir devtools.
 */
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

/** Vacio con causa. "Sin datos" a secas no distingue "no hay" de "no cargo". */
export function EmptyState({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="px-4 py-10 text-center">
      <p className="text-sm text-muted">{title}</p>
      {detail && <p className="mt-1 text-2xs text-faint">{detail}</p>}
    </div>
  );
}

/* ── Fechas ────────────────────────────────────────────────────────────────── */

/**
 * Formato fijo con locale fijo. Es deliberado: la captura de pantalla que un
 * auditor adjunta a un hallazgo no debe depender de la configuracion regional de
 * su maquina, y 24 h evita la ambiguedad de un am/pm mal leido.
 */
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

/** Para "¿esto esta vivo?". Nunca sustituye a la fecha exacta en un registro. */
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
