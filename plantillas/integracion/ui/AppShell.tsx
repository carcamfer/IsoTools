import { useEffect, useState, type AnchorHTMLAttributes, type ReactNode } from 'react';
import { ArrowLeft, LogOut } from 'lucide-react';

/**
 * =============================================================================
 * COPIA ESTE ARCHIVO. Es el marco de TODA pantalla de tu tool.
 * =============================================================================
 *
 * Envuelve tus rutas y ya: barra superior, estado del servicio, sesion, aviso de
 * caida y el ancho del contenido. No lo re-implementes por pantalla.
 *
 *   <AppShell tool="Control de no conformidades" clause="8.7 — salidas no conformes">
 *     <Routes>…</Routes>
 *   </AppShell>
 *
 * Cuatro cosas que aqui no son opcionales, porque son de plataforma:
 *
 *  1. NOMBRE DE LA TOOL Y CLAUSULA ISO, siempre visibles. El operador llega
 *     desde el dashboard sin haber elegido conscientemente esta pantalla; si no
 *     dice donde esta, la primera pregunta de cada dia es "¿esta cual es?".
 *  2. ESTADO DEL SERVICIO, con sonda propia. El mosaico verde del dashboard dice
 *     que la tool respondia hace 15 segundos, no que responda AHORA.
 *  3. QUIEN FIRMA. Toda aprobacion o disposicion queda en la traza de auditoria
 *     a nombre de quien esta en sesion (ISO 9001:2015 7.5.2 / 8.7.1). Eso se
 *     muestra ANTES de actuar, no despues en un log.
 *  4. VUELTA AL DASHBOARD. Es una navegacion completa a otro subdominio; el
 *     boton "atras" del navegador no siempre existe (muchos llegan por enlace
 *     directo o marcador).
 *
 * Sin dependencias mas alla de react y lucide-react. Los colores y tamaños salen
 * del tema de `index.css` — no metas hex aqui.
 */

interface SessionUser {
  displayName?: string;
  email?: string;
  role?: string | null;
  roles?: string[];
}

interface SessionInfo {
  authenticated: boolean;
  /** `sso` = hay identidad real. `open` = servicio corriendo sin autenticacion. */
  mode?: 'sso' | 'open';
  user?: SessionUser;
}

