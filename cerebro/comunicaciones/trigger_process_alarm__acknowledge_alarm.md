---
tipo: comunicacion
regla: rule-scada-003
fuente: trigger_process_alarm
destino: acknowledge_alarm
evento: ALARM_ACTIVATED
protocolo: MQTT
rama: comm/trigger_process_alarm__acknowledge_alarm
programadores:
actualizado: 2026-06-28
tags: [comunicacion, ALARM_ACTIVATED]
---
# trigger_process_alarm → acknowledge_alarm

> Regla `rule-scada-003` · evento `ALARM_ACTIVATED` · protocolo MQTT
> Rama de trabajo: `comm/trigger_process_alarm__acknowledge_alarm`

## Las dos tools
- **Fuente:** [[../tools/trigger_process_alarm]]
- **Destino:** [[../tools/acknowledge_alarm]]

## Contrato
- **Evento:** `ALARM_ACTIVATED`
- **Protocolo / topic:** MQTT `scada/alarms/active`
- **Condición de disparo:** `priority IN ['critical','high']`
- **Descripción:** Alarma crítica o alta activa la notificación al operador para reconocimiento

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "ALARM_ACTIVATED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm trigger_process_alarm__acknowledge_alarm` (crea/cambia a la rama `comm/trigger_process_alarm__acknowledge_alarm`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

