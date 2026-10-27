---
tipo: comunicacion
regla: rule-scm-005
fuente: manage_supplier_scorecard
destino: generate_delivery_report
evento: SCORECARD_UPDATED
protocolo: REST
rama: comm/manage_supplier_scorecard__generate_delivery_report
programadores:
actualizado: 2026-06-28
tags: [comunicacion, SCORECARD_UPDATED]
---
# manage_supplier_scorecard → generate_delivery_report

> Regla `rule-scm-005` · evento `SCORECARD_UPDATED` · protocolo REST
> Rama de trabajo: `comm/manage_supplier_scorecard__generate_delivery_report`

## Las dos tools
- **Fuente:** [[../tools/manage_supplier_scorecard]]
- **Destino:** [[../tools/generate_delivery_report]]

## Contrato
- **Evento:** `SCORECARD_UPDATED`
- **Protocolo / topic:** REST `POST /api/scm/reports/delivery`
- **Condición de disparo:** `classification IN ['conditional','disqualified']`
- **Descripción:** Proveedor clasificado como condicional o descalificado genera reporte de desempeño de entrega

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "SCORECARD_UPDATED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm manage_supplier_scorecard__generate_delivery_report` (crea/cambia a la rama `comm/manage_supplier_scorecard__generate_delivery_report`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

