---
tipo: comunicacion
regla: rule-infra-005
fuente: monitor_edge_health
destino: manage_device_registry
evento: HEALTH_REPORT_READY
protocolo: REST
rama: comm/monitor_edge_health__manage_device_registry
programadores:
actualizado: 2026-06-28
tags: [comunicacion, HEALTH_REPORT_READY]
---
# monitor_edge_health → manage_device_registry

> Regla `rule-infra-005` · evento `HEALTH_REPORT_READY` · protocolo REST
> Rama de trabajo: `comm/monitor_edge_health__manage_device_registry`

## Las dos tools
- **Fuente:** [[../tools/monitor_edge_health]]
- **Destino:** [[../tools/manage_device_registry]]

## Contrato
- **Evento:** `HEALTH_REPORT_READY`
- **Protocolo / topic:** REST `PUT /api/infra/registry`
- **Condición de disparo:** `nodesOffline > 0`
- **Descripción:** Nodos offline actualizan su estado en el registro central

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "HEALTH_REPORT_READY" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm monitor_edge_health__manage_device_registry` (crea/cambia a la rama `comm/monitor_edge_health__manage_device_registry`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

