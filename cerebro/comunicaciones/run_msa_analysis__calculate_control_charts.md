---
tipo: comunicacion
regla: rule-pkg-005
fuente: run_msa_analysis
destino: calculate_control_charts
evento: MSA_VALIDATED
protocolo: REST
rama: comm/run_msa_analysis__calculate_control_charts
programadores:
actualizado: 2026-06-28
tags: [comunicacion, MSA_VALIDATED]
---
# run_msa_analysis → calculate_control_charts

> Regla `rule-pkg-005` · evento `MSA_VALIDATED` · protocolo REST
> Rama de trabajo: `comm/run_msa_analysis__calculate_control_charts`

## Las dos tools
- **Fuente:** [[../tools/run_msa_analysis]]
- **Destino:** [[../tools/calculate_control_charts]]

## Contrato
- **Evento:** `MSA_VALIDATED`
- **Protocolo / topic:** REST `POST /api/quality/spc/update`
- **Condición de disparo:** `verdict == 'acceptable'`
- **Descripción:** Sistema de medición validado habilita el cálculo confiable de cartas de control

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "MSA_VALIDATED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm run_msa_analysis__calculate_control_charts` (crea/cambia a la rama `comm/run_msa_analysis__calculate_control_charts`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

