---
tipo: comunicacion
regla: rule-vision-005
fuente: analyze_visual_patterns
destino: train_vision_model
evento: PATTERN_ANALYSIS_COMPLETE
protocolo: REST
rama: comm/analyze_visual_patterns__train_vision_model
programadores:
actualizado: 2026-06-28
tags: [comunicacion, PATTERN_ANALYSIS_COMPLETE]
---
# analyze_visual_patterns → train_vision_model

> Regla `rule-vision-005` · evento `PATTERN_ANALYSIS_COMPLETE` · protocolo REST
> Rama de trabajo: `comm/analyze_visual_patterns__train_vision_model`

## Las dos tools
- **Fuente:** [[../tools/analyze_visual_patterns]]
- **Destino:** [[../tools/train_vision_model]]

## Contrato
- **Evento:** `PATTERN_ANALYSIS_COMPLETE`
- **Protocolo / topic:** REST `POST /api/vision/retrain`
- **Condición de disparo:** `defectTrend === 'worsening'`
- **Descripción:** Tendencia de empeoramiento dispara reentrenamiento del modelo

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "PATTERN_ANALYSIS_COMPLETE" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm analyze_visual_patterns__train_vision_model` (crea/cambia a la rama `comm/analyze_visual_patterns__train_vision_model`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

