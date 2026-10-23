---
tipo: comunicacion
regla: rule-pkg-002
fuente: analyze_failure_modes
destino: manage_nonconformances
evento: FMEA_CRITICAL_FOUND
protocolo: REST
rama: comm/analyze_failure_modes__manage_nonconformances
programadores:
actualizado: 2026-06-28
tags: [comunicacion, FMEA_CRITICAL_FOUND]
---
# analyze_failure_modes → manage_nonconformances

> Regla `rule-pkg-002` · evento `FMEA_CRITICAL_FOUND` · protocolo REST
> Rama de trabajo: `comm/analyze_failure_modes__manage_nonconformances`

## Las dos tools
- **Fuente:** [[../tools/analyze_failure_modes]]
- **Destino:** [[../tools/manage_nonconformances]]

## Contrato
- **Evento:** `FMEA_CRITICAL_FOUND`
- **Protocolo / topic:** REST `POST /api/quality/nc/create`
- **Condición de disparo:** `criticalItems > 0`
- **Descripción:** Modo de falla crítico (FMEA) levanta una no conformidad preventiva

## Forma del payload
```json
{
  "event": { "type": "FMEA_CRITICAL_FOUND", "category": "maintenance", "severity": "critical" },
  "data": {
    "asset_id": "MOTOR-014",
    "analysis_type": "both",
    "failure_modes": [
      {
        "mode": "Falla de aislamiento de bobinado",
        "function": "Conversión energía eléctrica → mecánica",
        "failure_effect": "Cortocircuito → disparo de protecciones / incendio",
        "severity": 9,
        "occurrence": 6,
        "detectability": 5,
        "rpn": 270,
        "is_critical": true,
        "recommended_action": "Prueba de aislamiento (Megger) anual y monitoreo de corriente por fase",
        "rcm_strategy": "PM-condition-based"
      }
    ],
    "criticalItems": 1,
    "maintenance_strategy": "PM-condition-based",
    "rpn_threshold": 100,
    "methodology": "AIAG FMEA-4 / VDA 6.3",
    "iso_clause": "6.1",
    "iso_stage": "Planificación y Riesgos"
  }
}
```
`criticalItems` se mantiene en camelCase: es el campo exacto que evalúa el `triggerCondition` de `rule-pkg-002` (`criticalItems > 0`). `analyze_failure_modes` publica **siempre** que resuelve un `asset_id` (incluso con `criticalItems = 0`); es el router el que filtra por `triggerCondition`, no la tool. `failure_modes[].rcm_strategy` solo aparece cuando `analysis_type` incluye `'rcm'` (es decir, `'rcm'` o `'both'`); con `analysis_type: 'fmea'` ese campo no está presente en ningún modo. Umbral estricto: `is_critical` es `true` solo si `rpn > 100` (no `>=`).

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.
- [2026-10-22] (Rumbar) se llena la forma del payload con la salida real del handler implementado (`src/tools/analyze_failure_modes.js` en rumbar-tools), para que `manage_nonconformances` no tenga que preguntarlo — queda listo para el Ensayo Integral (PR-ORCA-ENS-001), Escenario 5. La decisión de marcar la NC como preventiva (PV-5.2 del ensayo) es de `manage_nonconformances` al recibir este evento (ninguna NC "correctiva" nace de FMEA_CRITICAL_FOUND); esta tool no manda un campo explícito tipo `nc_type`.

## Flujo de trabajo
1. `npm run rama:comm analyze_failure_modes__manage_nonconformances` (crea/cambia a la rama `comm/analyze_failure_modes__manage_nonconformances`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `main` cuando el contrato quede estable.

