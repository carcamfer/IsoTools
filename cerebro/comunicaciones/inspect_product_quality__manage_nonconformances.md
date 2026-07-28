---
tipo: comunicacion
regla: rule-pkg-001
fuente: inspect_product_quality
destino: manage_nonconformances
evento: DEFECT_FOUND
protocolo: REST
rama: comm/inspect_product_quality__manage_nonconformances
programadores:
actualizado: 2026-06-28
tags: [comunicacion, DEFECT_FOUND]
---
# inspect_product_quality → manage_nonconformances

> Regla `rule-pkg-001` · evento `DEFECT_FOUND` · protocolo REST
> Rama de trabajo: `comm/inspect_product_quality__manage_nonconformances`

## Las dos tools
- **Fuente:** [[../tools/inspect_product_quality]]
- **Destino:** [[../tools/manage_nonconformances]]

## Contrato
- **Evento:** `DEFECT_FOUND`
- **Protocolo / topic:** REST `POST /api/quality/nc/create`
- **Condición de disparo:** `defectFound == true`
- **Descripción:** Defecto confirmado en inspección abre una no conformidad

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "DEFECT_FOUND" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.
- [2026-07-27] (Carlos) **Cambia quién produce `DEFECT_FOUND`:** ya no el placeholder nativo, sino el servicio EXTERNO de visión. La regla `rule-pkg-001` **se conserva**, así que cuando el externo publica el evento el bus abre UNA sola NC. ⚠️ **Contrato para el productor externo:** el `data` DEBE traer `defectFound: true`; la condición `defectFound == true` la evalúa el bus sobre tu payload y si el campo falta, la NC no se abre.

## Flujo de trabajo
1. `npm run rama:comm inspect_product_quality__manage_nonconformances` (crea/cambia a la rama `comm/inspect_product_quality__manage_nonconformances`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

