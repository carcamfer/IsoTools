---
tipo: comunicacion
regla: rule-hse-004
fuente: run_hazop_analysis
destino: calculate_sil_level
evento: HAZOP_UNACCEPTABLE_RISK
protocolo: REST
rama: comm/run_hazop_analysis__calculate_sil_level
programadores:
actualizado: 2026-06-28
tags: [comunicacion, HAZOP_UNACCEPTABLE_RISK]
---
# run_hazop_analysis → calculate_sil_level

> Regla `rule-hse-004` · evento `HAZOP_UNACCEPTABLE_RISK` · protocolo REST
> Rama de trabajo: `comm/run_hazop_analysis__calculate_sil_level`

## Las dos tools
- **Fuente:** [[../tools/run_hazop_analysis]]
- **Destino:** [[../tools/calculate_sil_level]]

## Contrato
- **Evento:** `HAZOP_UNACCEPTABLE_RISK`
- **Protocolo / topic:** REST `POST /api/hse/sil/calculate`
- **Condición de disparo:** `unacceptableRisks > 0`
- **Descripción:** Riesgo inaceptable en HAZOP activa cálculo de nivel SIL requerido

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "HAZOP_UNACCEPTABLE_RISK" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm run_hazop_analysis__calculate_sil_level` (crea/cambia a la rama `comm/run_hazop_analysis__calculate_sil_level`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

