---
tipo: comunicacion
regla: rule-pkg-008
fuente: compare_planned_vs_actual
destino: generate_kpis
evento: PRODUCTION_VARIANCE_DETECTED
protocolo: REST
rama: comm/compare_planned_vs_actual__generate_kpis
programadores:
actualizado: 2026-06-28
tags: [comunicacion, PRODUCTION_VARIANCE_DETECTED]
---
# compare_planned_vs_actual → generate_kpis

> Regla `rule-pkg-008` · evento `PRODUCTION_VARIANCE_DETECTED` · protocolo REST
> Rama de trabajo: `comm/compare_planned_vs_actual__generate_kpis`

## Las dos tools
- **Fuente:** [[../tools/compare_planned_vs_actual]]
- **Destino:** [[../tools/generate_kpis]]

## Contrato
- **Evento:** `PRODUCTION_VARIANCE_DETECTED`
- **Protocolo / topic:** REST `POST /api/mgmt/kpis`
- **Condición de disparo:** `always`
- **Descripción:** Variación plan vs real alimenta el tablero de KPIs de Revisión por Dirección

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "PRODUCTION_VARIANCE_DETECTED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm compare_planned_vs_actual__generate_kpis` (crea/cambia a la rama `comm/compare_planned_vs_actual__generate_kpis`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

