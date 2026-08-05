# IsoTools

Repositorio **único y enfocado** de la plataforma ISO. Tiene dos planos, y no se mezclan:

- **`src/` — el core de eventos.** Handlers de tools nativas, bus, validación, API de ingesta y consumo, catálogo publicado. Node + Express, sin build.
- **`web/` — el dashboard orquestador.** La consola de operación: barra lateral con las 125 tools, salud en vivo de cada servicio, flujo de eventos, trazabilidad y reporte de auditoría ISO. React + TypeScript + Vite, con su propio `package.json` y su propio `node_modules`.

Se comunican **solo por HTTP**. Nada de imports cruzados, nada de dependencias compartidas. Al desplegar, el core sirve el SPA compilado por el **mismo origen**, que es lo que hace que la cookie de sesión sea first-party y que CORS no participe en absoluto.

> **Qué sigue sin estar aquí (a propósito):** el sitio web público, las landings y las vistas Pug. El dashboard es una **consola de operación**, no una página de marketing.

**Cada tool de cada equipo se despliega en su propio subdominio** y es un relying party OIDC independiente. El dashboard **no es un gateway de autenticación**: es un relying party más, así que una caída suya no impide a nadie entrar a su tool. El contrato completo entre equipos está en **[`docs/PLATAFORMA-SSO.md`](./docs/PLATAFORMA-SSO.md)**.

---

## 🚀 Empieza aquí según quién seas

- **Tienes tu propia tool y quieres conectarla** (publicar/consumir eventos) → **[Manual de integración](#manual-de-integración-publicar-y-consumir-eventos)**, más abajo. Ahí está el contrato completo: payloads, endpoints, filtros y ejemplos.
- **Vas a programar una tool por primera vez** → sigue el roadmap paso a paso en **[`pasos/`](./pasos/)** (1 → 10, sin saltarte ninguno).
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
│   ├── PLATAFORMA-SSO.md      ← contrato de SSO entre equipos (léelo antes de autenticar)
│   ├── DASHBOARD.md           ← cómo funciona el frontend y cómo sumar una tool
│   ├── SIMULACION_PASO_A_PASO.md
│   └── postman/               ← colección Postman lista para importar
├── cerebro/                   ← 🧠 segundo cerebro Obsidian (tools + comunicaciones)
│
├── src/                       ← BACKEND (Node ESM, sin build)
│   ├── server.js              ← monta las 3 superficies + el SPA, por un solo origen
│   ├── config.js              ← configuración central (env vars)
│   ├── auth/                  ← relying party OIDC: sesión firmada, roles, handshake
│   ├── tools/                 ← un archivo por tool + index.js (registro)
│   ├── data/
│   │   ├── agents/            ← los 5 JSON de CONTRATO (cambian con el dominio)
│   │   └── platform/          ← roles.json · deployments.json (cambian al desplegar)
│   ├── services/              ← eventBus · eventsService · catalogService · deploymentService · healthProbe · cache
│   ├── controllers/           ← eventsController · catalogController · consoleController
│   ├── routes/                ← eventsRoutes · catalogRoutes · consoleRoutes · authRoutes
│   ├── middleware/            ← apiKeyAuth · rateLimit · spa
│   └── db/                    ← conexión, migración y capacidades de Postgres
│
├── web/                       ← FRONTEND (React + TS + Vite; node_modules propio)
│   ├── src/api/               ← cliente HTTP y tipos del contrato con el core
│   ├── src/components/        ← Sidebar + primitivas visuales
│   ├── src/pages/             ← Resumen · Herramientas · Eventos · Catálogo · Auditoría
│   └── dist/                  ← salida del build (la sirve el core; no se versiona)
├── scripts/
│   ├── createApiKey.js · seedEvents.js · simulateStream.js · test_package_iso.js
│   ├── generar-cerebro.js     ← genera/actualiza las notas del cerebro
│   └── crear-rama-comunicacion.js ← crea la rama de una comunicación tool↔tool
├── db/init.sql
├── docker-compose.yml · Dockerfile · railway.toml
└── .env.example
```

---

## Cómo correr el ambiente (local)

```bash
# 1. Dependencias
npm install

# 2. Postgres + API con Docker Compose
docker compose --profile api up -d

# 3. Crear una API key
npm run apikey:create mi-cliente -- --scopes=events:read,events:write

# 4. Probar
curl http://localhost:3000/api/v1/health
```

Servicios: API en `http://localhost:3000`, Postgres en `localhost:5432` (`industrial`/`industrial`).
Sin Docker: copia `.env.example` → `.env`, ajusta `DATABASE_URL` y corre `npm run dev`.

### Scripts útiles

| Script | Uso |
|--------|-----|
| `npm run apikey:create [label] -- --scopes=…` | Crea una API key (imprime el valor una sola vez). |
| `npm run seed:events [n]` | Inserta eventos de prueba en Postgres. |
| `npm run seed:stream` | Envía eventos al endpoint (usa `API_KEY`). |
| `npm run sim:iso` | Simula la cadena del paquete ISO 9001. |
| `npm run cerebro:generar` | Crea/actualiza las notas del cerebro Obsidian. |
| `npm run rama:comm <s>__<t>` | Crea la rama de una comunicación tool↔tool. |

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

---

## 2. Conectarte: URL, API key y scopes

Toda ruta bajo `/api/v1/events` exige el header **`x-api-key`**. El catálogo y health son abiertos.

```bash
# La plataforma te da una key (se imprime UNA sola vez, guárdala como secreto):
npm run apikey:create mi_tool -- --scopes=events:read,events:write
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
CORE_BASE_URL=https://<tu-core>.up.railway.app   # o http://localhost:3000 en local
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

> `since_seq=0` significa "desde el principio".

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

// 1) Recupera tu cursor de donde lo guardes (archivo, tu DB…). 0 = desde el principio.
let cursor = await loadCursor() ?? 0;

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

El trabajo entre dos tools que se comunican se hace en **su propia rama**, no en `main`. Convención:

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
4. **PR de la rama → `main`** cuando el contrato quede estable.

Así `main` siempre refleja contratos acordados, y cada negociación entre dos programadores vive aislada hasta que cierra.

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

---

## Estado

- **16 tools implementadas** (handler en `src/tools/`): paquete de **calidad ISO 9001**.
- **109 tools en catálogo** listas para implementar.
- **90 comunicaciones** declaradas en `communication-rules.json`.
