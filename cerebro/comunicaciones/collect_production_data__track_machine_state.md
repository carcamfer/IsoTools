---
tipo: comunicacion
regla: rule-prod-001
fuente: collect_production_data
destino: track_machine_state
evento: PRODUCTION_DATA_CAPTURED
protocolo: Internal
rama: comm/collect_production_data__track_machine_state
programadores:
actualizado: 2026-06-28
tags: [comunicacion, PRODUCTION_DATA_CAPTURED]
---
# collect_production_data → track_machine_state

> Regla `rule-prod-001` · evento `PRODUCTION_DATA_CAPTURED` · protocolo Internal
> Rama de trabajo: `comm/collect_production_data__track_machine_state`

## Las dos tools
- **Fuente:** [[../tools/collect_production_data]]
- **Destino:** [[../tools/track_machine_state]]

## Contrato
- **Evento:** `PRODUCTION_DATA_CAPTURED`
- **Protocolo / topic:** Internal `edge/prod/machine-data`
- **Condición de disparo:** `always`
- **Descripción:** Datos de producción alimentan el rastreador de estado de máquina

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "PRODUCTION_DATA_CAPTURED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm collect_production_data__track_machine_state` (crea/cambia a la rama `comm/collect_production_data__track_machine_state`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

