---
tipo: comunicacion
regla: rule-qual-005
fuente: calculate_cpk_ppk
destino: manage_product_specs
evento: CAPABILITY_BELOW_TARGET
protocolo: REST
rama: comm/calculate_cpk_ppk__manage_product_specs
programadores:
actualizado: 2026-06-28
tags: [comunicacion, CAPABILITY_BELOW_TARGET]
---
# calculate_cpk_ppk → manage_product_specs

> Regla `rule-qual-005` · evento `CAPABILITY_BELOW_TARGET` · protocolo REST
> Rama de trabajo: `comm/calculate_cpk_ppk__manage_product_specs`

## Las dos tools
- **Fuente:** [[../tools/calculate_cpk_ppk]]
- **Destino:** [[../tools/manage_product_specs]]

## Contrato
- **Evento:** `CAPABILITY_BELOW_TARGET`
- **Protocolo / topic:** REST `POST /api/quality/specs/review`
- **Condición de disparo:** `cpk < 1.33 OR status == 'not_capable'`
- **Descripción:** Capacidad de proceso por debajo del objetivo activa revisión de especificaciones

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "CAPABILITY_BELOW_TARGET" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm calculate_cpk_ppk__manage_product_specs` (crea/cambia a la rama `comm/calculate_cpk_ppk__manage_product_specs`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

