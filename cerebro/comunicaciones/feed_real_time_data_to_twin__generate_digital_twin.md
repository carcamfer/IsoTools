---
tipo: comunicacion
regla: rule-twin-002
fuente: feed_real_time_data_to_twin
destino: generate_digital_twin
evento: TWIN_DATA_UPDATED
protocolo: HTTPS
rama: comm/feed_real_time_data_to_twin__generate_digital_twin
programadores:
actualizado: 2026-06-28
tags: [comunicacion, TWIN_DATA_UPDATED]
---
# feed_real_time_data_to_twin → generate_digital_twin

> Regla `rule-twin-002` · evento `TWIN_DATA_UPDATED` · protocolo HTTPS
> Rama de trabajo: `comm/feed_real_time_data_to_twin__generate_digital_twin`

## Las dos tools
- **Fuente:** [[../tools/feed_real_time_data_to_twin]]
- **Destino:** [[../tools/generate_digital_twin]]

## Contrato
- **Evento:** `TWIN_DATA_UPDATED`
- **Protocolo / topic:** HTTPS `POST /api/twin/update`
- **Condición de disparo:** `recordsSent > 0`
- **Descripción:** Datos del piso de planta actualizan el gemelo digital

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "TWIN_DATA_UPDATED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm feed_real_time_data_to_twin__generate_digital_twin` (crea/cambia a la rama `comm/feed_real_time_data_to_twin__generate_digital_twin`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

