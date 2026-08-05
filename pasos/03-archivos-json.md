# Paso 3 — Mapa de archivos de configuración del sistema

> [⬅ Volver al roadmap](../README.md)

> **⚠️ Para una tool EXTERNA, estos JSON son opcionales / de solo lectura.** No los editas para publicar ni consumir: el validador no comprueba tu `module.id` contra `tools.json`. Solo agregas un renglón en `tools.json` (PR de **datos**) si quieres salir en `/catalog` o usar `/events/subscriptions/:toolId`; `communication-rules.json` es exclusivo del bus nativo. Útil leerlos como referencia del contrato. Ver el banner del [Paso 1](./01-vision-general.md).

## Qué vas a lograr en este paso

Conocer **los 5 archivos JSON** que controlan el comportamiento del sistema, dónde viven, quién los edita, cuándo, y cuáles vas a tocar tú cuando agregues tu tool. Es la página de referencia que abres antes de modificar cualquier configuración.

> Estos archivos viven todos en `src/data/agents/` del repo `IsoTools`.

---

## 🧠 La regla mental rápida — qué te toca como programador

Si solo lees una sección de esta página, que sea esta:

```
LEES estos 2 antes de tocar código:
  ► event-standard.json    →  qué es un evento válido (so tu salida no es rechazada)
  ► tools-dev-spec.json    →  qué se supone que hace TU tool (el brief del lead)

EDITAS estos 2 cuando agregas tu tool:
  ► tools.json                ► registras tu tool en el catálogo del sistema
  ► communication-rules.json  ► conectas tu tool al bus (sin esto, NUNCA corre)

NO EDITAS, pero NOTIFICAS al lead:
  ► agents.json            →  para que sume tu tool al agente correspondiente
                              (sin esto, tu tool funciona pero no aparece en
                              la página comercial ni en el reporte ISO agrupado)
```

**Por qué cada uno te importa, en una línea**:

| Archivo | Por qué te importa |
|---|---|
| `event-standard.json` | Si tu evento no cumple esta estructura, el ingest lo **rechaza al instante** y nunca llega a la DB. |
| `tools-dev-spec.json` | Es el brief del lead. Sin leerlo vas a programar algo técnicamente correcto que **no resuelve el problema real**. |
| `tools.json` | Si tu tool no está aquí, **no existe** para el sistema. Dashboard ciego, bus ciego. |
| `communication-rules.json` | Sin una regla aquí, tu tool **nunca se ejecuta**. Está dormida aunque exista. |
| `agents.json` | Sin aparecer en un agente, tu tool **funciona pero queda huérfana** en la UI comercial. |

El resto del documento desglosa cada archivo con su formato real y ejemplos.

---

## 3.1 Mapa visual

```
src/data/agents/
│
├── event-standard.json          ← 📜 contrato del evento (estándar IES)
│                                   Quién edita: Carlos (raras veces)
│                                   Tú lo CONSULTAS pero NO lo editas normalmente
│
├── tools.json                   ← 📦 catálogo de tools (125 entries hoy)
│                                   Quién edita: cada programador al agregar su tool
│                                   Aquí va el inputSchema, outputSchema, metadata
│
├── communication-rules.json     ← 🔗 reglas de quién dispara a quién
│                                   Quién edita: cada programador al agregar su tool
│                                   Aquí va tu regla con sourceToolId / targetToolId
│
├── agents.json                  ← 👤 catálogo de agentes (capa más alta que tools)
│                                   Quién edita: Carlos / lead
│                                   Un "agente" agrupa varias tools relacionadas
│
└── tools-dev-spec.json          ← 📝 specs de implementación por tool
                                    Quién edita: Carlos / lead al planear,
                                                  el programador puede consultar
```

---

## 3.2 `event-standard.json` — el contrato del evento

**Para qué sirve.** Define la estructura obligatoria que TODO evento debe respetar. Es el **documento humano** del estándar — la verdad escrita.

