---
tipo: comunicacion
regla: rule-erp-008
fuente: score_leads
destino: predict_sales
evento: LEADS_SCORED
protocolo: REST
rama: comm/score_leads__predict_sales
programadores:
actualizado: 2026-06-28
tags: [comunicacion, LEADS_SCORED]
---
# score_leads → predict_sales

> Regla `rule-erp-008` · evento `LEADS_SCORED` · protocolo REST
> Rama de trabajo: `comm/score_leads__predict_sales`

## Las dos tools
- **Fuente:** [[../tools/score_leads]]
- **Destino:** [[../tools/predict_sales]]

## Contrato
- **Evento:** `LEADS_SCORED`
- **Protocolo / topic:** REST `POST /api/crm/predict-sales`
- **Condición de disparo:** `score > 70`
- **Descripción:** Leads de alto puntaje alimentan la predicción de ventas

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "LEADS_SCORED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm score_leads__predict_sales` (crea/cambia a la rama `comm/score_leads__predict_sales`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

