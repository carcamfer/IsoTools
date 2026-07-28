# IsoTools

Repositorio **único y enfocado** para construir las *tools* de los agentes industriales orientadas a **procedimientos ISO**. Aquí está todo lo necesario para entender, crear, probar y coordinar tools — y **nada más**.

> **Qué NO está aquí (a propósito):** el sitio web, los dashboards, las landings y las vistas Pug. Eso vive en el repo de la plataforma. En IsoTools solo hay el plano de *tools*: handlers, bus de eventos, validación, la API de ingesta, los JSON de configuración y la documentación para programarlas. Así nadie se distrae con código que no le toca.

---

## 🚀 Empieza aquí según quién seas

- **Tienes tu propia tool y quieres conectarla** (publicar/consumir eventos) → **[Manual de integración](#manual-de-integración-publicar-y-consumir-eventos)**, más abajo. Ahí está el contrato completo: payloads, endpoints, filtros y ejemplos.
- **Vas a programar una tool por primera vez** → lo normal es una **tool externa**: vive en **tu propio repo**, en cualquier lenguaje, y solo habla con la plataforma por HTTP. Tu guía completa es el **[Manual de integración](#manual-de-integración-publicar-y-consumir-eventos)** (más abajo). **No clonas este repo, no escribes en `src/tools/`, no haces PR de código.** El roadmap de **[`pasos/`](./pasos/)** (1 → 10) describe el caso especial de una **tool nativa dentro de este repo** (el paquete de referencia que corre el bus), tarea del admin/core — no lo necesitas para una tool externa.
- **Necesitas la referencia técnica** → **[`docs/GUIA_TOOLS.md`](./docs/GUIA_TOOLS.md)** (anatomía del handler, reglas de nombrado IES, comunicación, checklist).
- **Quieres ver qué hace cada tool y con quién habla** → abre el **[cerebro Obsidian](./cerebro/)** (`cerebro/index.md`). Cómo usarlo y coordinarte con la otra tool: **[`pasos/10-cerebro-y-colaboracion.md`](./pasos/10-cerebro-y-colaboracion.md)**.
- **Vas a levantar y probar el ambiente** → **[`docs/SIMULACION_PASO_A_PASO.md`](./docs/SIMULACION_PASO_A_PASO.md)**.

---

## Estructura del repo

```
IsoTools/
├── README.md                  ← este archivo
├── pasos/                     ← roadmap del programador (1 → 9)
├── plantillas/                ← esqueletos descargables (handler, meta, regla, placeholder…)
├── recursos/                  ← diagramas y material de apoyo
├── docs/
│   ├── GUIA_TOOLS.md          ← referencia técnica para crear una tool
│   ├── SIMULACION_PASO_A_PASO.md
│   └── postman/               ← colección Postman lista para importar
├── cerebro/                   ← 🧠 segundo cerebro Obsidian (tools + comunicaciones)
├── src/
│   ├── server.js              ← API de eventos: publicar/consumir (SOLO tools, sin web)
│   ├── config.js              ← configuración central (env vars)
│   ├── tools/                 ← un archivo por tool + index.js (registro)
│   ├── data/agents/           ← los 5 JSON de configuración del sistema
│   ├── services/              ← eventBus · eventsService · validationService · catalogService · cache
│   ├── controllers/           ← eventsController · catalogController
│   ├── routes/                ← eventsRoutes · catalogRoutes
│   ├── middleware/            ← apiKeyAuth · rateLimit
│   └── db/                    ← conexión, migración y capacidades de Postgres
├── scripts/
│   ├── createApiKey.js · seedEvents.js · simulateStream.js · test_package_iso.js
│   ├── generar-cerebro.js     ← genera/actualiza las notas del cerebro
│   └── crear-rama-comunicacion.js ← crea la rama de una comunicación tool↔tool
├── db/init.sql
├── docker-compose.yml · Dockerfile · railway.toml
└── .env.example
```

---

## Vía rápida — tu primer día (todos usan la plataforma central)

**No se corre nada en local.** Todas las tools se conectan a la misma plataforma desplegada en Railway. Memoriza la URL base:

```
https://isotools-production.up.railway.app/api/v1
```

Sigue estos pasos **en orden**. El contrato completo (payloads, filtros, ejemplos) está en el [Manual de integración](#manual-de-integración-publicar-y-consumir-eventos), más abajo.

### Paso 0 — Consigue tu API key (esto es LO PRIMERO)

Sin key, todo `POST`/`GET` de eventos responde `401`. El catálogo y el health son abiertos (no piden key).

1. **Genera tú mismo un secreto aleatorio** y guárdalo (no se vuelve a mostrar):
   ```bash
   openssl rand -hex 24        # recomendado
   # o
   uuidgen
   ```
2. **Pásale al admin (Carlos) dos datos:** el **valor** de la key y el **nombre de tu tool** (el *label*, ej. `tool-vision`).
3. **El admin la registra** en Railway → servicio **IsoTools** → **Variables**:
   ```
   BOOTSTRAP_API_KEY        = <la key que generaste>
   BOOTSTRAP_API_KEY_LABEL  = <el nombre de tu tool, ej. tool-vision>
   BOOTSTRAP_API_KEY_SCOPES = events:read,events:write   # opcional
   ```
   Al redesplegar, la plataforma inserta tu key (hasheada, nunca en logs). Es idempotente. Después el admin **quita** `BOOTSTRAP_API_KEY` por seguridad.
4. Listo: ya puedes usar tu key en el header **`x-api-key`**.

> **Scopes:** `events:write` para publicar, `events:read` para consumir. Si tu tool hace ambas (lo normal), pide `events:read,events:write`.

### Paso 1 — Configura tu entorno

```bash
export CORE_BASE_URL="https://isotools-production.up.railway.app/api/v1"
export API_KEY="<tu-key-del-paso-0>"
```

> La key **jamás** va en el frontend ni se commitea: vive en tu servidor / en variables de entorno. Añade `.env*` a tu `.gitignore`.

### Paso 2 — Verifica que estás conectado

```bash
curl "$CORE_BASE_URL/health"    # -> {"status":"ok"}     (el proceso responde)
curl "$CORE_BASE_URL/ready"     # -> {"status":"ready"}  (además hay base de datos)
```

Si `/health` responde pero un `POST` te da `401`, revisa el header `x-api-key` (no `Authorization`) y que la key no tenga saltos de línea.

### Paso 3 — Publica tu primer evento

```bash
curl -X POST "$CORE_BASE_URL/events" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d @sample-event.json
```

El payload debe cumplir el **Industrial Event Standard (IES)** (ver [§ 3](#3-el-payload-de-entrada-el-sobre-ies); hay un ejemplo listo en [`sample-event.json`](./sample-event.json)). Es **idempotente**: reintentar con el mismo `event_id` responde `200 status:"duplicate"`; un evento nuevo responde `201 status:"accepted"`.

### Paso 4 — Consume (elige el patrón correcto)

Ver [§ 5](#5-consumir-cómo-pedir-solo-los-datos-que-necesitas) para el detalle. En corto:

- **Consumo incremental continuo** → cursor `since_seq` (patrón por defecto).
- **Última data por tipo** → `/events/latest` (poll barato con ETag/304).
- **Solo lo que MI tool consume** → `/events/subscriptions/:toolId`.
- **Trazabilidad** → `/events/chain/:correlationId`.

### Paso 5 — (Solo admin/core) Si vas a escribir un handler NATIVO dentro de este repo

**Esto NO es el camino normal y una tool externa nunca lo necesita.** Aplica solo a las **tools nativas** que la plataforma corre en su propio proceso (el paquete de referencia ISO 9001), tarea del admin/core. Con las tools externas te comunicas con las nativas exactamente igual que con cualquier otra: por evento. Si de verdad vas a escribir una nativa, sigue el roadmap completo en [`pasos/`](./pasos/) (1 → 10): crea `src/tools/<tu_tool_id>.js` (`meta` + `handler`), regístralo en `src/tools/index.js`, declara `consumes`/`produces` en `tools.json`, añade la regla en `communication-rules.json`, prueba y pasa el checklist.

> **¿Qué necesita una tool externa para "comunicarse" con otra?** Nada de lo anterior. Publica su evento (`POST /events`) y consume el tipo que le interesa (`GET /events?type=…`). Ver el [Manual de integración](#manual-de-integración-publicar-y-consumir-eventos). El **auto-disparo** (que otra tool reaccione **sola** al publicar) ocurre únicamente entre tools **nativas** vía el bus; entre tools externas, cada una corre su propio *poll* y trae su reacción codificada.

> **Correr la plataforma tú mismo es tarea exclusiva del admin** (deploy en Railway): ver [`pasos/02` § 2.2](./pasos/02-api-central.md). Los programadores nunca levantan la plataforma.

### Scripts útiles (admin)

| Script | Uso |
|--------|-----|
| `npm run apikey:create [label] -- --scopes=…` | Crea una API key (imprime el valor una sola vez). |
| `npm run seed:events [n]` | Inserta eventos de prueba en Postgres. |
| `npm run seed:stream` | Envía eventos al endpoint (usa `API_KEY`). |
| `npm run sim:iso` | Simula la cadena del paquete ISO 9001. |
| `npm run cerebro:generar` | Crea/actualiza las notas del cerebro Obsidian. |
| `npm run rama:comm <s>__<t>` | Crea la rama de una comunicación tool↔tool. |

---

## Pruebas rápidas con `curl` (8 pasos)

Ya con tu API key, copia y pega. No corres nada en local: todo pega contra la plataforma central. Guarda la base **sin** `/events`:

```bash
export CORE_BASE_URL="https://isotools-production.up.railway.app/api/v1"
export API_KEY="<tu-key>"
```

**1. ¿Está viva?** (abierto, no pide key)
```bash
curl "$CORE_BASE_URL/health"    # -> {"status":"ok"}
curl "$CORE_BASE_URL/ready"     # -> {"status":"ready"}  (además hay DB)
```

**2. Descubre el contrato** (abierto): qué tipos existen y quién los mueve.
```bash
curl "$CORE_BASE_URL/catalog/events"                        # tipos + productores/consumidores
curl "$CORE_BASE_URL/catalog/tools/manage_nonconformances"  # consumes/produces de una de las 16
curl "$CORE_BASE_URL/catalog/event-standard"                # el IES completo
```

**3. Publica un evento** (`events:write`):
```bash
curl -i -X POST "$CORE_BASE_URL/events" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "test-'"$(openssl rand -hex 6)"'",
    "timestamp": "2026-07-21T12:00:00.000Z",
    "platform_version": "2.0",
    "module": { "id": "mi_tool_de_prueba", "version": "1.0.0" },
    "asset":  { "asset_id": "TEST-1", "plant_id": "plant_01" },
    "event":  { "type": "CALIBRATION_FAILED", "category": "quality", "severity": "high" },
    "data":   { "deviceId": "TEST-1", "priorMeasurementsSuspect": true }
  }'
```
Fíjate en `201 status:"accepted"`, tu `seq` y `triggered` (cuántas tools **nativas** reaccionaron). Como `CALIBRATION_FAILED` dispara a `manage_nonconformances`, verás `triggered: 1` y una `chain`.

**4. Idempotencia**: repite el POST anterior **con el mismo `event_id`** (fíjalo en el `-d`). La 2ª vez responde `200 status:"duplicate"`, `triggered: 0`.

**5. Consume por tipo** (cursor incremental — el patrón real):
```bash
curl -H "x-api-key: $API_KEY" \
  "$CORE_BASE_URL/events?since_seq=0&type=CALIBRATION_FAILED&limit=10"
# guarda el next_seq y en el siguiente tick úsalo como since_seq=<next_seq>
```

**6. Última data por tipo** (con ETag/304):
```bash
curl -i -H "x-api-key: $API_KEY" \
  "$CORE_BASE_URL/events/latest?type=CALIBRATION_FAILED"
# reenvía el ETag -> 304 si no hubo nada nuevo:
curl -i -H "x-api-key: $API_KEY" -H 'If-None-Match: W/"<seq>"' \
  "$CORE_BASE_URL/events/latest?type=CALIBRATION_FAILED"
```

**7. Suscripción "solo lo mío"** (usa un id ya listado en el catálogo):
```bash
curl -H "x-api-key: $API_KEY" \
  "$CORE_BASE_URL/events/subscriptions/manage_nonconformances?since_seq=0&limit=20"
```

**8. Traza la cadena causal** (usa un `correlation_id` de la respuesta del paso 3):
```bash
curl -H "x-api-key: $API_KEY" "$CORE_BASE_URL/events/chain/<correlation_id>"
```

> `401` → revisa el header `x-api-key` (no `Authorization`), sin saltos de línea. `403` → tu key no tiene el scope. `400` → el sobre no cumple el IES (compara contra `/catalog/event-standard`).

---

# Manual de integración: publicar y consumir eventos

Esta es la guía completa para conectar **tu propia tool** (en cualquier lenguaje o stack) a la plataforma. Léela entera antes de escribir código: aquí está todo el contrato.

## 1. El modelo en 30 segundos

La plataforma es un **broker de eventos** con API HTTP y Postgres. Tu tool **solo habla con la plataforma**, nunca con otra tool.

```
  Tool A  ──POST /api/v1/events──▶  PLATAFORMA  ◀──GET /api/v1/events...──  Tool B
                                   (guarda todo)
  Tool A  ✗────── nunca se llaman directo ──────✗  Tool B
```

- **Publicar** = `POST /api/v1/events`. Mandas un evento, la plataforma lo valida y lo guarda.
- **Consumir** = **`GET`** con *polling* (tú preguntas cada N segundos). **No hay push, ni webhooks, ni websockets.**
- **A y B no se conocen.** El acoplamiento es por el **tipo de evento** (`event.type`), nunca por el nombre del productor. Si tu tool necesita datos de otra, consume el **tipo de evento** que esa otra publica — la plataforma te lo entrega.

> Si eres tool B y necesitas "lo último que publicó la tool A", no le preguntas a A: le pides a la plataforma **el último evento del tipo que A produce** (sección 5.1).

### Referencia rápida: endpoints

| Método | Ruta (bajo la URL base) | Scope | Qué hace |
|--------|-------------------------|-------|----------|
| `POST` | `/events` | `events:write` | Publica (idempotente por `event_id`). |
| `GET`  | `/events?since_seq=N` | `events:read` | Consumo incremental por cursor (**recomendado**). |
| `GET`  | `/events?start=&end=` | `events:read` | Rango por fecha (ISO), modo compat. |
| `GET`  | `/events/latest?type=` | `events:read` | Última data por tipo (cache + ETag/304). |
| `GET`  | `/events/subscriptions/:toolId` | `events:read` | Solo los tipos que esa tool consume. |
| `GET`  | `/events/chain/:correlationId` | `events:read` | Cadena causal de un `correlation_id`. |
| `GET`  | `/catalog/*` | — (abierto) | Contrato público: standard, eventos, tools. |
| `GET`  | `/health` · `/ready` | — (abierto) | Liveness · readiness. |

### Referencia rápida: errores comunes

| Código | Significa | Qué haces |
|--------|-----------|-----------|
| `401` | Falta o está mal la API key | Revisa el header `x-api-key` (no `Authorization`), sin saltos de línea. |
| `403` | Tu key no tiene el scope | Pide al admin registrar la key con `events:read` y/o `events:write`. |
| `429` | Rate limit excedido (poll muy agresivo) | Respeta el header `Retry-After`; baja la frecuencia y apóyate en el `ETag` de `/latest`. |
| `400` | Payload no cumple el IES | Compara contra `/catalog/event-standard` y el [§ 3](#3-el-payload-de-entrada-el-sobre-ies). |

---

## 2. Conectarte: URL, API key y scopes

Toda ruta bajo `/api/v1/events` exige el header **`x-api-key`**. El catálogo y health son abiertos.

**Cómo consigues tu key (esto es lo PRIMERO que haces):** tú generas un secreto aleatorio y el admin lo registra en la plataforma. Paso a paso en la [Vía rápida § Paso 0](#paso-0--consigue-tu-api-key-esto-es-lo-primero), más arriba, y en [`pasos/02-api-central.md` § 2.0](./pasos/02-api-central.md).

```bash
# 1. Genera TU secreto (guárdalo, no se vuelve a mostrar):
openssl rand -hex 24
# 2. Pásaselo al admin con el nombre de tu tool; él lo registra en Railway
#    (BOOTSTRAP_API_KEY / BOOTSTRAP_API_KEY_LABEL) y redespliega.
```

| Scope | Para qué |
|-------|----------|
| `events:write` | `POST /events` (publicar). |
| `events:read`  | Todos los `GET /events*` (consumir). |

- Si tu tool **solo publica** → `events:write`.
- Si tu tool **publica y consume** (lo normal) → `events:read,events:write`.
- **Una key por tool y por entorno.** Nunca compartan la misma key: así se revoca y audita por separado.
- La key **jamás** va en el frontend. Si tienes una UI, la key vive en tu servidor.

Variables que conviene tener en tu tool:

```bash
CORE_BASE_URL=https://isotools-production.up.railway.app
API_KEY=<tu key>
```

---

## 3. El payload de ENTRADA: el sobre IES

Todo lo que publicas usa el **Industrial Event Standard (IES)**. Este es el contrato exacto que valida la API:

```jsonc
{
  "event_id":         "01HG7Z9KQR5N3M2P4VX8YBWQTC", // REQUERIDO. único (UUID/ULID)
  "timestamp":        "2026-06-17T14:32:10.123Z",   // REQUERIDO. ISO-8601 UTC, la hora REAL del hecho
  "platform_version": "2.0",                        // REQUERIDO
  "module": {                                       // REQUERIDO. quién emite = TU tool
    "id":      "manage_device_registry",            //   REQUERIDO. tu tool_id en snake_case
    "version": "1.0.0"                              //   REQUERIDO. SemVer
  },
  "asset": {                                        // REQUERIDO. sobre qué activo es el evento
    "asset_id":   "DEV-9",                          //   REQUERIDO y no vacío
    "asset_type": "gauge",                          //   opcional
    "plant_id":   "plant_01",                       //   opcional
    "area_id":    "assembly",                       //   opcional
    "line_id":    "line_2",                         //   opcional
    "location":   "station_4"                       //   opcional
  },
  "event": {                                        // REQUERIDO. qué ocurrió
    "type":     "CALIBRATION_FAILED",               //   REQUERIDO. UPPER_SNAKE_CASE
    "category": "quality",                          //   opcional
    "severity": "high"                              //   opcional
  },
  "data":     { "deviceId": "DEV-9", "priorMeasurementsSuspect": true }, // TU payload (libre)
  "metadata": { "shift": "A", "operator_id": "op-12" },                  // contexto (libre)

  "correlation_id": null,   // opcional (ver sección 7)
  "causation_id":   null    // opcional (ver sección 7)
}
```

### Las 4 reglas que más se rompen

1. **Los campos inventados se BORRAN en silencio.** El nivel superior y los bloques `module` / `asset` / `event` son cerrados: si agregas un campo tuyo ahí, la API lo elimina antes de guardar — sin error, simplemente desaparece. **Todo lo tuyo va dentro de `data` o `metadata`**, que son objetos libres.
2. **`asset.asset_id` es obligatorio.** Todo evento es sobre un activo. Si tu tool no es de un activo concreto, usa un id sintético estable (por ejemplo el `plant_id`).
3. **Los enums NO se validan.** `type`, `category` y `severity` se aceptan como cualquier string. Si escribes mal un tipo, la API lo guarda feliz y **tu evento nunca hará match con ningún consumidor**. La disciplina la impones **en tus pruebas**:
   - `event.type` → `UPPER_SNAKE_CASE`
   - `event.severity` → `low` | `medium` | `high` | `critical`
   - `event.category` → `quality` | `productivity` | `maintenance` | `energy` | `safety` | `configuration` | `system`
4. **`timestamp` es TU reloj** (cuándo ocurrió el hecho); `received_at` lo pone la plataforma (cuándo llegó). Manda un UTC honesto.

---

## 4. PUBLICAR: `POST /api/v1/events`

```bash
curl -X POST "$CORE_BASE_URL/api/v1/events" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "event_id": "01HG7Z9KQR5N3M2P4VX8YBWQTC",
    "timestamp": "2026-06-17T14:32:10.123Z",
    "platform_version": "2.0",
    "module": { "id": "manage_device_registry", "version": "1.0.0" },
    "asset":  { "asset_id": "DEV-9", "asset_type": "gauge", "plant_id": "plant_01" },
    "event":  { "type": "CALIBRATION_FAILED", "category": "quality", "severity": "high" },
    "data":   { "deviceId": "DEV-9", "productRef": "PART-1", "priorMeasurementsSuspect": true }
  }'
```

**Respuesta `201` (evento nuevo, aceptado):**

```jsonc
{
  "status": "accepted",
  "event_id": "01HG7Z9KQR5N3M2P4VX8YBWQTC",
  "received_at": "2026-06-17T14:32:11.002Z",
  "correlation_id": "01HG7Z9KQR5N3M2P4VX8YBWQTC",
  "seq": 4821,          // posición global del evento (ver sección 5.3)
  "triggered": 1,       // cuántas tools NATIVAS reaccionaron dentro de la plataforma
  "chain": [ ... ]      // qué produjeron (informativo; no te afecta si eres externo)
}
```

### La ingesta es IDEMPOTENTE — úsalo

Si reintentas con el **mismo `event_id`**, la plataforma **no crea otra fila ni vuelve a disparar nada**. Responde **`200`**:

```jsonc
{ "status": "duplicate", "event_id": "...", "correlation_id": "...", "seq": 4821, "triggered": 0, "chain": [] }
```

Esto hace que reintentar sea **seguro**. La regla:

- **Un `event_id` nuevo por cada hecho distinto.**
- **El MISMO `event_id` al reintentar ese mismo hecho** (timeout, 5xx, caída de red).
- Truco recomendado: si tienes una tabla *outbox*, usa el **id de la fila del outbox** como `event_id`. Así el reintento es idempotente sin esfuerzo.

### Errores al publicar

| Código | Significa | Cuerpo |
|--------|-----------|--------|
| `400` | Sobre inválido | `{ "error": "Invalid event format", "details": [...] }` — `details` dice exactamente qué campo falla |
| `400` | JSON mal formado / body vacío | `{ "error": "Invalid JSON format" }` · `{ "error": "Empty request body" }` |
| `401` | Falta la key o es inválida | `{ "error": "API key required" }` · `{ "error": "Invalid API key" }` |
| `403` | La key no tiene `events:write` | `{ "error": "Insufficient scope" }` |
| `429` | Demasiadas peticiones | `{ "error": "Rate limit exceeded", "retry_after_seconds": 1 }` — respeta el header `Retry-After` |

---

## 5. CONSUMIR: cómo pedir **solo** los datos que necesitas

Hay 4 formas de leer. **Elige por caso de uso** — pedir de más es el error clásico que hace lento todo:

| Lo que necesitas | Usa | Sección |
|------------------|-----|---------|
| **La última data** de un tipo (el estado actual) | `GET /events/latest?type=X` | 5.1 |
| **Todo lo nuevo que me toca**, en bucle continuo | `GET /events/subscriptions/<mi_tool_id>?since_seq=N` | 5.2 |
| Lo nuevo de **un tipo/tool** concreto, incremental | `GET /events?since_seq=N&type=X` | 5.3 |
| Un **rango histórico** (auditoría, reportes) | `GET /events?start=…&end=…&type=X` | 5.4 |

> **Nunca** traigas todo y filtres del lado del cliente. La plataforma filtra por ti en el servidor: `type`, `module_id`, `asset_id`, `category`, `severity`.

### 5.1 La última data publicada (`/events/latest`)

Devuelve **el evento más reciente de cada tipo** que pidas. Es la lectura más barata que existe: una fila por tipo.

```bash
# "Dame lo último que se publicó de CALIBRATION_FAILED"
curl -H "x-api-key: $API_KEY" \
  "$CORE_BASE_URL/api/v1/events/latest?type=CALIBRATION_FAILED"

# Varios tipos a la vez -> te devuelve el último de CADA uno
curl -H "x-api-key: $API_KEY" \
  "$CORE_BASE_URL/api/v1/events/latest?type=CALIBRATION_FAILED,DEFECT_FOUND"

# Acotado a una tool concreta o a un activo concreto
curl -H "x-api-key: $API_KEY" \
  "$CORE_BASE_URL/api/v1/events/latest?type=CALIBRATION_FAILED&module_id=manage_device_registry"
curl -H "x-api-key: $API_KEY" \
  "$CORE_BASE_URL/api/v1/events/latest?type=CALIBRATION_FAILED&asset_id=DEV-9"
```

```jsonc
{ "count": 1, "max_seq": 4821, "events": [ /* la fila de evento, ver sección 6 */ ] }
```

**Ahorra ancho de banda con ETag.** La respuesta trae un header `ETag`. Si en el siguiente poll lo reenvías en `If-None-Match` y no hubo cambios, recibes **`304 Not Modified`** sin cuerpo:

```bash
curl -H "x-api-key: $API_KEY" -H 'If-None-Match: W/"4821"' \
  "$CORE_BASE_URL/api/v1/events/latest?type=CALIBRATION_FAILED"
# -> 304 (no hay nada nuevo; no descargaste nada)
```

### 5.2 Suscripción: solo lo que TU tool consume (`/events/subscriptions/:toolId`)

La forma **recomendada** para el bucle continuo. Tu tool declara en `src/data/agents/tools.json` qué tipos consume (`consumes`), y la plataforma te entrega **solo esos**. Tú solo dices tu propio id: **no necesitas saber quién los produce**.

```bash
curl -H "x-api-key: $API_KEY" \
  "$CORE_BASE_URL/api/v1/events/subscriptions/manage_nonconformances?since_seq=0&limit=100"
```

```jsonc
{
  "consumer": "manage_nonconformances",
  "consumes": ["OUT_OF_CONTROL_DETECTED", "DEFECT_FOUND", "FMEA_CRITICAL_FOUND"],
  "count": 2,
  "next_seq": 4830,       // guarda esto y mándalo como since_seq en el siguiente tick
  "events": [ /* solo eventos de esos tipos, en orden ascendente */ ]
}
```

Si el `toolId` no existe en el catálogo → `404`.

### 5.3 Cursor incremental (`since_seq`) — el motor del consumo continuo

Cada evento guardado recibe un **`seq`**: un número **estrictamente creciente** (1, 2, 3…) que marca su posición global. Es el cursor:

```bash
# "Dame todo lo que entró DESPUÉS del seq 4820, solo de estos tipos"
curl -H "x-api-key: $API_KEY" \
  "$CORE_BASE_URL/api/v1/events?since_seq=4820&type=DEFECT_FOUND,CALIBRATION_FAILED&limit=200"
```

```jsonc
{ "count": 3, "next_seq": 4823, "events": [ /* orden ASCENDENTE por seq */ ] }
```

**Cómo se usa:**

1. Guardas el `next_seq` de forma **durable** (archivo, tu DB, lo que sea).
2. En el siguiente tick lo mandas como `since_seq`.
3. Repites.

**Por qué esto es mejor que consultar por fechas:** `seq` no depende de relojes. No necesitas ventanas de solape ni de-duplicar: nunca te llega dos veces lo mismo, nunca se te escapa nada. Si tu tool se cae y vuelve, retoma exactamente donde iba.

#### ⚠️ El arranque en frío: NO empieces en `since_seq=0`

`since_seq=0` significa **"desde el principio de los tiempos"**. La primera vez que conectas tu tool contra la plataforma central **ya hay backlog**: eventos viejos que pasaron hace días o semanas y que **ya fueron atendidos** en su momento. Si arrancas el cursor en `0`, tu tool los procesa **todos** como si acabaran de ocurrir y publica una tanda de eventos duplicados — reales, con `seq` nuevo y timestamp de hoy — por hechos que ya se cerraron.

Solo arranca en `0` si de verdad quieres **reprocesar el histórico** y tu tool es idempotente (por ejemplo: deriva un `event_id` determinista del evento padre, para que la plataforma descarte el repetido).

**Arranque correcto: primero pregunta por dónde va la punta, y empieza ahí.**

```bash
# 1) SOLO la primera vez (no tienes cursor guardado): ¿cuál es el seq más reciente
#    de los tipos que me interesan?
curl -s -H "x-api-key: $API_KEY" \
  "$CORE_BASE_URL/api/v1/events/latest?type=8D_REPORT_ISSUED,PROJECT_AT_RISK" \
  | jq '.max_seq'      # -> 55   (null si todavía no hay ninguno: arranca en 0)

# 2) Guarda ese 55 como tu cursor y a partir de ahí sí, poll normal.
curl -H "x-api-key: $API_KEY" \
  "$CORE_BASE_URL/api/v1/events?since_seq=55&type=8D_REPORT_ISSUED,PROJECT_AT_RISK"
```

Con eso tu tool solo ve lo que pase **de aquí en adelante**, que es lo que casi siempre quieres. `/events/latest` sin `type` te da la punta global.

### 5.4 Ventana histórica (`start` / `end`)

Para auditoría y reportes, no para el bucle continuo.

```bash
curl -H "x-api-key: $API_KEY" \
  "$CORE_BASE_URL/api/v1/events?start=2026-06-01T00:00:00Z&end=2026-06-30T23:59:59Z&type=NONCONFORMANCE_RAISED&limit=500"
```

`start` y `end` son **obligatorios** en este modo (si no mandas `since_seq`), en ISO-8601, y filtran sobre el `timestamp` del productor. Orden: **descendente** (lo más nuevo primero).

### Todos los filtros de `GET /api/v1/events`

| Param | Ejemplo | Qué hace |
|-------|---------|----------|
| `since_seq` | `4820` | **Modo cursor.** Devuelve `seq > 4820`, ascendente. |
| `start` + `end` | `2026-06-01T00:00:00Z` | **Modo ventana.** Obligatorios si no hay `since_seq`. |
| `type` | `DEFECT_FOUND,CALIBRATION_FAILED` | Uno o varios tipos (CSV, o repite `&type=`). |
| `module_id` | `manage_device_registry` | Solo lo que publicó esa tool. |
| `asset_id` | `DEV-9` | Solo lo de ese activo. |
| `category` | `quality` | Filtra por categoría. |
| `severity` | `critical` | Filtra por severidad. |
| `limit` | `500` | Default `100`, **tope duro `1000`**. |

Los filtros se **combinan** (AND). Errores: `401` sin key, `403` sin `events:read`, `400` si falta `start`/`end` sin cursor o si `since_seq` no es un entero ≥ 0.

---

## 6. El payload de SALIDA: la fila de evento

**Ojo:** lo que publicas es **anidado** (`event.type`, `module.id`), pero lo que **lees** viene **plano**. Esta es la forma exacta de cada elemento de `events[]`:

```jsonc
{
  "seq": 4821,                          // cursor global (número)
  "event_id": "01HG7Z9KQR...",          // el id que puso el productor
  "timestamp": "2026-06-17T14:32:10.123Z",  // reloj del productor
  "received_at": "2026-06-17T14:32:11.002Z",// reloj de la plataforma
  "platform_version": "2.0",

  "module_id": "manage_device_registry", // ← ojo: PLANO (era module.id)
  "module_version": "1.0.0",

  "asset_id": "DEV-9",                   // ← PLANO (era asset.asset_id)
  "asset_type": "gauge",
  "plant_id": "plant_01",
  "area_id": null,
  "line_id": null,
  "location": null,

  "event_type": "CALIBRATION_FAILED",    // ← PLANO (era event.type). Este es el campo que filtras.
  "category": "quality",
  "severity": "high",

  "data":     { "deviceId": "DEV-9", "priorMeasurementsSuspect": true }, // el payload del productor
  "metadata": { "shift": "A" },

  "correlation_id": "01HG7Z9KQR...",
  "causation_id": null,
  "id": "3f2a…"                          // uuid interno de la fila (ignóralo)
}
```

Lo que te importa a ti como consumidor: **`event_type`** (para saber qué es), **`data`** (el contenido), **`asset_id`** (sobre qué), y **`seq`** (para avanzar el cursor).

---

## 7. Trazabilidad: `correlation_id` y `causation_id`

- **`correlation_id`** = el hilo completo. Si no lo mandas, la plataforma usa tu `event_id` (tu evento es la raíz de una cadena nueva).
- **`causation_id`** = el `event_id` del evento **padre** que provocó éste.

**Regla para consumidores:** cuando publiques un evento **como reacción** a otro que consumiste, **propaga el `correlation_id` del original** y pon `causation_id` = el `event_id` del original. Así la cadena queda trazable de punta a punta:

```jsonc
// Consumiste { event_id: "E1", correlation_id: "C1", event_type: "CALIBRATION_FAILED" }
// Publicas tu reacción así:
{
  "event_id": "E2",              // nuevo
  "correlation_id": "C1",        // ← el del original
  "causation_id":   "E1",        // ← el event_id del original
  "event": { "type": "NONCONFORMANCE_RAISED", "category": "quality", "severity": "high" },
  ...
}
```

Luego puedes ver la historia completa:

```bash
curl -H "x-api-key: $API_KEY" "$CORE_BASE_URL/api/v1/events/chain/C1"
```

```jsonc
{
  "correlation_id": "C1",
  "count": 2,
  "events": [   // orden cronológico (más viejo primero)
    { "event_id": "E1", "tool": "manage_device_registry", "event": "CALIBRATION_FAILED",  "causation_id": null, "data": {…} },
    { "event_id": "E2", "tool": "manage_nonconformances", "event": "NONCONFORMANCE_RAISED","causation_id": "E1", "data": {…} }
  ]
}
```

---

## 8. Descubrir el contrato (sin clonar este repo)

El catálogo es **público** (no necesita API key). Úsalo para saber qué tipos existen y quién los mueve:

```bash
curl "$CORE_BASE_URL/api/v1/catalog/events"
# -> { count, events: [ { type, producers: [...], consumers: [...] }, ... ] }

curl "$CORE_BASE_URL/api/v1/catalog/tools/manage_nonconformances"
# -> { id, category, consumes: [...], produces: [...] }

curl "$CORE_BASE_URL/api/v1/catalog/event-standard"
# -> el IES completo (forma y nombrado de los eventos)
```

Y para saber si la plataforma está viva:

```bash
curl "$CORE_BASE_URL/api/v1/health"   # -> { "status": "ok" }    (el proceso responde)
curl "$CORE_BASE_URL/api/v1/ready"    # -> { "status": "ready" } (además hay base de datos)
```

---

## 9. Ejemplo completo: un consumidor de referencia

Bucle de consumo listo para copiar (Node, pero la forma es idéntica en cualquier lenguaje):

```js
const BASE = process.env.CORE_BASE_URL;
const KEY  = process.env.API_KEY;
const ME   = 'manage_nonconformances';   // tu tool_id

// 1) Recupera tu cursor de donde lo guardes (archivo, tu DB…).
//    Si NO hay cursor guardado (primer arranque) NO uses 0: eso reprocesaría todo
//    el backlog ya atendido y publicarías duplicados. Empieza en la punta actual.
let cursor = await loadCursor() ?? await tipSeq();

async function tipSeq () {
  const res = await fetch(`${BASE}/api/v1/events/latest`, { headers: { 'x-api-key': KEY } });
  const { max_seq: maxSeq } = await res.json();
  return maxSeq ?? 0;                                   // null = plataforma vacía
}

async function tick () {
  const url = `${BASE}/api/v1/events/subscriptions/${ME}?since_seq=${cursor}&limit=200`;
  const res = await fetch(url, { headers: { 'x-api-key': KEY } });

  if (res.status === 429) return;                       // rate limit: espera al siguiente tick
  if (!res.ok) throw new Error(`poll falló: ${res.status}`);

  const { events, next_seq } = await res.json();

  // 2) Ya vienen filtrados (solo tus `consumes`) y en orden ascendente por seq.
  for (const e of events) {
    await handle(e);                                    // e.event_type, e.data, e.asset_id
  }

  // 3) Avanza el cursor SOLO si todo salió bien, y guárdalo de forma durable.
  if (next_seq != null) {
    cursor = next_seq;
    await saveCursor(cursor);
  }
}

async function handle (e) {
  if (e.event_type === 'CALIBRATION_FAILED' && e.data.priorMeasurementsSuspect) {
    await publish({
      event_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      platform_version: '2.0',
      module: { id: ME, version: '1.0.0' },
      asset:  { asset_id: e.asset_id },
      event:  { type: 'NONCONFORMANCE_RAISED', category: 'quality', severity: 'high' },
      data:   { ncId: `NC-CAL-${e.data.deviceId}`, detectionSource: 'calibration' },
      correlation_id: e.correlation_id,   // propaga el hilo
      causation_id:   e.event_id          // apunta al padre
    });
  }
}

async function publish (event) {
  const res = await fetch(`${BASE}/api/v1/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': KEY },
    body: JSON.stringify(event)
  });
  if (res.status !== 201 && res.status !== 200) {
    throw new Error(`publish falló: ${res.status} ${await res.text()}`);   // reintenta con el MISMO event_id
  }
}

setInterval(() => tick().catch(console.error), 5000);
```

---

## 10. Reglas de oro

**Haz esto**

- Habla **solo** con la plataforma. Trata a las demás tools como si no existieran.
- Consume por **tipo de evento**, nunca por "quién lo publicó".
- Pide **solo lo que necesitas**: usa `type`, `since_seq`, `/latest` o `/subscriptions`.
- Guarda tu **cursor (`next_seq`) de forma durable** para sobrevivir reinicios.
- Haz tus handlers **idempotentes** (que procesar dos veces el mismo `event_id` no duplique efectos).
- Reintenta con el **mismo `event_id`**; genera uno nuevo solo para hechos nuevos.
- Mete todo lo tuyo en **`data`** / **`metadata`**.
- Propaga **`correlation_id`** y **`causation_id`** cuando reacciones a un evento.

**No hagas esto**

- No llames al servicio de otra tool ni importes su código.
- No esperes push/webhook/websocket: **no existen**, se consulta por poll.
- No inventes campos fuera de `data`/`metadata`: **se borran en silencio**.
- No traigas una ventana entera para filtrar en tu código: **filtra en el servidor**.
- No confíes en que la API valide `type`/`category`/`severity`: **valida tú en tus pruebas**.
- No compartas una API key entre tools, ni la pongas en el navegador.

---

## 🧠 El segundo cerebro (Obsidian)

`cerebro/` es un vault de Obsidian con la **memoria viva** de las tools. Hay una nota por tool y **una nota por cada comunicación entre dos tools**. Cada nota de comunicación tiene una **bitácora**: cuando un programador cambia el contrato de su tool, lo anota ahí, y el programador de la tool con la que se comunica lo ve sin tener que leer su código.

Ábrelo en Obsidian apuntando el vault a la carpeta `cerebro/`. Empieza por `cerebro/index.md`. Las reglas de mantenimiento están en `cerebro/CLAUDE.md`.

Para regenerar las notas tras agregar tools o reglas:
```bash
npm run cerebro:generar   # idempotente: nunca pisa lo que ya escribiste
```

---

## 🌿 Estrategia de ramas: una por comunicación

El trabajo entre dos tools que se comunican se hace en **su propia rama**, no en `feature/filter`. Convención:

```
comm/<sourceToolId>__<targetToolId>      ej: comm/inspect_product_quality__manage_nonconformances
```

Flujo:

1. **Crea/cambia a la rama de tu comunicación:**
   ```bash
   npm run rama:comm inspect_product_quality__manage_nonconformances
   npm run rama:comm --list     # ver todas las comunicaciones disponibles
   ```
2. **Trabaja el contrato** entre las dos tools en esa rama (código + payload).
3. **Anota el cambio** en la bitácora de `cerebro/comunicaciones/<source>__<target>.md`.
4. **PR de la rama → `feature/filter`** cuando el contrato quede estable.

Así `feature/filter` siempre refleja contratos acordados, y cada negociación entre dos programadores vive aislada hasta que cierra.

---

## Los 5 JSON de configuración (`src/data/agents/`)

| Archivo | Qué controla |
|---------|--------------|
| `event-standard.json` | El Industrial Event Standard (IES): forma y nombrado de los eventos. |
| `tools.json` | Catálogo de las 125 tools (id, schema de entrada/salida, categoría). |
| `tools-dev-spec.json` | Notas de implementación de cada tool (por qué los inputs, cálculos, UI). |
| `communication-rules.json` | Las 90 reglas: quién dispara a quién, con qué evento y condición. |
| `agents.json` | Los 13 agentes y qué tools agrupa cada uno. |

Quién edita cada uno y cuándo: ver **[`pasos/03-archivos-json.md`](./pasos/03-archivos-json.md)**.

> **Para una tool externa, `tools.json` es OPCIONAL.** La plataforma acepta y entrega eventos aunque tu tool no esté listada: publicas con `POST /events` (el validador solo revisa la forma del sobre IES, **no** que tu `module.id` exista en el catálogo) y consumes con `GET /events?type=…&since_seq=…`. Solo necesitas un renglón en `tools.json` si quieres aparecer en `/catalog` o usar `/events/subscriptions/:toolId` (el consumo "solo lo mío"): eso es un PR de **datos**, no de código, y hoy requiere un redeploy para que el catálogo lo recargue.
>
> **Sin `tools.json`, la coordinación de nombres corre por tu cuenta:** los `event.type` **no se validan**, así que si un productor publica `EVENT_X` y un consumidor escucha `EVENT_x`, nunca hacen match y no hay error. Acuerden los nombres exactos por convención (en el [cerebro Obsidian](./cerebro/) o donde prefieran) — eso es lo que el catálogo hacía por ustedes.

---

## Estado

- **16 tools implementadas** (handler en `src/tools/`): paquete de **calidad ISO 9001**.
- **109 tools en catálogo** listas para implementar.
- **90 comunicaciones** declaradas en `communication-rules.json`.
