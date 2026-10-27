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

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "FMEA_CRITICAL_FOUND" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm analyze_failure_modes__manage_nonconformances` (crea/cambia a la rama `comm/analyze_failure_modes__manage_nonconformances`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

