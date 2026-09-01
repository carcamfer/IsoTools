# IsoTools — orientación

Repo **enfocado solo en tools** de agentes industriales para procedimientos **ISO**. No contiene página web, dashboards ni vistas: solo el plano de tools (handlers, bus de eventos, validación, API de ingesta) y la documentación para programarlas.

## Por dónde empezar
- **Visión y cómo correr:** [`README.md`](./README.md)
- **Roadmap del programador (1 → 9):** [`pasos/`](./pasos/)
- **Referencia técnica de tools:** [`docs/GUIA_TOOLS.md`](./docs/GUIA_TOOLS.md)
- **Conectores ERP/PLC (plataforma central):** [`docs/ERP_CENTRAL.md`](./docs/ERP_CENTRAL.md)
- **Segundo cerebro (Obsidian) + reglas de mantenimiento:** [`cerebro/CLAUDE.md`](./cerebro/CLAUDE.md)

## Reglas clave
- El código de tools vive en `src/tools/` (un archivo por tool, registrado en `src/tools/index.js`).
- Los 5 JSON de configuración están en `src/data/agents/`.
- Cada **comunicación tool↔tool** se trabaja en su rama `comm/<source>__<target>` y se documenta en `cerebro/comunicaciones/`.
- Al cambiar un contrato entre tools, **anota la bitácora** de la nota de comunicación correspondiente.
- Tras agregar tools o reglas: `npm run cerebro:generar` (idempotente, no pisa notas existentes).
- Las tools **no** se conectan al ERP/PLC. Los conectores viven en la plataforma central (`src/connectors/` + `src/data/connectors/*.json`) y publican eventos ya normalizados: `ERP/PLC → conector → Industrial Events → Communication Router → tool(s)`.
- No reintroducir código de sitio web aquí: este repo es deliberadamente solo-tools.
