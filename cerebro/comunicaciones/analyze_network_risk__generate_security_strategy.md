---
tipo: comunicacion
regla: rule-cyber-006
fuente: analyze_network_risk
destino: generate_security_strategy
evento: RISK_ANALYZED
protocolo: REST
rama: comm/analyze_network_risk__generate_security_strategy
programadores:
actualizado: 2026-06-28
tags: [comunicacion, RISK_ANALYZED]
---
# analyze_network_risk → generate_security_strategy

> Regla `rule-cyber-006` · evento `RISK_ANALYZED` · protocolo REST
> Rama de trabajo: `comm/analyze_network_risk__generate_security_strategy`

## Las dos tools
- **Fuente:** [[../tools/analyze_network_risk]]
- **Destino:** [[../tools/generate_security_strategy]]

## Contrato
- **Evento:** `RISK_ANALYZED`
- **Protocolo / topic:** REST `POST /api/security/strategy`
- **Condición de disparo:** `riskLevel === 'high' || riskLevel === 'critical'`
- **Descripción:** Riesgo alto/crítico genera estrategia de seguridad actualizada

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "RISK_ANALYZED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm analyze_network_risk__generate_security_strategy` (crea/cambia a la rama `comm/analyze_network_risk__generate_security_strategy`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

