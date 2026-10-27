---
tipo: comunicacion
regla: rule-energy-001
fuente: monitor_energy_meters
destino: calculate_energy_kpis
evento: ENERGY_READING_AVAILABLE
protocolo: MQTT
rama: comm/monitor_energy_meters__calculate_energy_kpis
programadores:
actualizado: 2026-06-28
tags: [comunicacion, ENERGY_READING_AVAILABLE]
---
# monitor_energy_meters → calculate_energy_kpis

> Regla `rule-energy-001` · evento `ENERGY_READING_AVAILABLE` · protocolo MQTT
> Rama de trabajo: `comm/monitor_energy_meters__calculate_energy_kpis`

## Las dos tools
- **Fuente:** [[../tools/monitor_energy_meters]]
- **Destino:** [[../tools/calculate_energy_kpis]]

## Contrato
- **Evento:** `ENERGY_READING_AVAILABLE`
- **Protocolo / topic:** MQTT `energy/meters/reading`
- **Condición de disparo:** `always`
- **Descripción:** Lectura de medidores disponible actualiza cálculo de indicadores EnPI

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "ENERGY_READING_AVAILABLE" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm monitor_energy_meters__calculate_energy_kpis` (crea/cambia a la rama `comm/monitor_energy_meters__calculate_energy_kpis`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

