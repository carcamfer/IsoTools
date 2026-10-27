---
tipo: comunicacion
regla: rule-infra-006
fuente: manage_device_registry
destino: deploy_edge_configuration
evento: NEW_DEVICE_REGISTERED
protocolo: MQTT
rama: comm/manage_device_registry__deploy_edge_configuration
programadores:
actualizado: 2026-06-28
tags: [comunicacion, NEW_DEVICE_REGISTERED]
---
# manage_device_registry → deploy_edge_configuration

> Regla `rule-infra-006` · evento `NEW_DEVICE_REGISTERED` · protocolo MQTT
> Rama de trabajo: `comm/manage_device_registry__deploy_edge_configuration`

## Las dos tools
- **Fuente:** [[../tools/manage_device_registry]]
- **Destino:** [[../tools/deploy_edge_configuration]]

## Contrato
- **Evento:** `NEW_DEVICE_REGISTERED`
- **Protocolo / topic:** MQTT `cloud/infra/deploy-config`
- **Condición de disparo:** `operation === 'register'`
- **Descripción:** Nuevo dispositivo registrado recibe su configuración inicial

## Forma del payload (rellenar al implementar)
```json
{
  "event": { "type": "NEW_DEVICE_REGISTERED" },
  "data": { }
}
```

## Bitácora de la comunicación
<!-- Cada cambio en el contrato entre estas dos tools se anota aquí.
     Así el programador del otro lado ve qué cambió sin leer el código.
     Formato:  - [YYYY-MM-DD] (quién) qué cambió en el payload/condición y por qué -->
- [2026-06-28] (auto) nota inicial generada desde communication-rules.json.

## Flujo de trabajo
1. `npm run rama:comm manage_device_registry__deploy_edge_configuration` (crea/cambia a la rama `comm/manage_device_registry__deploy_edge_configuration`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

