---
tipo: comunicacion
regla: rule-hse-005
fuente: manage_work_permits
destino: track_safety_kpis
evento: PERMIT_CLOSED
protocolo: REST
rama: comm/manage_work_permits__track_safety_kpis
programadores:
actualizado: 2026-06-28
tags: [comunicacion, PERMIT_CLOSED]
---
# manage_work_permits → track_safety_kpis

> Regla `rule-hse-005` · evento `PERMIT_CLOSED` · protocolo REST
> Rama de trabajo: `comm/manage_work_permits__track_safety_kpis`

## Las dos tools
- **Fuente:** [[../tools/manage_work_permits]]
- **Destino:** [[../tools/track_safety_kpis]]

## Contrato
- **Evento:** `PERMIT_CLOSED`
- **Protocolo / topic:** REST `POST /api/hse/kpis/update`
- **Condición de disparo:** `status == 'closed'`
- **Descripción:** Cierre de permiso de trabajo actualiza los KPIs de seguridad del período

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "PERMIT_CLOSED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm manage_work_permits__track_safety_kpis` (crea/cambia a la rama `comm/manage_work_permits__track_safety_kpis`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

