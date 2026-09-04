# Despliegue automático a Railway

Cómo cada equipo conecta su repo de GitHub a Railway para que un merge a `main`
despliegue su tool solo.

**Regla de la plataforma: un proyecto Railway por tool, todos en el mismo
workspace.** Los proyectos quedan aislados (variables, base de datos, logs y
reinicios independientes), pero la facturación y los permisos se administran una
sola vez. Un equipo con tres tools tiene tres proyectos.

---

## 1. El token: el 90% de los problemas está aquí

Railway tiene **dos** tipos de token y no son intercambiables. Usar el equivocado da
el error `Project Token not found`, que no dice nada sobre la causa real.

| | De dónde sale | Variable | Alcance |
| --- | --- | --- | --- |
| **Token de proyecto** ✅ | Proyecto → Settings → Tokens | `RAILWAY_TOKEN` | Un proyecto, un environment. Solo desplegar. |
| Token de cuenta ❌ | Account → Tokens | `RAILWAY_API_TOKEN` | Toda tu cuenta. |

**Usa siempre el token de proyecto.** Está acotado a un proyecto y solo puede
desplegar: si se filtra, el daño está contenido. Un token de cuenta filtrado entrega
el workspace entero, y en este montaje eso son las tools de los cinco equipos.

Con un token de proyecto **no hace falta `railway link`**: el token ya dice a qué
proyecto y environment apunta. Solo hay que decir a qué servicio, con `--service`.

### Guardarlo en tu repo

`Settings → Secrets and variables → Actions → New repository secret`

| Nombre | Valor |
| --- | --- |
| `RAILWAY_TOKEN` | el token de proyecto que te dio plataforma |

Con varias tools, un secreto por tool (`RAILWAY_TOKEN_NC`,
`RAILWAY_TOKEN_SPECS`, …). Un secreto de repositorio es visible para cualquier
workflow del repo, así que **no** metas ahí el token de un proyecto que no sea de tu
equipo.

## 2. Elige tu plantilla

```bash
mkdir -p .github/workflows

# UNA tool en el repo:
cp plantillas/integracion/despliegue/deploy-railway.yml .github/workflows/

# VARIAS tools en el repo:
cp plantillas/integracion/despliegue/deploy-railway-multi.yml .github/workflows/deploy-railway.yml
```

Copia también `railway.toml` a la raíz de tu repo y ajústalo.

Y antes de que esto sirva de algo, tu repo necesita un Dockerfile: Railway
construye desde él. Si todavía no lo tienes, empieza por
[`../docker/`](../docker/).

En la versión multi, **lo único que editas es el bloque `TOOLS`**: por cada tool, su
`service`, el nombre de su `secret`, su URL de `health` y los `paths` que la afectan.

## 3. Varias tools en un repo (monorepo)

Es el caso de `ai-iso`: un repo, tres Dockerfiles en `docker/`, tres proyectos
Railway. Los Dockerfiles salen de [`../docker/`](../docker/) — uno por tool, cada
uno empaquetando su backend y su frontend en una sola imagen.

### Cómo sabe cada proyecto qué Dockerfile construir

`railway up` sube **todo el repo** (respetando `.gitignore`) y el build ocurre allá.
Cada proyecto necesita que le digas cuál de los tres Dockerfiles usar. La forma que
funciona es una **variable de servicio** en el dashboard de Railway:

```
RAILWAY_DOCKERFILE_PATH = docker/manage_nonconformances.Dockerfile
```

Una por proyecto, apuntando a su Dockerfile. El contexto de build sigue siendo la
raíz del repo, que es justo lo que necesitan los Dockerfiles que instalan desde un
`package.json` compartido.

> No intentes resolver esto con un `railway.toml` por tool: la ruta del archivo de
> config y el `rootDirectory` **solo** se pueden fijar desde el dashboard, no desde
> config-as-code ni desde el CLI. Es una limitación de Railway, no un descuido.

### Por qué el filtro de rutas vive en el workflow

Railway tiene *watch paths* para no reconstruir de más, pero solo aplican cuando
Railway despliega desde su propia integración de GitHub. Aquí desplegamos con el
CLI, así que **Railway no decide cuándo**: lo decide tu workflow. Por eso el filtro
está en el job `plan` y no en el dashboard.

El job `plan` compara `github.event.before` contra el commit actual y selecciona las
tools cuyos `paths` fueron tocados. Si no hay base fiable (primer push a la rama)
despliega todo: dejar una tool sin actualizar en silencio es peor que un build de más.

Incluye siempre en `paths` lo **compartido** (el código común, `package.json`, el
lockfile). Si cambia el núcleo que las tres importan, las tres deben reconstruirse.

