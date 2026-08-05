# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────────────────────
# Una sola imagen sirve el core Y el dashboard, por el MISMO origen.
#
# Es la decision que borra trabajo: la cookie de sesion es first-party, CORS no
# participa, y no hay que desplegar ni versionar dos cosas que siempre cambian
# juntas. El frontend se compila en su propia etapa, con su propio toolchain, y de
# el solo sobrevive `dist/` — ni node_modules ni TypeScript llegan a la imagen final.
# ─────────────────────────────────────────────────────────────────────────────

# --- 1. Dashboard (web/) ---------------------------------------------------
FROM node:22-slim AS web

WORKDIR /web
# Las dependencias se copian solas primero para que Docker cachee la instalacion:
# tocar un .tsx no debe reinstalar todo el arbol.
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# --- 2. Core (src/) + dashboard compilado ----------------------------------
FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .
COPY --from=web /web/dist ./web/dist

EXPOSE 3000
CMD ["node", "src/server.js"]
