# Simulación del Paquete ISO 9001 — paso a paso

Esta guía te lleva de cero a ver, **en tiempo real**, cómo mandas un evento "dummy"
desde tu laptop (Postman, curl o el script) y el sistema responde disparando en
cadena a las tools que reaccionan.

---

## 0. Qué vas a ver

Mandas **un** evento (la *salida* de una tool, como si ya hubiera corrido) y el
**bus** ejecuta automáticamente a las tools que reaccionan a ese evento, una tras
otra. La respuesta del `POST` ya trae la cadena completa en el campo `chain`.

```
POST 1 evento  ─────►  el bus dispara la cadena  ─────►  respuesta con todos los eventos generados
```

Ejemplo real (escenario "mediciones"):

```
┌─ [raíz] collect_quality_measurements  →  MEASUREMENTS_CAPTURED
└─ calculate_control_charts        →  CHART_POINTS_UPDATED      [rule-qual-001]
     ⋮
     ⋮  (aquí la cadena nativa TERMINA: detect_out_of_control_signals ya no
     ⋮   corre en el bus. Un servicio EXTERNO consume CHART_POINTS_UPDATED y
     ⋮   publica OUT_OF_CONTROL_DETECTED con POST /api/v1/events)
     ▼
┌─ [raíz] OUT_OF_CONTROL_DETECTED  (lo publica el servicio externo)
├─ manage_nonconformances          →  NC_REQUIRES_8D            [rule-qual-003]
└─ generate_8d_report              →  8D_REPORT_ISSUED          [rule-qual-004]
     ⋮
     ⋮  (y aquí igual: automate_followups tampoco corre en el bus. El servicio
     ⋮   externo de seguimientos consume 8D_REPORT_ISSUED / PROJECT_AT_RISK y
     ⋮   publica FOLLOWUP_SCHEDULED, que es terminal: nadie reacciona a él)
```

Escenario "defecto de visión" (el mismo patrón: la raíz la publica el externo):

```
     ⋮  (inspect_product_quality tampoco corre en el bus. El servicio externo
     ⋮   consume FRAME_CAPTURED y publica DEFECT_FOUND con POST /api/v1/events)
     ▼
┌─ [raíz] DEFECT_FOUND  (lo publica el servicio externo, con data.defectFound = true)
├─ manage_nonconformances          →  NC_REQUIRES_8D            [rule-pkg-001]
└─ analyze_visual_patterns         →  (sin handler nativo)      [rule-vision-004]
```

> **Tools con dueño EXTERNO** (no están en `src/tools/`, no las ejecuta el bus):
> `detect_out_of_control_signals`, `automate_followups` e
> `inspect_product_quality`. Si vuelves a registrar un handler nativo para
> alguna, el mismo hecho se procesará dos veces.
>
> Como el bus ya no las ejecuta, **la condición de disparo de sus reglas de
> salida la tiene que cumplir el payload del externo**: `rule-pkg-001` exige
> `data.defectFound == true` en el `DEFECT_FOUND` que publiques, o no se abre
> la no conformidad.

---

## 1. Levantar la API en tu laptop (Docker)

```bash
cd industrial-api-v2
docker compose --profile api up -d        # levanta API (puerto 3000) + Postgres
curl http://localhost:3000/api/v1/health  # → {"status":"ok", ...}
```

> Si ya tenías el volumen de Postgres de antes, corre una vez la migración para
> agregar las columnas nuevas de la cadena causal:
> ```bash
> docker compose exec db psql -U industrial -d industrial_events \
>   -c "ALTER TABLE industrial_events ADD COLUMN IF NOT EXISTS correlation_id TEXT;
>       ALTER TABLE industrial_events ADD COLUMN IF NOT EXISTS causation_id TEXT;"
> ```

## 2. Crear tu API key

```bash
docker compose exec api npm run apikey:create -- mi-nombre --scopes=events:read,events:write
```

Copia la key que aparece (**solo se muestra una vez**).

---

## 3. Opción A — Probar con Postman

1. **Importa la colección**: en Postman → *Import* → elige
   `docs/postman/Paquete-ISO9001.postman_collection.json`.
2. Abre la colección → pestaña **Variables** y pon:
   - `baseUrl` = `http://localhost:3000` (local) o `https://www.expo-programador.com` (Railway)
   - `apiKey` = la key que creaste
   - (`correlationId` se llena solo)
