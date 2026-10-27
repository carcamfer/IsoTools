---
tipo: comunicacion
regla: rule-infra-008
fuente: monitor_energy_consumption
destino: execute_local_control_action
evento: PEAK_DEMAND_DETECTED
protocolo: Internal
rama: comm/monitor_energy_consumption__execute_local_control_action
programadores:
actualizado: 2026-06-28
tags: [comunicacion, PEAK_DEMAND_DETECTED]
---
# monitor_energy_consumption → execute_local_control_action

> Regla `rule-infra-008` · evento `PEAK_DEMAND_DETECTED` · protocolo Internal
> Rama de trabajo: `comm/monitor_energy_consumption__execute_local_control_action`

## Las dos tools
- **Fuente:** [[../tools/monitor_energy_consumption]]
- **Destino:** [[../tools/execute_local_control_action]]

## Contrato
- **Evento:** `PEAK_DEMAND_DETECTED`
- **Protocolo / topic:** Internal `edge/infra/control`
- **Condición de disparo:** `peakDemand === true`
- **Descripción:** Demanda pico detectada activa acción de control local

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "PEAK_DEMAND_DETECTED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm monitor_energy_consumption__execute_local_control_action` (crea/cambia a la rama `comm/monitor_energy_consumption__execute_local_control_action`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

