# Docker: empaquetar una tool con backend y frontend separados

Casi todas las tools de la plataforma son **dos aplicaciones**: un backend Node y
un frontend React, cada uno con su `package.json`, su lockfile y su toolchain.
Esta carpeta dice cómo se empaquetan.

```
docker/
├── tool.Dockerfile          ← el que vas a usar: back + front en UNA imagen
├── ui-nginx.Dockerfile      variante: el SPA solo, tras nginx
├── nginx.conf.template      configuración de esa variante
├── dockerignore.example     cópialo como `.dockerignore` a la raíz
└── docker-compose.tool.yml  levantar tu tool en local como se despliega
```

```bash
mkdir -p docker
cp plantillas/integracion/docker/tool.Dockerfile      docker/mi-tool.Dockerfile
cp plantillas/integracion/docker/dockerignore.example .dockerignore
cp plantillas/integracion/docker/docker-compose.tool.yml docker-compose.yml
```

---

## 1. La decisión: dos aplicaciones, una imagen

El backend y el frontend se **construyen por separado** y se **despliegan juntos**.
Una imagen sirve tres cosas por el mismo host:

```
/           el SPA compilado
/api/*      tu API
/auth/*     el handshake OIDC
```

Parece un detalle de empaquetado y es una decisión de arquitectura:

**La cookie de sesión es first-party.** Con un solo origen no hay CORS que abrir,
ni `SameSite=None`, ni navegadores bloqueando cookies de terceros. En cuanto
separas `app.<dominio>` de `api.<dominio>` heredas los tres problemas a la vez, y
el que más tiempo cuesta es el tercero, porque falla solo en algunos navegadores.

**Un subdominio es una unidad de despliegue completa.** `nc.<dominio>` es la tool,
no "la parte de adelante de la tool". No existe el estado "el front está
desplegado y el back todavía no".

**SSE funciona sin inventar nada.** `EventSource` no puede poner cabeceras, pero
sí manda la cookie si el origen coincide. Con orígenes separados acabas pasando
un token por query string, que es exactamente donde una credencial no debe estar
(queda en logs de acceso, en el historial y en el `Referer`).

Lo que **no** se comparte entre las dos aplicaciones: `node_modules`, lockfile ni
toolchain. El backend no arrastra React; el frontend no ve las dependencias del
servidor. De la etapa del front a la imagen final solo sobrevive `dist/`.

## 2. Las tres etapas y por qué están en ese orden

```
web      → compila el frontend con su propio pnpm install    → deja  dist/
build    → compila el backend (bórrala si no compilas)       → deja  dist/
runtime  → deps de producción + backend + dist/ del frontend
```

**Los manifiestos se copian antes que el código.** Es lo único que hace útil el
caché de Docker:

```dockerfile
COPY web/package.json web/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile     ← esta capa se reusa mientras el lockfile no cambie
COPY web/ ./
RUN pnpm run build
```

Al revés (`COPY . .` y luego `install`) cualquier cambio en un `.tsx` invalida la
instalación completa y cada build reinstala el árbol entero.

**`--frozen-lockfile`.** Falla si el lockfile no concuerda con el `package.json`
en vez de "arreglarlo". Un build que resuelve versiones distintas a las tuyas es
un despliegue que nadie probó.

**pnpm por Corepack, con la versión fijada** en el campo `packageManager` de cada
`package.json`. Así tu máquina, CI y Docker resuelven el mismo árbol. Y
`COREPACK_ENABLE_DOWNLOAD_PROMPT=0`: sin eso Corepack pregunta antes de descargar
pnpm y en un build no interactivo se queda colgado hasta el timeout, sin decir
por qué.

**`pnpm install --prod` en runtime.** Fuera las devDependencies. La consecuencia
que sorprende: nada que corra dentro del contenedor puede depender de una
devDependency. Si tu `CMD` usa `nodemon` o `tsx`, no arranca. Para recarga en
caliente usa `node --watch`, nativo desde Node 22.

## 3. Frontend con workspace pnpm (varias apps)

Si tu front es un monorepo (`web/apps/*` + `web/shared`), copia **todos** los
manifiestos antes del install y compila con filtro:

```dockerfile
COPY web/package.json web/pnpm-lock.yaml web/pnpm-workspace.yaml ./
COPY web/shared/package.json ./shared/
COPY web/apps/mi-app/package.json ./apps/mi-app/
RUN pnpm install --frozen-lockfile
COPY web ./
RUN pnpm --filter mi-app build
```

Falta un `package.json` en esa lista y el install resuelve un árbol incompleto;
el error aparece después, en el `build`, apuntando a un import que sí existe.

## 4. Variables: qué se hornea y qué se inyecta

| Cuándo | Qué | Dónde |
| --- | --- | --- |
| **Build** | `VITE_*` del frontend | `ARG` en el Dockerfile |
| **Runtime** | todo lo del backend | variables del servicio |

