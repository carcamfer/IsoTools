---
tipo: comunicacion
regla: rule-aiml-005
fuente: analyze_vibration_patterns
destino: predict_machine_failure
evento: VIBRATION_PATTERN_ANALYZED
protocolo: MQTT
rama: comm/analyze_vibration_patterns__predict_machine_failure
programadores:
actualizado: 2026-06-28
tags: [comunicacion, VIBRATION_PATTERN_ANALYZED]
---
# analyze_vibration_patterns → predict_machine_failure

> Regla `rule-aiml-005` · evento `VIBRATION_PATTERN_ANALYZED` · protocolo MQTT
> Rama de trabajo: `comm/analyze_vibration_patterns__predict_machine_failure`

## Las dos tools
- **Fuente:** [[../tools/analyze_vibration_patterns]]
- **Destino:** [[../tools/predict_machine_failure]]

## Contrato
- **Evento:** `VIBRATION_PATTERN_ANALYZED`
- **Protocolo / topic:** MQTT `cloud/ml/failure-prediction`
- **Condición de disparo:** `severity === 'alert' || severity === 'danger'`
- **Descripción:** Patrón crítico de vibración dispara predicción de falla

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "VIBRATION_PATTERN_ANALYZED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm analyze_vibration_patterns__predict_machine_failure` (crea/cambia a la rama `comm/analyze_vibration_patterns__predict_machine_failure`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

