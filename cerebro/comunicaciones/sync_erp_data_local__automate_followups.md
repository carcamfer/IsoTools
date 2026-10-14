---
tipo: comunicacion
regla: rule-conn-004
fuente: sync_erp_data_local
destino: automate_followups
evento: ERP_SALES_ORDER_UNFULFILLABLE
protocolo: REST
rama: comm/sync_erp_data_local__automate_followups
programadores:
actualizado: 2026-09-30
tags: [comunicacion, ERP_SALES_ORDER_UNFULFILLABLE]
---
# sync_erp_data_local → automate_followups

> Regla `rule-conn-004` · evento `ERP_SALES_ORDER_UNFULFILLABLE` · protocolo REST
> Rama de trabajo: `comm/sync_erp_data_local__automate_followups`

## Las dos tools
- **Fuente:** [[../tools/sync_erp_data_local]]
- **Destino:** [[../tools/automate_followups]]

## Contrato
- **Evento:** `ERP_SALES_ORDER_UNFULFILLABLE`
- **Protocolo / topic:** REST `POST /api/mgmt/followups`
- **Condición de disparo:** `always`
- **Descripción:** Pedido comprometido sin existencia dispara seguimiento comercial

## Forma del payload
```json
{
  "event": { "type": "ERP_SALES_ORDER_UNFULFILLABLE" },
  "data": {
      "targetType": "order",
      "targetIds": [
          "P-009001"
      ],
      "orderId": 9001,
      "skuId": "SKU-0001",
      "articuloId": 1,
      "nombre": "Articulo demo 001",
      "unidadesComprometidas": 35,
      "existencia": 0,
      "warehouseId": "ALM-01",
      "erpType": "microsip"
  }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-09-30] (auto) nota inicial generada desde communication-rules.json.
- [2026-09-30] (Carlos+Claude) contrato inicial. Origen: pull `pedidos_sin_surtir` del conector `erp_microsip` (`/api/pedidos/sin-surtir`).
- [2026-09-30] (Carlos+Claude) el destinatario es el PEDIDO, no el SKU: `targetType` solo admite `lead|supplier|order`, y el seguimiento se le da al pedido comprometido que no se va a surtir, no al articulo. El cruce pedido x existencia se hace en el gateway porque son dos tablas del ERP y las tools no conocen su modelo.
- [2026-09-30] (Carlos+Claude) BLOQUEADO EN EL BUS: `deployments.json` marca automate_followups como `native` pero `src/tools/index.js` ya la retiro del bus nativo. Mientras eso no se corrija, el evento se guarda y queda en su suscripcion, pero el router no ejecuta nada (`npm run validate` lo reporta como error).

## Flujo de trabajo
1. `npm run rama:comm sync_erp_data_local__automate_followups` (crea/cambia a la rama `comm/sync_erp_data_local__automate_followups`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

