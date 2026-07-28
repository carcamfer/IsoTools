---
tipo: tool
id: compare_planned_vs_actual
nombre: "Comparar Planificado vs Real"
categoria: erp
agente: erp-gestion-empresarial
estado: implementada
consume: []
produce: [PRODUCTION_VARIANCE_DETECTED]
programador:
actualizado: 2026-07-23
tags: [tool, erp, implementada]
---
# Comparar Planificado vs Real
> `compare_planned_vs_actual` - Cloud - categoria **erp** - estado **implementada**
> Pertenece al agente [[../agentes/erp-gestion-empresarial|Agente ERP & Gestion Empresarial]]

## Que hace
Compara metricas planificadas contra ejecucion real y emite `PRODUCTION_VARIANCE_DETECTED` con trazabilidad, calidad de datos, severidad y acciones recomendadas.

## Contrato de eventos
- **Consume:** none (tool raiz; `consumes: []`)
- **Produce:** `PRODUCTION_VARIANCE_DETECTED`

## Contrato de entrada
Contrato principal en `snake_case`:
- `organization_id`
- `analysis_id`
- `as_of_date`
- `metrics[]` con `metric_id`, `name`, `planned`, `actual`, `unit`, `direction`
- `thresholds` opcional
- `source` opcional
- Si no viene `period`, V1 infiere `daily` desde `as_of_date`.
- `plant_id` puede venir en data o heredarse del asset; si falta en ambos, el resultado queda `not_calculable`.

Lectura legacy aceptada:
- `organizationId`, `analysisId`, `asOfDate`
- `plantId`
- `metricId`
- `module`, `periodStart`, `periodEnd`

## Contrato de salida
Salida principal en `snake_case`:
- `analysis_type`
- `domain`
- `analysis_id`
- `organization_id`
- `plant_id`
- `period`
- `metrics`
- `status`
- `severity`
- `summary`
- `deviation_percent`
- `weighted_deviation_percent`
- `details.metrics`
- `recommended_actions`
- `audit`
- `data_quality`

Aliases de compatibilidad:
- `plantId`
- `deviationPercent`

`status` permitido: `on_track`, `deviation`, `critical`, `not_calculable`.

## Notas de implementacion
- La tool ya no devuelve constantes productivas.
- `planned = 0` y `actual > 0` produce `not_calculable`.
- `category` se mantiene como `erp` por catalogo/agente. Esto diverge del IES estricto, donde las categorias validas no incluyen `erp`; la decision queda documentada para no tocar `event-standard.json` en V1.
- `camelCase` se acepta solo como lectura legacy; la salida contractual es `snake_case`.

## Comunicaciones
**Esta tool dispara a:**
- [[../comunicaciones/compare_planned_vs_actual__generate_kpis]] - `PRODUCTION_VARIANCE_DETECTED` -> [[generate_kpis]]
- [[../comunicaciones/compare_planned_vs_actual__detect_business_anomalies]] - `PRODUCTION_VARIANCE_DETECTED` -> [[detect_business_anomalies]]

**Esta tool es disparada por:**
- _ninguna declarada_

## Bitacora de cambios
<!-- Anota aqui cada cambio de contrato/logica que pueda afectar a otras tools.
     Formato sugerido:  - [YYYY-MM-DD] (tu-nombre) que cambio y a quien afecta -->
- [2026-06-28] (auto) nota inicial generada desde la configuracion.
- [2026-07-23] (codex) Importacion V1 productizable: calculo real de plan vs real, salida `snake_case`, estado `not_calculable`, aliases legacy y reglas downstream condicionadas para `generate_kpis` y `detect_business_anomalies`.
