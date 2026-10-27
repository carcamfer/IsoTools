---
tipo: comunicacion
regla: rule-hse-001
fuente: monitor_gas_sensors
destino: report_safety_incident
evento: GAS_ALARM_TRIGGERED
protocolo: MQTT
rama: comm/monitor_gas_sensors__report_safety_incident
programadores:
actualizado: 2026-06-28
tags: [comunicacion, GAS_ALARM_TRIGGERED]
---
# monitor_gas_sensors → report_safety_incident

> Regla `rule-hse-001` · evento `GAS_ALARM_TRIGGERED` · protocolo MQTT
> Rama de trabajo: `comm/monitor_gas_sensors__report_safety_incident`

## Las dos tools
- **Fuente:** [[../tools/monitor_gas_sensors]]
- **Destino:** [[../tools/report_safety_incident]]

## Contrato
- **Evento:** `GAS_ALARM_TRIGGERED`
- **Protocolo / topic:** MQTT `hse/gas/alarm`
- **Condición de disparo:** `status IN ['alarm','evacuation']`
- **Descripción:** Alarma de gas activa reporte automático de incidente y notificación de emergencia

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "GAS_ALARM_TRIGGERED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm monitor_gas_sensors__report_safety_incident` (crea/cambia a la rama `comm/monitor_gas_sensors__report_safety_incident`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

