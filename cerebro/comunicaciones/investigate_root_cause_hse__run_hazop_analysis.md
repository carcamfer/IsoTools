---
tipo: comunicacion
regla: rule-hse-003
fuente: investigate_root_cause_hse
destino: run_hazop_analysis
evento: ROOT_CAUSE_SYSTEMIC
protocolo: REST
rama: comm/investigate_root_cause_hse__run_hazop_analysis
programadores:
actualizado: 2026-06-28
tags: [comunicacion, ROOT_CAUSE_SYSTEMIC]
---
# investigate_root_cause_hse → run_hazop_analysis

> Regla `rule-hse-003` · evento `ROOT_CAUSE_SYSTEMIC` · protocolo REST
> Rama de trabajo: `comm/investigate_root_cause_hse__run_hazop_analysis`

## Las dos tools
- **Fuente:** [[../tools/investigate_root_cause_hse]]
- **Destino:** [[../tools/run_hazop_analysis]]

## Contrato
- **Evento:** `ROOT_CAUSE_SYSTEMIC`
- **Protocolo / topic:** REST `POST /api/hse/hazop/run`
- **Condición de disparo:** `similarIncidentRisk IN ['medium','high']`
- **Descripción:** Causa raíz sistémica con riesgo medio/alto activa HAZOP del nodo de proceso afectado

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "ROOT_CAUSE_SYSTEMIC" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm investigate_root_cause_hse__run_hazop_analysis` (crea/cambia a la rama `comm/investigate_root_cause_hse__run_hazop_analysis`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

