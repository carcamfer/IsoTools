---
tipo: comunicacion
regla: rule-prod-003
fuente: detect_idle_time
destino: optimize_production_flow
evento: IDLE_TIME_DETECTED
protocolo: HTTPS
rama: comm/detect_idle_time__optimize_production_flow
programadores:
actualizado: 2026-06-28
tags: [comunicacion, IDLE_TIME_DETECTED]
---
# detect_idle_time → optimize_production_flow

> Regla `rule-prod-003` · evento `IDLE_TIME_DETECTED` · protocolo HTTPS
> Rama de trabajo: `comm/detect_idle_time__optimize_production_flow`

## Las dos tools
- **Fuente:** [[../tools/detect_idle_time]]
- **Destino:** [[../tools/optimize_production_flow]]

## Contrato
- **Evento:** `IDLE_TIME_DETECTED`
- **Protocolo / topic:** HTTPS `POST /api/prod/optimize-flow`
- **Condición de disparo:** `idleDurationSeconds > 300`
- **Descripción:** Tiempo muerto > 5min dispara optimización de flujo en cloud

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "IDLE_TIME_DETECTED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm detect_idle_time__optimize_production_flow` (crea/cambia a la rama `comm/detect_idle_time__optimize_production_flow`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

