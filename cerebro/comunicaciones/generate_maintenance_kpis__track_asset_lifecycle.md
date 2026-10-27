---
tipo: comunicacion
regla: rule-maint-005
fuente: generate_maintenance_kpis
destino: track_asset_lifecycle
evento: MAINTENANCE_KPIS_READY
protocolo: MQTT
rama: comm/generate_maintenance_kpis__track_asset_lifecycle
programadores:
actualizado: 2026-06-28
tags: [comunicacion, MAINTENANCE_KPIS_READY]
---
# generate_maintenance_kpis → track_asset_lifecycle

> Regla `rule-maint-005` · evento `MAINTENANCE_KPIS_READY` · protocolo MQTT
> Rama de trabajo: `comm/generate_maintenance_kpis__track_asset_lifecycle`

## Las dos tools
- **Fuente:** [[../tools/generate_maintenance_kpis]]
- **Destino:** [[../tools/track_asset_lifecycle]]

## Contrato
- **Evento:** `MAINTENANCE_KPIS_READY`
- **Protocolo / topic:** MQTT `maintenance/kpis/updated`
- **Condición de disparo:** `always`
- **Descripción:** KPIs de mantenimiento alimentan el modelo de ciclo de vida del activo

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "MAINTENANCE_KPIS_READY" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm generate_maintenance_kpis__track_asset_lifecycle` (crea/cambia a la rama `comm/generate_maintenance_kpis__track_asset_lifecycle`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

