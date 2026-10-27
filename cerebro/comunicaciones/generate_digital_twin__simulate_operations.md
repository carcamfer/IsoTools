---
tipo: comunicacion
regla: rule-twin-003
fuente: generate_digital_twin
destino: simulate_operations
evento: TWIN_READY
protocolo: MQTT
rama: comm/generate_digital_twin__simulate_operations
programadores:
actualizado: 2026-06-28
tags: [comunicacion, TWIN_READY]
---
# generate_digital_twin → simulate_operations

> Regla `rule-twin-003` · evento `TWIN_READY` · protocolo MQTT
> Rama de trabajo: `comm/generate_digital_twin__simulate_operations`

## Las dos tools
- **Fuente:** [[../tools/generate_digital_twin]]
- **Destino:** [[../tools/simulate_operations]]

## Contrato
- **Evento:** `TWIN_READY`
- **Protocolo / topic:** MQTT `cloud/twin/simulate`
- **Condición de disparo:** `syncStatus === 'live'`
- **Descripción:** Gemelo sincronizado ejecuta simulaciones continuas de operaciones

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "TWIN_READY" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm generate_digital_twin__simulate_operations` (crea/cambia a la rama `comm/generate_digital_twin__simulate_operations`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

