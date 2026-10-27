---
tipo: comunicacion
regla: rule-scm-001
fuente: scan_incoming_material
destino: manage_warehouse_wms
evento: MATERIAL_RECEIVED
protocolo: REST
rama: comm/scan_incoming_material__manage_warehouse_wms
programadores:
actualizado: 2026-06-28
tags: [comunicacion, MATERIAL_RECEIVED]
---
# scan_incoming_material → manage_warehouse_wms

> Regla `rule-scm-001` · evento `MATERIAL_RECEIVED` · protocolo REST
> Rama de trabajo: `comm/scan_incoming_material__manage_warehouse_wms`

## Las dos tools
- **Fuente:** [[../tools/scan_incoming_material]]
- **Destino:** [[../tools/manage_warehouse_wms]]

## Contrato
- **Evento:** `MATERIAL_RECEIVED`
- **Protocolo / topic:** REST `POST /api/scm/wms/receive`
- **Condición de disparo:** `qualityHoldRequired == false`
- **Descripción:** Material escaneado sin retención de calidad pasa directo a gestión de almacén WMS

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "MATERIAL_RECEIVED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm scan_incoming_material__manage_warehouse_wms` (crea/cambia a la rama `comm/scan_incoming_material__manage_warehouse_wms`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

