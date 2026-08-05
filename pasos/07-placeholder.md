# Paso 7 — Empezar con un placeholder

> [⬅ Volver al roadmap](../README.md)

> **⚠️ Solo para tools NATIVAS (admin/core).** El placeholder es un handler mínimo en `src/tools/`. Una tool **externa** no lo necesita: arranca publicando/consumiendo por la API. Ver el banner del [Paso 1](./01-vision-general.md).

## Qué vas a lograr en este paso

Subir tu tool a `feature/filter` **antes de tenerla terminada**. Aprenderás cómo escribir un *placeholder funcional* — un esqueleto que responde con datos plausibles para no romper el flujo del sistema mientras desarrollas la lógica real.

> 📥 **Plantilla descargable**: [`placeholder-tool.js`](../plantillas/placeholder-tool.js) — Placeholder completo listo para clonar.

---

## ⚠️ Estado actual vs estándar target — léelo antes de seguir

Esta página describe **una convención target** que cuando se construya hace que el sistema distinga placeholders de tools reales. Hoy:

| Lo que el doc prescribe | Lo que hay en `IsoTools` hoy |
|---|---|
| Archivo `src/tools/<id>.js` con handler | El directorio `src/tools/` no existe (gap heredado del paso 5). |
| Dashboard y reporte ISO ocultan o marcan `data._placeholder: true` | **Cero referencias** a `_placeholder` en código runtime. El flag no se lee. |
| `version: "0.x.x-placeholder"` distingue placeholders en el catálogo | En `tools.json` actual ningún tool tiene `version` poblado. No hay forma hoy de filtrar placeholders en queries. |
| `[PLACEHOLDER]` al inicio de `description` | No hay catálogo de tools con esta convención hoy; libre para empezar. |

Lo que sí existe — `src/services/agentDemoService.js` genera eventos sintéticos para llenar el dashboard (con `event_id: "evt-demo-..."`, `asset_id: "asset-demo-01"`). Es otra mecánica para "modo demo" pero **no es la del paso 7**: opera fuera del flujo de tools y no se activa por placeholders.

**Implicación para ti**: si vas a marcar tu tool como placeholder, sigue las 4 reglas de § 7.3 igual — son baratas y dejan tu tool lista para cuando el dashboard y el reporte ISO aprendan a leerlas. Mientras tanto, el dashboard mostrará tu tool del catálogo sin distinción visual de "demo". La § final propone los cambios mínimos para hacer la convención efectiva.

---

## 7.1 Por qué usar placeholders

Mientras tu lógica real no esté lista, **publica un placeholder funcional**. No dejes la tool sin existir.

> 💡 **El sistema entero se ve mejor con 137 tools placeholder respondiendo coherente, que con 5 reales y 132 desconectadas.**

Ventajas:

- Otros programadores pueden encadenar sus tools a la tuya hoy y desarrollar contra el contrato esperado.
- El dashboard muestra que tu tool existe _(hoy se muestra sin distinción visual de "demo" — ver banner inicial)._
- El reporte ISO sabe que el agente está vivo _(hoy: aparece como cualquier otra tool; cuando se implemente la marca, los placeholders pueden filtrarse del reporte)._
- Tú cambias la lógica real sin tocar el contrato — y nada downstream se rompe.

---

## 7.2 Estructura de un placeholder

```js
// src/tools/forecast_production_delays.js

export const meta = {
  id:       'forecast_production_delays',
  name:     'Forecast Production Delays',
  version:  '0.1.0-placeholder',
  consumes: ['PRODUCTION_METRICS_SNAPSHOT'],
  produces: ['PRODUCTION_DELAY_FORECASTED'],
  category: 'productivity',
  description: '[PLACEHOLDER] Pronostica retrasos de producción.',
};

export async function handler(inputEvent) {
  return {
    event: {
      type:     'PRODUCTION_DELAY_FORECASTED',
      category: 'productivity',
      severity: 'medium',
    },
    asset: inputEvent.asset,
    data: {
      forecast_delay_min: 45,
      confidence:         0.7,
      _placeholder:       true,
    },
  };
}
```