export function AppShell({
  tool,
  clause,
  icon,
  tabs,
  children,
  healthPath = '/health',
  sessionPath = '/auth/me',
  dashboardUrl = import.meta.env.VITE_DASHBOARD_URL,
}: {
  /** Nombre humano de la tool. El mismo que aparece en la barra del dashboard. */
  tool: string;
  /** Clausula ISO 9001:2015 que cubre esta tool, p. ej. `8.7 — salidas no conformes`. */
  clause: string;
  icon?: ReactNode;
  /** Navegacion secundaria dentro de la tool. Opcional: con una sola pantalla, sobra. */
  tabs?: ReactNode;
  children: ReactNode;
  /**
   * Liveness de TU servicio, siempre abierta. Ojo con la variante nginx: ahi `/health`
   * lo contesta el propio nginx y verias verde con el backend caido. En ese montaje
   * apunta a un endpoint que SI pase por el proxy.
   */
  healthPath?: string;
  sessionPath?: string;
  /** URL del dashboard orquestador. Se hornea en el bundle; es publica, no es secreto. */
  dashboardUrl?: string;
}) {
  const online = useHealth(healthPath);
  const session = useSession(sessionPath);

  return (
    <div className="flex min-h-full flex-col bg-bg text-text">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3">
          {dashboardUrl && (
            <a
              href={dashboardUrl}
              title="Volver al dashboard"
              className="-ml-1 rounded p-1.5 text-faint transition-colors hover:bg-surface2 hover:text-text"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Volver al dashboard</span>
            </a>
          )}
          {icon && <span className="shrink-0 text-brass">{icon}</span>}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-medium leading-tight text-text">{tool}</h1>
            {/* Mono para la clausula: es una referencia normativa, se cita literal. */}
            <p className="truncate font-mono text-2xs text-faint">ISO 9001:2015 · {clause}</p>
          </div>
          <HealthChip online={online} />
          <SessionChip session={session} />
        </div>
        {tabs && <div className="mx-auto max-w-6xl px-6">{tabs}</div>}
      </header>

      {/* Franja de caida. Va arriba y ocupa el ancho completo a proposito: si el
          servicio no responde, TODA accion de esta pantalla va a fallar, y
          descubrirlo al pulsar "guardar" es descubrirlo tarde. */}
      {online === false && (
        <div className="border-b border-danger/40 bg-danger/10 px-6 py-2 text-center text-2xs text-danger">
          El servicio no responde — las acciones fallaran hasta que vuelva.
        </div>
      )}

      {/* max-w-6xl: el ancho de lectura de la plataforma. Una tabla a 2560px de
          ancho separa tanto la primera columna de la ultima que deja de leerse
          como una fila. */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">{children}</main>
    </div>
  );
}

/** Sonda de vida cada 10 s. `null` = todavia no sabemos; no es lo mismo que "caido". */
function useHealth(path: string) {
  const [online, setOnline] = useState<boolean | null>(null);
  useEffect(() => {
    let alive = true;
    const ping = () =>
      fetch(path, { credentials: 'include' })
        .then((r) => alive && setOnline(r.ok))
        .catch(() => alive && setOnline(false));
    ping();
    const id = setInterval(ping, 10_000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [path]);
  return online;
}

/** Lee `/auth/me`. Con el SSO apagado responde `authenticated:false` y el chip no se pinta. */
function useSession(path: string) {
  const [session, setSession] = useState<SessionInfo | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(path, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { authenticated: false }))
      .then((data) => alive && setSession(data as SessionInfo))
      .catch(() => alive && setSession({ authenticated: false }));
    return () => {
      alive = false;
    };
  }, [path]);
  return session;
}

function HealthChip({ online }: { online: boolean | null }) {
  const dot = online === null ? 'bg-faint' : online ? 'bg-ok' : 'bg-danger';
  const label = online === null ? 'conectando' : online ? 'en linea' : 'sin respuesta';
  return (
    <span className="inline-flex shrink-0 items-center gap-2 rounded-md border border-border bg-surface2 px-2.5 py-1 text-2xs text-muted">
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}

function SessionChip({ session }: { session: SessionInfo | null }) {
  if (!session) return null;

  // Aviso permanente y deliberado en modo abierto: sin el es facil demostrar la
  // tool en local y creer que esta protegida. Se ve, no se esconde.
  if (!session.authenticated) {
    if (session.mode !== 'open') return null;
    return (
      <span className="inline-flex shrink-0 items-center rounded-md border border-warn/40 bg-warn/10 px-2.5 py-1 text-2xs text-warn">
        SSO desactivado · desarrollo
      </span>
    );
  }

  const user = session.user;
  return (
    <span className="inline-flex shrink-0 items-center gap-2 rounded-md border border-border bg-surface2 px-2.5 py-1 text-2xs">
      <span className="text-text">{user?.displayName ?? 'sesion'}</span>
      {/* El rol en mono: es el que la matriz de autoridad va a evaluar, y el que
          quedara escrito en la traza. Se lee literal, como un identificador. */}
      <span className="font-mono text-faint">{user?.role ?? 'sin rol'}</span>
      <a
        href="/auth/logout"
        title="Cerrar sesion"
        className="rounded p-0.5 text-faint transition-colors hover:text-text"
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="sr-only">Cerrar sesion</span>
      </a>
    </span>
  );
}

/** Pestañas de la barra superior. Pasalas a `AppShell` en `tabs`. */
export function Tab({
  active,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { active?: boolean }) {
  return (
    <a
      {...props}
      className={`inline-block border-b-2 px-3 py-2 text-2xs transition-colors ${
        active
          ? 'border-brass text-text'
          : 'border-transparent text-muted hover:border-border hover:text-text'
      }`}
    >
      {children}
    </a>
  );
}
