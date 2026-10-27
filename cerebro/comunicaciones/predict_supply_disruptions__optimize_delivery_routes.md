---
tipo: comunicacion
regla: rule-scm-004
fuente: predict_supply_disruptions
destino: optimize_delivery_routes
evento: DISRUPTION_RISK_HIGH
protocolo: REST
rama: comm/predict_supply_disruptions__optimize_delivery_routes
programadores:
actualizado: 2026-06-28
tags: [comunicacion, DISRUPTION_RISK_HIGH]
---
# predict_supply_disruptions → optimize_delivery_routes

> Regla `rule-scm-004` · evento `DISRUPTION_RISK_HIGH` · protocolo REST
> Rama de trabajo: `comm/predict_supply_disruptions__optimize_delivery_routes`

## Las dos tools
- **Fuente:** [[../tools/predict_supply_disruptions]]
- **Destino:** [[../tools/optimize_delivery_routes]]

## Contrato
- **Evento:** `DISRUPTION_RISK_HIGH`
- **Protocolo / topic:** REST `POST /api/scm/routes/reoptimize`
- **Condición de disparo:** `disruptionRisk IN ['high','critical']`
- **Descripción:** Riesgo alto de disrupción activa reoptimización de rutas con proveedores alternativos

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "DISRUPTION_RISK_HIGH" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm predict_supply_disruptions__optimize_delivery_routes` (crea/cambia a la rama `comm/predict_supply_disruptions__optimize_delivery_routes`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

