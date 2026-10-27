---
tipo: comunicacion
regla: rule-cyber-004
fuente: inspect_gateway_traffic
destino: detect_anomaly_patterns
evento: PACKETS_INSPECTED
protocolo: HTTPS
rama: comm/inspect_gateway_traffic__detect_anomaly_patterns
programadores:
actualizado: 2026-06-28
tags: [comunicacion, PACKETS_INSPECTED]
---
# inspect_gateway_traffic → detect_anomaly_patterns

> Regla `rule-cyber-004` · evento `PACKETS_INSPECTED` · protocolo HTTPS
> Rama de trabajo: `comm/inspect_gateway_traffic__detect_anomaly_patterns`

## Las dos tools
- **Fuente:** [[../tools/inspect_gateway_traffic]]
- **Destino:** [[../tools/detect_anomaly_patterns]]

## Contrato
- **Evento:** `PACKETS_INSPECTED`
- **Protocolo / topic:** HTTPS `POST /api/security/analyze-patterns`
- **Condición de disparo:** `maliciousPayloads > 0`
- **Descripción:** Payloads sospechosos enviados a análisis de patrones en cloud

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "PACKETS_INSPECTED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm inspect_gateway_traffic__detect_anomaly_patterns` (crea/cambia a la rama `comm/inspect_gateway_traffic__detect_anomaly_patterns`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

