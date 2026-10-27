---
tipo: comunicacion
regla: rule-vision-006
fuente: train_vision_model
destino: improve_detection_model
evento: MODEL_TRAINED
protocolo: REST
rama: comm/train_vision_model__improve_detection_model
programadores:
actualizado: 2026-06-28
tags: [comunicacion, MODEL_TRAINED]
---
# train_vision_model → improve_detection_model

> Regla `rule-vision-006` · evento `MODEL_TRAINED` · protocolo REST
> Rama de trabajo: `comm/train_vision_model__improve_detection_model`

## Las dos tools
- **Fuente:** [[../tools/train_vision_model]]
- **Destino:** [[../tools/improve_detection_model]]

## Contrato
- **Evento:** `MODEL_TRAINED`
- **Protocolo / topic:** REST `POST /api/vision/improve`
- **Condición de disparo:** `accuracy > 0.9`
- **Descripción:** Modelo entrenado se somete a mejora adicional con fine-tuning

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "MODEL_TRAINED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm train_vision_model__improve_detection_model` (crea/cambia a la rama `comm/train_vision_model__improve_detection_model`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

