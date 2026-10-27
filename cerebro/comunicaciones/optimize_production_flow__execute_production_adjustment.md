---
tipo: comunicacion
regla: rule-prod-005
fuente: optimize_production_flow
destino: execute_production_adjustment
evento: FLOW_OPTIMIZED
protocolo: MQTT
rama: comm/optimize_production_flow__execute_production_adjustment
programadores:
actualizado: 2026-06-28
tags: [comunicacion, FLOW_OPTIMIZED]
---
# optimize_production_flow → execute_production_adjustment

> Regla `rule-prod-005` · evento `FLOW_OPTIMIZED` · protocolo MQTT
> Rama de trabajo: `comm/optimize_production_flow__execute_production_adjustment`

## Las dos tools
- **Fuente:** [[../tools/optimize_production_flow]]
- **Destino:** [[../tools/execute_production_adjustment]]

## Contrato
- **Evento:** `FLOW_OPTIMIZED`
- **Protocolo / topic:** MQTT `edge/prod/adjustments`
- **Condición de disparo:** `oeeDelta > 0.05`
- **Descripción:** Mejora de OEE > 5% aplica ajustes directamente en la máquina

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "FLOW_OPTIMIZED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm optimize_production_flow__execute_production_adjustment` (crea/cambia a la rama `comm/optimize_production_flow__execute_production_adjustment`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

