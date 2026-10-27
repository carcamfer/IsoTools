---
tipo: comunicacion
regla: rule-energy-002
fuente: calculate_energy_kpis
destino: detect_energy_waste
evento: ENPI_CALCULATED
protocolo: REST
rama: comm/calculate_energy_kpis__detect_energy_waste
programadores:
actualizado: 2026-06-28
tags: [comunicacion, ENPI_CALCULATED]
---
# calculate_energy_kpis → detect_energy_waste

> Regla `rule-energy-002` · evento `ENPI_CALCULATED` · protocolo REST
> Rama de trabajo: `comm/calculate_energy_kpis__detect_energy_waste`

## Las dos tools
- **Fuente:** [[../tools/calculate_energy_kpis]]
- **Destino:** [[../tools/detect_energy_waste]]

## Contrato
- **Evento:** `ENPI_CALCULATED`
- **Protocolo / topic:** REST `POST /api/energy/waste/detect`
- **Condición de disparo:** `vsBaselinePercent > 5`
- **Descripción:** EnPI supera línea base en 5% activa análisis de desperdicios energéticos

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "ENPI_CALCULATED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm calculate_energy_kpis__detect_energy_waste` (crea/cambia a la rama `comm/calculate_energy_kpis__detect_energy_waste`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

