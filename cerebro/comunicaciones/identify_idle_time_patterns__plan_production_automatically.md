---
tipo: comunicacion
regla: rule-prod-006
fuente: identify_idle_time_patterns
destino: plan_production_automatically
evento: PATTERNS_IDENTIFIED
protocolo: REST
rama: comm/identify_idle_time_patterns__plan_production_automatically
programadores:
actualizado: 2026-06-28
tags: [comunicacion, PATTERNS_IDENTIFIED]
---
# identify_idle_time_patterns → plan_production_automatically

> Regla `rule-prod-006` · evento `PATTERNS_IDENTIFIED` · protocolo REST
> Rama de trabajo: `comm/identify_idle_time_patterns__plan_production_automatically`

## Las dos tools
- **Fuente:** [[../tools/identify_idle_time_patterns]]
- **Destino:** [[../tools/plan_production_automatically]]

## Contrato
- **Evento:** `PATTERNS_IDENTIFIED`
- **Protocolo / topic:** REST `POST /api/prod/replan`
- **Condición de disparo:** `always`
- **Descripción:** Patrones de tiempo muerto alimentan la planificación automática

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "PATTERNS_IDENTIFIED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm identify_idle_time_patterns__plan_production_automatically` (crea/cambia a la rama `comm/identify_idle_time_patterns__plan_production_automatically`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

