---
tipo: comunicacion
regla: rule-pkg-006
fuente: collect_quality_measurements
destino: calculate_cpk_ppk
evento: MEASUREMENTS_CAPTURED
protocolo: REST
rama: comm/collect_quality_measurements__calculate_cpk_ppk
programadores:
actualizado: 2026-06-28
tags: [comunicacion, MEASUREMENTS_CAPTURED]
---
# collect_quality_measurements → calculate_cpk_ppk

> Regla `rule-pkg-006` · evento `MEASUREMENTS_CAPTURED` · protocolo REST
> Rama de trabajo: `comm/collect_quality_measurements__calculate_cpk_ppk`

## Las dos tools
- **Fuente:** [[../tools/collect_quality_measurements]]
- **Destino:** [[../tools/calculate_cpk_ppk]]

## Contrato
- **Evento:** `MEASUREMENTS_CAPTURED`
- **Protocolo / topic:** REST `POST /api/quality/capability`
- **Condición de disparo:** `defectsFound >= 0`
- **Descripción:** Mediciones capturadas alimentan el cálculo de capacidad de proceso (Cpk/Ppk)

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
1. `npm run rama:comm collect_quality_measurements__calculate_cpk_ppk` (crea/cambia a la rama `comm/collect_quality_measurements__calculate_cpk_ppk`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