**Cuándo lo editas.** **Casi nunca.** Solo si agregas un nuevo `category`, `severity`, o un campo base nuevo. Si necesitas cambiarlo, abre un issue antes — afecta a TODOS los productores.

> ⚠️ **Gotcha real — divergencia spec/runtime**
>
> `event-standard.json` describe el estándar **en formato leíble por humanos**, pero el **validador en runtime** (`src/services/validationService.js`) tiene su propio JSON Schema **hardcoded inline con Ajv** que no lee este archivo. Si cambias `event-standard.json` y olvidas tocar `validationService.js`, los dos divergen sin avisar.
>
> Regla: **cualquier cambio a `event-standard.json` debe replicarse en el `eventSchema` de `validationService.js`** en el mismo PR.

**Formato (resumen)**:

```json
{
  "version": "1.0",
  "name": "Industrial Event Standard",
  "description": "...",
  "principles": ["...lista de reglas duras..."],
  "baseStructure": {
    "event_id":         { "type": "string", "format": "uuid", "required": true },
    "timestamp":        { "type": "string", "format": "ISO8601-UTC", "required": true },
    "platform_version": { "type": "string", "required": true },
    "module":           { "type": "object", "properties": { "id": {...}, "version": {...} } },
    "asset":            { "type": "object", "properties": { "asset_id": {...}, "asset_type": {...} } },
    "event":            { "type": "object", "properties": { "type": {...}, "category": {...}, "severity": {...} } },
    "data":             { "type": "object" },
    "metadata":         { "type": "object" }
  },
  "eventTypes":            { /* enums permitidos para event.type, agrupados por dominio */ },
  "categoryToToolMapping": { /* qué category puede ser emitida por qué tools */ }
}
```

Dos bloques que el doc no expandía y conviene tener en mente:
- **`eventTypes`** — el enum cerrado de `event.type` válidos. Si tu tool emite un type que no está aquí, el validador lo rechaza. Para agregar uno nuevo, ver Paso 4.
- **`categoryToToolMapping`** — mapping inverso `category → [tools que la pueden emitir]`. Lo usa el bus para sanity-check de quién dispara qué.

**Detalle completo** → [Paso 4: Nombrado IES](./04-nombrado-ies.md).

---

## 3.3 `tools.json` — catálogo de tools del sistema

**Para qué sirve.** Es la lista maestra de tools del sistema (**125 entries** al día de hoy). Es un **array plano de tools** (sin envoltorio con clave `tools`). Para cada entry guarda: id, nombre, categoría, descripción ES/EN, `inputSchema`, `outputSchema`, `isoEvent` y metadata.

**Cuándo lo editas.** **Cada vez que agregas una tool nueva** o cambias el schema de input/output de la tuya.

**Formato (1 entry)**:

```json
{
  "id": "get_inventory_status",
  "name": "get_inventory_status",
  "nameEs": "Consultar Estado de Inventario",
  "type": "Cloud",
  "category": "erp",
  "descriptionEs": "Consulta niveles actuales de inventario, alertas de stock mínimo y rotación por SKU.",
  "descriptionEn": "Queries current inventory levels, minimum stock alerts, and SKU rotation.",
  "inputSchema": {
    "type": "object",
    "properties": {
      "warehouseId": { "type": "string" },
      "skuIds": { "type": "array", "items": { "type": "string" } },
      "includeAlerts": { "type": "boolean", "default": true }
    }
  },
  "outputSchema": { /* ... */ }
}
```

**Reglas clave**:
- El `id` debe coincidir **exacto** con `meta.id` de tu archivo en `src/tools/`.
- `category` debe estar en el enum del estándar (`quality`, `productivity`, etc.).
- `inputSchema` y `outputSchema` son **JSON Schema válidos** — se validan en runtime.

**Detalle completo** → [Paso 5: Anatomía de una tool](./05-anatomia-tool.md).

