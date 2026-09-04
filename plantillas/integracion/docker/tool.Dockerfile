# syntax=docker/dockerfile:1
# =============================================================================
# PLANTILLA — una tool con backend (Node) y frontend (React) SEPARADOS,
# empaquetados en UNA SOLA imagen.
#
# Copia este archivo a `docker/<tu_tool>.Dockerfile` en tu repo y cambia solo lo
# que esta marcado con  <-- EDITA.
#
# ── Por que una imagen y no dos ──────────────────────────────────────────────
# Son dos aplicaciones distintas —dos package.json, dos toolchains, dos equipos
# de dependencias— y aun asi se despliegan juntas. La razon no es comodidad:
#
#   1. UN SOLO ORIGEN. El SPA en `/`, tu API en `/api/*` y el handshake OIDC en
#      `/auth/*` salen del mismo host. Asi la cookie de sesion es FIRST-PARTY y
#      CORS no participa. En cuanto separas origenes tienes que abrir CORS con
#      credenciales, marcar la cookie `SameSite=None`, y pelearte con los
#      navegadores que bloquean cookies de terceros. Eso no es un detalle de
#      configuracion: es la diferencia entre que el SSO funcione o no.
#   2. UN SUBDOMINIO = UNA UNIDAD DE DESPLIEGUE. `nc.<dominio>` es tu tool
#      completa. Nada de "el front esta desplegado y el back no".
#   3. `EventSource` (SSE) lleva la cookie sin que le pongas nada. Ninguna
#      credencial termina en una query string.
#
# Si de verdad necesitas servir el SPA aparte, usa `ui-nginx.Dockerfile` de esta
# misma carpeta — pero lee primero por que no deberias.
#
# ── Las tres etapas ──────────────────────────────────────────────────────────
#   web      compila el frontend con SU toolchain. De aqui solo sobrevive `dist/`.
#   build    compila el backend (borrala si tu backend no compila; ver §backend).
#   runtime  dependencias de PRODUCCION + el backend + el `dist/` del frontend.
#
# Ni `node_modules` del front ni TypeScript ni Vite llegan a la imagen final.
# =============================================================================

# Corepack pregunta antes de descargar pnpm; en un build no interactivo eso cuelga
# el build hasta el timeout, sin decir por que. La variable lo desactiva.
ARG NODE_IMAGE=node:22-slim

# --- 1. Frontend (React) -----------------------------------------------------
# El frontend tiene su propio lockfile y su propio arbol de dependencias. Se
# instala aparte, a proposito: el backend no debe arrastrar React ni Vite.
FROM ${NODE_IMAGE} AS web
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /web
RUN corepack enable

# Los MANIFIESTOS primero, el codigo despues. Es lo que hace que tocar un `.tsx`
# no reinstale el arbol entero: Docker cachea esta capa mientras el lockfile no
# cambie. Al reves (COPY . . y luego install) el cache no sirve para nada.
COPY web/package.json web/pnpm-lock.yaml ./
# Si tu frontend es un workspace pnpm con varias apps, copia tambien el
# pnpm-workspace.yaml y los package.json de cada paquete:      <-- EDITA
#   COPY web/pnpm-workspace.yaml ./
#   COPY web/shared/package.json ./shared/
#   COPY web/apps/<tu-app>/package.json ./apps/<tu-app>/
RUN pnpm install --frozen-lockfile

COPY web/ ./
# `VITE_*` se HORNEA en el bundle: es publico, cualquiera lo lee con ver-fuente.
# Nunca pongas aqui una clave. Lo unico que va aqui son URLs.
ARG VITE_DASHBOARD_URL=""
RUN VITE_DASHBOARD_URL="${VITE_DASHBOARD_URL}" pnpm run build
# Con workspace:  RUN pnpm --filter <nombre-del-paquete> build          <-- EDITA

# --- 2. Backend (compilacion) ------------------------------------------------
# SOLO si tu backend compila (TypeScript, esbuild, tsup...).
# Si tu backend es JavaScript que corre tal cual, BORRA esta etapa entera y
# quita el `COPY --from=build` de la etapa runtime.                  <-- EDITA
FROM ${NODE_IMAGE} AS build
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml tsconfig.json ./
RUN pnpm install --frozen-lockfile
COPY src ./src
RUN pnpm run build

# --- 3. Runtime --------------------------------------------------------------
FROM ${NODE_IMAGE} AS runtime
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV NODE_ENV=production
WORKDIR /app
RUN corepack enable

# `--prod` deja fuera las devDependencies: menos superficie y menos peso. Ojo:
# entonces NADA que corra en el contenedor puede depender de una devDependency
# (nodemon, ts-node, tsx...). Si tu `CMD` la necesita, no la necesitas: usa
# `node --watch`, que es nativo desde Node 22.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=build /app/dist ./dist
COPY . .

# El frontend compilado, y NADA MAS del frontend. `UI_DIST_DIR` le dice a tu
# servidor donde encontrarlo para servirlo en `/`.
COPY --from=web /web/dist ./web/dist
ENV UI_DIST_DIR=/app/web/dist

# `PORT` es un DEFAULT, no una imposicion: Railway inyecta el suyo y tu servidor
# tiene que leer `process.env.PORT`. Un puerto fijo en el codigo funciona en
# local y falla al desplegar — es el fallo de primer despliegue mas comun.
ENV PORT=8101
EXPOSE 8101

# Liveness, no readiness: pregunta si el PROCESO responde, no si la base esta
# arriba. Si mezclas las dos, una caida momentanea de Postgres reinicia el
# contenedor en bucle. La readiness (`/ready`) la vigila el orquestador con
# `healthcheckPath`. `/health` va ABIERTO, sin sesion: la sonda no tiene cookie.
# Node 22 trae `fetch` global, asi que esto no agrega ninguna dependencia.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8101)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.js"]
# Backend sin compilar:  CMD ["node", "src/server.js"]                 <-- EDITA
