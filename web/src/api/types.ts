/**
 * Formas que devuelve `/api/v1/console/*`.
 *
 * Se escriben a mano y a proposito: son el contrato entre el core y este SPA, y
 * tenerlo explicito hace que un cambio en el backend rompa el `tsc` en vez de
 * romper una pantalla en produccion.
 */

/** Donde corre una tool. Lo decide `src/data/platform/deployments.json`. */
export type ToolKind = 'federated' | 'native' | 'planned';

/** Resultado de la sonda de salud del servidor. `unknown` = registrada, sin desplegar. */
export type HealthState = 'up' | 'down' | 'unknown';

export interface ToolHealth {
  toolId: string;
  state: HealthState;
  detail?: string;
  httpStatus?: number;
  latencyMs?: number;
}

export interface ToolView {
  id: string;
  name: string;
  nameEn: string;
  description: string | null;
  category: string | null;
  type: string | null;
  isoEvent: string | null;
  isoClause: string | null;
  produces: string[];
  consumes: string[];

  agentId: string | null;
  agentName: string | null;
  /** Emoji del catalogo. El dashboard NO lo dibuja — ver `components/agent-icons.ts`. */
  agentIcon: string | null;
  agentLabel: string | null;

  kind: ToolKind;
  status: string;
  /** URL publica de la tool federada. `null` = registrada pero no desplegada aqui. */
  url: string | null;
  healthUrl: string | null;
  owner: string | null;
  repo: string | null;
  summary: string | null;
  requiredRoles: string[];

  /** Si ESTE usuario puede entrar. Es visibilidad, no autoridad de dominio. */
  accessible: boolean;
  health?: ToolHealth | null;
}

export interface AgentGroup {
  id: string;
  name: string;
  /** Emoji del catalogo. El dashboard NO lo dibuja — ver `components/agent-icons.ts`. */
  icon: string | null;
  label: string | null;
  category: string | null;
  description: string | null;
  tools: ToolView[];
}

export interface SessionUser {
  subject: string;
  displayName: string;
  email?: string;
  roles: string[];
  role: string | null;
  seesAllTools: boolean;
}

export interface SessionInfo {
  authenticated: boolean;
  /** `open` = sin IdP configurado (desarrollo local). */
  mode: 'sso' | 'open';
  user?: SessionUser;
}

export interface Bootstrap {
  platform: { name: string; domain: string | null; authMode: 'sso' | 'open' };
  session: SessionInfo;
  agents: AgentGroup[];
  counts: { tools: number; federated: number; native: number; planned: number };
}

export interface PlatformEvent {
  event_id: string;
  timestamp: string;
  received_at: string;
  seq?: number;
  module_id: string;
  module_version?: string;
  asset_id?: string | null;
  plant_id?: string | null;
  line_id?: string | null;
  event_type: string;
  category: string | null;
  severity: string | null;
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  correlation_id: string;
  causation_id: string | null;
}

export interface ChainStep {
  event_id: string;
  causation_id: string | null;
  correlation_id: string;
  tool: string;
  event: string;
  category: string | null;
  severity: string | null;
  data: Record<string, unknown>;
  received_at: string;
  seq?: number;
}

export interface Summary {
  windowHours: number;
  totals: { events: number; tools: number; chains: number; last_event_at: string | null };
  bySeverity: { severity: string; events: number }[];
  byCategory: { category: string; events: number }[];
  byTool: { tool_id: string; events: number; last_event_at: string }[];
  timeline: { bucket: string; events: number }[];
}

export interface EventCatalogEntry {
  type: string;
  producers: string[];
  consumers: string[];
}

export interface AuditReportRow {
  toolId: string;
  name: string;
  isoClause: string | null;
  kind: ToolKind;
  owner: string | null;
  declaredProduces: string[];
  observedEventTypes: string[];
  records: number;
  lastRecordAt: string | null;
  verdict: string;
}

export interface AuditReport {
  generatedAt: string;
  period: { start: string | null; end: string | null };
  standard: string;
  coverage: { toolsDeployed: number; toolsWithEvidence: number; findings: string[] };
  tools: AuditReportRow[];
  traceability: {
    correlation_id: string;
    steps: number;
    started_at: string;
    ended_at: string;
    tools: string[];
    max_severity: string | null;
  }[];
}
