---
tipo: comunicacion
regla: rule-cyber-002
fuente: detect_network_anomalies_local
destino: block_ip
evento: ANOMALY_DETECTED
protocolo: Internal
rama: comm/detect_network_anomalies_local__block_ip
programadores:
actualizado: 2026-06-28
tags: [comunicacion, ANOMALY_DETECTED]
---
# detect_network_anomalies_local → block_ip

> Regla `rule-cyber-002` · evento `ANOMALY_DETECTED` · protocolo Internal
> Rama de trabajo: `comm/detect_network_anomalies_local__block_ip`

## Las dos tools
- **Fuente:** [[../tools/detect_network_anomalies_local]]
- **Destino:** [[../tools/block_ip]]

## Contrato
- **Evento:** `ANOMALY_DETECTED`
- **Protocolo / topic:** Internal `edge/security/block`
- **Condición de disparo:** `severity === 'CRITICAL' || severity === 'HIGH'`
- **Descripción:** Anomalía crítica/alta activa bloqueo inmediato de IP

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "ANOMALY_DETECTED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm detect_network_anomalies_local__block_ip` (crea/cambia a la rama `comm/detect_network_anomalies_local__block_ip`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

