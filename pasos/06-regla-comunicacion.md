# Paso 6 — Regla de comunicación entre tools

> [⬅ Volver al roadmap](../README.md)

> **⚠️ Solo para tools NATIVAS (admin/core).** `communication-rules.json` solo lo usa el bus para auto-disparar handlers **dentro del repo**. Una tool **externa** no crea reglas: reacciona por su cuenta consumiendo el tipo de evento por la API. Ver el banner del [Paso 1](./01-vision-general.md).

## Qué vas a lograr en este paso

Aprender a **declarar quién dispara a quién** en `communication-rules.json`. Esto es lo que conecta tu tool con el resto del sistema. Sin una regla aquí, tu tool nunca se va a ejecutar — aunque esté perfectamente escrita.

> 📥 **Plantilla descargable**: [`comunicacion-rule.json`](../plantillas/comunicacion-rule.json) — Regla de ejemplo lista para copiar.

---

## ⚠️ Estado actual vs estándar target — léelo antes de seguir

> ✅ **El bus YA lee estas reglas y dispara tus tools en runtime** (`src/services/eventBus.js`). Lo que escribas aquí sí corre. Lee esta tabla para no tropezar con detalles del formato real:

| Tema | Cómo es en la realidad del proyecto |
|---|---|
| **Nombre del `event`** | **UPPER_SNAKE_CASE** (`MEASUREMENTS_CAPTURED`, `OUT_OF_CONTROL_DETECTED`). NO se usa formato con puntos. Debe coincidir **exacto** con el `meta.produces` de la source y el `meta.consumes` de la target. |
| **Qué usa el bus para enrutar** | El bus matchea por el campo **`event`** (= `event.type` del evento que llega). El `sourceToolId`/`targetToolId` definen la arista. |
| `protocol` y `topic` | **Solo documentación.** El bus es in-process (importa y llama la función); ignora `protocol`/`topic`. Pon `"REST"`/`"internal"` y un `topic` descriptivo; no afecta la ejecución. |
| `triggerCondition` | **Sí se evalúa** (`eventBus.evalCondition`). Soporta: `always`, comparadores `== === != !== > >= < <=`, compuestas con `OR`/`AND`, y `campo IN ['a','b']`. Lee del `data` del evento (más `severity`/`category`/`type` del sobre). Si la expresión no se puede parsear, **deja pasar** (no bloquea la simulación). |
| Ciclos | El bus corta ciclos: cada arista `source::event::target` se dispara máx. 1 vez por cadena + tope de profundidad. Aun así, evita ciclos sin condición de corte. |

**Implicación para ti**: agrega tu regla con el `event` en UPPER_SNAKE igual a tus `produces`/`consumes`, y un `triggerCondition` dentro de la gramática soportada. Apenas guardes y reinicies (o con nodemon, al instante), el bus ya la usa.

---

## 6.1 Cómo funciona la comunicación (Push in-process)

Hay tres formas teóricas de que tu tool reciba eventos. En este proyecto **solo usamos la tercera**:

| Modo | Cómo funciona | ¿Lo usamos? |
|---|---|---|
| Pull | La tool pregunta cada N segundos `GET /api/v1/events?since_seq=N` (cursor keyset) | ❌ No |
| Push externo (webhook HTTP) | La API hace `POST https://<tool>/run` cuando llega un evento | ❌ No |
| **Push in-process** | La tool es una función Node y el bus la importa y llama directamente | ✅ Sí |

### El flujo completo

```
evento llega ─► industrial_events ─► eventBus ─► toolRunner.runTool('mi_tool', evento)
                                                       │
                                                       ▼
                                             handler() de mi_tool
                                                       │
                                                       ▼
                                             return outputEvent
                                                       │
                                                       ▼
                                          se reinyecta como evento nuevo
```

**Implicación para ti como autor**: no piensas en redes, ni en endpoints, ni en auth. Solo escribes una función pura — pero **debes registrar la regla** para que el bus sepa cuándo llamarte.

---

## 6.2 Formato de la regla

Archivo: `src/data/agents/communication-rules.json`. Agregas un objeto al array:

```json
{
  "id":               "rule-qual-002",
  "sourceToolId":     "calculate_control_charts",
  "targetToolId":     "detect_out_of_control_signals",
  "event":            "CHART_POINTS_UPDATED",
  "protocol":         "REST",
  "topic":            "POST /api/quality/spc/detect",
  "triggerCondition": "always",
  "description":      "Cartas de control actualizadas ejecutan detección de señales fuera de control."
}
```

### Campo por campo

| Campo | Qué va |
|---|---|
| `id` | `rule-<dominio>-<numero>`. Único. |
| `sourceToolId` | `module.id` de la tool que **emite** el evento. |
| `targetToolId` | `module.id` de la tool que **reacciona**. Es la tuya. |
| `event` | El `event.type` que dispara la regla. **Debe coincidir** con uno de los `produces` de la source y uno de los `consumes` de la target. |
| `protocol` | **Solo documentación**, el bus lo ignora (es in-process). Usa `"REST"` o `"internal"`. |
| `topic` | **Solo documentación**, el bus lo ignora. Pon algo descriptivo. |
| `triggerCondition` | `always` o una expresión filtro. El bus **sí la evalúa** (`evalCondition`). Ver § 6.3. |
| `description` | Una línea en español que explique el flujo. |

