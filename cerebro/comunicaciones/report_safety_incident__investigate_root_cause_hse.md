---
tipo: comunicacion
regla: rule-hse-002
fuente: report_safety_incident
destino: investigate_root_cause_hse
evento: INCIDENT_REPORTED
protocolo: REST
rama: comm/report_safety_incident__investigate_root_cause_hse
programadores:
actualizado: 2026-06-28
tags: [comunicacion, INCIDENT_REPORTED]
---
# report_safety_incident → investigate_root_cause_hse

> Regla `rule-hse-002` · evento `INCIDENT_REPORTED` · protocolo REST
> Rama de trabajo: `comm/report_safety_incident__investigate_root_cause_hse`

## Las dos tools
- **Fuente:** [[../tools/report_safety_incident]]
- **Destino:** [[../tools/investigate_root_cause_hse]]

## Contrato
- **Evento:** `INCIDENT_REPORTED`
- **Protocolo / topic:** REST `POST /api/hse/investigate`
- **Condición de disparo:** `investigationRequired == true`
- **Descripción:** Incidente que requiere investigación abre automáticamente flujo de análisis de causa raíz

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "INCIDENT_REPORTED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm report_safety_incident__investigate_root_cause_hse` (crea/cambia a la rama `comm/report_safety_incident__investigate_root_cause_hse`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

