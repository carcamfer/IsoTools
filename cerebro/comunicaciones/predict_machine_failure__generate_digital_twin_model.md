---
tipo: comunicacion
regla: rule-aiml-006
fuente: predict_machine_failure
destino: generate_digital_twin_model
evento: FAILURE_PREDICTED
protocolo: MQTT
rama: comm/predict_machine_failure__generate_digital_twin_model
programadores:
actualizado: 2026-06-28
tags: [comunicacion, FAILURE_PREDICTED]
---
# predict_machine_failure → generate_digital_twin_model

> Regla `rule-aiml-006` · evento `FAILURE_PREDICTED` · protocolo MQTT
> Rama de trabajo: `comm/predict_machine_failure__generate_digital_twin_model`

## Las dos tools
- **Fuente:** [[../tools/predict_machine_failure]]
- **Destino:** [[../tools/generate_digital_twin_model]]

## Contrato
- **Evento:** `FAILURE_PREDICTED`
- **Protocolo / topic:** MQTT `cloud/ml/twin-update`
- **Condición de disparo:** `failureProbability > 0.7`
- **Descripción:** Alta probabilidad de falla actualiza el modelo del gemelo digital

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "FAILURE_PREDICTED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm predict_machine_failure__generate_digital_twin_model` (crea/cambia a la rama `comm/predict_machine_failure__generate_digital_twin_model`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