3. Corre **`0 · Health check`** → debe responder `{"status":"ok"}`.
4. Corre **`1 · Disparar cadena — Mediciones`**. En la respuesta verás:
   - `triggered`: cuántas tools reaccionaron,
   - `chain`: la lista de eventos generados, en orden.
   - En la consola de Postman (*View → Show Postman Console*) verás los `->` de cada paso.
5. Corre **`4 · Ver cadena guardada`** → trae de la base TODA la cadena con
   `causation_id` (qué evento disparó a cuál).

Prueba también `2 · Defecto de visión` y `3 · Dirección / KPIs` para ver otras cadenas.

### Cómo armar el POST tú mismo (sin la colección)

- Método: `POST`
- URL: `{{baseUrl}}/api/v1/events`
- Headers: `Content-Type: application/json` y `x-api-key: {{apiKey}}`
- Body (raw JSON) — este es el evento dummy que arranca la cadena larga:

```json
{
  "event_id": "11111111-1111-1111-1111-111111111111",
  "timestamp": "2026-06-07T00:00:00Z",
  "platform_version": "1.0",
  "module": { "id": "collect_quality_measurements", "version": "1.0.0" },
  "asset": { "asset_id": "LINE-2", "asset_type": "workstation", "plant_id": "plant_01", "line_id": "line_2" },
  "event": { "type": "MEASUREMENTS_CAPTURED", "category": "quality", "severity": "low" },
  "data": { "partId": "PART-001", "characteristicId": "CHAR-DIAM-01", "measurements": [10.01, 9.98, 10.03, 9.99], "passFailResult": "pass", "defectsFound": 0 }
}
```

> **Clave para entender el bus:** el `event.type` del evento que mandas es lo que el
> bus busca en `communication-rules.json`. Si mandas `MEASUREMENTS_CAPTURED`, dispara
> a quien reacciona a ese evento. Mandar este evento equivale a decir
> *"la tool `collect_quality_measurements` acaba de producir su salida"*.

---

## 4. Opción B — Probar con el script (lo más rápido)

```bash
export API_BASE_URL=http://localhost:3000
export API_KEY=<tu-key>

npm run sim:iso                 # escenario "mediciones" (cadena larga)
node scripts/test_package_iso.js defect     # cadena de defecto de visión
node scripts/test_package_iso.js variance   # cadena de dirección / KPIs
node scripts/test_package_iso.js device     # cadena MSA → cartas de control
```

Imprime la cadena en árbol directamente en tu terminal.

---

## 5. Opción C — curl puro

```bash
curl -X POST http://localhost:3000/api/v1/events \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d @sample-event.json

# luego, con el correlation_id que te devolvió:
curl "http://localhost:3000/api/v1/events/chain/<correlation_id>" -H "x-api-key: $API_KEY"
```

---

## 6. Verlo en Railway (la central, en la nube)

Es exactamente lo mismo, solo cambia la URL y la key:

- `baseUrl` = `https://www.expo-programador.com`
- `apiKey` = la key que te dé el admin (creada en Railway con `node scripts/createApiKey.js`)

Tras un `git push` a `feature/filter`, Railway redespliega solo. El mismo POST de Postman,
apuntando a esa URL, dispara la cadena en la base compartida del equipo. Así pruebas
la integración real entre tools de distintos programadores.

---

## 7. Escenarios disponibles y la cadena que disparan

| Escenario | Evento raíz que mandas | Tools que reaccionan en cadena |
|---|---|---|
| `measurements` | `MEASUREMENTS_CAPTURED` | control_charts → out_of_control → nonconformances → 8d_report → followups |
| `defect` | `DEFECT_FOUND` | nonconformances → 8d_report → followups |
| `variance` | `PRODUCTION_VARIANCE_DETECTED` | kpis, business_anomalies → track_progress → followups |
| `device` | `NEW_DEVICE_REGISTERED` | run_msa → control_charts → … |

---

## 8. Cómo funciona por dentro (resumen)

1. `POST /api/v1/events` valida el evento (`validationService`) y lo guarda (`eventsService.insertEvent`).
2. El controller llama a `eventBus.runChain()`.
3. El bus busca en `communication-rules.json` las reglas cuyo `event` coincide con el `event.type`.
4. Evalúa el `triggerCondition` y ejecuta el `handler` de la tool destino (`src/tools/<id>.js`).
5. La tool devuelve su evento; el bus lo guarda con `causation_id` = evento padre y `correlation_id` = raíz de la cadena.
6. Repite hasta que no haya más reglas que disparar (con guarda anti-ciclos).

> **Las tools nunca se llaman entre sí.** Solo emiten eventos; el bus las conecta.
