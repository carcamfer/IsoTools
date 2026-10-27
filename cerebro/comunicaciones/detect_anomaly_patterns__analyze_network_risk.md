---
tipo: comunicacion
regla: rule-cyber-005
fuente: detect_anomaly_patterns
destino: analyze_network_risk
evento: PATTERNS_FOUND
protocolo: MQTT
rama: comm/detect_anomaly_patterns__analyze_network_risk
programadores:
actualizado: 2026-06-28
tags: [comunicacion, PATTERNS_FOUND]
---
# detect_anomaly_patterns → analyze_network_risk

> Regla `rule-cyber-005` · evento `PATTERNS_FOUND` · protocolo MQTT
> Rama de trabajo: `comm/detect_anomaly_patterns__analyze_network_risk`

## Las dos tools
- **Fuente:** [[../tools/detect_anomaly_patterns]]
- **Destino:** [[../tools/analyze_network_risk]]

## Contrato
- **Evento:** `PATTERNS_FOUND`
- **Protocolo / topic:** MQTT `cloud/security/patterns`
- **Condición de disparo:** `attackType !== 'none'`
- **Descripción:** Patrones de ataque identificados disparan análisis de riesgo

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "PATTERNS_FOUND" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm detect_anomaly_patterns__analyze_network_risk` (crea/cambia a la rama `comm/detect_anomaly_patterns__analyze_network_risk`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

