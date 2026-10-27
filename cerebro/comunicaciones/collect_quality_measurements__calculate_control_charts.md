---
tipo: comunicacion
regla: rule-qual-001
fuente: collect_quality_measurements
destino: calculate_control_charts
evento: MEASUREMENTS_CAPTURED
protocolo: REST
rama: comm/collect_quality_measurements__calculate_control_charts
programadores:
actualizado: 2026-06-28
tags: [comunicacion, MEASUREMENTS_CAPTURED]
---
# collect_quality_measurements → calculate_control_charts

> Regla `rule-qual-001` · evento `MEASUREMENTS_CAPTURED` · protocolo REST
> Rama de trabajo: `comm/collect_quality_measurements__calculate_control_charts`

## Las dos tools
- **Fuente:** [[../tools/collect_quality_measurements]]
- **Destino:** [[../tools/calculate_control_charts]]

## Contrato
- **Evento:** `MEASUREMENTS_CAPTURED`
- **Protocolo / topic:** REST `POST /api/quality/spc/update`
- **Condición de disparo:** `defectsFound >= 0`
- **Descripción:** Mediciones de calidad capturadas actualizan cartas de control SPC en tiempo real

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "MEASUREMENTS_CAPTURED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm collect_quality_measurements__calculate_control_charts` (crea/cambia a la rama `comm/collect_quality_measurements__calculate_control_charts`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

