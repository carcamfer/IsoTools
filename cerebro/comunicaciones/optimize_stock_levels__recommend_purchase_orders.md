---
tipo: comunicacion
regla: rule-erp-004
fuente: optimize_stock_levels
destino: recommend_purchase_orders
evento: STOCK_OPTIMIZATION_COMPLETE
protocolo: REST
rama: comm/optimize_stock_levels__recommend_purchase_orders
programadores:
actualizado: 2026-06-28
tags: [comunicacion, STOCK_OPTIMIZATION_COMPLETE]
---
# optimize_stock_levels → recommend_purchase_orders

> Regla `rule-erp-004` · evento `STOCK_OPTIMIZATION_COMPLETE` · protocolo REST
> Rama de trabajo: `comm/optimize_stock_levels__recommend_purchase_orders`

## Las dos tools
- **Fuente:** [[../tools/optimize_stock_levels]]
- **Destino:** [[../tools/recommend_purchase_orders]]

## Contrato
- **Evento:** `STOCK_OPTIMIZATION_COMPLETE`
- **Protocolo / topic:** REST `POST /api/erp/recommend-orders`
- **Condición de disparo:** `reorderPoint < currentStock`
- **Descripción:** Niveles optimizados disparan recomendación de órdenes

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "STOCK_OPTIMIZATION_COMPLETE" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm optimize_stock_levels__recommend_purchase_orders` (crea/cambia a la rama `comm/optimize_stock_levels__recommend_purchase_orders`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

