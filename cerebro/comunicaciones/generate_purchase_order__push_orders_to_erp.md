---
tipo: comunicacion
regla: rule-erp-006
fuente: generate_purchase_order
destino: push_orders_to_erp
evento: ORDER_CREATED
protocolo: MQTT
rama: comm/generate_purchase_order__push_orders_to_erp
programadores:
actualizado: 2026-06-28
tags: [comunicacion, ORDER_CREATED]
---
# generate_purchase_order → push_orders_to_erp

> Regla `rule-erp-006` · evento `ORDER_CREATED` · protocolo MQTT
> Rama de trabajo: `comm/generate_purchase_order__push_orders_to_erp`

## Las dos tools
- **Fuente:** [[../tools/generate_purchase_order]]
- **Destino:** [[../tools/push_orders_to_erp]]

## Contrato
- **Evento:** `ORDER_CREATED`
- **Protocolo / topic:** MQTT `erp/orders/created`
- **Condición de disparo:** `always`
- **Descripción:** Orden creada en cloud se envía al ERP local via Edge

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "ORDER_CREATED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm generate_purchase_order__push_orders_to_erp` (crea/cambia a la rama `comm/generate_purchase_order__push_orders_to_erp`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

