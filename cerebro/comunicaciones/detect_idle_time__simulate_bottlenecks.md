---
tipo: comunicacion
regla: rule-prod-004
fuente: detect_idle_time
destino: simulate_bottlenecks
evento: IDLE_PATTERN_DETECTED
protocolo: HTTPS
rama: comm/detect_idle_time__simulate_bottlenecks
programadores:
actualizado: 2026-06-28
tags: [comunicacion, IDLE_PATTERN_DETECTED]
---
# detect_idle_time → simulate_bottlenecks

> Regla `rule-prod-004` · evento `IDLE_PATTERN_DETECTED` · protocolo HTTPS
> Rama de trabajo: `comm/detect_idle_time__simulate_bottlenecks`

## Las dos tools
- **Fuente:** [[../tools/detect_idle_time]]
- **Destino:** [[../tools/simulate_bottlenecks]]

## Contrato
- **Evento:** `IDLE_PATTERN_DETECTED`
- **Protocolo / topic:** HTTPS `POST /api/prod/simulate-bottleneck`
- **Condición de disparo:** `idleCount > 3`
- **Descripción:** Patrón recurrente de paros dispara simulación de cuellos de botella

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "IDLE_PATTERN_DETECTED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm detect_idle_time__simulate_bottlenecks` (crea/cambia a la rama `comm/detect_idle_time__simulate_bottlenecks`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