Lo que empieza con `VITE_` **queda dentro del bundle** y lo lee cualquiera con
ver-fuente. Ahí solo van URLs. Ninguna clave, nunca — ni la del core, ni
`OIDC_CLIENT_SECRET`, ni la de tu propia tool.

**No fijes `PORT` como si fuera definitivo.** El `ENV PORT=8101` del Dockerfile es
un default para correr en local; Railway inyecta el suyo y tu servidor debe leer
`process.env.PORT`. Un puerto fijo en el código funciona en tu máquina y falla al
desplegar — es el fallo de primer despliegue más común.

`UI_DIST_DIR` le dice a tu servidor dónde quedó el SPA dentro de la imagen. La
plantilla lo deja en `/app/web/dist`, que es donde lo copia la etapa `web`.

## 5. `HEALTHCHECK`: liveness, no readiness

```dockerfile
HEALTHCHECK CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8101)+'/health')..."
```

Pregunta si el **proceso** responde, no si la base está arriba. Si metes la base
en `/health`, una caída momentánea de Postgres reinicia el contenedor en bucle y
conviertes una degradación en una caída.

`/health` va **abierto**, antes de cualquier autenticación: ni la sonda de Docker
ni los mosaicos del dashboard tienen sesión. Un `/health` detrás del login es la
causa número uno de "mi tool está arriba pero el dashboard la ve gris".

La readiness va aparte, en `/ready`, y esa sí puede tocar dependencias.

Node 22 trae `fetch` global: el healthcheck no agrega `curl` ni ninguna
dependencia a la imagen.

## 6. `.dockerignore`: dos errores de signo contrario

**De menos** — copias `node_modules` del host a la imagen. Cientos de MB con
binarios del SO equivocado. Con pnpm es peor: su `node_modules` es una granja de
symlinks a rutas **absolutas** del host, que dentro del contenedor son enlaces
rotos. Falla cualquier `import`, no solo el de una devDependency. Y `node_modules`
a secas no basta: sin `**/` solo excluye el de la raíz y el de `web/` sí se copia.

**De más** — excluyes `web/` "porque es el front" y el `COPY web/ ./` falla con
*no such file or directory*. La ruta no está ausente de tu disco: está ausente del
**contexto**.

## 7. Varias tools en un repo

Un Dockerfile por tool en `docker/`, un proyecto Railway por tool, y en cada
proyecto la variable que dice cuál construir:

```
RAILWAY_DOCKERFILE_PATH = docker/manage_nonconformances.Dockerfile
```

El contexto de build sigue siendo la raíz del repo, que es justo lo que necesitan
los Dockerfiles que instalan desde un `package.json` compartido. El detalle
completo —y por qué esto no se puede resolver desde `railway.toml`— está en
[`../despliegue/README.md` §3](../despliegue/README.md).

## 8. Comprobar la imagen antes de desplegarla

```bash
docker compose up --build
```

```bash
curl -i http://localhost:8101/health     # 200 sin credenciales
curl -i http://localhost:8101/           # el index.html del SPA (o 302 al IdP con SSO activo)
```

Los tres fallos que solo aparecen aquí y nunca con `pnpm dev`: el puerto fijo, el
`.dockerignore` mal puesto y `UI_DIST_DIR` apuntando a un directorio vacío
(entonces `/` responde 404 y `/api` funciona — señal inequívoca de que la etapa
del front no copió nada).

## 9. Fallas comunes

| Síntoma | Causa |
| --- | --- |
| El build se cuelga sin salida | Falta `COREPACK_ENABLE_DOWNLOAD_PROMPT=0`. |
| `no such file or directory` en un `COPY` | Esa ruta está en `.dockerignore` (§6). |
| Imagen enorme, imports rotos | `node_modules` copiado; falta `**/` (§6). |
| Cada build reinstala todo | Se copió el código antes que los manifiestos (§2). |
| `/api` responde, `/` da 404 | `UI_DIST_DIR` vacío: la etapa del front no dejó `dist/`. |
| Build verde, servicio caído al desplegar | Puerto fijo en vez de `process.env.PORT` (§4). |
| `Cannot find module 'tsx'` al arrancar | El `CMD` usa una devDependency y runtime instaló `--prod` (§2). |
| El dashboard ve tu tool gris | `/health` quedó detrás de la autenticación (§5). |
| El login "no hace nada" en local | Cookie `Secure` sobre HTTP: `SESSION_INSECURE_COOKIES=true`. |
| Reinicios en bucle | El `HEALTHCHECK` toca la base (§5). |

---

Siguiente paso: [`../despliegue/`](../despliegue/) — el workflow que construye
esta imagen en cada merge a `main`. Y si tu tool tiene interfaz,
[`../ui/`](../ui/) es obligatorio: define cómo se ve.
