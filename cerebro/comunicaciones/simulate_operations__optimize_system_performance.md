---
tipo: comunicacion
regla: rule-twin-004
fuente: simulate_operations
destino: optimize_system_performance
evento: SIMULATION_COMPLETE
protocolo: REST
rama: comm/simulate_operations__optimize_system_performance
programadores:
actualizado: 2026-06-28
tags: [comunicacion, SIMULATION_COMPLETE]
---
# simulate_operations → optimize_system_performance

> Regla `rule-twin-004` · evento `SIMULATION_COMPLETE` · protocolo REST
> Rama de trabajo: `comm/simulate_operations__optimize_system_performance`

## Las dos tools
- **Fuente:** [[../tools/simulate_operations]]
- **Destino:** [[../tools/optimize_system_performance]]

## Contrato
- **Evento:** `SIMULATION_COMPLETE`
- **Protocolo / topic:** REST `POST /api/twin/optimize`
- **Condición de disparo:** `projectedImprovement > 0.02`
- **Descripción:** Resultado de simulación con mejora > 2% activa optimización global

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "SIMULATION_COMPLETE" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm simulate_operations__optimize_system_performance` (crea/cambia a la rama `comm/simulate_operations__optimize_system_performance`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

