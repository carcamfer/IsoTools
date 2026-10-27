---
tipo: comunicacion
regla: rule-scada-001
fuente: monitor_scada_tags
destino: execute_pid_control
evento: PROCESS_VARIABLE_UPDATED
protocolo: OPC-UA
rama: comm/monitor_scada_tags__execute_pid_control
programadores:
actualizado: 2026-06-28
tags: [comunicacion, PROCESS_VARIABLE_UPDATED]
---
# monitor_scada_tags → execute_pid_control

> Regla `rule-scada-001` · evento `PROCESS_VARIABLE_UPDATED` · protocolo OPC-UA
> Rama de trabajo: `comm/monitor_scada_tags__execute_pid_control`

## Las dos tools
- **Fuente:** [[../tools/monitor_scada_tags]]
- **Destino:** [[../tools/execute_pid_control]]

## Contrato
- **Evento:** `PROCESS_VARIABLE_UPDATED`
- **Protocolo / topic:** OPC-UA `ns=2;s=Plant/PV/Update`
- **Condición de disparo:** `quality == 'good'`
- **Descripción:** Tags de proceso actualizados alimentan el lazo PID con variable de proceso actual

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "PROCESS_VARIABLE_UPDATED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm monitor_scada_tags__execute_pid_control` (crea/cambia a la rama `comm/monitor_scada_tags__execute_pid_control`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

