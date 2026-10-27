---
tipo: comunicacion
regla: rule-maint-004
fuente: analyze_failure_modes
destino: schedule_preventive_maintenance
evento: FMEA_CRITICAL_FOUND
protocolo: REST
rama: comm/analyze_failure_modes__schedule_preventive_maintenance
programadores:
actualizado: 2026-06-28
tags: [comunicacion, FMEA_CRITICAL_FOUND]
---
# analyze_failure_modes → schedule_preventive_maintenance

> Regla `rule-maint-004` · evento `FMEA_CRITICAL_FOUND` · protocolo REST
> Rama de trabajo: `comm/analyze_failure_modes__schedule_preventive_maintenance`

## Las dos tools
- **Fuente:** [[../tools/analyze_failure_modes]]
- **Destino:** [[../tools/schedule_preventive_maintenance]]

## Contrato
- **Evento:** `FMEA_CRITICAL_FOUND`
- **Protocolo / topic:** REST `POST /api/maintenance/pm/schedule`
- **Condición de disparo:** `criticalItems > 0`
- **Descripción:** Modos de falla críticos detectados activan revisión del plan de mantenimiento preventivo

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "FMEA_CRITICAL_FOUND" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm analyze_failure_modes__schedule_preventive_maintenance` (crea/cambia a la rama `comm/analyze_failure_modes__schedule_preventive_maintenance`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

