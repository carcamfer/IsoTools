---
tipo: comunicacion
regla: rule-aiml-007
fuente: detect_process_deviation
destino: optimize_production_sequence
evento: DEVIATION_DETECTED
protocolo: REST
rama: comm/detect_process_deviation__optimize_production_sequence
programadores:
actualizado: 2026-06-28
tags: [comunicacion, DEVIATION_DETECTED]
---
# detect_process_deviation → optimize_production_sequence

> Regla `rule-aiml-007` · evento `DEVIATION_DETECTED` · protocolo REST
> Rama de trabajo: `comm/detect_process_deviation__optimize_production_sequence`

## Las dos tools
- **Fuente:** [[../tools/detect_process_deviation]]
- **Destino:** [[../tools/optimize_production_sequence]]

## Contrato
- **Evento:** `DEVIATION_DETECTED`
- **Protocolo / topic:** REST `POST /api/ml/reoptimize`
- **Condición de disparo:** `deviationDetected === true`
- **Descripción:** Desviación de proceso dispara reoptimización de secuencia

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "DEVIATION_DETECTED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm detect_process_deviation__optimize_production_sequence` (crea/cambia a la rama `comm/detect_process_deviation__optimize_production_sequence`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

