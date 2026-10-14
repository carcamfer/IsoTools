# Despliegue de las tres tools

Cada servicio Railway usa el contexto de build de la raíz y su propio Dockerfile:

| Tool | `RAILWAY_DOCKERFILE_PATH` | Servicio |
| --- | --- | --- |
| `calculate_control_charts` | `tools/calculate_control_charts/Docker/Dockerfile` | `calculate-control-charts` |
| `detect_business_anomalies` | `tools/detect_business_anomalies/Docker/Dockerfile` | `detect-business-anomalies` |
| `generate_kpis` | `tools/generate_kpis/Docker/Dockerfile` | `generate-kpis` |

Cada Dockerfile empaqueta el backend Node compartido y la UI de su tool en una
sola imagen y escucha `process.env.PORT` (8101 solo es el valor local por defecto).
El endpoint abierto de liveness es `/health`; `/ready` comprueba el acceso al
core y `/status` muestra el cursor y la última actividad del poller. Las rutas
de eventos y artefactos siguen protegidas por `x-api-key`.

## GitHub Actions

El workflow `.github/workflows/deploy-railway.yml` usa un único secreto de
repositorio llamado `RAILWAY_TOKEN`. No se escribe el token en el código.
El servicio de Railway debe existir previamente y el responsable de plataforma
debe asociar cada nombre de servicio al proyecto correspondiente.

En Railway, configure por servicio:

```text
RAILWAY_DOCKERFILE_PATH=<valor de la tabla>
```

Variables de runtime habituales: `DATABASE_URL`, `DB_HOST`, `DB_PORT`, `DB_USER`,
`DB_PASSWORD`, `DB_NAME`, `LOG_LEVEL` y las variables de bootstrap/API key
definidas por plataforma. Nunca las pongas en HTML, Dockerfile ni commits.
Para cada servicio federado configure también:

```text
TOOL_ID=<id de la tool de la tabla>
ISOTOOLS_API_URL=https://api-events.orcalabs.mx/api/v1
ISOTOOLS_API_KEY=<key registrada en el core con events:read,events:write>
```

El poller usa `GET /events/subscriptions/:TOOL_ID` y publica cada salida en
`POST /events`, conservando `correlation_id` y estableciendo `causation_id`.
El cursor es local a la instancia y se reinicia saltando el backlog; para no
perder eventos durante reinicios, el cursor debe persistirse en almacenamiento
durable antes de usarlo en producción crítica.

Los contenedores federados no necesitan PostgreSQL: el esquema/migrador local
del servidor es no fatal cuando no hay base configurada; lectura y publicación
se realizan contra el Core API. La API key se registra en el Core (el admin
puede usar `BOOTSTRAP_API_KEY` allí) y después se configura como
`ISOTOOLS_API_KEY` en cada servicio de tool. No configures el bootstrap key en
los servicios consumidores.

## Primer despliegue

1. El administrador crea los tres Services en Railway y entrega el token del equipo.
2. Añadir `RAILWAY_TOKEN` en GitHub → Settings → Secrets and variables → Actions.
3. Configurar `RAILWAY_DOCKERFILE_PATH` en cada Service con la ruta de la tabla.
4. Configurar `TOOL_ID`, `ISOTOOLS_API_URL` y la API key del servicio en Railway.
5. Hacer push a `main` o ejecutar el workflow manualmente con `deploy_all`.
6. Revisar GitHub Actions y comprobar `GET /health`, `GET /ready` y `/status` en cada dominio.

No modificar Secrets, Services ni configuración de Railway cuando falle un
deployment; conservar los logs del workflow y escalar el fallo al administrador.
