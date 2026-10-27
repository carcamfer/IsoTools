---
tipo: comunicacion
regla: rule-twin-001
fuente: collect_sensor_data
destino: feed_real_time_data_to_twin
evento: SENSOR_DATA_READY
protocolo: MQTT
rama: comm/collect_sensor_data__feed_real_time_data_to_twin
programadores:
actualizado: 2026-06-28
tags: [comunicacion, SENSOR_DATA_READY]
---
# collect_sensor_data → feed_real_time_data_to_twin

> Regla `rule-twin-001` · evento `SENSOR_DATA_READY` · protocolo MQTT
> Rama de trabajo: `comm/collect_sensor_data__feed_real_time_data_to_twin`

## Las dos tools
- **Fuente:** [[../tools/collect_sensor_data]]
- **Destino:** [[../tools/feed_real_time_data_to_twin]]

## Contrato
- **Evento:** `SENSOR_DATA_READY`
- **Protocolo / topic:** MQTT `edge/twin/sensor-data`
- **Condición de disparo:** `twinEnabled === true`
- **Descripción:** Datos de sensores transmitidos en tiempo real al gemelo digital

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "SENSOR_DATA_READY" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm collect_sensor_data__feed_real_time_data_to_twin` (crea/cambia a la rama `comm/collect_sensor_data__feed_real_time_data_to_twin`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

