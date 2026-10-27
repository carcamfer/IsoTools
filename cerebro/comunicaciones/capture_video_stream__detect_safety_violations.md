---
tipo: comunicacion
regla: rule-vision-002
fuente: capture_video_stream
destino: detect_safety_violations
evento: FRAME_CAPTURED
protocolo: Internal
rama: comm/capture_video_stream__detect_safety_violations
programadores:
actualizado: 2026-06-28
tags: [comunicacion, FRAME_CAPTURED]
---
# capture_video_stream → detect_safety_violations

> Regla `rule-vision-002` · evento `FRAME_CAPTURED` · protocolo Internal
> Rama de trabajo: `comm/capture_video_stream__detect_safety_violations`

## Las dos tools
- **Fuente:** [[../tools/capture_video_stream]]
- **Destino:** [[../tools/detect_safety_violations]]

## Contrato
- **Evento:** `FRAME_CAPTURED`
- **Protocolo / topic:** Internal `edge/vision/safety-frame`
- **Condición de disparo:** `zone === 'work_area'`
- **Descripción:** Frames de zona de trabajo se analizan para violaciones de seguridad

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

## Flujo de trabajo
1. `npm run rama:comm capture_video_stream__detect_safety_violations` (crea/cambia a la rama `comm/capture_video_stream__detect_safety_violations`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

