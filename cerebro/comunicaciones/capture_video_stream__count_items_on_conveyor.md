---
tipo: comunicacion
regla: rule-vision-003
fuente: capture_video_stream
destino: count_items_on_conveyor
evento: CONVEYOR_FRAME
protocolo: Internal
rama: comm/capture_video_stream__count_items_on_conveyor
programadores:
actualizado: 2026-06-28
tags: [comunicacion, CONVEYOR_FRAME]
---
# capture_video_stream → count_items_on_conveyor

> Regla `rule-vision-003` · evento `CONVEYOR_FRAME` · protocolo Internal
> Rama de trabajo: `comm/capture_video_stream__count_items_on_conveyor`

## Las dos tools
- **Fuente:** [[../tools/capture_video_stream]]
- **Destino:** [[../tools/count_items_on_conveyor]]

## Contrato
- **Evento:** `CONVEYOR_FRAME`
- **Protocolo / topic:** Internal `edge/vision/conveyor-frame`
- **Condición de disparo:** `zone === 'conveyor'`
- **Descripción:** Frames de la cinta se envían al contador de ítems

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "CONVEYOR_FRAME" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm capture_video_stream__count_items_on_conveyor` (crea/cambia a la rama `comm/capture_video_stream__count_items_on_conveyor`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

