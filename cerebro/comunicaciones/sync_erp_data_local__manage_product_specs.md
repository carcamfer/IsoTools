---
tipo: comunicacion
regla: rule-conn-003
fuente: sync_erp_data_local
destino: manage_product_specs
evento: ERP_ITEM_CREATED
protocolo: REST
rama: comm/sync_erp_data_local__manage_product_specs
programadores:
actualizado: 2026-09-30
tags: [comunicacion, ERP_ITEM_CREATED]
---
# sync_erp_data_local → manage_product_specs

> Regla `rule-conn-003` · evento `ERP_ITEM_CREATED` · protocolo REST
> Rama de trabajo: `comm/sync_erp_data_local__manage_product_specs`

## Las dos tools
- **Fuente:** [[../tools/sync_erp_data_local]]
- **Destino:** [[../tools/manage_product_specs]]

## Contrato
- **Evento:** `ERP_ITEM_CREATED`
- **Protocolo / topic:** REST `POST /api/quality/specs`
- **Condición de disparo:** `always`
- **Descripción:** Articulo nuevo en el catalogo del ERP siembra la parte en el registro de especificaciones

## Forma del payload
```json
{
  "event": { "type": "ERP_ITEM_CREATED" },
  "data": {
      "partId": "SKU-0001",
      "action": "create",
      "characteristics": [],
      "articuloId": 1,
      "nombre": "Articulo demo 001",
      "erpType": "microsip"
  }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-09-30] (auto) nota inicial generada desde communication-rules.json.
- [2026-09-30] (Carlos+Claude) contrato inicial. Origen: pull `articulos` del conector `erp_microsip` (`/api/articulos`, cursor `ARTICULO_ID`).
- [2026-09-30] (Carlos+Claude) `characteristics` viaja VACIO a proposito: el ERP da la identidad de la parte, no sus tolerancias. Microsip no sabe que es un USL. El ERP siembra la parte y el equipo de calidad es dueño de la especificacion.
- [2026-09-30] (Carlos+Claude) el cursor por `ARTICULO_ID` solo ve ALTAS. Un cambio de nombre o de clave en un articulo existente no genera evento: eso necesitaria un pull por fecha de modificacion.

## Flujo de trabajo
1. `npm run rama:comm sync_erp_data_local__manage_product_specs` (crea/cambia a la rama `comm/sync_erp_data_local__manage_product_specs`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

