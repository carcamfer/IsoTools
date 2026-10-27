---
tipo: comunicacion
regla: rule-cyber-003
fuente: detect_network_anomalies_local
destino: isolate_device
evento: DEVICE_COMPROMISE_SUSPECTED
protocolo: Internal
rama: comm/detect_network_anomalies_local__isolate_device
programadores:
actualizado: 2026-06-28
tags: [comunicacion, DEVICE_COMPROMISE_SUSPECTED]
---
# detect_network_anomalies_local → isolate_device

> Regla `rule-cyber-003` · evento `DEVICE_COMPROMISE_SUSPECTED` · protocolo Internal
> Rama de trabajo: `comm/detect_network_anomalies_local__isolate_device`

## Las dos tools
- **Fuente:** [[../tools/detect_network_anomalies_local]]
- **Destino:** [[../tools/isolate_device]]

## Contrato
- **Evento:** `DEVICE_COMPROMISE_SUSPECTED`
- **Protocolo / topic:** Internal `edge/security/isolate`
- **Condición de disparo:** `anomalyType === 'lateral_movement'`
- **Descripción:** Movimiento lateral detectado aísla el dispositivo origen

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "DEVICE_COMPROMISE_SUSPECTED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm detect_network_anomalies_local__isolate_device` (crea/cambia a la rama `comm/detect_network_anomalies_local__isolate_device`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

