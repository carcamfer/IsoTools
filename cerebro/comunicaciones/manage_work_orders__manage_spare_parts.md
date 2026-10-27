---
tipo: comunicacion
regla: rule-maint-002
fuente: manage_work_orders
destino: manage_spare_parts
evento: WORK_ORDER_APPROVED
protocolo: REST
rama: comm/manage_work_orders__manage_spare_parts
programadores:
actualizado: 2026-06-28
tags: [comunicacion, WORK_ORDER_APPROVED]
---
# manage_work_orders → manage_spare_parts

> Regla `rule-maint-002` · evento `WORK_ORDER_APPROVED` · protocolo REST
> Rama de trabajo: `comm/manage_work_orders__manage_spare_parts`

## Las dos tools
- **Fuente:** [[../tools/manage_work_orders]]
- **Destino:** [[../tools/manage_spare_parts]]

## Contrato
- **Evento:** `WORK_ORDER_APPROVED`
- **Protocolo / topic:** REST `POST /api/maintenance/parts/reserve`
- **Condición de disparo:** `status == 'in_progress'`
- **Descripción:** Orden de trabajo aprobada verifica y reserva repuestos necesarios

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "WORK_ORDER_APPROVED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm manage_work_orders__manage_spare_parts` (crea/cambia a la rama `comm/manage_work_orders__manage_spare_parts`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

