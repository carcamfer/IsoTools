---
tipo: comunicacion
regla: rule-scm-003
fuente: track_shipments
destino: predict_supply_disruptions
evento: SHIPMENT_DELAYED
protocolo: MQTT
rama: comm/track_shipments__predict_supply_disruptions
programadores:
actualizado: 2026-06-28
tags: [comunicacion, SHIPMENT_DELAYED]
---
# track_shipments → predict_supply_disruptions

> Regla `rule-scm-003` · evento `SHIPMENT_DELAYED` · protocolo MQTT
> Rama de trabajo: `comm/track_shipments__predict_supply_disruptions`

## Las dos tools
- **Fuente:** [[../tools/track_shipments]]
- **Destino:** [[../tools/predict_supply_disruptions]]

## Contrato
- **Evento:** `SHIPMENT_DELAYED`
- **Protocolo / topic:** MQTT `scm/shipments/delay`
- **Condición de disparo:** `delayDays > 2`
- **Descripción:** Envío con retraso > 2 días activa análisis predictivo de disrupciones de suministro

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "SHIPMENT_DELAYED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm track_shipments__predict_supply_disruptions` (crea/cambia a la rama `comm/track_shipments__predict_supply_disruptions`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

