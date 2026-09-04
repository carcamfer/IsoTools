# Estilo de la plataforma — obligatorio

Todas las tools comparten una sola identidad visual: el tema **Control Room**.
Esta carpeta no es una sugerencia de diseño, es el contrato de interfaz entre los
cinco equipos.

```
ui/
├── index.css             el tema (Tailwind v4). Cópialo tal cual.
├── tailwind-preset.cjs   lo mismo, si sigues en Tailwind v3
├── AppShell.tsx          barra superior, salud, sesión, ancho del contenido
├── PageHeader.tsx        cabecera de pantalla
└── primitives.tsx        Panel, Metric, StatusChip, Table, Button, Field, vacíos y errores
```

```bash
cp plantillas/integracion/ui/index.css       web/src/index.css
cp plantillas/integracion/ui/AppShell.tsx    web/src/components/
cp plantillas/integracion/ui/PageHeader.tsx  web/src/components/
cp plantillas/integracion/ui/primitives.tsx  web/src/components/
```

Dependencias: `react`, `lucide-react`, `tailwindcss`. Nada más.

---

## 0. Por qué esto no es negociable

Cada tool vive en **su propio subdominio**, la mantiene **su propio equipo** y se
despliega **por su cuenta**. Para quien la usa, eso es invisible y debe seguir
siéndolo: un inspector de calidad abre el dashboard, entra a la tool de
especificaciones, salta a la de no conformidades y vuelve. Son tres despliegues
de tres equipos. Tiene que sentirse como **una** aplicación.

Cuando no lo es, el costo no es estético. Es que el botón de aprobar está en otro
sitio, que el rojo de una tool significa lo que en otra significa el ámbar, y que
alguien duda medio segundo antes de disponer un lote. En una plataforma de
calidad, la consistencia visual es parte de la usabilidad, y la usabilidad es
parte del control.

La regla corta: **copia los archivos de esta carpeta, no los reinterpretes.**

## 1. Superficies: tres niveles, ni uno más

| Token | Hex | Para qué |
| --- | --- | --- |
| `bg` | `#0E1216` | el lienzo de la página |
| `surface` | `#161B21` | lo que flota sobre el lienzo: paneles, tarjetas, barras |
| `surface2` | `#1E242B` | lo hundido: cabecera de tabla, hover, chips, inputs |
| `border` | `#262D35` | **todas** las separaciones, 1px |

Si algo necesita destacar, no inventes un cuarto gris: usa el borde o un color de
estado. Un gris nuevo por pantalla es cómo se deshace una jerarquía.

**Bordes, no sombras.** En un tema oscuro la sombra no se lee y deja un halo
sucio. Nada de degradados, nada de `blur`, nada de glassmorphism.

**Radio:** `rounded-md` (paneles, tarjetas, chips grandes) o `rounded`
(botones, badges, inputs). Nunca `rounded-xl` ni `rounded-full` salvo en puntos
de estado y avatares.

## 2. Texto: tres niveles de jerarquía

| Token | Hex | Para qué |
| --- | --- | --- |
| `text` | `#E6E9EC` | lo que se lee: títulos, valores, filas |
| `muted` | `#9AA4AE` | secundario: descripciones, celdas de apoyo |
| `faint` | `#6B7681` | terciario: etiquetas, marcas de tiempo, pistas |

## 3. Estado: cada color significa una cosa

| Token | Hex | Significa |
| --- | --- | --- |
| `ok` | `#3FB36B` | conforme, aprobado, en línea, liberado |
| `warn` | `#E0A93B` | vence pronto, requiere revisión, contenido |
| `danger` | `#E5604D` | no conforme, caído, rechazado, vencido |
| `info` | `#4C8FBF` | informativo, en proceso — y el primario de acción |
| `brass` | `#D6A23E` | marca / identidad de plataforma. Acento, no estado. |

Dos reglas que van juntas:

**El color nunca informa solo.** Siempre lleva texto al lado. Alrededor del 8% de
los hombres no distingue rojo de verde; aquí se decide si un lote sale o no.