---

## 3.4 `communication-rules.json` — reglas del bus

**Para qué sirve.** Define quién dispara a quién. El `eventBus` lee este archivo en cada evento entrante y decide qué tools llamar. Estructura: `{ version, description, rules: [...] }` (78 reglas hoy).

**Cuándo lo editas.** **Cada vez que tu tool necesita reaccionar a un evento de otra tool.**

**Formato (1 entry)**:

```json
{
  "id":               "rule-prod-014",
  "sourceToolId":     "production_metrics_collector",
  "targetToolId":     "detect_production_deviation",
  "event":            "PRODUCTION_METRICS_SNAPSHOT",
  "protocol":         "internal",
  "topic":            "tool/detect_production_deviation",
  "triggerCondition": "always",
  "description":      "Las métricas de producción alimentan al detector de desviación."
}
```

**Detalle completo** → [Paso 6: Regla de comunicación](./06-regla-comunicacion.md).

> ⚠️ **Importante — convención de nombres**
>
> Los `event` names van en **`SCREAMING_SNAKE_CASE`** (`ERP_DATA_SYNCED`, `INVENTORY_STATUS_READY`, `MEASUREMENTS_CAPTURED`). **Ese es el estándar** y es el formato que el bus realmente enruta hoy (ver Paso 4). Lo único legacy es el campo `protocol`: algunas reglas viejas traen `"MQTT" / "HTTPS"`, pero el push in-process usa `protocol: "internal"`.
>
> **Para tu tool nueva**: `event.type` en `SCREAMING_SNAKE_CASE` (Paso 4) y `protocol: "internal"` en tu regla (Paso 6).

---

## 3.5 `agents.json` — catálogo de agentes (agrupación de tools)

**Para qué sirve.** Un "agente" es una **agrupación lógica de tools** relacionadas (un dominio del negocio). Es un **array de 13 agentes** hoy. Por ejemplo, el agente `erp-gestion-empresarial` contiene 24 tools (`get_inventory_status`, `predict_demand`, etc.). Lo usa el dashboard y el reporte ISO para presentar el sistema por agente, no tool por tool.

**Cuándo lo editas.** **Tú normalmente no.** Lo edita Carlos / el lead cuando se crea un agente nuevo (rara vez) o cuando se agrega una tool a un agente existente.

**Formato (1 entry, resumido)**:

```json
{
  "id": "erp-gestion-empresarial",
  "name": "ERP & Business Management Agent",
  "nameEs": "Agente ERP & Gestión Empresarial",
  "type": "Cloud",
  "category": "erp",
  "icon": "🧩",
  "isoAlarms": ["erp_kpi_alert"],
  "moduleIds": ["erp"],
  "descriptionEs": "Automatiza la gestión de inventario, compras, producción, finanzas y ventas con IA en la nube.",
  "toolIds": [
    "get_inventory_status", "predict_demand", "optimize_stock_levels",
    "recommend_purchase_orders", "..."
  ]
}
```

**Lo único que te toca a ti**: si agregas una tool nueva, **avísale al lead** para que sume tu `tool_id` al array `toolIds` del agente correspondiente. Si no lo hace, tu tool funciona pero **no aparece en el dashboard agrupado** ni en el reporte ISO.

---

## 3.6 `tools-dev-spec.json` — specs de implementación por tool

**Para qué sirve.** Para cada tool del catálogo guarda **el razonamiento de diseño**: por qué cada input, qué cálculos hace, por qué cada output, y sugerencia de UI. Es un **array de 125 entries** (uno por tool de `tools.json`). Es la **documentación interna** del por qué de la tool — útil cuando otro programador hereda tu código o cuando se evalúa si la tool sigue siendo relevante.

**Cuándo lo editas.** Lo crea Carlos / el lead al planear cada tool. Tú lo **consultas** cuando vas a implementar la tuya, para entender el razonamiento de diseño.

