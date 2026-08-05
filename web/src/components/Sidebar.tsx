import { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Activity,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  LayoutGrid,
  ListTree,
  Lock,
  LogOut,
  Search,
  Wrench,
} from 'lucide-react';
import type { AgentGroup, SessionInfo, ToolView } from '@/api/types';
import { agentIcon } from './agent-icons';
import { StatusDot } from './primitives';

/**
 * La barra lateral: el indice de todo lo que la plataforma sabe hacer.
 *
 * Se dibuja ENTERA desde `/console/bootstrap`. No hay ni una tool escrita a mano
 * aqui. Un equipo que despliega una tool nueva la registra en el core y aparece;
 * si la lista viviera en este archivo, cada tool nueva seria un PR contra el repo
 * de otro equipo.
 *
 * Tres destinos posibles por fila, y la diferencia importa:
 *   federada + desplegada  -> navegacion al subdominio de ese equipo. El SSO hace
 *                             que el operador llegue ya autenticado.
 *   nativa / no desplegada -> ficha interna: contrato, estado y ultimos eventos.
 *   sin acceso             -> no es enlace. Se muestra con candado en vez de
 *                             ocultarse: saber que la plataforma tiene la
 *                             herramienta y que te falta el rol es informacion
 *                             util; una lista que cambia de forma segun quien
 *                             mira es desconcertante.
 */

const NAV = [
  { to: '/', label: 'Resumen', icon: LayoutGrid, end: true },
  { to: '/herramientas', label: 'Herramientas', icon: Wrench, end: false },
  { to: '/eventos', label: 'Eventos', icon: Activity, end: false },
  { to: '/catalogo', label: 'Catalogo', icon: ListTree, end: false },
  { to: '/auditoria', label: 'Reporte de auditoria', icon: FileCheck2, end: false },
];

export function Sidebar({ agents, session }: { agents: AgentGroup[]; session: SessionInfo }) {
  const [filter, setFilter] = useState('');
  const location = useLocation();

  // Un grupo se abre por defecto si tiene algo real corriendo. Con 125 tools en 13
  // agentes, abrir todo esconde lo que importa detras de scroll.
  const defaultOpen = useMemo(
    () =>
      new Set(
        agents.filter((a) => a.tools.some((t) => t.kind !== 'planned')).map((a) => a.id),
      ),
    [agents],
  );
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const needle = filter.trim().toLowerCase();
  const groups = useMemo(() => {
    if (!needle) return agents;
    return agents
      .map((group) => ({
        ...group,
        tools: group.tools.filter(
          (t) =>
            t.id.includes(needle) ||
            t.name.toLowerCase().includes(needle) ||
            (t.agentLabel ?? '').toLowerCase().includes(needle),
        ),
      }))
      .filter((group) => group.tools.length > 0);
  }, [agents, needle]);

  const isOpen = (id: string) =>
    needle ? true : defaultOpen.has(id) ? !collapsed.has(id) : collapsed.has(id);

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <nav
      aria-label="Navegacion principal"
      className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-surface"
    >
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded bg-brass font-mono text-2xs font-semibold text-bg">
          ISO
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium leading-tight">Control Ejecutivo</p>
          <p className="truncate font-mono text-2xs text-faint">IsoTools · orquestador</p>
        </div>
      </div>

      <ul className="border-b border-border px-2 py-2">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded px-2 py-1.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-surface2 text-text'
                    : 'text-muted hover:bg-surface2 hover:text-text'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="border-b border-border px-3 py-2">
        <label className="relative block">
          <span className="sr-only">Filtrar herramientas</span>
          <Search
            className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint"
            aria-hidden="true"
          />
          <input
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filtrar herramientas"
            className="w-full rounded border border-border bg-bg py-1.5 pl-7 pr-2 text-2xs text-text placeholder:text-faint focus:border-brass/60 focus:outline-none"
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
        {groups.length === 0 ? (
          <p className="px-2 py-6 text-center text-2xs text-faint">Sin coincidencias</p>
        ) : (
          groups.map((group) => {
            const open = isOpen(group.id);
            const AgentIcon = agentIcon(group.id);
            return (
              <div key={group.id} className="mb-1">
                <button
                  type="button"
                  onClick={() => toggle(group.id)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-left text-2xs uppercase tracking-wide text-faint hover:bg-surface2 hover:text-muted"
                >
                  {open ? (
                    <ChevronDown className="h-3 w-3 shrink-0" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />
                  )}
                  <AgentIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{group.label ?? group.name}</span>
                  <span className="font-mono">{group.tools.length}</span>
                </button>
                {open && (
                  <ul className="mt-0.5 space-y-px pl-2">
                    {group.tools.map((tool) => (
                      <li key={tool.id}>
                        <ToolRow tool={tool} currentPath={location.pathname} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })
        )}
      </div>

      <SessionFooter session={session} />
    </nav>
  );
}

function ToolRow({ tool, currentPath }: { tool: ToolView; currentPath: string }) {
  const health = tool.health?.state ?? (tool.kind === 'planned' ? 'unknown' : 'unknown');
  const label = (
    <>
      <StatusDot state={health} />
      <span className="min-w-0 flex-1 truncate">{tool.name}</span>
    </>
  );
  const base =
    'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-2xs transition-colors';

  if (!tool.accessible) {
    return (
      <span
        title={`Requiere uno de: ${tool.requiredRoles.join(', ')}`}
        className={`${base} cursor-not-allowed text-faint`}
      >
        {label}
        <Lock className="h-3 w-3 shrink-0" aria-hidden="true" />
      </span>
    );
  }

  // Tool federada y desplegada: se sale a su subdominio. Es una navegacion completa
  // a proposito — nada de iframes. El operador llega con su sesion ya iniciada
  // porque esa tool tambien es relying party del mismo IdP.
  if (tool.kind === 'federated' && tool.url) {
    return (
      <a
        href={tool.url}
        title={`Abrir ${tool.name} en ${tool.url}`}
        className={`${base} text-muted hover:bg-surface2 hover:text-text`}
      >
        {label}
        <ExternalLink className="h-3 w-3 shrink-0 text-faint" aria-hidden="true" />
      </a>
    );
  }

  const to = `/herramientas/${tool.id}`;
  const active = currentPath === to;
  return (
    <NavLink
      to={to}
      className={`${base} ${active ? 'bg-surface2 text-text' : 'text-muted hover:bg-surface2 hover:text-text'}`}
    >
      {label}
    </NavLink>
  );
}

function SessionFooter({ session }: { session: SessionInfo }) {
  const user = session.user;
  const initials = (user?.displayName ?? '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="border-t border-border px-3 py-2.5">
      {session.mode === 'open' && (
        // Aviso permanente y deliberado: en modo abierto no hay identidad real. Sin
        // esto es facil demostrar el dashboard en local y creer que esta protegido.
        <p className="mb-2 rounded border border-warn/40 bg-warn/10 px-2 py-1 text-2xs text-warn">
          SSO desactivado · modo desarrollo
        </p>
      )}
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface2 font-mono text-2xs text-muted">
          {initials || '—'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-2xs text-text">{user?.displayName ?? 'Sin sesion'}</p>
          <p className="truncate font-mono text-2xs text-faint">{user?.role ?? 'sin rol'}</p>
        </div>
        {session.mode === 'sso' && (
          <a
            href="/auth/logout"
            title="Cerrar sesion"
            className="rounded p-1 text-faint hover:bg-surface2 hover:text-text"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="sr-only">Cerrar sesion</span>
          </a>
        )}
      </div>
    </div>
  );
}
