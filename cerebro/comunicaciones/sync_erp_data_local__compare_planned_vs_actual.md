---
tipo: comunicacion
regla: rule-conn-001
fuente: sync_erp_data_local
destino: compare_planned_vs_actual
evento: ERP_SALES_PERIOD_CLOSED
protocolo: REST
rama: comm/sync_erp_data_local__compare_planned_vs_actual
programadores:
actualizado: 2026-09-30
tags: [comunicacion, ERP_SALES_PERIOD_CLOSED]
---
# sync_erp_data_local → compare_planned_vs_actual

> Regla `rule-conn-001` · evento `ERP_SALES_PERIOD_CLOSED` · protocolo REST
> Rama de trabajo: `comm/sync_erp_data_local__compare_planned_vs_actual`

## Las dos tools
- **Fuente:** [[../tools/sync_erp_data_local]]
- **Destino:** [[../tools/compare_planned_vs_actual]]

## Contrato
- **Evento:** `ERP_SALES_PERIOD_CLOSED`
- **Protocolo / topic:** REST `POST /api/mgmt/plan-vs-real`
- **Condición de disparo:** `always`
- **Descripción:** Cierre de ventas del periodo desde el ERP alimenta la comparacion plan vs real

## Forma del payload
```json
{
  "event": { "type": "ERP_SALES_PERIOD_CLOSED" },
  "data": {
      "module": "sales",
      "periodStart": "2026-09-28",
      "periodEnd": "2026-09-28",
      "period": "2026-09-28_2026-09-28",
      "plantId": "plant_01",
      "actual": 124743.35,
      "unit": "MXN",
      "documentos": 27,
      "unidades": 216,
      "devuelto": 6003.27,
      "erpType": "microsip"
  }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-09-30] (auto) nota inicial generada desde communication-rules.json.
- [2026-09-30] (Carlos+Claude) contrato inicial. Origen real: conector `erp_microsip_cierre` (`/api/ventas/cierre`), no la tool `sync_erp_data_local` — se usa ese `sourceToolId` porque `validate-platform-data.js` exige que la fuente exista en `tools.json` y es el precedente de `rule-erp-001`.
- [2026-09-30] (Carlos+Claude) CAMBIO DE CONTRATO: se agrego `sales` al enum de `inputSchema.properties.module` de compare_planned_vs_actual (antes solo production|purchasing|costs). Sin eso no hay valor valido para un cierre de ventas.
- [2026-09-30] (Carlos+Claude) el evento NO trae `planned`. Microsip no lleva presupuesto de ventas, y la meta se decidio como dato de gobernanza: vive en `METAS` de `src/tools/compare_planned_vs_actual.js`, versionada en git. Sin meta el handler publica `status: "sin_meta"` y `deviationPercent: null` en lugar de inventar un 0 %.

## Flujo de trabajo
1. `npm run rama:comm sync_erp_data_local__compare_planned_vs_actual` (crea/cambia a la rama `comm/sync_erp_data_local__compare_planned_vs_actual`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

