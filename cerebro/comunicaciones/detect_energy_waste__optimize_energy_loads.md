---
tipo: comunicacion
regla: rule-energy-003
fuente: detect_energy_waste
destino: optimize_energy_loads
evento: ENERGY_WASTE_FOUND
protocolo: REST
rama: comm/detect_energy_waste__optimize_energy_loads
programadores:
actualizado: 2026-06-28
tags: [comunicacion, ENERGY_WASTE_FOUND]
---
# detect_energy_waste → optimize_energy_loads

> Regla `rule-energy-003` · evento `ENERGY_WASTE_FOUND` · protocolo REST
> Rama de trabajo: `comm/detect_energy_waste__optimize_energy_loads`

## Las dos tools
- **Fuente:** [[../tools/detect_energy_waste]]
- **Destino:** [[../tools/optimize_energy_loads]]

## Contrato
- **Evento:** `ENERGY_WASTE_FOUND`
- **Protocolo / topic:** REST `POST /api/energy/loads/optimize`
- **Condición de disparo:** `totalSavingsOpportunity > 1000`
- **Descripción:** Desperdicios detectados con ahorro potencial > 1000 kWh activan optimización de cargas

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "ENERGY_WASTE_FOUND" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm detect_energy_waste__optimize_energy_loads` (crea/cambia a la rama `comm/detect_energy_waste__optimize_energy_loads`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

