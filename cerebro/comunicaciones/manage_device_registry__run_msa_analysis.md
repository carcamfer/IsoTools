---
tipo: comunicacion
regla: rule-pkg-004
fuente: manage_device_registry
destino: run_msa_analysis
evento: NEW_DEVICE_REGISTERED
protocolo: REST
rama: comm/manage_device_registry__run_msa_analysis
programadores:
actualizado: 2026-06-28
tags: [comunicacion, NEW_DEVICE_REGISTERED]
---
# manage_device_registry → run_msa_analysis

> Regla `rule-pkg-004` · evento `NEW_DEVICE_REGISTERED` · protocolo REST
> Rama de trabajo: `comm/manage_device_registry__run_msa_analysis`

## Las dos tools
- **Fuente:** [[../tools/manage_device_registry]]
- **Destino:** [[../tools/run_msa_analysis]]

## Contrato
- **Evento:** `NEW_DEVICE_REGISTERED`
- **Protocolo / topic:** REST `POST /api/quality/msa/run`
- **Condición de disparo:** `operation == 'register'`
- **Descripción:** Equipo de medición registrado dispara estudio MSA (Gage R&R)

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
1. `npm run rama:comm manage_device_registry__run_msa_analysis` (crea/cambia a la rama `comm/manage_device_registry__run_msa_analysis`).
2. Implementa el cambio en ambas tools si aplica y actualiza esta bitácora.
3. PR de la rama a `feature/filter` cuando el contrato quede estable.

