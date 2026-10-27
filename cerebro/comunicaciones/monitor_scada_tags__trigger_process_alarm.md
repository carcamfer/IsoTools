---
tipo: comunicacion
regla: rule-scada-002
fuente: monitor_scada_tags
destino: trigger_process_alarm
evento: TAG_LIMIT_EXCEEDED
protocolo: OPC-UA
rama: comm/monitor_scada_tags__trigger_process_alarm
programadores:
actualizado: 2026-06-28
tags: [comunicacion, TAG_LIMIT_EXCEEDED]
---
# monitor_scada_tags → trigger_process_alarm

> Regla `rule-scada-002` · evento `TAG_LIMIT_EXCEEDED` · protocolo OPC-UA
> Rama de trabajo: `comm/monitor_scada_tags__trigger_process_alarm`

## Las dos tools
- **Fuente:** [[../tools/monitor_scada_tags]]
- **Destino:** [[../tools/trigger_process_alarm]]

## Contrato
- **Evento:** `TAG_LIMIT_EXCEEDED`
- **Protocolo / topic:** OPC-UA `ns=2;s=Plant/Alarm/Check`
- **Condición de disparo:** `value > hiLimit OR value < loLimit`
- **Descripción:** Tag de proceso fuera de límites dispara evaluación de alarma

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "TAG_LIMIT_EXCEEDED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm monitor_scada_tags__trigger_process_alarm` (crea/cambia a la rama `comm/monitor_scada_tags__trigger_process_alarm`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

