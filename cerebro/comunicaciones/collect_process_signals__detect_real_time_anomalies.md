---
tipo: comunicacion
regla: rule-aiml-003
fuente: collect_process_signals
destino: detect_real_time_anomalies
evento: SIGNALS_READY
protocolo: Internal
rama: comm/collect_process_signals__detect_real_time_anomalies
programadores:
actualizado: 2026-06-28
tags: [comunicacion, SIGNALS_READY]
---
# collect_process_signals → detect_real_time_anomalies

> Regla `rule-aiml-003` · evento `SIGNALS_READY` · protocolo Internal
> Rama de trabajo: `comm/collect_process_signals__detect_real_time_anomalies`

## Las dos tools
- **Fuente:** [[../tools/collect_process_signals]]
- **Destino:** [[../tools/detect_real_time_anomalies]]

## Contrato
- **Evento:** `SIGNALS_READY`
- **Protocolo / topic:** Internal `edge/process/signals`
- **Condición de disparo:** `always`
- **Descripción:** Señales de proceso alimentan la detección de anomalías en tiempo real

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "SIGNALS_READY" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm collect_process_signals__detect_real_time_anomalies` (crea/cambia a la rama `comm/collect_process_signals__detect_real_time_anomalies`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

