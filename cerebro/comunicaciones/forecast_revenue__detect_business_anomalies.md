---
tipo: comunicacion
regla: rule-erp-007
fuente: forecast_revenue
destino: detect_business_anomalies
evento: FORECAST_READY
protocolo: MQTT
rama: comm/forecast_revenue__detect_business_anomalies
programadores:
actualizado: 2026-06-28
tags: [comunicacion, FORECAST_READY]
---
# forecast_revenue → detect_business_anomalies

> Regla `rule-erp-007` · evento `FORECAST_READY` · protocolo MQTT
> Rama de trabajo: `comm/forecast_revenue__detect_business_anomalies`

## Las dos tools
- **Fuente:** [[../tools/forecast_revenue]]
- **Destino:** [[../tools/detect_business_anomalies]]

## Contrato
- **Evento:** `FORECAST_READY`
- **Protocolo / topic:** MQTT `erp/revenue/forecast`
- **Condición de disparo:** `always`
- **Descripción:** Pronóstico de ingresos alimenta el detector de anomalías

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "FORECAST_READY" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm forecast_revenue__detect_business_anomalies` (crea/cambia a la rama `comm/forecast_revenue__detect_business_anomalies`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

