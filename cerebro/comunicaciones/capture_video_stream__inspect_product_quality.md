---
tipo: comunicacion
regla: rule-vision-001
fuente: capture_video_stream
destino: inspect_product_quality
evento: FRAME_CAPTURED
protocolo: Internal
rama: comm/capture_video_stream__inspect_product_quality
programadores:
actualizado: 2026-06-28
tags: [comunicacion, FRAME_CAPTURED]
---
# capture_video_stream → inspect_product_quality

> Regla `rule-vision-001` · evento `FRAME_CAPTURED` · protocolo Internal
> Rama de trabajo: `comm/capture_video_stream__inspect_product_quality`

## Las dos tools
- **Fuente:** [[../tools/capture_video_stream]]
- **Destino:** [[../tools/inspect_product_quality]]

## Contrato
- **Evento:** `FRAME_CAPTURED`
- **Protocolo / topic:** Internal `edge/vision/frame`
- **Condición de disparo:** `always`
- **Descripción:** Cada frame capturado se pasa al inspector de calidad

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "FRAME_CAPTURED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.
- [2026-07-27] (Carlos) **`inspect_product_quality` pasa a dueño EXTERNO.** Se retiró el handler nativo y **se eliminó la regla `rule-vision-001`**: el bus ya no hace nada al recibir `FRAME_CAPTURED` para inspección. Esta comunicación ya **no la ejecuta la plataforma** — el servicio externo consume `FRAME_CAPTURED` por `GET /api/v1/events` y publica `DEFECT_FOUND` por `POST /api/v1/events`.

## Flujo de trabajo
1. `npm run rama:comm capture_video_stream__inspect_product_quality` (crea/cambia a la rama `comm/capture_video_stream__inspect_product_quality`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

