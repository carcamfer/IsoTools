---
tipo: comunicacion
regla: rule-infra-001
fuente: collect_sensor_data
destino: digitize_analog_signals
evento: ANALOG_DATA_BUFFERED
protocolo: Internal
rama: comm/collect_sensor_data__digitize_analog_signals
programadores:
actualizado: 2026-06-28
tags: [comunicacion, ANALOG_DATA_BUFFERED]
---
# collect_sensor_data → digitize_analog_signals

> Regla `rule-infra-001` · evento `ANALOG_DATA_BUFFERED` · protocolo Internal
> Rama de trabajo: `comm/collect_sensor_data__digitize_analog_signals`

## Las dos tools
- **Fuente:** [[../tools/collect_sensor_data]]
- **Destino:** [[../tools/digitize_analog_signals]]

## Contrato
- **Evento:** `ANALOG_DATA_BUFFERED`
- **Protocolo / topic:** Internal `edge/infra/analog`
- **Condición de disparo:** `signalType === 'analog'`
- **Descripción:** Datos analógicos del buffer se convierten a formato digital

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "ANALOG_DATA_BUFFERED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm collect_sensor_data__digitize_analog_signals` (crea/cambia a la rama `comm/collect_sensor_data__digitize_analog_signals`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

