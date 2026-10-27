---
tipo: comunicacion
regla: rule-pkg-007
fuente: manage_product_specs
destino: collect_quality_measurements
evento: PRODUCT_SPEC_UPDATED
protocolo: REST
rama: comm/manage_product_specs__collect_quality_measurements
programadores:
actualizado: 2026-06-28
tags: [comunicacion, PRODUCT_SPEC_UPDATED]
---
# manage_product_specs → collect_quality_measurements

> Regla `rule-pkg-007` · evento `PRODUCT_SPEC_UPDATED` · protocolo REST
> Rama de trabajo: `comm/manage_product_specs__collect_quality_measurements`

## Las dos tools
- **Fuente:** [[../tools/manage_product_specs]]
- **Destino:** [[../tools/collect_quality_measurements]]

## Contrato
- **Evento:** `PRODUCT_SPEC_UPDATED`
- **Protocolo / topic:** REST `POST /api/quality/measurements`
- **Condición de disparo:** `always`
- **Descripción:** Spec actualizada redefine el plan de inspección y la captura de mediciones

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "PRODUCT_SPEC_UPDATED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm manage_product_specs__collect_quality_measurements` (crea/cambia a la rama `comm/manage_product_specs__collect_quality_measurements`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

