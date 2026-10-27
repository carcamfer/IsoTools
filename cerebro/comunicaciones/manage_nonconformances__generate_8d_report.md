---
tipo: comunicacion
regla: rule-qual-004
fuente: manage_nonconformances
destino: generate_8d_report
evento: NC_REQUIRES_8D
protocolo: REST
rama: comm/manage_nonconformances__generate_8d_report
programadores:
actualizado: 2026-06-28
tags: [comunicacion, NC_REQUIRES_8D]
---
# manage_nonconformances → generate_8d_report

> Regla `rule-qual-004` · evento `NC_REQUIRES_8D` · protocolo REST
> Rama de trabajo: `comm/manage_nonconformances__generate_8d_report`

## Las dos tools
- **Fuente:** [[../tools/manage_nonconformances]]
- **Destino:** [[../tools/generate_8d_report]]

## Contrato
- **Evento:** `NC_REQUIRES_8D`
- **Protocolo / topic:** REST `POST /api/quality/8d/generate`
- **Condición de disparo:** `severity IN ['major','critical']`
- **Descripción:** No conformidad mayor o crítica dispara generación automática de reporte 8D

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "NC_REQUIRES_8D" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm manage_nonconformances__generate_8d_report` (crea/cambia a la rama `comm/manage_nonconformances__generate_8d_report`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

