---
tipo: comunicacion
regla: rule-pkg-010
fuente: detect_business_anomalies
destino: generate_kpis
evento: BUSINESS_ANOMALY_DETECTED
protocolo: REST
rama: comm/detect_business_anomalies__generate_kpis
programadores:
actualizado: 2026-06-28
tags: [comunicacion, BUSINESS_ANOMALY_DETECTED]
---
# detect_business_anomalies → generate_kpis

> Regla `rule-pkg-010` · evento `BUSINESS_ANOMALY_DETECTED` · protocolo REST
> Rama de trabajo: `comm/detect_business_anomalies__generate_kpis`

## Las dos tools
- **Fuente:** [[../tools/detect_business_anomalies]]
- **Destino:** [[../tools/generate_kpis]]

## Contrato
- **Evento:** `BUSINESS_ANOMALY_DETECTED`
- **Protocolo / topic:** REST `POST /api/mgmt/kpis`
- **Condición de disparo:** `criticalCount > 0`
- **Descripción:** Anomalía de negocio crítica se refleja en los KPIs de dirección

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "BUSINESS_ANOMALY_DETECTED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm detect_business_anomalies__generate_kpis` (crea/cambia a la rama `comm/detect_business_anomalies__generate_kpis`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

