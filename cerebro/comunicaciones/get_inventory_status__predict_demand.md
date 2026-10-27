---
tipo: comunicacion
regla: rule-erp-002
fuente: get_inventory_status
destino: predict_demand
evento: INVENTORY_STATUS_READY
protocolo: MQTT
rama: comm/get_inventory_status__predict_demand
programadores:
actualizado: 2026-06-28
tags: [comunicacion, INVENTORY_STATUS_READY]
---
# get_inventory_status → predict_demand

> Regla `rule-erp-002` · evento `INVENTORY_STATUS_READY` · protocolo MQTT
> Rama de trabajo: `comm/get_inventory_status__predict_demand`

## Las dos tools
- **Fuente:** [[../tools/get_inventory_status]]
- **Destino:** [[../tools/predict_demand]]

## Contrato
- **Evento:** `INVENTORY_STATUS_READY`
- **Protocolo / topic:** MQTT `erp/inventory/status`
- **Condición de disparo:** `always`
- **Descripción:** Estado de inventario envía datos al predictor de demanda

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "INVENTORY_STATUS_READY" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm get_inventory_status__predict_demand` (crea/cambia a la rama `comm/get_inventory_status__predict_demand`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

