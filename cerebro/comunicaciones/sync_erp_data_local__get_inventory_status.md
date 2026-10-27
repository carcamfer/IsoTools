---
tipo: comunicacion
regla: rule-erp-001
fuente: sync_erp_data_local
destino: get_inventory_status
evento: ERP_DATA_SYNCED
protocolo: HTTPS
rama: comm/sync_erp_data_local__get_inventory_status
programadores:
actualizado: 2026-06-28
tags: [comunicacion, ERP_DATA_SYNCED]
---
# sync_erp_data_local → get_inventory_status

> Regla `rule-erp-001` · evento `ERP_DATA_SYNCED` · protocolo HTTPS
> Rama de trabajo: `comm/sync_erp_data_local__get_inventory_status`

## Las dos tools
- **Fuente:** [[../tools/sync_erp_data_local]]
- **Destino:** [[../tools/get_inventory_status]]

## Contrato
- **Evento:** `ERP_DATA_SYNCED`
- **Protocolo / topic:** HTTPS `POST /api/erp/sync`
- **Condición de disparo:** `always`
- **Descripción:** Datos ERP locales sincronizados al cloud para consulta de inventario

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "ERP_DATA_SYNCED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm sync_erp_data_local__get_inventory_status` (crea/cambia a la rama `comm/sync_erp_data_local__get_inventory_status`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

