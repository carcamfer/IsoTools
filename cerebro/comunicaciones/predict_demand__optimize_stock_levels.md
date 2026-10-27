---
tipo: comunicacion
regla: rule-erp-003
fuente: predict_demand
destino: optimize_stock_levels
evento: DEMAND_FORECAST_READY
protocolo: MQTT
rama: comm/predict_demand__optimize_stock_levels
programadores:
actualizado: 2026-06-28
tags: [comunicacion, DEMAND_FORECAST_READY]
---
# predict_demand → optimize_stock_levels

> Regla `rule-erp-003` · evento `DEMAND_FORECAST_READY` · protocolo MQTT
> Rama de trabajo: `comm/predict_demand__optimize_stock_levels`

## Las dos tools
- **Fuente:** [[../tools/predict_demand]]
- **Destino:** [[../tools/optimize_stock_levels]]

## Contrato
- **Evento:** `DEMAND_FORECAST_READY`
- **Protocolo / topic:** MQTT `erp/demand/forecast`
- **Condición de disparo:** `always`
- **Descripción:** Predicción de demanda alimenta el optimizador de stock

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "DEMAND_FORECAST_READY" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm predict_demand__optimize_stock_levels` (crea/cambia a la rama `comm/predict_demand__optimize_stock_levels`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

