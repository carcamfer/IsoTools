# Paso 5 — Anatomía de una tool (handler + meta)

> [⬅ Volver al roadmap](../README.md)

> **⚠️ Este paso es solo para tools NATIVAS (admin/core).** Aplica únicamente si tu tool vive **dentro de este repo** y la corre el bus. Si tu tool es **externa** (lo normal), no escribes ningún handler aquí: publicas y consumes por la API. Ver el [Manual de integración del README](../README.md#manual-de-integración-publicar-y-consumir-eventos) y el banner del [Paso 1](./01-vision-general.md).

## Qué vas a lograr en este paso

Ver el **esqueleto exacto** de una tool y las 7 reglas que tu `handler` debe cumplir. Al terminar tendrás un archivo `.js` que el bus puede ejecutar sin modificaciones adicionales.

> 📥 **Plantillas descargables**:
> - [`handler-skeleton.js`](../plantillas/handler-skeleton.js) — Tool completa de ejemplo.
> - [`meta-skeleton.json`](../plantillas/meta-skeleton.json) — Solo el bloque `meta` para copiar y rellenar.

---

## ✅ Estado actual — el bus YA existe y corre

A diferencia de versiones anteriores de este manual, la capa de ejecución **ya está construida y funcionando** en `IsoTools`:

| Pieza | Dónde vive hoy |
|---|---|
| `src/tools/<tool_id>.js` con `meta`+`handler` | ✅ Existe. Hay 16 tools del paquete ISO 9001 como referencia para copiar. |
| Bus que matchea reglas y dispara handlers en cadena | ✅ `src/services/eventBus.js` (`runChain`). |
| Registro/loader de tools | ✅ `src/tools/index.js` (`getTool`, `listTools`). |
| Cadena causal `correlation_id` + `causation_id` | ✅ Columnas en `industrial_events` + endpoint `GET /api/v1/events/chain/:correlationId`. |
| Bus auto-rellena `event_id`/`timestamp`/`module`/`correlation_id`/`causation_id` | ✅ Lo hace `eventBus.buildChildEvent`. |

> **Pruébalo ya:** con tu `API_KEY` y `API_BASE_URL` apuntando a la plataforma central, `npm run sim:iso` dispara una cadena completa. Ver [Paso 8](./08-pruebas-locales.md) y `docs/SIMULACION_PASO_A_PASO.md`.

**Qué haces cuando agregas tu tool** (de verdad corre, no es aire):

1. Crea `src/tools/<tool_id>.js` con `meta` + `handler` (este paso).
2. Regístrala en `src/tools/index.js` (impórtala y añádela al array `TOOLS`).
3. Declara su(s) regla(s) en `communication-rules.json` (Paso 6).

Opcional pero recomendado: agrega su entrada en `tools.json` (catálogo del dashboard y mapeo ISO).

> ⚠️ **Convención de nombres de evento en ESTE proyecto:** los `event.type` van en **UPPER_SNAKE_CASE** (`MEASUREMENTS_CAPTURED`, `OUT_OF_CONTROL_DETECTED`), **no** en formato con puntos. El nombre que pongas en `meta.produces`/`meta.consumes` debe ser **idéntico** al campo `event` de tu regla en `communication-rules.json`.

---

## 5.1 Una tool = un archivo

Una tool es **un archivo en `src/tools/<tool_id>.js`** que exporta dos cosas: `meta` y `handler`. Eso es todo.

```js
// src/tools/compare_planned_vs_actual.js  (ejemplo real del paquete ISO)

export const meta = {
  id:          'compare_planned_vs_actual',
  name:        'Comparación Plan vs Real',
  version:     '1.0.0',
  consumes:    [],                                 // se dispara externo/periódico
  produces:    ['PRODUCTION_VARIANCE_DETECTED'],   // UPPER_SNAKE, = al `event` de su regla
  category:    'productivity',
  description: 'Compara producción planificada vs real y emite la desviación.',
};

export function handler(inputEvent) {
  const input = inputEvent.data || {};
  const planned = input.planned ?? 1000;
  const actual  = input.actual  ?? 875;
  const deviationPct = ((actual - planned) / planned) * 100;

  if (Math.abs(deviationPct) < 5) {
    return null; // dentro de tolerancia → no hay nada que emitir
  }

  return {
    event: {
      type:     'PRODUCTION_VARIANCE_DETECTED',
      category: 'productivity',
      severity: Math.abs(deviationPct) > 15 ? 'high' : 'medium',
    },
    // `asset` es OPCIONAL: si lo omites, el bus hereda el del evento entrante.
    asset: inputEvent.asset,
    data: {
      module: input.module || 'production',
      deviationPercent: Number(deviationPct.toFixed(2)),
      status: actual < planned ? 'over_budget' : 'ahead',
    },
  };
}
```

> El `handler` puede ser `function` o `async function`. Devuelve **un** evento `{ event, asset?, data }`, un **array** de ellos, o `null`. El bus también acepta la forma corta `{ type, category, severity, data }`, pero la canónica recomendada es la anidada de arriba.

---

## 5.2 Las 7 reglas duras del `handler`

1. **Firma fija**: `async function handler(inputEvent)`.
2. **Retorno**: un objeto con (al menos) `event`, `asset`, `data`. O un **array** si emite varios. O `null` si no emite nada.
3. **Lo que NO devuelves**: `event_id`, `timestamp`, `module`, `platform_version`, `correlation_id`, `causation_id`. **El bus los rellena automático** (`eventBus.buildChildEvent`).
4. **Sin efectos secundarios externos**: no llames a otras tools, no escribas en la DB, no hagas HTTP saliente. Tu único output es el `return`.
5. **Síncrono respecto a I/O propio**: si necesitas leer un archivo de catálogo o calcular algo, hazlo. Pero no toques recursos compartidos.
6. **Errores**: lanza `throw new Error('mensaje')`. El bus lo captura (try/catch en `runChain`), corta esa rama de la cadena y reporta el error en la respuesta del POST (`chain[].error`). **No silencies excepciones.** _(Aún no hay tabla `events_dlq`; por ahora el error se registra en la respuesta y en el log del servidor.)_
7. **Idempotente**: si te llaman dos veces con el mismo input, debes producir el mismo output.

---

## 5.3 Casos válidos de retorno

```js
// Caso 1 — un solo evento
return { event: {...}, asset: {...}, data: {...} };

// Caso 2 — múltiples eventos
return [
  { event: {...}, asset: {...}, data: {...} },
  { event: {...}, asset: {...}, data: {...} },
];

// Caso 3 — no emitir nada
return null;
```

---

## 5.4 Qué hay en `meta`

| Campo | Obligatorio | Para qué |
|---|---|---|
| `id` | Sí | Identificador único. **Igual al nombre del archivo.** |
| `name` | Sí | Nombre legible. |
| `version` | Sí | SemVer. |
| `consumes` | Sí | Array de `event.type` a los que reacciona. Vacío si solo se invoca manualmente. |
| `produces` | Sí | Array de `event.type` que puede emitir. |
| `category` | Sí | Una de las 7 categorías del enum. |
| `description` | Sí | Una línea. Para el dashboard de tools. |
| `inputSchema` | Recomendado | JSON Schema de `data` que espera. _(Hoy se guarda en `tools.json` y lo muestra el dashboard; aún no se valida en runtime.)_ |
| `outputSchema` | Recomendado | JSON Schema de `data` que produce. _(Idem: solo catálogo, sin validación runtime.)_ |

---

## 5.5 Coordinación entre programadores

Antes de escribir tu tool, **declara explícitamente** a los demás programadores:

1. Lo que vas a poner en `meta.consumes` (qué eventos te disparan).
2. Lo que vas a poner en `meta.produces` (qué eventos emites).

Eso es el contrato. Otros programadores ven tus `produces` y deciden si pueden encadenar su tool a la tuya en el [Paso 6: Regla de comunicación](./06-regla-comunicacion.md).

---

## 5.6 Cómo está construida la capa de ejecución (referencia)

> ✅ **Esto ya existe en `IsoTools`.** Lo que sigue documenta cómo está armado el bus, para que entiendas qué pasa cuando tu handler corre. Lo que SÍ queda pendiente está marcado como 🚧.

Mapa rápido de lo implementado:

| Pieza descrita abajo | Archivo real |
|---|---|
| Columnas `correlation_id`/`causation_id` | ✅ `db/init.sql` |
| Loader/registro de tools | ✅ `src/tools/index.js` |
| Bus (matcheo de reglas + ejecución en cadena + auto-fill) | ✅ `src/services/eventBus.js` (`runChain`) |
| Enganche en el ingest | ✅ `src/controllers/eventsController.js` llama `runChain` tras guardar |
| Endpoint de cadena causal | ✅ `GET /api/v1/events/chain/:correlationId` |
| Smoke/E2E | ✅ `scripts/test_package_iso.js` (`npm run sim:iso`) |
| Tabla `events_dlq` y worker `pg_notify` asíncrono | 🚧 Pendiente. Hoy el bus corre **síncrono** dentro del POST y reporta errores en la respuesta. |

El detalle original del diseño (por si lo quieres construir distinto a futuro) se conserva abajo como referencia:

### a) Schema DB — `db/init.sql`

```sql
-- Cadena causal
ALTER TABLE industrial_events
  ADD COLUMN IF NOT EXISTS correlation_id TEXT,
  ADD COLUMN IF NOT EXISTS causation_id   TEXT,
  ADD COLUMN IF NOT EXISTS originating_module_id TEXT;

CREATE INDEX IF NOT EXISTS idx_industrial_events_correlation_id
  ON industrial_events (correlation_id);

-- Dead letter queue para handlers que fallan
CREATE TABLE IF NOT EXISTS events_dlq (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_event_id TEXT NOT NULL,
  target_tool_id  TEXT NOT NULL,
  error_message   TEXT NOT NULL,
  error_stack     TEXT,
  failed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload         JSONB NOT NULL
);

-- Cursor del worker del bus (para no reprocesar eventos)
CREATE TABLE IF NOT EXISTS bus_cursor (
  consumer_name TEXT PRIMARY KEY,
  last_event_id UUID
);
```

### b) Loader dinámico de tools — `src/services/toolRunner.js`

Responsabilidades:
- Al arrancar, escanear `src/tools/*.js` e importar cada uno (`meta` + `handler`).
- Validar que cada `meta.id` coincide con el nombre del archivo.
- Exponer `runTool(toolId, inputEvent)` que invoca el handler con try/catch.
- Al fallar, escribir en `events_dlq` y NO propagar el error al bus (un handler malo no debe parar el bus).

### c) Worker del bus — `src/services/eventBus.js`

Responsabilidades:
- Loop o `LISTEN industrial_events_insert` (vía `pg_notify` desde un trigger en DB) para detectar eventos nuevos.
- Por cada evento entrante, leer `communication-rules.json` y buscar reglas cuyo `event` o `sourceToolId` coincidan.
- Para cada regla matching, evaluar `triggerCondition` y, si pasa, invocar `toolRunner.runTool(targetToolId, inputEvent)`.
- Si el handler devuelve un evento, persistirlo en `industrial_events` con auto-fill: `event_id` (ULID nuevo), `timestamp` (ahora), `module.id` (= targetToolId), `module.version` (= meta.version), `platform_version` (constante del sistema), `correlation_id` (= correlation_id del padre, o event_id del padre si era raíz), `causation_id` (= event_id del padre), `originating_module_id` (= module.id del padre).
- Actualizar `bus_cursor.last_event_id` después de procesar.

### d) Arranque en `src/server.js`

```js
import { startEventBus } from './services/eventBus.js';
startEventBus();  // arranca el worker como parte del proceso de la API
```

### e) Test de smoke end-to-end

`scripts/smokeTestBus.js`:
1. POST `event_A` (tipo que dispara `tool_X`).
2. Esperar 500ms.
3. SELECT en `industrial_events` filtrando por `correlation_id = event_A.event_id`.
4. Verificar que existe un segundo row con `module.id = tool_X` y `causation_id = event_A.event_id`.

### Orden recomendado de construcción

1. Schema DB (a) — sin esto nada se persiste correctamente.
2. `toolRunner` (b) con 1 sola tool de juguete que sume dos números — verificar que el handler corre.
3. `eventBus` (c) primero con scan por polling (`SELECT ... WHERE id > cursor LIMIT 100` cada N segundos). Optimizar a `pg_notify` después.
4. Migrar 2-3 tools reales de catálogo a archivos `src/tools/`. Probar fan-out con una regla.
5. Cuando el bus sea estable, **endurecer el validador** (ver paso 4 § 4.10) para forzar el estándar IES sobre todo lo que entra.

---

## Archivos descargables

- 📥 [`handler-skeleton.js`](../plantillas/handler-skeleton.js) — Tool completa lista para clonar y modificar.
- 📥 [`meta-skeleton.json`](../plantillas/meta-skeleton.json) — Solo el bloque `meta`.

---

## Siguiente paso

→ [Paso 6: Regla de comunicación entre tools](./06-regla-comunicacion.md)
