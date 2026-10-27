---
tipo: comunicacion
regla: rule-scm-002
fuente: manage_warehouse_wms
destino: calculate_scm_kpis
evento: WMS_OPERATION_COMPLETE
protocolo: REST
rama: comm/manage_warehouse_wms__calculate_scm_kpis
programadores:
actualizado: 2026-06-28
tags: [comunicacion, WMS_OPERATION_COMPLETE]
---
# manage_warehouse_wms → calculate_scm_kpis

> Regla `rule-scm-002` · evento `WMS_OPERATION_COMPLETE` · protocolo REST
> Rama de trabajo: `comm/manage_warehouse_wms__calculate_scm_kpis`

## Las dos tools
- **Fuente:** [[../tools/manage_warehouse_wms]]
- **Destino:** [[../tools/calculate_scm_kpis]]

## Contrato
- **Evento:** `WMS_OPERATION_COMPLETE`
- **Protocolo / topic:** REST `POST /api/scm/kpis/update`
- **Condición de disparo:** `operation IN ['ship','receive']`
- **Descripción:** Operación de recepción o despacho actualiza los KPIs SCOR de la cadena de suministro

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "WMS_OPERATION_COMPLETE" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm manage_warehouse_wms__calculate_scm_kpis` (crea/cambia a la rama `comm/manage_warehouse_wms__calculate_scm_kpis`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

