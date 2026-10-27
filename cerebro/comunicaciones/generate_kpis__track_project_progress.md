---
tipo: comunicacion
regla: rule-pkg-011
fuente: generate_kpis
destino: track_project_progress
evento: KPI_REPORT_GENERATED
protocolo: REST
rama: comm/generate_kpis__track_project_progress
programadores:
actualizado: 2026-06-28
tags: [comunicacion, KPI_REPORT_GENERATED]
---
# generate_kpis → track_project_progress

> Regla `rule-pkg-011` · evento `KPI_REPORT_GENERATED` · protocolo REST
> Rama de trabajo: `comm/generate_kpis__track_project_progress`

## Las dos tools
- **Fuente:** [[../tools/generate_kpis]]
- **Destino:** [[../tools/track_project_progress]]

## Contrato
- **Evento:** `KPI_REPORT_GENERATED`
- **Protocolo / topic:** REST `POST /api/mgmt/progress`
- **Condición de disparo:** `always`
- **Descripción:** KPIs generados actualizan el avance del proyecto de implementación ISO

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "KPI_REPORT_GENERATED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm generate_kpis__track_project_progress` (crea/cambia a la rama `comm/generate_kpis__track_project_progress`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

