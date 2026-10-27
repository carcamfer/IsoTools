# Cerebro de IsoTools — Schema de operación

Este es el **segundo cerebro** del repo: un vault de Obsidian que mantiene la memoria viva de las tools y, sobre todo, de **cómo se comunican entre sí**. Su razón de ser es que un programador, antes de tocar su tool, pueda ver de un vistazo qué cambió el programador de la tool con la que se comunica — sin leer el código del otro.

No es un chatbot. Si actúas como agente sobre este vault, eres un **mantenedor de la wiki de tools**.

---

## Estructura del vault

```
cerebro/
├── CLAUDE.md            ← este archivo (reglas)
├── index.md             ← índice maestro / punto de entrada
├── log.md               ← bitácora cronológica del vault
├── tools/               ← una nota por tool (125)
│   └── <tool_id>.md
├── comunicaciones/      ← una nota por comunicación tool↔tool (90)
│   └── <source>__<target>.md
└── agentes/             ← una nota por agente (agrupa tools)
    └── <agente_id>.md
```

Las notas se generan desde la configuración con `npm run cerebro:generar` (script en `../scripts/generar-cerebro.js`). El generador **nunca sobreescribe** una nota existente: respeta lo que escribiste a mano.

---

## La pieza clave: notas de `comunicaciones/`

Cada archivo `comunicaciones/<source>__<target>.md` representa **un contrato entre dos tools** (una regla de `communication-rules.json`). Contiene:

- Las dos tools enlazadas (`[[../tools/...]]`).
- El evento, protocolo, topic y condición de disparo.
- La forma del payload.
- **La bitácora de la comunicación** ← lo más importante.
- La rama git asociada (`comm/<source>__<target>`).

> **Regla de oro:** cada vez que cambies el contrato de una comunicación (la forma del `data`, el `event.type`, la condición de disparo), **añade una línea a la bitácora de esa nota**. Ese es el aviso que verá el programador del otro lado.

---

## Operaciones

### REGISTRAR CAMBIO (lo más frecuente)
Cuando modificas una tool o un contrato:
1. Abre la nota de la(s) comunicación(es) afectada(s) en `comunicaciones/`.
2. Añade una línea a la **Bitácora de la comunicación**:
   `- [YYYY-MM-DD] (tu-nombre) qué cambió en el payload/condición y por qué`
3. Si cambió la tool en sí, añade también una línea a la **Bitácora de cambios** de su nota en `tools/`.
4. Apunta la entrada equivalente en `log.md`.

### CONSULTAR (antes de tocar tu tool)
1. Abre la nota de tu tool en `tools/<tu_tool>.md`.
2. Mira las secciones **"dispara a"** y **"es disparada por"**.
3. Abre cada nota de `comunicaciones/` enlazada y lee su bitácora: ahí está lo que cambió el otro programador.

### SINCRONIZAR (cuando se agregan tools o reglas nuevas)
1. Actualiza los JSON en `../src/data/agents/`.
2. Corre `npm run cerebro:generar` — crea solo las notas que faltan.
3. Revisa `index.md` y añade lo relevante.

### LINT (health-check del vault)
1. Notas de tool con `estado: catalogo` que ya tienen handler → cambiar a `implementada`.
2. Comunicaciones sin bitácora real (solo la línea `(auto)`) que ya se implementaron.
3. Tools huérfanas (sin comunicaciones declaradas) que deberían tener alguna.
4. Contradicciones entre el payload documentado y el código real de la tool.

---

## Convenciones

- **Idioma:** español; inglés solo para términos técnicos (event.type en `SCREAMING_SNAKE_CASE`, ISO, SPC, EOQ, etc.).
- **Links internos:** estilo Obsidian `[[ruta/archivo-sin-extension]]`.
- **Fechas:** siempre absolutas `YYYY-MM-DD`.
- **Frontmatter:** no borrar los campos; el campo `programador:` / `programadores:` lo llenas tú.
- **Una idea por nota.** No mezclar dos comunicaciones en un archivo.
- **No inventar contratos:** si no sabes la forma del payload, déjalo marcado `[POR DEFINIR]`.

---

## Relación con las ramas git

Cada nota de comunicación nombra su rama `comm/<source>__<target>`. El flujo:

1. `npm run rama:comm <source>__<target>` crea/cambia a esa rama desde `feature/filter`.
2. Los cambios del contrato entre esas dos tools se trabajan **en esa rama**.
3. Se actualiza la bitácora de la nota de comunicación en la misma rama.
4. Cuando el contrato queda estable → **PR de la rama a `feature/filter`**.

Así, `feature/filter` siempre tiene el estado acordado y cada negociación entre dos tools vive aislada en su rama hasta que cierra.
