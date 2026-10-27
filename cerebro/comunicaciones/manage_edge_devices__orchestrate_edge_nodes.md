---
tipo: comunicacion
regla: rule-infra-003
fuente: manage_edge_devices
destino: orchestrate_edge_nodes
evento: DEVICE_STATE_CHANGED
protocolo: Internal
rama: comm/manage_edge_devices__orchestrate_edge_nodes
programadores:
actualizado: 2026-06-28
tags: [comunicacion, DEVICE_STATE_CHANGED]
---
# manage_edge_devices → orchestrate_edge_nodes

> Regla `rule-infra-003` · evento `DEVICE_STATE_CHANGED` · protocolo Internal
> Rama de trabajo: `comm/manage_edge_devices__orchestrate_edge_nodes`

## Las dos tools
- **Fuente:** [[../tools/manage_edge_devices]]
- **Destino:** [[../tools/orchestrate_edge_nodes]]

## Contrato
- **Evento:** `DEVICE_STATE_CHANGED`
- **Protocolo / topic:** Internal `edge/infra/device-state`
- **Condición de disparo:** `operation !== 'list'`
- **Descripción:** Cambio de estado de dispositivo reportado al orquestador

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "DEVICE_STATE_CHANGED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm manage_edge_devices__orchestrate_edge_nodes` (crea/cambia a la rama `comm/manage_edge_devices__orchestrate_edge_nodes`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

