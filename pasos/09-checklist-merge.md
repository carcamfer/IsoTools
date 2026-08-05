# Paso 9 — Checklist antes de mergear

> [⬅ Volver al roadmap](../README.md)

> **⚠️ Solo para tools NATIVAS (admin/core).** Este checklist es para el PR que mergea un handler dentro de este repo. Una tool **externa** no mergea nada aquí: su código vive en su propio repo. Ver el banner del [Paso 1](./01-vision-general.md).

## Qué vas a lograr en este paso

Tener una lista **única y exhaustiva** que recorres antes de abrir el PR. Si algo está en rojo, **no se mergea**. Incluye también la tabla de errores comunes y el apéndice de campos para que tengas todo a la mano sin abrir otros pasos.

---

## ⚠️ Estado actual del checklist — qué se puede verificar hoy

Cada item está etiquetado:

- 🟢 **Verificable hoy** — el repo lo soporta, lo corres y comprueba.
- 🟡 **Aplicable pero no enforzado** — el ítem importa, pero ningún script automatizado lo va a cazar. Hoy depende de revisión humana en el PR.
- 🔵 **Cuando exista el bus** — depende del PR del paso 5 § 5.6. Hoy no se puede comprobar; déjalo listo y cierra el ciclo después.

CI hoy (`/.github/workflows/ci.yml`) corre: `npm install`, `npm run lint`, build de Docker. **No hay tests automáticos** — el step "Run tests" hace `echo "Add tests when ready"`. Eso explica por qué la columna 🟡 es tan grande.

---

## 9.1 Checklist completo

### Código

- [ ] 🔵 Archivo en `src/tools/<tool_id>.js`. _(El directorio no existe; lo crear tú primero.)_
- [ ] 🟡 El nombre del archivo coincide **exacto** con `meta.id`. _(Revisión humana — un lint script lo cazaría: paso 5 § 5.6 e).)_
- [ ] 🟡 Exporta `meta` **y** `handler` (ambos).
- [ ] 🟡 `meta.consumes` y `meta.produces` listados completos.
- [ ] 🟡 `handler` es `async`, recibe un solo argumento `inputEvent`, devuelve objeto / array / `null`.
- [ ] 🟡 **Sin `import` de otros archivos en `src/tools/`.** Solo de `src/services/` o utilidades.
- [ ] 🟡 Sin llamadas HTTP, sin escrituras a DB, sin `console.log` en producción (usa el logger central). _(El lint del repo (`eslint`) puede cazar `console.log` con regla `no-console: warn`; añadirla si no está.)_

### Datos

- [ ] 🟢 `tools.json` actualizado con la entry de tu tool (`id`, `name`, `category`, `description`, `inputSchema`, `outputSchema`, **`isoEvent`**). _(`isoEvent` lo usa el reporte ISO — paso 3.)_
- [ ] 🟢 JSON válido sintácticamente: `node -e "require('./src/data/agents/tools.json').length"` no falla.
- [ ] 🟢 `communication-rules.json` tiene al menos una regla con tu tool como `targetToolId`. _(Sigue formato target del paso 6 aunque hoy no dispare nada.)_
- [ ] 🟡 Si tu tool produce un `event.type` nuevo, está documentado en `event-standard.json`. _(Recuerda paso 4: el validador runtime no lo enforza; añadirlo al `eventSchema` Ajv es PR aparte.)_
- [ ] 🟡 Si tu tool aplica a un estándar ISO, está mapeada en `src/services/isoMappingService.js`.

### Pruebas

- [ ] 🟢 `scripts/test_<tool_id>.js` corre y produce salida válida _(smoke aislado del handler — paso 8 § 8.2)._
- [ ] 🟢 POST a `/api/v1/events` (plataforma central) con tu evento prueba devuelve 201. GET con `?since_seq=0&type=<tu_tipo>` lo encuentra (y avanza el `next_seq`).
- [ ] 🔵 Smoke test end-to-end vía `curl` muestra el evento de respuesta con `correlation_id` correcto. _(Sin bus + sin columna correlation_id, no aplica hoy.)_

### Documentación

- [ ] 🟡 `meta.description` (y `descriptionEs`/`descriptionEn` del catálogo) en español, una sola línea, clara.
- [ ] 🟡 Si es placeholder, lleva `[PLACEHOLDER]` y `version` `0.x.x-placeholder` _(paso 7 — hoy no hay hook que distinga visualmente)._

---

## 9.2 Errores comunes y cómo evitarlos

