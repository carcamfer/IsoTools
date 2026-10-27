---
tipo: comunicacion
regla: rule-aiml-001
fuente: collect_vibration_data
destino: analyze_vibration_patterns
evento: VIBRATION_SAMPLES_READY
protocolo: MQTT
rama: comm/collect_vibration_data__analyze_vibration_patterns
programadores:
actualizado: 2026-06-28
tags: [comunicacion, VIBRATION_SAMPLES_READY]
---
# collect_vibration_data → analyze_vibration_patterns

> Regla `rule-aiml-001` · evento `VIBRATION_SAMPLES_READY` · protocolo MQTT
> Rama de trabajo: `comm/collect_vibration_data__analyze_vibration_patterns`

## Las dos tools
- **Fuente:** [[../tools/collect_vibration_data]]
- **Destino:** [[../tools/analyze_vibration_patterns]]

## Contrato
- **Evento:** `VIBRATION_SAMPLES_READY`
- **Protocolo / topic:** MQTT `cloud/ml/vibration/raw`
- **Condición de disparo:** `always`
- **Descripción:** Datos crudos de vibración enviados a análisis de patrones en cloud

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "VIBRATION_SAMPLES_READY" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm collect_vibration_data__analyze_vibration_patterns` (crea/cambia a la rama `comm/collect_vibration_data__analyze_vibration_patterns`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

