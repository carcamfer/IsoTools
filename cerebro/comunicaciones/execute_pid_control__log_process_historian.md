---
tipo: comunicacion
regla: rule-scada-004
fuente: execute_pid_control
destino: log_process_historian
evento: PID_OUTPUT_UPDATED
protocolo: MQTT
rama: comm/execute_pid_control__log_process_historian
programadores:
actualizado: 2026-06-28
tags: [comunicacion, PID_OUTPUT_UPDATED]
---
# execute_pid_control → log_process_historian

> Regla `rule-scada-004` · evento `PID_OUTPUT_UPDATED` · protocolo MQTT
> Rama de trabajo: `comm/execute_pid_control__log_process_historian`

## Las dos tools
- **Fuente:** [[../tools/execute_pid_control]]
- **Destino:** [[../tools/log_process_historian]]

## Contrato
- **Evento:** `PID_OUTPUT_UPDATED`
- **Protocolo / topic:** MQTT `scada/historian/write`
- **Condición de disparo:** `always`
- **Descripción:** Salida del controlador PID y PV se registran continuamente en el historiador

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "PID_OUTPUT_UPDATED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm execute_pid_control__log_process_historian` (crea/cambia a la rama `comm/execute_pid_control__log_process_historian`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

