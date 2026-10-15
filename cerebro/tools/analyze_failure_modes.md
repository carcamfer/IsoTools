---
tipo: tool
id: analyze_failure_modes
nombre: "Analizar Modos de Falla (FMEA/RCM)"
categoria: maintenance
agente: mantenimiento-cmms
estado: implementada
consume: [CONDITION_DEGRADED]
produce: [FMEA_CRITICAL_FOUND]
programador:
actualizado: 2026-10-14
tags: [tool, maintenance, implementada]
---
# Analizar Modos de Falla (FMEA/RCM)
> `analyze_failure_modes` · Cloud · categoría **maintenance** · estado **implementada**
> Pertenece al agente [[../agentes/mantenimiento-cmms|Agente de Mantenimiento & CMMS]]
## Qué hace
Ejecuta análisis de modos y efectos de falla (FMEA) y mantenimiento centrado en confiabilidad (RCM) para priorizar acciones.
## Contrato de eventos
- **Consume:** `CONDITION_DEGRADED` (por poll directo del servicio externo vía `/events/subscriptions`; deliberadamente SIN regla en `communication-rules.json` — ver nota de la bitácora)
- **Produce:** `FMEA_CRITICAL_FOUND`
## Notas de implementación (tools-dev-spec)
**Por qué estos inputs:** Se necesita `assetId` para acceder al árbol de componentes del activo y su historial de fallas por modo. `analysisType` define el marco metodológico: 'fmea' genera la tabla clásica con RPN, 'rcm' produce una decisión de estrategia de mantenimiento por modo de falla, 'both' ejecuta ambos. `includeHistoricalFailures` enriquece el análisis con frecuencias reales de ocurrencia en lugar de estimaciones de ingeniería, haciendo el análisis más representativo de las condiciones reales de operación.

**Cálculos:** Para FMEA: por cada modo de falla del catálogo del activo, calcular RPN = Severidad × Ocurrencia × Detectabilidad (escalas 1-10 cada una). Clasificar como crítico si RPN > 100. Para RCM: aplicar el árbol de decisión RCM (¿es evidente la falla? ¿afecta seguridad? ¿afecta producción?) para determinar la estrategia: PM-time-based, PM-condition-based, rediseño o run-to-failure. Ordenar `failureModes` por RPN descendente. Contar `criticalItems` (RPN > 100). Derivar `maintenanceStrategy` dominante del análisis.

**Por qué estos outputs:** `failureModes` ordenados por RPN permite al agente priorizar las acciones de mejora de mayor impacto primero. `rpn` individual es el criterio de corte para decidir si un modo requiere rediseño o mantenimiento. `recommendedAction` por modo es la instrucción directa que el agente puede convertir en una tarea de mejora. `criticalItems` es el KPI ejecutivo que justifica recursos de inversión.

**Sugerencia de UI:** Tabla FMEA con columnas: Modo de Falla, Severidad, Ocurrencia, Detectabilidad y RPN con color de fondo (rojo >100, amarillo 50-100, verde <50). Filtro rápido para mostrar solo críticos. Sección colapsable con la estrategia de mantenimiento recomendada por RCM. Botón de exportar a Excel para documentación de auditorías.
## Comunicaciones
**Esta tool dispara a:**
- [[../comunicaciones/analyze_failure_modes__schedule_preventive_maintenance]] — `FMEA_CRITICAL_FOUND` → [[schedule_preventive_maintenance]]
- [[../comunicaciones/analyze_failure_modes__manage_nonconformances]] — `FMEA_CRITICAL_FOUND` → [[manage_nonconformances]]
**Esta tool es disparada por:**
- `execute_condition_monitoring` — `CONDITION_DEGRADED` (consumo por poll, sin regla de bus; ver bitácora)
## Bitácora de cambios
<!-- Anota aquí cada cambio de contrato/lógica que pueda afectar a otras tools.
     Formato sugerido:  - [YYYY-MM-DD] (tu-nombre) qué cambió y a quién afecta -->
- [2026-06-28] (auto) nota inicial generada desde la configuración.
- [2026-10-14] (Rumbar) se corrige `consumes` en `tools.json` de `[]` a `[CONDITION_DEGRADED]`: el servicio real desplegado (`rumbar-tools`, subdominio `rap`) hace poll de ese evento desde que se implementó, para re-evaluar FMEA/RCM de un activo cuando su condición se degrada — el catálogo no lo reflejaba. `CONDITION_DEGRADED` lo produce `execute_condition_monitoring`; hoy esa arista solo está declarada por regla hacia `manage_work_orders` (`rule-maint-001`). Deliberadamente NO se agrega una regla nueva en `communication-rules.json` para esta arista (decisión previa: nada de disparadores automáticos nuevos para FMEA) — la suscripción por poll es suficiente, igual que para `detect_out_of_control_signals` antes de que se repusiera `rule-qual-002`. Efecto: `/events/subscriptions/analyze_failure_modes` ahora sí refleja la suscripción real; `/events/chain` seguirá sin mostrar esta arista como causal (mismo trade-off de trazabilidad vs. no-duplicado que ya se documentó para `rdp`).
