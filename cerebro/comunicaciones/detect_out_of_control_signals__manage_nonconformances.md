---
tipo: comunicacion
regla: rule-qual-003
fuente: detect_out_of_control_signals
destino: manage_nonconformances
evento: OUT_OF_CONTROL_DETECTED
protocolo: REST
rama: comm/detect_out_of_control_signals__manage_nonconformances
programadores:
actualizado: 2026-06-28
tags: [comunicacion, OUT_OF_CONTROL_DETECTED]
---
# detect_out_of_control_signals → manage_nonconformances

> Regla `rule-qual-003` · evento `OUT_OF_CONTROL_DETECTED` · protocolo REST
> Rama de trabajo: `comm/detect_out_of_control_signals__manage_nonconformances`

## Las dos tools
- **Fuente:** [[../tools/detect_out_of_control_signals]]
- **Destino:** [[../tools/manage_nonconformances]]

## Contrato
- **Evento:** `OUT_OF_CONTROL_DETECTED`
- **Protocolo / topic:** REST `POST /api/quality/nc/create`
- **Condición de disparo:** `violationsDetected == true`
- **Descripción:** Señal fuera de control detectada abre automáticamente una no conformidad

## Forma del payload
```json
{
  "event": { "type": "OUT_OF_CONTROL_DETECTED", "category": "quality", "severity": "high" },
  "data": {
    "chartId": "CHART-001",
    "violationsDetected": true,
    "violations": [
      {
        "rule": "Nelson 1",
        "points": [12],
        "description": "1 punto(s) fuera de los límites de control ±3σ"
      }
    ],
    "rules_applied": ["Nelson 1", "Nelson 2", "..."],
    "total_points_analyzed": 25,
    "iso_clause": "8.3",
    "iso_stage": "Operación"
  }
}
```
`violationsDetected` siempre es `true` cuando el evento se publica (si no hay violación, `detect_out_of_control_signals` no publica nada — por eso `rule-qual-003` lo puede usar como `triggerCondition`, pero de hecho siempre se cumple cuando el evento llega). `chartId` se mantiene en camelCase porque `manage_nonconformances` lo lee directo del payload, no solo en el `triggerCondition`. `severity` es `"high"` si hay un punto fuera de ±3σ (Nelson 1 / Western Electric 1) o más de una regla violada a la vez; si no, `"medium"`. `violations[].rule` puede ser cualquiera de las 8 reglas de Nelson o las 4 de Western Electric, según el `rulesSet` con que se corrió la detección.

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.
- [2026-10-22] (Rumbar) se llena la forma del payload con la salida real del handler implementado (`src/tools/detect_out_of_control_signals.js` en rumbar-tools), para que `manage_nonconformances` no tenga que preguntarlo — queda listo para el Ensayo Integral (PR-ORCA-ENS-001), Escenario 2.

## Flujo de trabajo
1. `npm run rama:comm detect_out_of_control_signals__manage_nonconformances` (crea/cambia a la rama `comm/detect_out_of_control_signals__manage_nonconformances`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `main` cuando el contrato quede estable.

