---
tipo: comunicacion
regla: rule-energy-004
fuente: calculate_energy_kpis
destino: calculate_carbon_footprint
evento: CONSUMPTION_DATA_READY
protocolo: REST
rama: comm/calculate_energy_kpis__calculate_carbon_footprint
programadores:
actualizado: 2026-06-28
tags: [comunicacion, CONSUMPTION_DATA_READY]
---
# calculate_energy_kpis → calculate_carbon_footprint

> Regla `rule-energy-004` · evento `CONSUMPTION_DATA_READY` · protocolo REST
> Rama de trabajo: `comm/calculate_energy_kpis__calculate_carbon_footprint`

## Las dos tools
- **Fuente:** [[../tools/calculate_energy_kpis]]
- **Destino:** [[../tools/calculate_carbon_footprint]]

## Contrato
- **Evento:** `CONSUMPTION_DATA_READY`
- **Protocolo / topic:** REST `POST /api/energy/carbon/calculate`
- **Condición de disparo:** `periodDays >= 30`
- **Descripción:** Datos de consumo mensual disponibles actualizan cálculo de huella de carbono

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "CONSUMPTION_DATA_READY" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm calculate_energy_kpis__calculate_carbon_footprint` (crea/cambia a la rama `comm/calculate_energy_kpis__calculate_carbon_footprint`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

