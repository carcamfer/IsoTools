# CI/CD de la plataforma

`workflows/deploy-railway.yml` verifica y despliega **este repo** (core + dashboard)
a Railway.

Las tools de los equipos **no** se despliegan desde aquí: cada una tiene su propio
proyecto Railway y su propio repo. Su plantilla está en
[`plantillas/integracion/despliegue/`](../plantillas/integracion/despliegue/).

---

## Qué hace

| Disparador | Corre |
| --- | --- |
| Pull request a `main` | solo `verificar` |
| Push a `main` | `verificar` → `desplegar` |
| `workflow_dispatch` | `verificar` → `desplegar` |

Un push que solo toca documentación (`**.md`, `docs/`, `cerebro/`, `pasos/`,
`recursos/`, `plantillas/`) no dispara nada: no cambia la imagen.

### `verificar`

Este repo **no tiene suite de pruebas**, así que este job es toda la red de
seguridad que hay:

1. **Sintaxis del backend** — `node --check` sobre `src/` y `scripts/`. Existe
   porque `npm run lint` no comprueba nada: no hay configuración de ESLint en el
   repo.
2. **Integridad de los datos de plataforma** — `pnpm run validate`. Cruza
   `deployments.json` contra `tools.json`, `roles.json` y el registro de tools
   nativas. Es el chequeo que más vale: un `toolId` mal escrito no rompe nada, solo
   hace que esa tool **nunca** aparezca en la barra lateral, y su equipo tarda días
   en notar que su despliegue "no se ve".
3. **Typecheck y build del dashboard** — se compila aquí aunque Docker lo repita:
   fallar en 40 segundos es mejor que fallar tras un build completo de Railway.

### `desplegar`

`railway up --service <servicio> --ci`, y después tres comprobaciones, porque
**un workflow verde no prueba que el despliegue sirvió**:

| Comprobación | Qué demuestra |
| --- | --- |
| `/api/v1/health` → 200 | el proceso responde |
| `/api/v1/ready` → 200 | además hay Postgres |
| `/` → 200 o 302 | el dashboard se está sirviendo |

La tercera existe por un modo de fallo real y silencioso: si `web/dist` no entra en
la imagen, el core arranca y pasa `/health` **perfectamente**, solo que sirviendo la
API sin dashboard. Un `404` en `/` significa que la etapa `web` del Dockerfile no
produjo nada. Un `302` es correcto: es el SSO mandando al IdP.

## Configuración

**Secreto** — Settings → Secrets and variables → Actions:

| Nombre | Valor |
| --- | --- |
| `RAILWAY_TOKEN` | token de **proyecto** de Railway |

Token de **proyecto** (Proyecto → Settings → Tokens), no de cuenta. Uno de cuenta da
`Project Token not found`, que no dice nada sobre la causa real — y además abre todo
el workspace, donde viven las tools de los cinco equipos.

**Variables** (opcionales, misma pantalla, pestaña Variables):

| Nombre | Por defecto |
| --- | --- |
| `RAILWAY_SERVICE` | `IsoTools` |
| `PLATFORM_URL` | `https://isotools-production.up.railway.app` |

## Ojo: no dejes dos despliegues compitiendo

Si el proyecto de Railway tiene conectada su integración de GitHub, **cada push
desplegará dos veces**: una por Railway y otra por este workflow. Desconecta el repo
en Railway (Settings → Source) y deja que el despliegue lo mande el workflow, que es
el que además verifica antes y comprueba después.

## Pendiente

`ci.yml.disabled` es el workflow viejo, de cuando el repo usaba npm y no tenía
dashboard. Está **obsoleto**: `deploy-railway.yml` cubre lo que hacía y más. Se puede
borrar cuando alguien lo confirme.
