---
tipo: comunicacion
regla: rule-prod-002
fuente: track_machine_state
destino: detect_idle_time
evento: MACHINE_STATE_UPDATED
protocolo: Internal
rama: comm/track_machine_state__detect_idle_time
programadores:
actualizado: 2026-06-28
tags: [comunicacion, MACHINE_STATE_UPDATED]
---
# track_machine_state → detect_idle_time

> Regla `rule-prod-002` · evento `MACHINE_STATE_UPDATED` · protocolo Internal
> Rama de trabajo: `comm/track_machine_state__detect_idle_time`

## Las dos tools
- **Fuente:** [[../tools/track_machine_state]]
- **Destino:** [[../tools/detect_idle_time]]

## Contrato
- **Evento:** `MACHINE_STATE_UPDATED`
- **Protocolo / topic:** Internal `edge/prod/machine-state`
- **Condición de disparo:** `state === 'idle' || state === 'fault'`
- **Descripción:** Estado idle/fault dispara detección de tiempo muerto

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "MACHINE_STATE_UPDATED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm track_machine_state__detect_idle_time` (crea/cambia a la rama `comm/track_machine_state__detect_idle_time`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