**Formato (1 entry)**:

```json
{
  "id": "get_inventory_status",
  "whyInput": "Se necesita warehouseId para consultar solo el almacén correcto en sistemas multi-planta. skuIds permite filtrar los artículos de interés...",
  "calculations": "Consultar la base de datos de inventario filtrando por warehouseId y opcionalmente por skuIds. Para cada SKU, comparar quantity contra minStock y generar el flag alert...",
  "whyOutput": "items permite al agente iterar sobre cada SKU y decidir si lanzar una orden de compra. totalAlerts es el KPI que dispara alertas...",
  "uiSuggestion": "Tabla de inventario con columnas SKU, Cantidad, Mínimo y semáforo (rojo/amarillo/verde) en la columna Alerta..."
}
```

**Cómo lo usas como programador**:

1. Antes de escribir código, **lee la entry de tu tool** en `tools-dev-spec.json`.
2. Tu implementación debe seguir el `calculations`, devolver los campos de `whyOutput`, y aceptar los inputs de `whyInput`.
3. Si crees que falta algo o está mal, comenta al lead — el spec se afina antes de mergear, no después.

---

## 3.7 Resumen de cuál tocas tú

| Archivo | ¿Lo editas tú al agregar una tool? |
|---|---|
| `event-standard.json` | ❌ No |
| `tools.json` | ✅ Sí — añades 1 entry con tu tool |
| `communication-rules.json` | ✅ Sí — añades 1+ reglas conectando tu tool con otras |
| `agents.json` | ❌ No (avisas al lead) |
| `tools-dev-spec.json` | ❌ No (lo consultas) |

---

## 3.8 ¿Cómo se "cargan" estos archivos?

**Automáticamente al arrancar la API.** No tienes que correr ningún script de carga. El loader central es **`src/services/agentDataService.js`** — importa los 5 JSONs y los expone a las rutas y a los servicios derivados.

| Archivo                    | Quién lo lee (importante)                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `event-standard.json`      | `agentDataService.js`, `agentDemoService.js`, `routes/agentesRoutes.js` (no el validador — ver § 3.2) |
| `tools.json`               | `agentDataService.js`, `agentDemoService.js`, `controllers/agentesController.js`                      |
| `communication-rules.json` | `agentDataService.js`, `routes/agentesRoutes.js`                                                      |
| `agents.json`              | `agentDataService.js`, `controllers/agentesController.js`, `isoMappingService.js` (para reporte ISO)  |
| `tools-dev-spec.json`      | `agentDataService.js`                                                                                 |

**Cuando editas un archivo, ¿cuándo toma efecto?**

Tu cambio en los JSON entra en producción **cuando se mergea a `feature/filter`**: Railway redespliega automáticamente y arranca con la versión nueva. No hay nada que reiniciar a mano — no corres la plataforma en local (todo vive en la central, ver [Paso 2](./02-api-central.md)).

---

## 3.9 Validación antes de comitear

Antes de hacer commit con cambios en `tools.json` o `communication-rules.json`:

```bash
# tools.json es array plano → .length directo
node -e "console.log('tools OK:', require('./src/data/agents/tools.json').length)"

# communication-rules.json envuelve en { version, description, rules: [...] }
node -e "console.log('rules OK:', require('./src/data/agents/communication-rules.json').rules.length)"
```

Si alguno te falla, hay un error de sintaxis (coma sobrante, comilla faltante). Arréglalo antes de pushear — un JSON inválido tira la API entera al arrancar.

Validación más completa (todos los 5 archivos a la vez):

```bash
for f in event-standard tools communication-rules agents tools-dev-spec; do
  node -e "JSON.parse(require('fs').readFileSync('./src/data/agents/$f.json','utf8')); console.log('$f.json OK')" || echo "$f.json FAIL"
done
```

---

## Siguiente paso

→ [Paso 4: Nombrado IES](./04-nombrado-ies.md)