| Error | Causa | Cómo evitarlo |
|---|---|---|
| Tu tool nunca se ejecuta | Hoy: ningún handler corre porque no hay bus (paso 5). Cuando exista: falta regla en `communication-rules.json` o el `event` no coincide. | A futuro: verifica que existe una regla con tu `targetToolId` y el `event` exacto. Hoy: limítate al smoke aislado del handler. |
| Evento rechazado al ingest | No cumple lo mínimo de `validationService.js` (falta `event_id`/`timestamp`/`platform_version`/`module`/`asset`/`event` o tipos incorrectos). | Corre el smoke test del [Paso 8](./08-pruebas-locales.md). Recuerda que el validador hoy NO comprueba enums de category/severity ni formato de `event.type` (paso 4) — tu evento puede pasar la validación y estar igual mal nombrado. |
| `asset_id desconocido` | El activo no está en el catálogo de assets | Añádelo al catálogo o usa uno existente. **No inventes ids.** |
| Ciclo infinito | Tu tool emite un evento que vuelve a dispararla | Añade `triggerCondition` que corte, o no consumas el mismo `event.type` que produces. |
| Eventos duplicados | El productor reusa `event_id` en reintentos | El productor debe generar un `event_id` nuevo por intento *único*. El reintento sí usa el mismo id (eso es lo que da idempotencia). |
| Pierdes el `correlation_id` | Tu handler crea un evento manualmente sin dejar que el bus lo procese | Solo devuelve el objeto desde el handler. El bus rellena `correlation_id` y `causation_id`. _(Hoy no hay bus ni columna correlation_id — paso 4 § 4.10 + paso 5 § 5.6.)_ |
| Severidad inconsistente | Uno usa `'CRITICAL'`, otro `'critical'` | Solo `low` / `medium` / `high` / `critical`. **Minúsculas.** |
| Unidad ambigua | `data.temperature: 75` (¿F? ¿C?) | Renombra a `temperature_c` o `temperature_f`. |

---

## 9.3 Apéndice — Tabla resumen de campos del evento

Las columnas **Formato** y **Lo pone** describen el target. Los campos con 🚧 todavía no se enforzan o no se almacenan (referencia: paso 4 § 4.10, paso 5 § 5.6).

| Campo | Tipo | Formato | Lo pone | Ejemplo |
|---|---|---|---|---|
| `event_id` | string | ULID o UUIDv4 | productor | `01HG7Z9KQR5N3M2P4VX8YBWQTC` |
| `timestamp` | string | ISO 8601 UTC | productor | `2026-05-19T14:32:10.123Z` |
| `received_at` | string | ISO 8601 UTC | API (default DB) | `2026-05-19T14:32:10.567Z` |
| `platform_version` | string | semver | productor | `"2.0"` |
| `module.id` | string | snake_case | productor | `detect_production_deviation` |
| `module.version` | string | semver | productor | `"1.0.0"` |
| `asset.asset_id` | string | jerárquico con guiones 🚧 | productor | `plant_01-assembly-line_2-robot_03` |
| `asset.asset_type` | string | enum 🚧 | productor | `robot` |
| `asset.plant_id` | string | snake_case | productor | `plant_01` |
| `asset.area_id` | string | snake_case | productor | `assembly` |
| `asset.line_id` | string | snake_case | productor | `line_2` |
| `event.type` | string | `SCREAMING_SNAKE_CASE` 🚧 | productor | `PRODUCTION_DEVIATION_DETECTED` |
| `event.category` | string | enum (7 valores) 🚧 | productor | `productivity` |
| `event.severity` | string | enum (4 valores) 🚧 | productor | `high` |
| `data` | object | flexible, snake_case | productor | `{ deviation_pct: 12.5 }` |
| `metadata` | object | opcional | productor | `{ shift: 'B' }` |
| `correlation_id` | string | ULID/UUID 🚧 | productor o bus | `01HG7Z9KQR5N3M2P4VX8YBWQTC` |
| `causation_id` | string | ULID/UUID 🚧 | bus | `01HG7Z9KQR5N3M2P4VX8YBWQXX` |

🚧 = formato prescrito pero no enforzado por el validador hoy, o columna que no existe en `db/init.sql`. Sigue el formato igual — el dashboard, los reportes y el bus a futuro asumen estos valores aunque el ingest los acepte mal escritos.

---

## Siguiente paso

→ [Paso 10 — El cerebro y coordinarte con la otra tool](./10-cerebro-y-colaboracion.md) — cómo usar el cerebro Obsidian, ponerte de acuerdo con quien tiene la tool que se comunica con la tuya, saber cuándo está lista y cuándo llega a Railway.
