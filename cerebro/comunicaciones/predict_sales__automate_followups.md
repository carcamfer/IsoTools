---
tipo: comunicacion
regla: rule-erp-009
fuente: predict_sales
destino: automate_followups
evento: SALES_PREDICTED
protocolo: MQTT
rama: comm/predict_sales__automate_followups
programadores:
actualizado: 2026-06-28
tags: [comunicacion, SALES_PREDICTED]
---
# predict_sales → automate_followups

> Regla `rule-erp-009` · evento `SALES_PREDICTED` · protocolo MQTT
> Rama de trabajo: `comm/predict_sales__automate_followups`

## Las dos tools
- **Fuente:** [[../tools/predict_sales]]
- **Destino:** [[../tools/automate_followups]]

## Contrato
- **Evento:** `SALES_PREDICTED`
- **Protocolo / topic:** MQTT `crm/sales/prediction`
- **Condición de disparo:** `closeProbability > 0.6`
- **Descripción:** Alta probabilidad de venta dispara seguimiento automático

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "SALES_PREDICTED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.
- [2026-07-27] (Carlos) **`automate_followups` pasa a dueño EXTERNO.** Se retiró el handler nativo y la regla `rule-erp-009` del bus. ⚠️ **Hueco de cobertura:** el servicio externo hoy solo declara consumir `8D_REPORT_ISSUED` y `PROJECT_AT_RISK`. Mientras no añada `SALES_PREDICTED` a sus `consumes`, **nadie atiende esta comunicación** (antes la atendía el placeholder con datos falsos). La condición `closeProbability > 0.6` la debe aplicar el consumidor externo.

## Flujo de trabajo
1. `npm run rama:comm predict_sales__automate_followups` (crea/cambia a la rama `comm/predict_sales__automate_followups`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

