---
tipo: comunicacion
regla: rule-infra-002
fuente: digitize_analog_signals
destino: orchestrate_edge_nodes
evento: SIGNAL_DIGITIZED
protocolo: MQTT
rama: comm/digitize_analog_signals__orchestrate_edge_nodes
programadores:
actualizado: 2026-06-28
tags: [comunicacion, SIGNAL_DIGITIZED]
---
# digitize_analog_signals → orchestrate_edge_nodes

> Regla `rule-infra-002` · evento `SIGNAL_DIGITIZED` · protocolo MQTT
> Rama de trabajo: `comm/digitize_analog_signals__orchestrate_edge_nodes`

## Las dos tools
- **Fuente:** [[../tools/digitize_analog_signals]]
- **Destino:** [[../tools/orchestrate_edge_nodes]]

## Contrato
- **Evento:** `SIGNAL_DIGITIZED`
- **Protocolo / topic:** MQTT `edge/infra/digital-signals`
- **Condición de disparo:** `always`
- **Descripción:** Señal digitalizada disponible para orquestación entre nodos

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "SIGNAL_DIGITIZED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm digitize_analog_signals__orchestrate_edge_nodes` (crea/cambia a la rama `comm/digitize_analog_signals__orchestrate_edge_nodes`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

