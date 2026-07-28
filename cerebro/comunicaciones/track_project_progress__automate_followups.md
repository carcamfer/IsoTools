---
tipo: comunicacion
regla: rule-pkg-012
fuente: track_project_progress
destino: automate_followups
evento: PROJECT_AT_RISK
protocolo: REST
rama: comm/track_project_progress__automate_followups
programadores:
actualizado: 2026-06-28
tags: [comunicacion, PROJECT_AT_RISK]
---
# track_project_progress → automate_followups

> Regla `rule-pkg-012` · evento `PROJECT_AT_RISK` · protocolo REST
> Rama de trabajo: `comm/track_project_progress__automate_followups`

## Las dos tools
- **Fuente:** [[../tools/track_project_progress]]
- **Destino:** [[../tools/automate_followups]]

## Contrato
- **Evento:** `PROJECT_AT_RISK`
- **Protocolo / topic:** REST `POST /api/mgmt/followups`
- **Condición de disparo:** `status == 'at_risk'`
- **Descripción:** Proyecto en riesgo agenda seguimientos automáticos con los responsables

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "PROJECT_AT_RISK" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.
- [2026-07-27] (Carlos) **`automate_followups` pasa a dueño EXTERNO.** Se retiró el handler nativo y la regla `rule-pkg-012` del bus (duplicaba los seguimientos del servicio externo). El contrato sigue vigente: el servicio externo consume `PROJECT_AT_RISK` por la API y publica `FOLLOWUP_SCHEDULED`. Ojo: la condición `status == 'at_risk'` ya no la evalúa el bus — **la tiene que aplicar el consumidor externo**.

## Flujo de trabajo
1. `npm run rama:comm track_project_progress__automate_followups` (crea/cambia a la rama `comm/track_project_progress__automate_followups`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

