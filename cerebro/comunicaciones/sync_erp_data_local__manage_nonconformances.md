---
tipo: comunicacion
regla: rule-conn-002
fuente: sync_erp_data_local
destino: manage_nonconformances
evento: ERP_CUSTOMER_RETURN_REGISTERED
protocolo: REST
rama: comm/sync_erp_data_local__manage_nonconformances
programadores:
actualizado: 2026-09-30
tags: [comunicacion, ERP_CUSTOMER_RETURN_REGISTERED]
---
# sync_erp_data_local → manage_nonconformances

> Regla `rule-conn-002` · evento `ERP_CUSTOMER_RETURN_REGISTERED` · protocolo REST
> Rama de trabajo: `comm/sync_erp_data_local__manage_nonconformances`

## Las dos tools
- **Fuente:** [[../tools/sync_erp_data_local]]
- **Destino:** [[../tools/manage_nonconformances]]

## Contrato
- **Evento:** `ERP_CUSTOMER_RETURN_REGISTERED`
- **Protocolo / topic:** REST `POST /api/quality/nc`
- **Condición de disparo:** `always`
- **Descripción:** Devolucion de cliente registrada en el ERP levanta una no conformidad de origen cliente

## Forma del payload
```json
{
  "event": { "type": "ERP_CUSTOMER_RETURN_REGISTERED" },
  "data": {
      "action": "create",
      "ncType": "customer",
      "severity": "major",
      "affectedPartId": "SKU-0025",
      "description": "Devolucion de cliente registrada en el ERP",
      "articuloId": 25,
      "nombre": "Articulo demo 025",
      "unidades": 5,
      "orderId": 1,
      "folio": "D-000001",
      "fecha": "2026-09-29",
      "amount": 8053.41,
      "erpType": "microsip"
  }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-09-30] (auto) nota inicial generada desde communication-rules.json.
- [2026-09-30] (Carlos+Claude) contrato inicial. Origen: pull `devoluciones` del conector `erp_microsip` (`/api/ventas/devoluciones`).
- [2026-09-30] (Carlos+Claude) UN EVENTO POR PARTIDA, no por documento: una NC es por parte afectada, asi que una devolucion de tres articulos son tres NC. La clave `DEVOLUCION_KEY` (`DOCTO_VE_ID-ARTICULO_ID`) se calcula en el SQL del gateway porque el motor de mapeo no interpola plantillas.
- [2026-09-30] (Carlos+Claude) OJO CON LAS DOS ESCALAS DE SEVERIDAD: `data.severity` usa la de la NC (`minor|major|critical`) y `event.severity` la del IES (`low|medium|high|critical`). No son la misma y la validacion no lo detecta.
- [2026-09-30] (Carlos+Claude) PENDIENTE DE VERIFICACION: que `TIPO_DOCTO = 'D'` sean las devoluciones en esta base. Es configurable con `ERP_TIPO_DEVOLUCION` en el gateway. Si las devoluciones se manejan como notas de credito, este pull cambia de tabla.

## Flujo de trabajo
1. `npm run rama:comm sync_erp_data_local__manage_nonconformances` (crea/cambia a la rama `comm/sync_erp_data_local__manage_nonconformances`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

