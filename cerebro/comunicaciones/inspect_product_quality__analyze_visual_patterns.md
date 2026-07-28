---
tipo: comunicacion
regla: rule-vision-004
fuente: inspect_product_quality
destino: analyze_visual_patterns
evento: DEFECT_FOUND
protocolo: HTTPS
rama: comm/inspect_product_quality__analyze_visual_patterns
programadores:
actualizado: 2026-06-28
tags: [comunicacion, DEFECT_FOUND]
---
# inspect_product_quality → analyze_visual_patterns

> Regla `rule-vision-004` · evento `DEFECT_FOUND` · protocolo HTTPS
> Rama de trabajo: `comm/inspect_product_quality__analyze_visual_patterns`

## Las dos tools
- **Fuente:** [[../tools/inspect_product_quality]]
- **Destino:** [[../tools/analyze_visual_patterns]]

## Contrato
- **Evento:** `DEFECT_FOUND`
- **Protocolo / topic:** HTTPS `POST /api/vision/patterns`
- **Condición de disparo:** `defectFound === true`
- **Descripción:** Defectos encontrados se envían al análisis de patrones en cloud

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "DEFECT_FOUND" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.
- [2026-07-27] (Carlos) **Cambia quién produce `DEFECT_FOUND`:** ahora el servicio EXTERNO de visión. La regla `rule-vision-004` se conserva, pero `analyze_visual_patterns` sigue sin handler nativo, así que hoy el bus la ignora. Condición `defectFound === true` sobre el payload del externo.

## Flujo de trabajo
1. `npm run rama:comm inspect_product_quality__analyze_visual_patterns` (crea/cambia a la rama `comm/inspect_product_quality__analyze_visual_patterns`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

