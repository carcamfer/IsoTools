---
tipo: comunicacion
regla: rule-pkg-008
fuente: compare_planned_vs_actual
destino: generate_kpis
evento: PRODUCTION_VARIANCE_DETECTED
protocolo: REST
rama: comm/compare_planned_vs_actual__generate_kpis
programadores:
actualizado: 2026-07-23
tags: [comunicacion, PRODUCTION_VARIANCE_DETECTED]
---
# compare_planned_vs_actual -> generate_kpis

> Regla `rule-pkg-008` - evento `PRODUCTION_VARIANCE_DETECTED` - protocolo REST
> Rama de trabajo: `comm/compare_planned_vs_actual__generate_kpis`

## Las dos tools
- **Fuente:** [[../tools/compare_planned_vs_actual]]
- **Destino:** [[../tools/generate_kpis]]

## Contrato
- **Evento:** `PRODUCTION_VARIANCE_DETECTED`
- **Protocolo / topic:** REST `POST /api/mgmt/kpis`
- **Condicion de disparo:** `status != 'not_calculable'`
- **Descripcion:** Variacion plan vs real calculable alimenta el tablero de KPIs de Revision por Direccion

## Forma del payload
```json
{
  "event": {
    "type": "PRODUCTION_VARIANCE_DETECTED",
    "category": "erp",
    "severity": "low|medium|high"
  },
  "data": {
    "analysis_type": "planned_vs_actual",
    "domain": "production",
    "analysis_id": "AN-001",
    "organization_id": "ORG-001",
    "plant_id": "plant_01",
    "period": "monthly",
    "metrics": ["OEE", "SCRAP"],
    "status": "on_track|deviation|critical",
    "deviation_percent": 12.5,
    "weighted_deviation_percent": 8.4,
    "details": {
      "metrics": [
        {
          "metric_id": "OEE",
          "planned": 85,
          "actual": 80,
          "unit": "percent",
          "direction": "higher_is_better",
          "status": "deviation"
        }
      ]
    },
    "audit": {},
    "data_quality": {}
  }
}
```

## Bitacora de la comunicacion
<!-- Cada cambio en el contrato entre estas dos tools se anota aqui.
     Asi el programador del otro lado ve que cambio sin leer el codigo.
     Formato:  - [YYYY-MM-DD] (quien) que cambio en el payload/condicion y por que -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.
- [2026-07-23] (codex) La condicion cambia de `always` a `status != 'not_calculable'`; el payload queda en `snake_case` y `generate_kpis` puede leer `plant_id`, `period`, `metrics` y evidencia de proyecto si viene en el evento.

## Flujo de trabajo
1. `npm run rama:comm compare_planned_vs_actual__generate_kpis` (crea/cambia a la rama `comm/compare_planned_vs_actual__generate_kpis`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitacora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.
