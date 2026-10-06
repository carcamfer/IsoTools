---
tipo: comunicacion
regla: rule-qual-002
fuente: calculate_control_charts
destino: detect_out_of_control_signals
evento: CHART_POINTS_UPDATED
protocolo: REST
rama: comm/calculate_control_charts__detect_out_of_control_signals
programadores:
actualizado: 2026-06-28
tags: [comunicacion, CHART_POINTS_UPDATED]
---
# calculate_control_charts → detect_out_of_control_signals

> Regla `rule-qual-002` · evento `CHART_POINTS_UPDATED` · protocolo REST
> Rama de trabajo: `comm/calculate_control_charts__detect_out_of_control_signals`

## Las dos tools
- **Fuente:** [[../tools/calculate_control_charts]]
- **Destino:** [[../tools/detect_out_of_control_signals]]

## Contrato
- **Evento:** `CHART_POINTS_UPDATED`
- **Protocolo / topic:** REST `POST /api/quality/spc/detect`
- **Condición de disparo:** `always`
- **Descripción:** Cartas de control actualizadas ejecutan detección de señales fuera de control

## Forma del payload
```json
{
  "event": { "type": "CHART_POINTS_UPDATED" },
  "data": {
    "chartId": "<id de la carta>",
    "characteristicId": "<CTQ>",
    "plotPoints": [],
    "ucl": 0, "lcl": 0, "centerLine": 0
  }
}
```
Los cinco campos del `data` son los `required` del `inputSchema` de
[[../tools/detect_out_of_control_signals]] (`chartId`, `plotPoints`, `ucl`, `lcl`,
`centerLine`). Si falta alguno, el evento llega inservible.

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.
- [2026-07-21] (histórico) la regla se **borró** junto con el handler nativo: el placeholder del core y el servicio externo publicaban `OUT_OF_CONTROL_DETECTED` los dos, y salían NC y 8D duplicados. Quitar el handler fue correcto; borrar la regla fue el parche de más.
- [2026-10-05] (Carlos+Claude) **regla repuesta con el mismo `rule-qual-002` y el mismo contrato.** Ya no duplica: la tool es `federated` con `subdomain: rdp`, así que `isHandledExternally()` da `true` y el bus **delega** en el servicio en lugar de ejecutar nada. La federación resolvió de raíz lo que el borrado parchó.
- [2026-10-05] (Carlos+Claude) lo que esto recupera es la **trazabilidad**, no la entrega: la tool ya recibía por poll, porque `/events/subscriptions/:toolId` se guía por el `consumes` de `tools.json` y no por las reglas. Sin la regla, `/events/chain/:correlationId` no mostraba la arista y la cadena causal del log de evidencia tenía un salto — justo lo que mira una auditoría.
- [2026-10-05] (Carlos+Claude) efecto colateral: con la arista repuesta, `detect_out_of_control_signals` pasa a recibir dato del ERP **a salto 4** (`ERP_ITEM_CREATED → manage_product_specs → collect_quality_measurements → calculate_control_charts →` aquí). Son 12 las tools alcanzadas por el ERP.

## Flujo de trabajo
1. `npm run rama:comm calculate_control_charts__detect_out_of_control_signals` (crea/cambia a la rama `comm/calculate_control_charts__detect_out_of_control_signals`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

