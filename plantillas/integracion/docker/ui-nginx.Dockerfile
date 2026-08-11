# syntax=docker/dockerfile:1
# =============================================================================
# PLANTILLA — VARIANTE. El SPA solo, detras de nginx, en su propio contenedor.
#
# LEE ESTO ANTES DE USARLA. La forma recomendada es `tool.Dockerfile`: una
# imagen que sirve backend y frontend. Esta variante existe para dos casos:
#
#   - la demo local con docker compose, donde quieres reiniciar el front sin
#     tocar el back;
#   - fronts que ya estaban desplegados aparte y todavia no se migran.
#
# Lo que NO cambia: el navegador tiene que ver UN SOLO ORIGEN. Por eso nginx
# hace proxy de `/api` y `/auth` hacia el servicio backend. Si en vez de eso
# apuntas el SPA a `https://api.<dominio>` desde el bundle, rompiste el SSO:
# la cookie deja de ser first-party y tienes que abrir CORS con credenciales.
#
# Build:   docker build -f docker/ui-nginx.Dockerfile -t <tool>-ui .
# Runtime: TOOL_ORIGIN=http://<servicio-backend>:<puerto>
# =============================================================================

ARG NODE_IMAGE=node:22-slim

FROM ${NODE_IMAGE} AS build
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /web
RUN corepack enable

COPY web/package.json web/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY web/ ./

# Sin `VITE_API_BASE`: el SPA pide a `/api` RELATIVO y nginx lo enruta. Meter un
# host absoluto aqui es exactamente lo que rompe el origen unico.
RUN pnpm run build

FROM nginx:1.27-alpine AS runtime
# nginx renderiza `/etc/nginx/templates/*.template` con envsubst al arrancar, asi
# que `${TOOL_ORIGIN}` se resuelve en tiempo de despliegue y no en el build.
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /web/dist /usr/share/nginx/html

ENV TOOL_ORIGIN=http://localhost:8101
EXPOSE 80
