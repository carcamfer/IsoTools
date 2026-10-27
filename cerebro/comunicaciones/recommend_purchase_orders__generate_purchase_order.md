---
tipo: comunicacion
regla: rule-erp-005
fuente: recommend_purchase_orders
destino: generate_purchase_order
evento: ORDER_RECOMMENDED
protocolo: REST
rama: comm/recommend_purchase_orders__generate_purchase_order
programadores:
actualizado: 2026-06-28
tags: [comunicacion, ORDER_RECOMMENDED]
---
# recommend_purchase_orders → generate_purchase_order

> Regla `rule-erp-005` · evento `ORDER_RECOMMENDED` · protocolo REST
> Rama de trabajo: `comm/recommend_purchase_orders__generate_purchase_order`

## Las dos tools
- **Fuente:** [[../tools/recommend_purchase_orders]]
- **Destino:** [[../tools/generate_purchase_order]]

## Contrato
- **Evento:** `ORDER_RECOMMENDED`
- **Protocolo / topic:** REST `POST /api/erp/generate-order`
- **Condición de disparo:** `autoApprove === true`
- **Descripción:** Recomendación auto-aprobada genera la orden de compra

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "ORDER_RECOMMENDED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm recommend_purchase_orders__generate_purchase_order` (crea/cambia a la rama `comm/recommend_purchase_orders__generate_purchase_order`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

