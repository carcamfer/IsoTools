# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────────────────────
# Una sola imagen sirve el core Y el dashboard, por el MISMO origen.
#
# Es la decision que borra trabajo: la cookie de sesion es first-party, CORS no
# participa, y no hay que desplegar ni versionar dos cosas que siempre cambian
# juntas. El frontend se compila en su propia etapa, con su propio toolchain, y de
# el solo sobrevive `dist/` — ni node_modules ni TypeScript llegan a la imagen final.
#
# Gestor de paquetes: pnpm, via Corepack, con la version fijada en el campo
# `packageManager` de cada package.json. Asi el build de Docker, el de CI y el de
# tu maquina resuelven exactamente el mismo arbol.
# ─────────────────────────────────────────────────────────────────────────────

# Corepack pregunta antes de descargar pnpm; en un build no interactivo eso cuelga.
ARG NODE_IMAGE=node:22-slim

# --- 1. Dashboard (web/) ---------------------------------------------------
FROM ${NODE_IMAGE} AS web
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /web
RUN corepack enable

# Los manifiestos se copian solos primero para que Docker cachee la instalacion:
# tocar un .tsx no debe reinstalar todo el arbol.
COPY web/package.json web/pnpm-lock.yaml web/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY web/ ./
RUN pnpm run build

# --- 2. Core (src/) + dashboard compilado ----------------------------------
FROM ${NODE_IMAGE}
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV NODE_ENV=production
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY . .
COPY --from=web /web/dist ./web/dist

EXPOSE 3000

# Liveness sin depender de la base: si el proceso responde, el contenedor esta vivo.
# La readiness (que si toca Postgres) la vigila Railway con healthcheckPath.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
