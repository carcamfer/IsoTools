---
tipo: comunicacion
regla: rule-infra-004
fuente: orchestrate_edge_nodes
destino: monitor_edge_health
evento: NODE_STATUS_REPORT
protocolo: HTTPS
rama: comm/orchestrate_edge_nodes__monitor_edge_health
programadores:
actualizado: 2026-06-28
tags: [comunicacion, NODE_STATUS_REPORT]
---
# orchestrate_edge_nodes → monitor_edge_health

> Regla `rule-infra-004` · evento `NODE_STATUS_REPORT` · protocolo HTTPS
> Rama de trabajo: `comm/orchestrate_edge_nodes__monitor_edge_health`

## Las dos tools
- **Fuente:** [[../tools/orchestrate_edge_nodes]]
- **Destino:** [[../tools/monitor_edge_health]]

## Contrato
- **Evento:** `NODE_STATUS_REPORT`
- **Protocolo / topic:** HTTPS `POST /api/infra/health`
- **Condición de disparo:** `always`
- **Descripción:** Orquestador reporta estado de nodos al monitor en cloud

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "NODE_STATUS_REPORT" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm orchestrate_edge_nodes__monitor_edge_health` (crea/cambia a la rama `comm/orchestrate_edge_nodes__monitor_edge_health`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

