---
tipo: comunicacion
regla: rule-infra-007
fuente: deploy_edge_configuration
destino: update_edge_agents
evento: CONFIG_DEPLOYED
protocolo: MQTT
rama: comm/deploy_edge_configuration__update_edge_agents
programadores:
actualizado: 2026-06-28
tags: [comunicacion, CONFIG_DEPLOYED]
---
# deploy_edge_configuration → update_edge_agents

> Regla `rule-infra-007` · evento `CONFIG_DEPLOYED` · protocolo MQTT
> Rama de trabajo: `comm/deploy_edge_configuration__update_edge_agents`

## Las dos tools
- **Fuente:** [[../tools/deploy_edge_configuration]]
- **Destino:** [[../tools/update_edge_agents]]

## Contrato
- **Evento:** `CONFIG_DEPLOYED`
- **Protocolo / topic:** MQTT `cloud/infra/update-agents`
- **Condición de disparo:** `agentUpdateRequired === true`
- **Descripción:** Configuración desplegada incluye actualización de agentes

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "CONFIG_DEPLOYED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm deploy_edge_configuration__update_edge_agents` (crea/cambia a la rama `comm/deploy_edge_configuration__update_edge_agents`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