**`brass` no es un estado.** Es el acento de identidad (el logo, la pestaña
activa, lo federado). Usarlo para "atención" lo desgasta y deja `warn` sin
contraste contra él — son casi el mismo ámbar a propósito.

## 4. Tipografía

**IBM Plex Sans** para prosa. **IBM Plex Mono** para todo dato que alguien pueda
tener que comparar carácter por carácter:

> ids, códigos de lote, versiones, fechas y horas, cifras, roles, claves,
> cláusulas ISO, cualquier valor que aparezca igual en un evento y en un reporte.

No es decoración. En mono los dígitos alinean entre filas y un `1` no se confunde
con una `l`. Un auditor coteja `NC-2024-0117` contra un PDF: en sans, esa
comparación es más lenta y más frágil.

| Uso | Clase |
| --- | --- |
| Título de pantalla | `text-lg font-medium` |
| Título de panel | `text-sm font-medium` |
| Cuerpo | `text-sm` |
| Metadatos, tablas, chips, botones | `text-2xs` (0.6875rem) |
| Cifra de métrica | `font-mono text-2xl` |
| Etiqueta de sección | `text-2xs uppercase tracking-wide text-faint` |

`text-2xs` domina la interfaz y eso es correcto: una pantalla de operación es,
sobre todo, metadato. Nada por encima de `text-lg`: no hay títulos de portada
aquí, esto es una consola.

## 5. Estructura y distribución