---

## 6.3 `triggerCondition` — filtrar cuándo se dispara

Permite filtrar **cuándo** se dispara la regla, no solo por tipo. Lo evalúa `eventBus.evalCondition`.

> ⚠️ **Importante sobre los campos:** la condición se evalúa contra el `data` del evento usando **nombres de campo "pelados"** (sin prefijo), más `severity`, `category` y `type` que vienen del sobre. Es decir: usa `deviationPercent`, NO `data.deviationPercent`; usa `severity`, NO `event.severity`. (Campos de `asset` no están disponibles en la condición.)

| Expresión | Significado |
|---|---|
| `"always"` | Siempre que llegue el evento. |
| `"severity == 'critical'"` | Solo si la severidad del evento es crítica. |
| `"deviationPercent > 10"` | Solo si el campo `data.deviationPercent` pasa 10. |
| `"violationsDetected == true"` | Solo si `data.violationsDetected` es true. |
| `"severity IN ['major','critical']"` | Si la severidad es una de la lista. |
| `"cpk < 1.33 OR status == 'not_capable'"` | Compuesta con OR. También existe `AND`. |

**Gramática soportada hoy** (`evalCondition`):
- `always` (o vacío) → siempre true.
- Comparadores: `==`, `===`, `!=`, `!==`, `>`, `>=`, `<`, `<=` (los `===`/`!==` se tratan igual que `==`/`!=`).
- Compuestas: `OR` y `AND` (en mayúsculas, estilo SQL).
- Pertenencia: `campo IN ['a','b','c']`.
- Si la expresión **no se puede parsear, deja pasar** (devuelve true) — pensado para que la simulación fluya. No dependas de eso para lógica crítica.

> **Nota de implementación:** `evalCondition` NO usa `eval`/`Function()`; parsea la expresión con regex (comparadores, `OR`/`AND`, `IN`), así que no hay superficie de inyección. El operador `includes` y el acceso con puntos (`data.x.y`, `asset.x`) **no** están soportados: si tu condición los necesita, haz que el productor emita un booleano simple en `data` y evalúa ese campo pelado (ej. `wantsSegmentation == true`).

---

## 6.4 Patrones de comunicación válidos

### Fan-out (una tool dispara varias)

```
production_metrics_collector ──► detect_production_deviation
                            └──► forecast_production_delays
                            └──► identify_bottlenecks
```

Se logra con **tres reglas**, una por destino. Las tres tienen el mismo `sourceToolId` y `event`.

### Fan-in (varias tools alimentan una)

```
detect_production_deviation ──┐
forecast_production_delays  ──┼──► generate_maintenance_kpis
identify_bottlenecks        ──┘
```

**Tres reglas** con distinto `sourceToolId` y `event`, mismo `targetToolId`.

### Cadena

```
A ─► B ─► C ─► D
```

**Cuatro reglas**, una por par consecutivo. El `correlation_id` se propaga automático.

---

## 6.5 Lo que NO debes hacer en reglas

- ❌ Crear **ciclos sin condición de corte**. (El bus igual los corta por arista + profundidad, pero no abuses: revisa que tu lógica converja.)
- ❌ Reglas duplicadas (mismo `source`, `target` y `event`).
- ❌ Apuntar a un `targetToolId` que **no tiene handler** en `src/tools/` (registrado en `src/tools/index.js`). Si no hay handler, el bus simplemente ignora la regla.
- ❌ Mencionar un `event` que **no aparece** en los `produces` de la source ni en los `consumes` de la target.

> **Validador propuesto** (script `scripts/lintCommunicationRules.js` a futuro):
> 1. Cargar `tools.json`, indexar por `id` con sus `produces`/`consumes` (cuando esos campos estén poblados en el catálogo).
> 2. Para cada regla: verificar que `sourceToolId` y `targetToolId` existen, que `event` está en `tools[source].produces` y en `tools[target].consumes`, y que no hay otra regla con la misma terna `(source, target, event)`.
> 3. Detectar ciclos con un grafo dirigido y reportar si alguno no tiene `triggerCondition` ≠ `"always"`.
> 4. Correr en `pre-commit` y en CI. Hoy nada de esto existe.

---

## 6.6 Coordinación entre programadores

**Esto es lo que conecta el trabajo de equipos distintos.** Para encadenar tu tool con la de otro programador:

1. Pide al autor de la source tool su lista exacta de `produces`.
2. Elige el `event.type` que te sirve y ponlo en tus `consumes`.
3. Agrega la regla en `communication-rules.json`.
4. Avisa al autor de la source: "agregué una regla que escucha tu evento X". No requiere su permiso, pero sí su conocimiento — por si planeaba cambiar el contrato.

---

## Archivos descargables

- 📥 [`comunicacion-rule.json`](../plantillas/comunicacion-rule.json) — Regla de ejemplo en formato listo para pegar.

---

## Siguiente paso

→ [Paso 7: Empezar con un placeholder](./07-placeholder.md)
