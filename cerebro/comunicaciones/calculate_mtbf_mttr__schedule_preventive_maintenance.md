---
tipo: comunicacion
regla: rule-maint-003
fuente: calculate_mtbf_mttr
destino: schedule_preventive_maintenance
evento: RELIABILITY_DATA_UPDATED
protocolo: REST
rama: comm/calculate_mtbf_mttr__schedule_preventive_maintenance
programadores:
actualizado: 2026-06-28
tags: [comunicacion, RELIABILITY_DATA_UPDATED]
---
# calculate_mtbf_mttr → schedule_preventive_maintenance

> Regla `rule-maint-003` · evento `RELIABILITY_DATA_UPDATED` · protocolo REST
> Rama de trabajo: `comm/calculate_mtbf_mttr__schedule_preventive_maintenance`

## Las dos tools
- **Fuente:** [[../tools/calculate_mtbf_mttr]]
- **Destino:** [[../tools/schedule_preventive_maintenance]]

## Contrato
- **Evento:** `RELIABILITY_DATA_UPDATED`
- **Protocolo / topic:** REST `POST /api/maintenance/pm/schedule`
- **Condición de disparo:** `trend == 'degrading' OR mtbfHours < baseline`
- **Descripción:** MTBF actualizado con tendencia a degradación reajusta plan de PM

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "RELIABILITY_DATA_UPDATED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm calculate_mtbf_mttr__schedule_preventive_maintenance` (crea/cambia a la rama `comm/calculate_mtbf_mttr__schedule_preventive_maintenance`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