```
┌─────────────────────────────────────────────┐
│ ← │ icono │ Tool               [salud][user]│  AppShell — barra superior
│           │ ISO 9001:2015 · 8.7             │
│ pestaña  pestaña                            │  tabs (opcional)
├─────────────────────────────────────────────┤
│  [métrica] [métrica] [métrica] [métrica]    │  ← max-w-6xl, px-6 py-6
│                                             │
│  ┌ Panel ─────────────────────── [acción] ┐ │
│  │ tabla / formulario / detalle           │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**El dashboard lleva barra lateral; las tools llevan barra superior.** No es
inconsistencia, es la diferencia entre ambos: el dashboard navega entre 125
tools, tu tool navega entre tres pantallas de un dominio. Una barra lateral con
tres entradas es un menú vacío, y además duplicaría la del dashboard con otro
contenido, que es la forma más rápida de perder a alguien.

**`max-w-6xl` para el contenido.** Una tabla a 2560px de ancho separa tanto la
primera columna de la última que deja de leerse como una fila.

**Ritmo de espaciado** — cuatro medidas, siempre las mismas:

| Sitio | Clase |
| --- | --- |
| Contenido de la página | `px-6 py-6` |
| Cabecera de panel | `px-4 py-2.5` |
| Cuerpo de panel / celda de tabla | `px-4 py-3` / `px-4 py-2` |
| Entre secciones de una página | `space-y-5` |
| Entre tarjetas de una fila | `gap-3` |

Ajustar el padding "solo en este panel" es lo que hace que dos paneles lado a
lado se vean rotos.

**Orden de una pantalla:** métricas arriba (el resumen que se lee de un vistazo),
el trabajo en paneles debajo, la acción primaria en la cabecera del panel al que
pertenece — no flotando en una esquina.

**Una acción `primary` por pantalla.** Si todo destaca, nada destaca.

## 6. Elementos: úsalos, no los reescribas

Todo esto está en `primitives.tsx`. Antes de escribir un
`<div className="rounded border …">`, búscalo aquí:

| Componente | Cuándo |
| --- | --- |
| `Panel` | cualquier bloque de contenido con título |
| `Metric` | cifra de resumen |
| `StatusChip` / `StatusDot` | estado del dominio (punto + etiqueta) |
| `Badge` | clasificación: severidad, tipo, versión |
| `Table` + `Column<T>` | listados |
| `Button` | `primary` \| `ghost` \| `danger` |
| `Field` + `Input` | formularios |
| `Loading` / `EmptyState` / `ErrorState` | los tres estados que se olvidan |
| `Mono` | ids, fechas, cifras |
| `formatTime` / `formatRelative` | fechas — locale fijo `es-MX`, 24 h |

Cuando de verdad falte una pieza, agrégala **a `primitives.tsx`** y úsala desde
tus pantallas. Un estilo suelto en una página es cómo la siguiente pantalla acaba
inventando otro.

### Los tres estados que se olvidan

Toda vista que pide datos tiene **cuatro** estados, no uno: cargando, vacío,
error y con datos. Los tres primeros existen en `primitives.tsx` porque saltárselos
produce el peor fallo de una consola de operación: una tabla vacía que es
indistinguible de una tabla que falló al cargar. En una pantalla de calidad, "no
hay no conformidades abiertas" y "no pude consultarlas" son conclusiones
opuestas, y equivocarse de una a otra es un hallazgo de auditoría.

Por eso `EmptyState` y `ErrorState` piden causa, y el detalle técnico del error se
muestra visible y en mono: quien reporta el fallo casi nunca es quien puede abrir
devtools.

## 7. Lo que tu tool debe mostrar siempre

`AppShell` lo resuelve; si no lo usas, replícalo:

1. **Nombre de la tool y cláusula ISO**, visibles siempre. Se llega por enlace
   directo desde el dashboard, sin haber elegido conscientemente esta pantalla.
2. **Estado del servicio**, con sonda propia cada 10 s. El mosaico verde del
   dashboard dice que respondías hace 15 segundos, no que respondas ahora.
3. **Quién firma.** Toda aprobación o disposición queda en la traza a nombre de
   quien está en sesión (ISO 9001:2015 7.5.2 / 8.7.1). Se muestra **antes** de
   actuar, no después en un log.
4. **Vuelta al dashboard.** Es otro subdominio; el botón "atrás" no siempre existe.
5. **Aviso de modo abierto.** Sin `OIDC_ISSUER` no hay identidad real. El aviso es
   permanente y visible: sin él es fácil demostrar la tool en local y creer que
   está protegida.

## 8. Lo que no se hace

- Otra paleta, otra fuente, otro radio. Ni "solo para esta pantalla".
- Modo claro. La plataforma es oscura; no hay conmutador de tema.
- Degradados, sombras, blur, animaciones de entrada.
- Emojis como iconos de estado. Iconos: `lucide-react`, `h-4 w-4` o `h-3.5 w-3.5`.
- Color como único portador de información.
- Hex sueltos en un `.tsx`. Si el token no existe, no es que falte el token:
  es que ese color no va.
- Librerías de UI con su propio tema (MUI, Chakra, Ant). Si usas shadcn/ui, mapea
  sus tokens semánticos a esta paleta — hay un ejemplo al final de
  `tailwind-preset.cjs`.
- Barra lateral en una tool (§5).
- Reescribir `Panel`/`Table`/`Button` "un poco distinto" en tu repo.

## 9. Antes de abrir el PR

- [ ] `index.css` es copia literal — ningún valor de `@theme` cambiado
- [ ] Cero hex fuera de `index.css` / `tailwind-preset.cjs`
- [ ] Toda pantalla dentro de `AppShell`; el contenido a `max-w-6xl`
- [ ] Cada vista de datos cubre cargando / vacío / error / con datos
- [ ] Ids, fechas y cifras en mono
- [ ] Ningún estado comunicado solo con color
- [ ] Una sola acción `primary` por pantalla
- [ ] Padding de paneles sin retocar
- [ ] Abierta al lado del dashboard, se ve como la misma aplicación

Ese último punto es la prueba real. Los otros ocho son cómo llegar a él.

---

Referencia viva: el dashboard orquestador de este repo
([`web/src/components/`](../../../web/src/components/)). Si algo de aquí y algo de
allá se contradicen, manda el dashboard — y avisa para actualizar esta plantilla.
