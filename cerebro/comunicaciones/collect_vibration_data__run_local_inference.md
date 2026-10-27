---
tipo: comunicacion
regla: rule-aiml-002
fuente: collect_vibration_data
destino: run_local_inference
evento: VIBRATION_SAMPLES_READY
protocolo: Internal
rama: comm/collect_vibration_data__run_local_inference
programadores:
actualizado: 2026-06-28
tags: [comunicacion, VIBRATION_SAMPLES_READY]
---
# collect_vibration_data → run_local_inference

> Regla `rule-aiml-002` · evento `VIBRATION_SAMPLES_READY` · protocolo Internal
> Rama de trabajo: `comm/collect_vibration_data__run_local_inference`

## Las dos tools
- **Fuente:** [[../tools/collect_vibration_data]]
- **Destino:** [[../tools/run_local_inference]]

## Contrato
- **Evento:** `VIBRATION_SAMPLES_READY`
- **Protocolo / topic:** Internal `edge/ml/infer`
- **Condición de disparo:** `cloudUnavailable === true`
- **Descripción:** Sin conectividad cloud, inferencia corre localmente en el edge

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
1. `npm run rama:comm collect_vibration_data__run_local_inference` (crea/cambia a la rama `comm/collect_vibration_data__run_local_inference`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