---

## 7.3 Reglas del placeholder

- ✅ `meta.version` empieza con `0.x.x-placeholder` (y replica el mismo valor en la entry de `tools.json` cuando ese campo se empiece a poblar).
- ✅ `meta.description` empieza con `[PLACEHOLDER]` (y misma cadena en `descriptionEs`/`descriptionEn` del catálogo).
- ✅ El campo `data._placeholder: true` está presente en cada salida. _(Hoy no se lee; cuando dashboard e ISO lo soporten — ver § 7.6 — esta convención permite ocultar o marcar como demo.)_
- ✅ Los valores son **plausibles**: si la unidad es minutos, devuelve un número de minutos razonable. **No `null`, no `0`, no `"TODO"`.**

---

## 7.4 Cuándo reemplazas el placeholder

Cuando subes a `1.0.0`:

- Quitas el `_placeholder` del `data`.
- Quitas el `[PLACEHOLDER]` de la `description`.
- Cambias `version` de `0.x.x-placeholder` a `1.0.0`.

**Nada más cambia.** El contrato sigue idéntico, así que ninguna tool downstream necesita actualizarse.

---

## 7.5 ¿Y si todavía no sé qué eventos voy a producir?

Si el contrato de salida aún no está claro, **define al menos uno provisional** y ponlo en `produces`. Otros programadores pueden empezar a planear su integración basados en ese contrato. Si después cambias el `event.type` o los campos de `data`, sube `version` a `0.2.0-placeholder` y avisa a quien consume.

---

## 7.6 Para hacer obligatoria la distinción de placeholders (PR pendiente)

Para que la convención de este paso tenga efecto real, falta agregar estos hooks en `IsoTools`:

### a) Catálogo — campo `_placeholder` en `tools.json`

Cuando registras la entry de tu tool en `tools.json`, agrega también:

```json
{
  "id": "forecast_production_delays",
  "version": "0.1.0-placeholder",
  "_placeholder": true,
  /* resto de campos del catálogo */
}
```

Hoy ningún tool del catálogo trae estos campos, así que arrancas con la convención limpia.

### b) Dashboard — `src/services/dashboardService.js`

Al armar la respuesta del listado de tools (`GET /api/tools`), añadir badge:

```js
tools.map(t => ({
  ...t,
  is_placeholder: !!t._placeholder || (t.version || '').includes('placeholder')
}));
```

En el frontend (`src/public/agents-detail.js`, `agents-catalog.js`), si `is_placeholder` está en true, pintar un badge naranja "DEMO" y opcionalmente filtrarlos con un toggle "Mostrar solo tools en producción".

### c) Reporte ISO — `src/services/isoMappingService.js`

Excluir del reporte oficial las tools con `_placeholder: true`:

```js
const productionTools = allTools.filter(t => !t._placeholder);
// generar el reporte solo con productionTools
```

Mantener un reporte separado "ISO + Placeholders" para auditoría interna.

### d) Bus runtime — cuando se construya (ver paso 5 § 5.6)

El `eventBus` debe marcar los eventos producidos por tools placeholder con `metadata.is_placeholder: true`. Así el dashboard puede mostrar un overlay "estos números vienen de placeholders" sin que el productor tenga que recordar setear `data._placeholder`.

### e) Lint script — `scripts/lintPlaceholders.js`

- Detectar entries de `tools.json` con `version` empezando en `0.` pero sin `_placeholder: true` (probable olvido).
- Reportar tools con `version: "1.0.0"` pero con `[PLACEHOLDER]` aún en la descripción (probable olvido al promover).
- Correr en pre-commit.

---

## Archivos descargables

- 📥 [`placeholder-tool.js`](../plantillas/placeholder-tool.js) — Placeholder completo. Cambia el `id`, `consumes`, `produces` y los valores plausibles del `data`.

---

## Siguiente paso

→ [Paso 8: Probar localmente](./08-pruebas-locales.md)
