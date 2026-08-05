# Paso 10 — El cerebro (Obsidian) y coordinarte con la otra tool

> [⬅ Volver al roadmap](../README.md)

## Qué vas a lograr en este paso

Saber **usar el cerebro** para ver qué hace la otra persona, **cómo ponerse de acuerdo** con quien tiene la tool que se comunica con la tuya, **cuándo tu tool ya está bien**, y **cuándo eso llega a Railway**. Tu tool casi nunca vive sola: alguien le manda un evento (tu *entrada*) y alguien recibe lo que produces (tu *salida*). Este paso es sobre ese acuerdo.

---

## 10.1 Abrir el cerebro (una vez)

1. Instala **Obsidian** (gratis).
2. *Open folder as vault* → elige la carpeta **`cerebro/`** del repo.
3. Entra por **`index.md`**. Tres carpetas:
   - `tools/` → una nota por tool.
   - `comunicaciones/` → una nota por cada par de tools que se hablan (el **contrato**).
   - `agentes/` → agrupan tools.

> Las reglas completas de mantenimiento del vault están en `cerebro/CLAUDE.md`.

---

## 10.2 Antes de programar: lee qué cambió el otro

1. Abre **`tools/<tu_tool>.md`**. Mira:
   - **Consume** = tu *entrada* (qué evento te llega).
   - **Produce** = tu *salida* (qué evento emites).
   - Las secciones *"dispara a"* y *"es disparada por"*.
2. Abre cada nota enlazada de **`comunicaciones/`** y lee su **Bitácora**. Ahí está, en una línea por cambio, qué tocó el otro programador en el contrato — **sin que tengas que leer su código.**

---

## 10.3 Trabajar con la persona de la otra tool

La nota de `comunicaciones/<source>__<target>.md` es el **punto de acuerdo** entre los dos. La fuente y el destino la comparten.

1. **Acuerden el contrato primero, no el código.** En la nota, completen juntos:
   - El `event.type`.
   - La **forma del `data`** (qué campos, tipos, unidades).
   - La **condición de disparo** (`triggerCondition`).
2. **Trabajen en la rama de esa comunicación:**
   ```bash
   npm run rama:comm <source>__<target>
   ```
3. **Cada vez que cambien algo del contrato**, agreguen una línea a la *Bitácora de la comunicación*:
   ```
   - [2026-06-28] (ana) data ahora lleva temperature_c (antes temperature, sin unidad)
   ```
   Esa línea es el aviso para el otro lado.

> Regla simple: **el productor manda en la forma de la salida; el consumidor manda en lo que necesita de la entrada.** Si chocan, se negocia en la nota antes de tocar código.

---

## 10.4 ¿Cuándo está "bien" la tool? (entrada y salida)

Tu tool está lista **cuando su contrato cierra de los dos lados**:

**Entrada (lo que recibes) está bien cuando:**
- [ ] El evento que te llega valida (`/api/v1/events` devuelve 201 — paso 8).
- [ ] Tu handler lee del `data` exactamente los campos acordados en la nota.
- [ ] Manejas el caso de que falte un campo (no truena, devuelve `null` o error claro).

**Salida (lo que produces) está bien cuando:**
- [ ] Emites el `event.type` exacto que la nota declara.
- [ ] El `data` tiene la forma acordada (campos, tipos, **unidades**).
- [ ] La tool destino la consume sin reproches (lo prueban juntos con el smoke / la cadena del paso 8).

**Y además:**
- [ ] Pasaste la checklist del [Paso 9](./09-checklist-merge.md).
- [ ] La bitácora de la comunicación refleja el contrato final.

Si las dos columnas (entrada/salida) están en verde y la otra persona confirma que recibe bien lo tuyo, **el contrato cerró**.

---

## 10.5 ¿Los demás ven lo que actualizo en la rama?

Sí, **pero solo después de que hagas `push`**:

- Trabajas local → `git add` + `git commit` → **`git push`**. Hasta el push, nadie lo ve.
- La otra persona ve tus cambios con `git pull` (estando en la misma rama `comm/...`).
- En GitHub, abrir un **Pull Request en borrador (Draft PR)** desde el inicio es lo mejor: todos ven el avance, los commits y la conversación en un solo lugar mientras el contrato aún se negocia.

> Recomendado: las dos personas trabajan sobre **la misma rama** `comm/<source>__<target>` (o una hace PR a la del otro). La bitácora en la nota evita malentendidos aunque no lean el código del otro.

---

## 10.6 ¿Cuándo sube a Railway? (ese paso NO cambió)

**No subes a Railway a mano, y no se sube por rama.** Railway está conectado a `main`:

```
rama comm/...  →  PR  →  merge a main  →  Railway redespliega solo
```

- Mientras estés en tu rama `comm/...`, **nada toca producción**. Pruebas contra la plataforma central con tu API key (paso 2); `main` no se ve afectada hasta el merge.
- **Cuando el contrato cerró** (10.4) y el PR pasa la checklist (paso 9) → **merge a `main`**.
- Ese merge dispara el **auto-deploy de Railway** (paso 2 §2.3). No hay un botón extra que apretar.

**Lo mejor / regla de oro:**
- `main` = solo contratos cerrados y acordados. Nunca trabajes el contrato directo en `main`.
- Una comunicación a la vez por rama → PR pequeño → merge → deploy.
- Si necesitas subir tu tool a producción **antes** de que el contrato esté listo, usa un **placeholder** (paso 7): se mergea a `main`, despliega, pero no rompe a nadie.

---

## Resumen en 6 puntos

1. Abre `cerebro/` en Obsidian y entra por `index.md`.
2. Lee la nota de tu tool y la bitácora de cada comunicación antes de tocar código.
3. Acuerda el contrato (evento + forma del `data` + condición) con la otra persona **en la nota**.
4. Trabaja en `comm/<source>__<target>`, haz `push` y abre un Draft PR para que todos vean el avance.
5. La tool está lista cuando entrada y salida cierran y la otra persona confirma.
6. PR → merge a `main` → Railway despliega solo. Nunca subas a Railway a mano.

---

## Siguiente paso

→ [⬅ Volver al roadmap](../README.md) — con esto cierras el ciclo completo: de tu tool sola, a tu tool integrada y desplegada.
