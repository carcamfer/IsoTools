import type {
  AuditReport,
  Bootstrap,
  ChainStep,
  EventCatalogEntry,
  PlatformEvent,
  Summary,
  ToolHealth,
  ToolView,
} from './types';

/**
 * Cliente HTTP del dashboard.
 *
 * La URL base es RELATIVA a proposito. El SPA y la API se sirven por el mismo
 * origen (el core sirve `web/dist` en `/`), asi que:
 *   - la cookie de sesion viaja sola, sin `credentials: 'include'` ni CORS,
 *   - no hay ninguna clave de API en el bundle. La credencial de maquina
 *     (`x-api-key`) se queda del lado del servidor, donde debe estar.
 *
 * En desarrollo, `vite dev` hace proxy de /api y /auth al core, asi que esta misma
 * premisa se cumple en local.
 */
const BASE = '/api/v1/console';

/** Error de API con el status, para que las pantallas distingan 403 de 500. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { accept: 'application/json', ...(init?.headers ?? {}) },
    credentials: 'same-origin',
  });

  if (response.status === 401) {
    // La sesion vencio con la pestana abierta. Se manda al IdP conservando donde
    // estaba el usuario: al volver aterriza en la misma pantalla, no en la portada.
    const returnTo = window.location.pathname + window.location.search;
    window.location.assign(`/auth/login?return_to=${encodeURIComponent(returnTo)}`);
    // La navegacion no es sincrona; se lanza para cortar el render en curso.
    throw new ApiError(401, 'sesion expirada');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    const message =
      (body as { error?: string; message?: string } | undefined)?.message ??
      (body as { error?: string } | undefined)?.error ??
      `HTTP ${response.status}`;
    throw new ApiError(response.status, message, body);
  }

  return (await response.json()) as T;
}

export const api = {
  bootstrap: () => request<Bootstrap>('/bootstrap'),

  tools: (params?: { kind?: string; category?: string; q?: string }) => {
    const query = new URLSearchParams();
    if (params?.kind) query.set('kind', params.kind);
    if (params?.category) query.set('category', params.category);
    if (params?.q) query.set('q', params.q);
    const suffix = query.toString() ? `?${query}` : '';
    return request<{ count: number; tools: ToolView[] }>(`/tools${suffix}`);
  },

  tool: (toolId: string) =>
    request<{ tool: ToolView; recentEvents: PlatformEvent[] }>(`/tools/${toolId}`),

  health: () =>
    request<{ checkedAt: string; health: Record<string, ToolHealth> }>('/health'),

  summary: (hours = 24) => request<Summary>(`/summary?hours=${hours}`),

  events: (params?: { type?: string; module_id?: string; severity?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.module_id) query.set('module_id', params.module_id);
    if (params?.severity) query.set('severity', params.severity);
    query.set('limit', String(params?.limit ?? 50));
    return request<{ count: number; events: PlatformEvent[] }>(`/events?${query}`);
  },

  chain: (correlationId: string) =>
    request<{ correlation_id: string; count: number; events: ChainStep[] }>(
      `/events/chain/${correlationId}`,
    ),

  catalog: () =>
    request<{ standard: unknown; events: EventCatalogEntry[] }>('/catalog'),

  auditReport: (params?: { start?: string; end?: string }) => {
    const query = new URLSearchParams();
    if (params?.start) query.set('start', params.start);
    if (params?.end) query.set('end', params.end);
    const suffix = query.toString() ? `?${query}` : '';
    return request<AuditReport>(`/audit-report${suffix}`);
  },
};
