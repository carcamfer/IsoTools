---
tipo: comunicacion
regla: rule-cyber-001
fuente: monitor_ot_network
destino: detect_network_anomalies_local
evento: TRAFFIC_CAPTURED
protocolo: Internal
rama: comm/monitor_ot_network__detect_network_anomalies_local
programadores:
actualizado: 2026-06-28
tags: [comunicacion, TRAFFIC_CAPTURED]
---
# monitor_ot_network → detect_network_anomalies_local

> Regla `rule-cyber-001` · evento `TRAFFIC_CAPTURED` · protocolo Internal
> Rama de trabajo: `comm/monitor_ot_network__detect_network_anomalies_local`

## Las dos tools
- **Fuente:** [[../tools/monitor_ot_network]]
- **Destino:** [[../tools/detect_network_anomalies_local]]

## Contrato
- **Evento:** `TRAFFIC_CAPTURED`
- **Protocolo / topic:** Internal `edge/network/traffic`
- **Condición de disparo:** `always`
- **Descripción:** Tráfico OT monitorizado pasa al detector de anomalías local

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "TRAFFIC_CAPTURED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm monitor_ot_network__detect_network_anomalies_local` (crea/cambia a la rama `comm/monitor_ot_network__detect_network_anomalies_local`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

