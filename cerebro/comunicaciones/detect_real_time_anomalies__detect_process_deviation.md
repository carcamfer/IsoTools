---
tipo: comunicacion
regla: rule-aiml-004
fuente: detect_real_time_anomalies
destino: detect_process_deviation
evento: ANOMALY_CONFIRMED
protocolo: HTTPS
rama: comm/detect_real_time_anomalies__detect_process_deviation
programadores:
actualizado: 2026-06-28
tags: [comunicacion, ANOMALY_CONFIRMED]
---
# detect_real_time_anomalies → detect_process_deviation

> Regla `rule-aiml-004` · evento `ANOMALY_CONFIRMED` · protocolo HTTPS
> Rama de trabajo: `comm/detect_real_time_anomalies__detect_process_deviation`

## Las dos tools
- **Fuente:** [[../tools/detect_real_time_anomalies]]
- **Destino:** [[../tools/detect_process_deviation]]

## Contrato
- **Evento:** `ANOMALY_CONFIRMED`
- **Protocolo / topic:** HTTPS `POST /api/ml/process-deviation`
- **Condición de disparo:** `anomalyDetected === true && severity !== 'LOW'`
- **Descripción:** Anomalía confirmada pasa a análisis de desviación de proceso en cloud

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "ANOMALY_CONFIRMED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm detect_real_time_anomalies__detect_process_deviation` (crea/cambia a la rama `comm/detect_real_time_anomalies__detect_process_deviation`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

