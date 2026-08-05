# Paso 2 — Crear la API central y conectarse a ella

> [⬅ Volver al roadmap](../README.md)

## Qué vas a lograr en este paso

Conseguir tu **API key** y **conectarte a la plataforma central**. **Todos se conectan a la misma plataforma desplegada** en Railway: no se corre nada en local. Apuntas tu tool a la URL con tu key y listo.

Orden correcto:

1. **Paso 0 — API key** (lo primero de todo, § 2.0).
2. **Conectarte a la plataforma central** (§ 2.3) y probar publicar/consumir.

> **URL base de la plataforma:**
> ```
> https://isotools-production.up.railway.app/api/v1
> ```

> 📥 **Plantilla descargable**:
> - [`env-central.example`](../plantillas/env-central.example) — variables para conectarte a la plataforma

---

## 2.0 — Consigue tu API key (LO PRIMERO)

Sin API key, todo `POST`/`GET` de eventos responde `401`. Consíguela **antes de escribir código**.

**El programador genera su propia key; el admin la registra.** Pasos:

1. **Genera tú un secreto aleatorio** (es TU key, guárdala como secreto):
   ```bash
   openssl rand -hex 24     # recomendado
   # o: uuidgen
   ```

2. **Pásale al admin (Carlos):** el **valor** de la key + el **nombre de tu tool** (el *label*, ej. `tool-vision`).

3. **El admin la registra** en Railway → servicio **IsoTools** → **Variables**:
   ```
   BOOTSTRAP_API_KEY        = <la key que generaste>
   BOOTSTRAP_API_KEY_LABEL  = <nombre de tu tool, ej. tool-vision>
   BOOTSTRAP_API_KEY_SCOPES = events:read,events:write   # opcional (default: read,write)
   ```
   Al redesplegar, la plataforma inserta la key (hasheada, nunca se imprime). Es idempotente. Luego el admin **quita** `BOOTSTRAP_API_KEY` por seguridad.

4. Ya puedes usarla en el header **`x-api-key`**. Guárdala en tu `.env` (nunca la commitees):
   ```bash
   CORE_BASE_URL=https://isotools-production.up.railway.app
   API_KEY=<tu-key>
   ```

**Scopes:** `events:write` para publicar, `events:read` para consumir. Lo normal es pedir `events:read,events:write`.

---

## 2.1 Topología — una sola plataforma para todos

```
┌───────────────────────────────────────────────────────────┐
│  PLATAFORMA CENTRAL — Railway (única, para todos)          │
│  https://isotools-production.up.railway.app                │
│                                                            │
│  Auto-deploy en cada push a main                           │
│  Postgres administrado (plugin de Railway)                 │
│  Health: /api/v1/health                                    │
│                                                            │
│  Aquí ocurre TODO: publicar, consumir, integrar tools      │
└───────────────────────────────────────────────────────────┘
        ▲                    ▲                    ▲
        │ HTTP + x-api-key   │                    │
   ┌─────────┐          ┌─────────┐          ┌─────────┐
   │ tool A  │          │ tool B  │          │ tool C  │
   └─────────┘          └─────────┘          └─────────┘
```

**Regla simple**: no corres nada en local. Todas las tools apuntan a la misma URL central con su propia API key. El dashboard, las vistas y el reporte ISO **no viven en este repo** (es solo-tools): corren en el repo de la plataforma.

---

## 2.2 Deploy de la plataforma en Railway

