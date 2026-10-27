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

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "OUT_OF_CONTROL_DETECTED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm detect_out_of_control_signals__manage_nonconformances` (crea/cambia a la rama `comm/detect_out_of_control_signals__manage_nonconformances`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

