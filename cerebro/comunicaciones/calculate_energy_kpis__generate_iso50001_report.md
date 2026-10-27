---
tipo: comunicacion
regla: rule-energy-005
fuente: calculate_energy_kpis
destino: generate_iso50001_report
evento: ENPI_PERIOD_CLOSED
protocolo: REST
rama: comm/calculate_energy_kpis__generate_iso50001_report
programadores:
actualizado: 2026-06-28
tags: [comunicacion, ENPI_PERIOD_CLOSED]
---
# calculate_energy_kpis → generate_iso50001_report

> Regla `rule-energy-005` · evento `ENPI_PERIOD_CLOSED` · protocolo REST
> Rama de trabajo: `comm/calculate_energy_kpis__generate_iso50001_report`

## Las dos tools
- **Fuente:** [[../tools/calculate_energy_kpis]]
- **Destino:** [[../tools/generate_iso50001_report]]

## Contrato
- **Evento:** `ENPI_PERIOD_CLOSED`
- **Protocolo / topic:** REST `POST /api/energy/iso50001/report`
- **Condición de disparo:** `periodDays == 90`
- **Descripción:** Cierre de periodo trimestral genera reporte de revisión ISO 50001 automáticamente

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "ENPI_PERIOD_CLOSED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm calculate_energy_kpis__generate_iso50001_report` (crea/cambia a la rama `comm/calculate_energy_kpis__generate_iso50001_report`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

