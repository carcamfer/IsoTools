---
tipo: comunicacion
regla: rule-scada-005
fuente: log_process_historian
destino: analyze_control_loop_performance
evento: HISTORIAN_BATCH_READY
protocolo: REST
rama: comm/log_process_historian__analyze_control_loop_performance
programadores:
actualizado: 2026-06-28
tags: [comunicacion, HISTORIAN_BATCH_READY]
---
# log_process_historian → analyze_control_loop_performance

> Regla `rule-scada-005` · evento `HISTORIAN_BATCH_READY` · protocolo REST
> Rama de trabajo: `comm/log_process_historian__analyze_control_loop_performance`

## Las dos tools
- **Fuente:** [[../tools/log_process_historian]]
- **Destino:** [[../tools/analyze_control_loop_performance]]

## Contrato
- **Evento:** `HISTORIAN_BATCH_READY`
- **Protocolo / topic:** REST `POST /api/scada/loop-analysis`
- **Condición de disparo:** `recordsStored > 1000`
- **Descripción:** Datos históricos acumulados se envían al cloud para análisis de desempeño de lazos

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "HISTORIAN_BATCH_READY" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm log_process_historian__analyze_control_loop_performance` (crea/cambia a la rama `comm/log_process_historian__analyze_control_loop_performance`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

