# IsoTools — orientación

Plataforma central para procedimientos **ISO**, con dos planos que no se mezclan:

- **`src/` — backend.** El core de eventos: handlers de tools nativas, bus, validación, API de ingesta y consumo, catálogo publicado. Node + Express, JS ESM, sin build.
- **`web/` — frontend.** El dashboard orquestador: barra lateral con todas las tools, salud en vivo, flujo de eventos y reporte de auditoría ISO. React + TypeScript + Vite, con su propio `package.json` y su propio `node_modules`.

Cada tool de cada equipo se despliega en **su propio subdominio** y es un relying party OIDC independiente. El dashboard **no es un gateway de autenticación**: es un relying party más, sin privilegios especiales, para que una caída suya no impida entrar a ninguna tool.

## Por dónde empezar
- **Visión y cómo correr:** [`README.md`](./README.md)
- **Roadmap del programador (1 → 9):** [`pasos/`](./pasos/)
- **Referencia técnica de tools:** [`docs/GUIA_TOOLS.md`](./docs/GUIA_TOOLS.md)
- **Contrato de SSO entre equipos:** [`docs/PLATAFORMA-SSO.md`](./docs/PLATAFORMA-SSO.md)
- **Plantillas que cada equipo copia a su repo (SSO + despliegue):** [`plantillas/integracion/`](./plantillas/integracion/)
- **Dashboard (frontend):** [`docs/DASHBOARD.md`](./docs/DASHBOARD.md)
- **Segundo cerebro (Obsidian) + reglas de mantenimiento:** [`cerebro/CLAUDE.md`](./cerebro/CLAUDE.md)

## Reglas clave
- El código de tools vive en `src/tools/` (un archivo por tool, registrado en `src/tools/index.js`).
- Los 5 JSON de **contrato** están en `src/data/agents/`: cambian cuando cambia el dominio.
- Los JSON de **operación** están en `src/data/platform/` (`roles.json`, `deployments.json`): cambian cuando alguien despliega. No mezclar unos con otros — tocar el contrato para mover un servidor es exactamente lo que esta separación evita.
- Cada **comunicación tool↔tool** se trabaja en su rama `comm/<source>__<target>` y se documenta en `cerebro/comunicaciones/`.
- Al cambiar un contrato entre tools, **anota la bitácora** de la nota de comunicación correspondiente.
- Tras agregar tools o reglas: `npm run cerebro:generar` (idempotente, no pisa notas existentes).
- **El frontend no toca `src/` y el backend no toca `web/`.** Se comunican solo por HTTP, contra `/api/v1/console/*`. Nada de imports cruzados ni de node_modules compartidos.
- **Ninguna clave de API llega al navegador.** `/api/v1/events` es plano máquina (`x-api-key`); `/api/v1/console` es plano humano (cookie de sesión). Ningún endpoint sirve a los dos.
- Este repo sigue sin tener **sitio web de marketing**. El dashboard es una consola de operación, no una página pública.
- Lo de `plantillas/integracion/` **se copia a otros repos**, no se importa desde aquí. Si cambias `src/auth/` de forma que afecte el contrato (nombres de variables, forma de la cookie, claims), actualiza también la plantilla — son dos copias a propósito, porque una tool no depende del core para autenticar.

## Tres estados de una tool
- `federated` — servicio propio, subdominio propio, equipo propio. El bus **no** ejecuta su handler nativo: ella consume por poll desde `/events/subscriptions/:toolId`.
- `native` — corre en proceso dentro del core (`src/tools/`).
- `planned` — está en el catálogo, sin despliegue todavía. Se muestra apagada, nunca como enlace roto.

Lo decide `src/data/platform/deployments.json`. Una tool federada **sin URL resoluble en este entorno** cae de vuelta a su handler nativo, para que la simulación local siga funcionando sin desplegar nada.
