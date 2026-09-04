import {
  BrainCircuit,
  Building2,
  ChartSpline,
  Component,
  Factory,
  Gauge,
  HardHat,
  Hammer,
  Orbit,
  ScanEye,
  Server,
  ShieldCheck,
  Truck,
  Zap,
  type LucideIcon,
} from 'lucide-react';

/**
 * Icono de cada agente.
 *
 * `agents.json` trae un emoji en `icon`, y el dashboard NO lo usa. Un emoji se
 * dibuja con la fuente del sistema: cambia de forma, de color y de peso entre
 * Windows, macOS y Linux, no hereda `currentColor` y desentona junto a un set de
 * iconos de trazo. En una consola de operacion — que se ve en un monitor de planta
 * tanto como en una laptop — eso es ruido, no personalidad.
 *
 * El emoji sigue publicandose en el catalogo por si otro consumidor lo quiere: es
 * dato del contrato. La eleccion visual es de esta aplicacion, y vive aqui.
 *
 * Se indexa por `id` del agente porque es estable; la etiqueta y el emoji no lo son.
 */
const BY_AGENT_ID: Readonly<Record<string, LucideIcon>> = {
  'erp-gestion-empresarial': Building2,
  'ciberseguridad-industrial': ShieldCheck,
  'vision-artificial-industrial': ScanEye,
  'ai-ml-industrial': BrainCircuit,
  'infraestructura-edge': Server,
  'produccion-avanzada': Factory,
  'digital-twin': Orbit,
  'mantenimiento-cmms': Hammer,
  'control-scada': Gauge,
  'calidad-spc': ChartSpline,
  'energia-sustentabilidad': Zap,
  'seguridad-hse': HardHat,
  'cadena-suministro': Truck,
};

/**
 * Icono de un agente, con respaldo neutro.
 *
 * Un agente nuevo aparece con el icono generico en vez de con un hueco: el
 * catalogo puede crecer sin que este archivo lo bloquee, que es la misma regla que
 * sigue el resto del dashboard.
 */
export function agentIcon(agentId: string | null | undefined): LucideIcon {
  return (agentId && BY_AGENT_ID[agentId]) || Component;
}