## 4. Decisiones que ya vienen tomadas en la plantilla

**`--ci`, no `--detach`.** `--ci` transmite los logs de build y termina cuando el
build acaba, así que el job se pone en rojo si el build falla. `--detach` devuelve
apenas sube el código: el workflow sale **verde aunque el build reviente**, que es la
peor señal posible. Sin ninguna bandera, el CLI se queda escuchando logs de deploy y
el job cuelga hasta el timeout.

**Health check después del deploy.** `--ci` termina cuando acaba el *build*, no
cuando el servicio está *sano*. Un workflow verde no prueba que tu tool responda.
El último paso hace poll a `/health` hasta 5 minutos, y ese es el único paso que
prueba que el despliegue sirvió.

**`concurrency` con `cancel-in-progress: false`.** Dos merges seguidos no se pisan.
No se cancela el que va a la mitad: cortar un deploy en curso deja el servicio en un
estado que nadie eligió.

**`fail-fast: false` en la matriz.** Que una tool falle no cancela el despliegue de
las otras: son proyectos independientes.

**Guardia de secreto faltante.** Sin ella, un secreto sin configurar da un error del
CLI que no menciona secretos y se pierden veinte minutos.

## 5. Variables del servicio en Railway

El workflow despliega **código**; no toca variables. Configúralas una vez en cada
proyecto Railway (Variables), a partir de
[`../sso/env-tool.example`](../sso/env-tool.example):

- `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET` — te los da plataforma
- `OIDC_REDIRECT_URI` — **la URL pública**, `https://<tu-subdominio>/auth/callback`
- `SESSION_SECRET` — `openssl rand -hex 32`, uno por tool, nunca compartido
- `ISOTOOLS_API_KEY`, `ISOTOOLS_API_URL` — plano máquina hacia el core
- `RAILWAY_DOCKERFILE_PATH` — solo si tienes varias tools en el repo

**No pongas `PORT`.** Railway lo inyecta, y tu servicio debe leer `process.env.PORT`.
Un puerto fijo funciona en local y falla al desplegar; es el fallo de primer
despliegue más común.

## 6. Subdominio y cierre del círculo

1. En Railway: proyecto → servicio → Settings → Networking → **Custom Domain** →
   `nc.<dominio>`. Railway te da un CNAME.
2. Quien administra el DNS lo apunta. El TLS lo emite Railway solo.
3. Pide a plataforma que autorice tu callback en el IdP:
   `https://nc.<dominio>/auth/callback` **y** `http://localhost:<puerto>/auth/callback`.
   Pide el de localhost desde el primer día o tu primera corrida local se queda
   esperando un cambio en la consola del IdP.
4. Registra tu tool en `src/data/platform/deployments.json` del core (`subdomain`,
   `owner`, `isoClause`, `requiredRoles`). Ahí es donde aparece en el dashboard.

## 7. Comprobar que quedó

```bash
curl https://nc.<dominio>/health          # -> 200 sin credenciales
curl -I https://nc.<dominio>/             # -> 302 al IdP (si el SSO está activo)
```

Y en el dashboard orquestador, tu mosaico debe pasar de gris a verde. Si sigue gris,
la sonda del dashboard no está alcanzando tu `/health` — casi siempre es el DNS
todavía propagándose o un `/health` que quedó detrás de la autenticación.

## 8. Fallas comunes

| Síntoma | Causa |
| --- | --- |
| `Project Token not found` | Usaste un token de cuenta donde va uno de proyecto (§1). |
| `Service not found` | El `--service` no coincide con el nombre en Railway. |
| Build correcto, servicio caído | Puerto fijo en el código en vez de `process.env.PORT`. |
| Construye el Dockerfile equivocado | Falta `RAILWAY_DOCKERFILE_PATH` en ese proyecto (§3). |
| El job cuelga hasta el timeout | Se quitó `--ci`. |
| Verde pero nada desplegado | Se usó `--detach`. |
| El healthcheck de Railway falla | `/health` quedó detrás de la autenticación. Debe ser abierto. |
| Cambio en una tool redespliega las tres | Correcto si tocaste código compartido; revisa `paths` si no. |

---

Fuentes: [Railway CLI](https://docs.railway.com/guides/cli) ·
[Deploying with the CLI](https://docs.railway.com/cli/deploying) ·
[GitHub Actions con Railway](https://blog.railway.com/p/github-actions) ·
[Dockerfiles](https://docs.railway.com/guides/dockerfiles) ·
[Monorepo](https://docs.railway.com/guides/monorepo) ·
[Config as Code](https://docs.railway.com/config-as-code)
