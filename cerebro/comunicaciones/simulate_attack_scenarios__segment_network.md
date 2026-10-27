---
tipo: comunicacion
regla: rule-cyber-008
fuente: simulate_attack_scenarios
destino: segment_network
evento: VULNERABILITIES_FOUND
protocolo: MQTT
rama: comm/simulate_attack_scenarios__segment_network
programadores:
actualizado: 2026-06-28
tags: [comunicacion, VULNERABILITIES_FOUND]
---
# simulate_attack_scenarios → segment_network

> Regla `rule-cyber-008` · evento `VULNERABILITIES_FOUND` · protocolo MQTT
> Rama de trabajo: `comm/simulate_attack_scenarios__segment_network`

## Las dos tools
- **Fuente:** [[../tools/simulate_attack_scenarios]]
- **Destino:** [[../tools/segment_network]]

## Contrato
- **Evento:** `VULNERABILITIES_FOUND`
- **Protocolo / topic:** MQTT `edge/security/segment`
- **Condición de disparo:** `criticalPaths.length > 0`
- **Descripción:** Rutas críticas encontradas disparan segmentación preventiva

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "VULNERABILITIES_FOUND" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm simulate_attack_scenarios__segment_network` (crea/cambia a la rama `comm/simulate_attack_scenarios__segment_network`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

