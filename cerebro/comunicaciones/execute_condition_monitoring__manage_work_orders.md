---
tipo: comunicacion
regla: rule-maint-001
fuente: execute_condition_monitoring
destino: manage_work_orders
evento: CONDITION_DEGRADED
protocolo: MQTT
rama: comm/execute_condition_monitoring__manage_work_orders
programadores:
actualizado: 2026-06-28
tags: [comunicacion, CONDITION_DEGRADED]
---
# execute_condition_monitoring → manage_work_orders

> Regla `rule-maint-001` · evento `CONDITION_DEGRADED` · protocolo MQTT
> Rama de trabajo: `comm/execute_condition_monitoring__manage_work_orders`

## Las dos tools
- **Fuente:** [[../tools/execute_condition_monitoring]]
- **Destino:** [[../tools/manage_work_orders]]

## Contrato
- **Evento:** `CONDITION_DEGRADED`
- **Protocolo / topic:** MQTT `maintenance/condition/alert`
- **Condición de disparo:** `conditionIndex < 60 OR recommendedAction IN ['inspect','repair_now']`
- **Descripción:** Condición de activo degradada genera orden de trabajo automáticamente

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "CONDITION_DEGRADED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm execute_condition_monitoring__manage_work_orders` (crea/cambia a la rama `comm/execute_condition_monitoring__manage_work_orders`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