> Esta parte la hace **una vez** el admin del proyecto (Carlos). Si tú eres un programador, salta a [§ 2.3](#23-conectarte-a-la-plataforma-el-flujo-normal).

### Por qué Railway

- Ya hay `railway.toml` en el repo → el deploy es prácticamente automático.
- Postgres administrado incluido (no instalas ni respaldas nada manualmente).
- $5-20/mes según uso (suficiente para los primeros 6-12 meses).
- Auto-deploy: cada push a `main` redespliega.
- Si crece el uso a >100k eventos/día sostenidos, ahí sí evalúas migrar a VPS (Hetzner ~$10/mes con misma carga). Por debajo de eso, Railway gana.

### Pasos de deploy (una vez)

1. **Crea cuenta** en [railway.app](https://railway.app) y conecta tu GitHub.
2. **Nuevo proyecto** → `Deploy from GitHub repo` → selecciona `IsoTools`.
3. Railway lee `railway.toml` automáticamente (builder: Dockerfile, healthcheck: `/api/v1/health`).
4. **Añade Postgres**: dentro del proyecto, `+ New` → `Database` → `Add PostgreSQL`. Railway expone `DATABASE_URL` automáticamente al servicio API.
5. **Variables de entorno del servicio API** (Settings → Variables):
   - `PORT=3000`
   - `LOG_LEVEL=info`
   - `DATABASE_URL` ← ya inyectada por Railway, no la pongas a mano
6. **Ejecuta migraciones la primera vez** (desde la consola de Railway o local apuntando a la `DATABASE_URL` pública):
   ```bash
   psql $DATABASE_URL -f db/init.sql
   ```
7. **Genera el dominio público**: Settings → Networking → `Generate Domain`. Obtienes algo como `IsoTools-production.up.railway.app`, o conectas un dominio propio (en este proyecto: `www.expo-programador.com`).
8. **Registra las API keys de los programadores** (ver § 2.4).

### Verificar el deploy

```bash
curl https://isotools-production.up.railway.app/api/v1/health
# Esperado: {"status":"ok"}
```

### ⚠️ Gotchas reales de este proyecto (anota antes de operar)

Lecciones aprendidas al hacer el deploy inicial. Si vas a tocar Railway, léelo:

1. **Postgres se rompe si Railway sube de versión mayor.** El proyecto fue creado con PG16; cuando el template auto-actualizó a PG18, el `postgresql.conf` quedó con parámetros nuevos (`autovacuum_worker_slots`) que PG16/17 no entienden. Si ves el servicio Postgres en CRASHED y el log dice `unrecognized configuration parameter`, la opción rápida es volver a la imagen que sí arranca con el volumen. Mutación GraphQL:
   ```graphql
   mutation { serviceInstanceUpdate(
     serviceId: "<id>", environmentId: "<id>",
     input: { source: { image: "ghcr.io/railwayapp-templates/postgres-ssl:18" } }
   ) }
   ```
   Después: `serviceInstanceDeployV2(...)` para forzar el deploy.

2. **El proxy TCP de Postgres (`switchyard.proxy.rlwy.net:14199`) cierra TCP sin razón aparente cuando Postgres está crasheado.** El handshake TCP abre, pero el proceso pg detrás está muerto → ECONNRESET. Si ves esto en `psql`/`pg`, primero revisa que el servicio Postgres esté en SUCCESS, no CRASHED.

3. **`db/init.sql` tiene un `GRANT CONNECT ON DATABASE industrial_events`** que falla en Railway porque la base se llama `railway`, no `industrial_events`. Es no bloqueante (el resto del schema se crea), pero conviene parchar a `current_database()`.

4. **`src/db/index.js` y `scripts/createApiKey.js` NO leen `DATABASE_URL`.** Leen `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME`. En Railway hay que crear esas vars como referencias:
   ```
   DB_HOST=${{Postgres.PGHOST}}
   DB_PORT=${{Postgres.PGPORT}}
   DB_USER=${{Postgres.PGUSER}}
   DB_PASSWORD=${{Postgres.PGPASSWORD}}
   DB_NAME=${{Postgres.PGDATABASE}}
   ```
   Sin esto, la API arranca pero falla 500 al primer query con `ECONNREFUSED ::1:5432` (intenta localhost).

5. **Plan sin shell.** Si tu plan de Railway no expone `Shell` en el servicio ni `Data` tab en Postgres, para crear keys o correr migraciones ad-hoc tienes que conectarte por el TCP proxy público desde tu máquina (`docker run --rm postgres:16 psql ...`). El CLI `railway run` requiere shell autenticada que algunos planes no proveen.

---

## 2.3 Conectarte a la plataforma (el flujo normal)

### Pre-requisitos

- La **URL base**: `https://isotools-production.up.railway.app`.
- Tu **API key** (la del § 2.0, que generaste tú y el admin registró).

### Configura tu `.env`

```bash
API_BASE_URL=https://isotools-production.up.railway.app
API_KEY=<tu-key>
```

> No commitees el `.env`. Añádelo al `.gitignore`.

### Verifica la conexión

```bash
curl "$API_BASE_URL/api/v1/health"   # -> {"status":"ok"}
curl "$API_BASE_URL/api/v1/ready"    # -> {"status":"ready"}  (además hay DB)
```

### Publicar un evento

```bash
curl -X POST $API_BASE_URL/api/v1/events \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d @sample-event.json
```

Es **idempotente**: reintentar el mismo `event_id` no duplica (responde `200 duplicate`).

### Consumir eventos (cursor keyset — el patrón por defecto)

```bash
# Arranca en 0; usa el next_seq de la respuesta en el siguiente tick:
curl "$API_BASE_URL/api/v1/events?since_seq=0&type=CALIBRATION_FAILED" \
  -H "x-api-key: $API_KEY"
```

Otras formas de consumir: `GET /events/latest?type=…` (última data por tipo, con ETag/304) y `GET /events/subscriptions/<tu_tool_id>?since_seq=0` (solo lo que tu tool declara consumir). Detalle completo: la [Vía rápida](../README.md#vía-rápida--tu-primer-día-todos-usan-la-plataforma-central) y el Manual del `README.md`.

### Ver la cadena causal de un evento

```bash
curl "$API_BASE_URL/api/v1/events/chain/<correlation-id>" -H "x-api-key: $API_KEY"
```

---

## 2.4 Gestión de API keys (una por tool)

**Decisión del proyecto**: cada programador tiene su propia API key. Esto te da:

- Trazabilidad de quién ingestó qué.
- Posibilidad de revocar a un programador sin afectar a los demás.
- Scopes diferenciados (ej. junior solo `events:read`).

### Registrar una key en la plataforma (flujo normal)

Como se explicó en § 2.0: **el programador genera su propio secreto y el admin lo registra** por variable de entorno en Railway. El admin va a Railway → servicio **IsoTools** → **Variables**:

```
BOOTSTRAP_API_KEY        = <la key que generó el programador>
BOOTSTRAP_API_KEY_LABEL  = <nombre de la tool, ej. tool-vision>
BOOTSTRAP_API_KEY_SCOPES = events:read,events:write   # opcional
```

Redeploy → la key queda insertada (hasheada, no se imprime; idempotente). El admin **quita** `BOOTSTRAP_API_KEY` después. Como es una sola variable, se registra **una key a la vez**: repite el ciclo por cada tool.

### Alternativa (admin, con acceso a la DB): `apikey:create`

Si el admin prefiere generar la key él mismo en vez de recibirla, desde la shell del servicio en Railway:
```bash
node scripts/createApiKey.js tool-vision --scopes=events:read,events:write
```
Imprime la key en texto plano **una sola vez** — cópiala y entrégasela al programador.

### Scopes disponibles

| Scope | Permite |
|---|---|
| `events:read` | Consumir: `GET /api/v1/events`, `/latest`, `/subscriptions/:id`, `/chain/:id` |
| `events:write` | Publicar: `POST /api/v1/events` |

Combinaciones típicas:

- **Tool que publica y consume**: `events:read,events:write` (lo normal)
- **Tool solo-ingest**: `events:write`
- **Consumidor / consultor**: `events:read`

### Revocar una key

Hoy es manual contra la DB:

```sql
DELETE FROM api_keys WHERE label = 'nombre-del-programador';
```

> Si esto se vuelve frecuente, agregamos un script `apikey:revoke`. Por ahora rota y avisa.

### Reglas de seguridad

- La key se guarda **hasheada** en la DB (SHA-256). Si la pierdes, no se recupera — generas una nueva.
- **Nunca** comitees una key. `.env*` debe estar en `.gitignore`.
- Si la filtraste, revoca de inmediato y genera otra.

---

## 2.5 Solución de problemas comunes

| Síntoma | Causa | Cómo resolver |
|---|---|---|
| `401 Unauthorized` | API key faltante o mal escrita | Verifica header `x-api-key` (no `Authorization`), key sin saltos de línea |
| `403 forbidden — missing scope` | Tu key no tiene el scope | Pide al admin registrar la key con `events:read` y/o `events:write` |
| Evento aceptado (201) pero no aparece al consumir | Falló validación silenciosa o el filtro no coincide | Revisa el `type`/filtros de tu `GET`; en Railway: pestaña "Deployments" → "View Logs" |
| `429 Too Many Requests` | Poll demasiado agresivo | Respeta el header `Retry-After`; baja la frecuencia y usa el `ETag` de `/latest` |
| Railway tarda en redesployar | Build de Docker lento | Normal en el primer deploy. Subsecuentes usan cache y bajan a ~1 min |

---

## Archivos descargables

- 📥 [`env-central.example`](../plantillas/env-central.example) — `.env` para conectarte a la plataforma en Railway.

---

## Siguiente paso

→ [Paso 3: Cargar los archivos JSON del estándar](./03-archivos-json.md) _(en preparación)_

Si ya tienes tu API key y la URL, y quieres saltar al código: → [Paso 4: Nombrado IES](./04-nombrado-ies.md)
