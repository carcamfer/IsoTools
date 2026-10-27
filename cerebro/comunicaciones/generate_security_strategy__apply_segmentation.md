---
tipo: comunicacion
regla: rule-cyber-007
fuente: generate_security_strategy
destino: apply_segmentation
evento: STRATEGY_GENERATED
protocolo: MQTT
rama: comm/generate_security_strategy__apply_segmentation
programadores:
actualizado: 2026-06-28
tags: [comunicacion, STRATEGY_GENERATED]
---
# generate_security_strategy → apply_segmentation

> Regla `rule-cyber-007` · evento `STRATEGY_GENERATED` · protocolo MQTT
> Rama de trabajo: `comm/generate_security_strategy__apply_segmentation`

## Las dos tools
- **Fuente:** [[../tools/generate_security_strategy]]
- **Destino:** [[../tools/apply_segmentation]]

## Contrato
- **Evento:** `STRATEGY_GENERATED`
- **Protocolo / topic:** MQTT `edge/security/segmentation-rules`
- **Condición de disparo:** `priorityActions includes 'segmentation'`
- **Descripción:** Estrategia enviada al edge para aplicar segmentación de red

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "STRATEGY_GENERATED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm generate_security_strategy__apply_segmentation` (crea/cambia a la rama `comm/generate_security_strategy__apply_segmentation`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

