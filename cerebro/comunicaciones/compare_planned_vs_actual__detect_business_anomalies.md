---
tipo: comunicacion
regla: rule-pkg-009
fuente: compare_planned_vs_actual
destino: detect_business_anomalies
evento: PRODUCTION_VARIANCE_DETECTED
protocolo: REST
rama: comm/compare_planned_vs_actual__detect_business_anomalies
programadores:
actualizado: 2026-07-23
tags: [comunicacion, PRODUCTION_VARIANCE_DETECTED]
---
# compare_planned_vs_actual -> detect_business_anomalies

> Regla `rule-pkg-009` - evento `PRODUCTION_VARIANCE_DETECTED` - protocolo REST
> Rama de trabajo: `comm/compare_planned_vs_actual__detect_business_anomalies`

## Las dos tools
- **Fuente:** [[../tools/compare_planned_vs_actual]]
- **Destino:** [[../tools/detect_business_anomalies]]

## Contrato
- **Evento:** `PRODUCTION_VARIANCE_DETECTED`
- **Protocolo / topic:** REST `POST /api/mgmt/anomalies`
- **Condicion de disparo:** `status IN ['deviation','critical']`
- **Descripcion:** Desviacion o variacion critica se envia al detector de anomalias de negocio

## Forma del payload
```json
{
  "event": {
    "type": "PRODUCTION_VARIANCE_DETECTED",
    "category": "erp",
    "severity": "medium|high"
  },
  "data": {
    "analysis_type": "planned_vs_actual",
    "domain": "production",
    "plant_id": "plant_01",
    "period": "monthly",
    "metrics": ["SCRAP"],
    "status": "deviation|critical",
    "details": {
      "metrics": [
        {
          "metric_id": "SCRAP",
          "planned": 2,
          "actual": 3,
          "unit": "percent",
          "direction": "lower_is_better",
          "status": "critical"
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
- [2026-07-23] (codex) La condicion cambia de `always` a `status IN ['deviation','critical']`; `detect_business_anomalies` lee `details.metrics` para derivar anomalias sin depender de constantes.

## Flujo de trabajo
1. `npm run rama:comm compare_planned_vs_actual__detect_business_anomalies` (crea/cambia a la rama `comm/compare_planned_vs_actual__detect_business_anomalies`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitacora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.
