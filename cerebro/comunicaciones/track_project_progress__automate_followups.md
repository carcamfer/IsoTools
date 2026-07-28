---
tipo: comunicacion
regla: rule-pkg-012
fuente: track_project_progress
destino: automate_followups
evento: PROJECT_AT_RISK
protocolo: REST
rama: comm/track_project_progress__automate_followups
programadores:
actualizado: 2026-07-23
tags: [comunicacion, PROJECT_AT_RISK]
---
# track_project_progress -> automate_followups

> Regla `rule-pkg-012` - evento `PROJECT_AT_RISK` - protocolo REST
> Rama de trabajo: `comm/track_project_progress__automate_followups`

## Las dos tools
- **Fuente:** [[../tools/track_project_progress]]
- **Destino:** [[../tools/automate_followups]]

## Contrato
- **Evento:** `PROJECT_AT_RISK`
- **Protocolo / topic:** REST `POST /api/mgmt/followups`
- **Condicion de disparo:** `status == 'at_risk'`
- **Descripcion:** Proyecto en riesgo agenda seguimientos automaticos con los responsables

## Forma del payload
```json
{
  "event": {
    "type": "PROJECT_AT_RISK",
    "category": "erp",
    "severity": "medium|high"
  },
  "data": {
    "project_id": "PRJ-001",
    "projectId": "PRJ-001",
    "organization_id": "ORG-001",
    "completionPercent": 34,
    "milestonesCompleted": 2,
    "milestonesTotal": 6,
    "budgetUsedPercent": 50,
    "status": "at_risk",
    "severity": "medium",
    "risk_reasons": ["budget_overrun"],
    "targetType": "order",
    "targetIds": ["PRJ-001"],
    "target_type": "order",
    "target_ids": ["PRJ-001"],
    "audit": {},
    "data_quality": {}
  }
}
```

## Bitacora de la comunicacion
<!-- Cada cambio en el contrato entre estas dos tools se anota aqui.
     Asi el programador del otro lado ve que cambio sin leer el codigo.
     Formato:  - [YYYY-MM-DD] (quien) que cambio en el payload/condicion y por que -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.
- [2026-07-23] (codex) Se conserva la condicion `status == 'at_risk'`; `delayed` puede emitirse como `PROJECT_AT_RISK` pero no dispara followups en V1. El payload ahora incluye `targetType` y `targetIds` para satisfacer el contrato de `automate_followups`.

## Flujo de trabajo
1. `npm run rama:comm track_project_progress__automate_followups` (crea/cambia a la rama `comm/track_project_progress__automate_followups`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitacora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.
