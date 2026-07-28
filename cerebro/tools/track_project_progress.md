---
tipo: tool
id: track_project_progress
nombre: "Rastrear Progreso de Proyectos"
categoria: erp
agente: erp-gestion-empresarial
estado: implementada
consume: [KPI_REPORT_GENERATED]
produce: [PROJECT_AT_RISK]
programador:
actualizado: 2026-07-23
tags: [tool, erp, implementada]
---
# Rastrear Progreso de Proyectos
> `track_project_progress` - Cloud - categoria **erp** - estado **implementada**
> Pertenece al agente [[../agentes/erp-gestion-empresarial|Agente ERP & Gestion Empresarial]]

## Que hace
Evalua avance planificado contra real, hitos y presupuesto para emitir `PROJECT_AT_RISK` solo cuando el proyecto esta en riesgo o retrasado.

## Contrato de eventos
- **Consume:** `KPI_REPORT_GENERATED`
- **Produce:** `PROJECT_AT_RISK`

## Contrato de entrada
Contrato principal en `snake_case`:
- `organization_id`
- `project_id`
- `project_name`
- `as_of_date`
- `planned_start_date`
- `planned_end_date`
- `planned_progress_percent`
- `actual_progress_percent`
- `milestones[]` opcional
- `budget` opcional
- `target_type` y `target_ids` opcionales
- `thresholds` opcional
- `source` opcional

Lectura legacy aceptada:
- `organizationId`, `projectId`, `projectName`
- `asOfDate`, `plannedStartDate`, `plannedEndDate`
- `plannedProgressPercent`, `actualProgressPercent`
- `targetType`, `targetIds`

## Contrato de salida
La tool emite evento solo cuando `status` es `at_risk` o `delayed`. Para `on_track` o `not_calculable`, devuelve `null`.

Campos emitidos en `PROJECT_AT_RISK`:
- `project_id`
- `projectId`
- `organization_id`
- `completionPercent`
- `milestonesCompleted`
- `milestonesTotal`
- `budgetUsedPercent`
- `status`
- `severity`
- `risk_reasons`
- `targetType`
- `targetIds`
- `target_type`
- `target_ids`
- `audit`
- `data_quality`

`status` emitible: `at_risk`, `delayed`.

## Notas de implementacion
- No se introduce `PROJECT_PROGRESS_UPDATED` en V1.
- `rule-pkg-012` conserva `status == 'at_risk'`; `delayed` se emite como `PROJECT_AT_RISK` pero no agenda followups en V1.
- Si faltan evidencias obligatorias, la tool calcula `not_calculable` internamente y devuelve `null`.
- `targetType` usa `order` por defecto y `targetIds` usa `project_id` si no se reciben valores explicitos.
- `category` se mantiene como `erp` por catalogo/agente. Esto diverge del IES estricto, donde las categorias validas no incluyen `erp`; la decision queda documentada para no tocar `event-standard.json` en V1.

## Comunicaciones
**Esta tool dispara a:**
- [[../comunicaciones/track_project_progress__automate_followups]] - `PROJECT_AT_RISK` -> [[automate_followups]]

**Esta tool es disparada por:**
- [[generate_kpis]] - `KPI_REPORT_GENERATED` -> [[../comunicaciones/generate_kpis__track_project_progress]]

## Bitacora de cambios
<!-- Anota aqui cada cambio de contrato/logica que pueda afectar a otras tools.
     Formato sugerido:  - [YYYY-MM-DD] (tu-nombre) que cambio y a quien afecta -->
- [2026-06-28] (auto) nota inicial generada desde la configuracion.
- [2026-07-23] (codex) Importacion V1 productizable: calculo real de avance, hitos y presupuesto; `null` para `on_track`/`not_calculable`; salida `PROJECT_AT_RISK` con `targetType` y `targetIds`.
