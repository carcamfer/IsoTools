# Paso 1 — Visión general del sistema

> [⬅ Volver al roadmap](../README.md)

> ## ⚠️ Antes de empezar: ¿tu tool es externa o nativa?
>
> **Este roadmap describe la tool NATIVA** — un handler que vive **dentro de este repo** (`src/tools/`) y que la plataforma corre en su propio proceso. Es cómo se construyó el paquete de referencia ISO 9001 (16 tools) y es **tarea del admin/core**.
>
> **Si construyes una tool externa (lo normal):** vive en **tu propio repo**, en cualquier lenguaje, y solo habla con la plataforma por HTTP. **No necesitas `src/tools/`, ni `communication-rules.json`, ni PRs de código.** Tu guía es el **[Manual de integración del README](../README.md#manual-de-integración-publicar-y-consumir-eventos)**.
>
> **Qué pasos de este roadmap te sirven aunque seas externo:** el **2** (conseguir tu API key), el **4** (nombrado de eventos IES) y el **8** (pruebas). Los pasos **5, 6, 7 y 9** (handler, regla de comunicación, placeholder, checklist de merge) son exclusivos del camino nativo.
>
> **Una diferencia clave:** el **auto-disparo** (que otra tool reaccione *sola* cuando publicas) solo ocurre entre tools **nativas**, vía el bus. Entre tools externas no hay orquestador: cada una corre su propio *poll* y trae su reacción codificada.

## Qué vas a lograr en este paso

Entender en 5 minutos cómo encaja tu tool en la plataforma industrial, y por qué las tools **nunca se llaman entre sí**. Esta regla mental es la más importante de todo el roadmap. Si la rompes en tu código, rompes el sistema sin darte cuenta.

---

## 1.1 Las tres capas

El sistema tiene tres capas. **Tu tool vive en la capa de en medio.**

```
┌──────────────────────────────────────────────────────────────────────┐
│  CAPA 1 — PRODUCTORES                                                 │
│  Simulador, sensores, otras tools                                     │
│  Hacen: POST /api/v1/events                                           │
└────────────────────────────┬──────────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│  CAPA 2 — API CENTRAL  (src/server.js)                                   │
│  1. apiKeyAuth         ── verifica la API key                         │
│  2. validationService  ── valida contra event-standard.json           │
│  3. eventsController   ── inserta en industrial_events                │
│  4. eventBus (worker)  ── lee tabla y dispara tools según             │
│                           communication-rules.json                    │
│  5. toolRunner         ── ejecuta el handler de la tool destino       │
└────────────────────────────┬──────────────────────────────────────────┘
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│  CAPA 3 — CONSUMIDORES                                                │
│  Otras tools (polling GET /events) · consumidores externos            │
└──────────────────────────────────────────────────────────────────────┘
```

**Tu tool es un handler que vive en `src/tools/<tool_id>.js`**. Recibe un evento, hace su trabajo, devuelve otro evento (o `null` si no hay nada que emitir). No abre conexiones a otras tools, no llama a webhooks, no hace HTTP. Solo procesa lo que le entra y devuelve lo que sale. El bus se encarga del resto.

---

## 1.2 La regla mental — el sistema es un *bus*, no un orquestador

**Las tools NO se llaman entre sí.** Nunca.

Si la tool A produce algo que la tool B necesita:

- A devuelve un evento.
- Ese evento se guarda en `industrial_events`.
- El `eventBus` lee `communication-rules.json` y descubre que B reacciona a ese tipo.
- El bus llama a B con el evento de A.

Las tools son ignorantes la una de la otra. Eso es lo que permite agregar, quitar o renombrar tools sin romper nada.

### ❌ Antipatrón a evitar

Dentro del handler de A, hacer:

```js
import { handler as runB } from './B.js';
const result = await runB(evento);
```

**No lo hagas.** Rompe el bus, rompe la trazabilidad, rompe la independencia de las tools.

---

## 1.3 Qué te toca — según el tipo de tool

**Si tu tool es EXTERNA (lo normal):** tu único trabajo es, desde tu propio repo:

1. **Publicar** tus eventos con `POST /events`.
2. **Consumir** los tipos que te interesan con `GET /events?type=…&since_seq=…` (o `/events/subscriptions/:toolId` si te registraste en el catálogo).
3. **Reaccionar** en tu código y, si emites algo, propagar `correlation_id`/`causation_id`.

No escribes en `src/tools/`, no tocas `communication-rules.json`, no haces PR de código. Detalle completo en el [Manual de integración del README](../README.md#manual-de-integración-publicar-y-consumir-eventos).

**Si tu tool es NATIVA (admin/core):** tu trabajo es:

1. **Escribir un archivo** `src/tools/<tu_tool_id>.js` que exporte `meta` y `handler`.
2. **Declarar a qué eventos reacciona** (en `meta.consumes`) y **qué eventos emite** (en `meta.produces`).
3. **Registrar la regla** en `communication-rules.json` que conecta los eventos de otras tools con la tuya.

En ambos casos: no abres puertos hacia otras tools, no las llamas directo. El resto de este roadmap (pasos 5–9) desarrolla el camino **nativo**.

---

## 1.4 Mapa del repo — qué carpetas tocas tú

`IsoTools` es un repo **enfocado solo en tools**: no hay página web, ni dashboards, ni vistas. Eso quedó fuera a propósito para que no te distraigas. Aún así, **la mayoría de los archivos no son cosa tuya** — empiezas en `src/tools/`.

Esta es la única vista que necesitas tener clara:

```
IsoTools/
│
├── src/
│   ├── tools/                  ◄── 🟢 TÚ VIVES AQUÍ
│   │   └── <tu_tool_id>.js         crea tu archivo aquí
│   │
│   ├── data/agents/            ◄── 🟡 EDITAS DOS ARCHIVOS DE AQUÍ
│   │   ├── tools.json              registras tu tool en el catálogo
│   │   ├── communication-rules.json  conectas tu tool al bus
│   │   ├── event-standard.json     LO LEES, no lo editas
│   │   ├── tools-dev-spec.json     LO LEES (el brief de tu tool)
│   │   └── agents.json             NO LO EDITAS (avisas al lead)
│   │
│   └── (todo lo demás)         ◄── ⚪ CONTEXTO. Léelo si tienes curiosidad.
│       ├── server.js               el bootstrap del Express (solo la API de tools)
│       ├── controllers/            eventsController (la ingesta)
│       ├── services/               validation, bus de eventos, eventsService
│       ├── routes/                 eventsRoutes (la API de eventos)
│       ├── middleware/             apiKeyAuth
│       └── db/                     conexión a Postgres
│
├── cerebro/                    ◄── 🧠 segundo cerebro Obsidian (tu tool + sus comunicaciones)
├── pasos/                      ◄── este roadmap (1 → 9)
├── plantillas/ · recursos/ · docs/  ◄── plantillas y referencia técnica
│
├── scripts/                    ◄── 🟡 AQUÍ CREAS TU SMOKE TEST
│   ├── test_<tu_tool_id>.js        archivo nuevo, ver Paso 8
│   ├── createApiKey.js             scripts existentes — no los toques
│   ├── seedEvents.js · simulateStream.js
│   ├── generar-cerebro.js          regenera las notas del cerebro
│   └── crear-rama-comunicacion.js  crea la rama de tu comunicación
│
├── docker-compose.yml          ◄── ⚪ NO LO TOCAS (deploy del admin, Paso 2)
├── Dockerfile                  ◄── ⚪ NO LO TOCAS
├── railway.toml                ◄── ⚪ NO LO TOCAS (es deploy del admin)
├── db/init.sql                 ◄── ⚪ NO LO TOCAS
└── package.json                ◄── ⚪ Solo si necesitas agregar una dependencia
```

### Resumen rápido

| Color | Significa | Cuántas carpetas |
|---|---|---|
| 🟢 | Tu casa — creas un archivo nuevo aquí | 1 |
| 🟡 | Tocas archivos existentes (siguiendo las reglas) | 3 archivos puntuales |
| ⚪ | Contexto del sistema — léelo si quieres entender el "por qué", no editas | El resto del repo |

**El 95% del repo no es cosa tuya como programador de tools.** No es un proyecto donde tengas que entender todo antes de aportar — empiezas pegado a `src/tools/` y desde ahí expandes hacia afuera solo si te interesa.

---

## Archivos descargables relacionados con este paso

Ninguno todavía. La parte práctica empieza en el [Paso 5](./05-anatomia-tool.md).

---

## Siguiente paso

→ [Paso 2: Crear la API central y conectarse a ella](./02-api-central.md)

Si la API ya está corriendo en tu equipo y tienes tu API key, puedes saltar al [Paso 4: Nombrado IES](./04-nombrado-ies.md).
