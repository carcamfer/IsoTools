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
actualizado: 2026-06-28
tags: [tool, erp, implementada]
---
# Comparar Planificado vs Real
> `compare_planned_vs_actual` · Cloud · categoría **erp** · estado **implementada**
> Pertenece al agente [[../agentes/erp-gestion-empresarial|Agente ERP & Gestión Empresarial]]
## Qué hace
Compara métricas planificadas contra ejecución real en producción, compras y costos.
## Contrato de eventos
- **Consume:** — (es disparador raíz o aún sin regla)
- **Produce:** `PRODUCTION_VARIANCE_DETECTED`
## Notas de implementación (tools-dev-spec)
**Por qué estos inputs:** module especifica qué área comparar (producción, ventas, compras, costos) para consultar las tablas correctas. periodStart y periodEnd definen el rango de comparación — normalmente un mes o trimestre — para que el análisis sea homogéneo y comparable con períodos anteriores.

**Cálculos:** Consultar los valores planificados del presupuesto/plan maestro y los valores reales del sistema de ejecución para el módulo y período dado. Calcular deviationPercent = ((real - plan) / plan) × 100. Clasificar el status: verde si |desviación| < 5%, amarillo si 5-15%, rojo si > 15%. Desglosar las desviaciones por sub-categoría.

**Por qué estos outputs:** deviationPercent es el KPI principal que el agente reporta a la dirección y que dispara alertas si supera umbrales. status permite filtrar rápidamente qué áreas necesitan atención. details es el drill-down que los managers usan para identificar la raíz de la desviación.

**Sugerencia de UI:** Gráfica de barras agrupadas (Plan vs Real) por sub-categoría. Velocímetro o gauge central con la desviación total y colores de semáforo. Tabla de detalles expandible con variación absoluta y porcentual por partida.
## Comunicaciones
**Esta tool dispara a:**
- [[../comunicaciones/compare_planned_vs_actual__generate_kpis]] — `PRODUCTION_VARIANCE_DETECTED` → [[generate_kpis]]
- [[../comunicaciones/compare_planned_vs_actual__detect_business_anomalies]] — `PRODUCTION_VARIANCE_DETECTED` → [[detect_business_anomalies]]
**Esta tool es disparada por:**
- _ninguna declarada_
## Bitácora de cambios
<!-- Anota aquí cada cambio de contrato/lógica que pueda afectar a otras tools.
     Formato sugerido:  - [YYYY-MM-DD] (tu-nombre) qué cambió y a quién afecta -->
- [2026-06-28] (auto) nota inicial generada desde la configuración.
- [2026-09-30] (Carlos+Claude) ahora consume `ERP_SALES_PERIOD_CLOSED` (era la unica tool real con `consumes` vacio). Se agrego `sales` al enum de `module` y el handler dejo de devolver la desviacion fija de 12.5 %: calcula con `actual` del ERP y la meta de `METAS`. Sin meta publica `status: "sin_meta"`. Afecta a [[generate_kpis]] y [[detect_business_anomalies]], que leen su `data`.
