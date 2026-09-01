# ERP Central — conectores de la plataforma ORCA

> **Cambio de modelo.** Las Tools ya **no** se conectan al ERP, al PLC ni a ningún
> sistema externo. La Plataforma Central tiene los conectores; cada conector lee
> el sistema externo, traduce el dato al **Industrial Event Standard (IES)** y lo
> entrega a **Industrial Events**. Desde ahí el **Communication Router**
> (`communication-rules.json`) decide qué Tool(s) reciben cada evento.
>
> ```
> ERP / PLC  →  Conector  →  Industrial Events  →  Communication Router  →  Tool(s)
> ```
>
> Los equipos de Tools solo se ocupan de **consumir y publicar eventos**.

---

## 1. Las dos piezas

| Pieza | Dónde corre | Qué hace | Archivo |
|---|---|---|---|
| **ERP Edge Gateway** | En la planta, junto al ERP (Windows + Firebird) | Expone el ERP en **solo lectura** por HTTP | `app.py` + `requirements.txt` |
| **Conector ERP** | En la Plataforma Central (este repo, Railway) | Sondea el gateway, mapea al estándar IES y publica | `src/connectors/` + `src/data/connectors/*.json` |

Se parten en dos porque el ERP vive **dentro** de la planta y la plataforma vive
en la nube: el gateway es la única pieza que toca la base del ERP, y solo hace
`SELECT`. Ninguna Tool ve nunca ni Firebird, ni las tablas, ni las credenciales.

### «¿Y si mi Tool necesita consultar el ERP?»

No lo consulta: **lee el dato que la plataforma ya tiene**. Es la diferencia
entre *preguntar* y *estar suscrito*, y es deliberada.

El conector sondea el ERP cada ciclo y publica lo que encuentra. Cuando tu Tool
necesita el inventario, se lo pide a la plataforma —no al ERP— con el mismo
`GET /api/v1/events` que ya usa para todo lo demás:

```bash
GET /api/v1/events/latest?types=ERP_DATA_SYNCED               # último estado conocido
GET /api/v1/events?since_seq=120&types=ERP_STOCK_BELOW_MINIMUM # lo nuevo desde tu cursor
```

Por qué así y no una consulta en vivo al ERP:

- **La planta se cae y tu Tool sigue funcionando** con el último estado conocido.
  Con una consulta en vivo, cada caída del ERP es una caída de todas las Tools.
- **El ERP no se ahoga.** Da igual que haya 3 Tools o 30: el conector sondea una
  vez y todas leen de la plataforma.
- **Queda evidencia ISO.** Cada dato que entró está en el log de eventos con su
  timestamp y su cadena causal. Una consulta en vivo no deja rastro.

El precio es que el dato tiene hasta un ciclo de antigüedad (60 s por defecto,
ajustable por conector). Si un caso de uso necesita más frescura, la respuesta es
**bajar `intervalMs` de ese pull o agregar un `emit`**, no abrir un camino
directo al ERP.

---

## 2. Levantarlo en local (sin ERP real, en 3 minutos)

El gateway trae **modo MOCK** con datos simulados: sirve para desarrollar y
demostrar toda la cadena sin Firebird y sin Windows.

```bash
# 1) Gateway edge simulado (terminal 1)
pip install -r requirements-mock.txt          # solo Flask (en la planta: requirements.txt)
ERP_MOCK=1 ERP_API_KEY=demo-key ERP_GATEWAY_PORT=5000 python3 app.py
#    …o con Docker, sin instalar nada:
#    docker compose --profile erp up -d erp-gateway

# 2) Plataforma central con el conector activo (terminal 2)
CONNECTORS_ENABLED=true \
ERP_GATEWAY_URL=http://localhost:5000 \
ERP_GATEWAY_KEY=demo-key \
npm run dev

# 3) Un ciclo a mano, sin esperar al planificador
ERP_GATEWAY_URL=http://localhost:5000 ERP_GATEWAY_KEY=demo-key npm run erp:sync
```

Comprobación rápida:

```bash
curl -H "x-api-key: $API_KEY" localhost:3000/api/v1/connectors
curl -H "x-api-key: $API_KEY" "localhost:3000/api/v1/events?since_seq=0&types=ERP_STOCK_BELOW_MINIMUM"
```

---

## 3. El gateway edge (`app.py`)

Recursos que expone (todos `GET`, todos protegidos con `X-API-Key` si defines
`ERP_API_KEY`):

| Ruta | Cursor incremental | Parámetros |
|---|---|---|
| `/health`, `/ready` | — | sin auth, para el orquestador |
| `/api/catalogo` | — | descubrimiento de recursos |
| `/api/inventario` | — | `limit`, `almacen` |
| `/api/ventas` | `DOCTO_VE_ID` | `limit`, `fecha`, `desde_id` |
| `/api/compras` | `DOCTO_CM_ID` | `limit`, `fecha`, `desde_id` |
| `/api/articulos` | `ARTICULO_ID` | `limit`, `desde_id` |

Variables (se definen en la máquina del ERP, nunca en el código):

```bash
ERP_MOCK=0                 # 1 = datos simulados
ERP_API_KEY=<secreto>      # la misma que ERP_GATEWAY_KEY en la plataforma
ERP_GATEWAY_PORT=5000
ERP_TYPE=microsip
ERP_PLANT_ID=plant_01
ERP_MAX_ROWS=500           # tope duro de filas por respuesta
FB_HOST=localhost
FB_PORT=3050
FB_DATABASE=C:\Microsip Datos\AGTE.FDB
FB_USER=SYSDBA
FB_PASSWORD=<secreto>
FB_CHARSET=WIN1252
```

> `/api/compras` consulta `DOCTOS_CM`. Verifica ese nombre contra tu base de
> Microsip antes de habilitar el pull correspondiente (viene `enabled: false`).

### Publicarlo hacia la nube — Cloudflare Tunnel

Railway **no puede entrar** a la red de la planta. La solución adoptada es un
túnel de Cloudflare: `cloudflared` corre en la máquina del ERP y abre la conexión
**hacia afuera**, así que no se publica ningún puerto de entrada ni se toca el
firewall perimetral. La planta solo necesita salida por 443.

```
Railway ──HTTPS──► erp-planta1.orcalabs.mx ──► red Cloudflare
                                                     ▲
                                     conexión saliente│ (la abre la planta)
                                          cloudflared ─┘ → http://localhost:5000 (app.py)
```

**En la máquina del ERP (una sola vez):**

```powershell
winget install --id Cloudflare.cloudflared

cloudflared tunnel login                       # abre el navegador, elige orcalabs.mx
cloudflared tunnel create erp-planta1          # anota el TUNNEL-ID que imprime
cloudflared tunnel route dns erp-planta1 erp-planta1.orcalabs.mx
```

`C:\Users\<usuario>\.cloudflared\config.yml`:

```yaml
tunnel: erp-planta1
credentials-file: C:\Users\<usuario>\.cloudflared\<TUNNEL-ID>.json

ingress:
  - hostname: erp-planta1.orcalabs.mx
    service: http://localhost:5000     # aquí escucha app.py
  - service: http_status:404
```

```powershell
cloudflared service install    # queda como servicio de Windows: sobrevive al reinicio
```

**Proteger el túnel con Cloudflare Access (service token):**

Sin esto, el hostname queda público. En *Zero Trust → Access → Applications*:

1. **Add an application → Self-hosted**, hostname `erp-planta1.orcalabs.mx`.
2. Policy con acción **Service Auth** (no "Allow": el conector no es una persona
   y no puede pasar por un login interactivo).
3. *Access → Service Auth → Create Service Token*. Guarda el **Client ID** y el
   **Client Secret** — el secreto se muestra una sola vez.

**En Railway (variables de la plataforma):**

```bash
CONNECTORS_ENABLED=true
ERP_GATEWAY_URL=https://erp-planta1.orcalabs.mx
ERP_GATEWAY_KEY=<la misma que ERP_API_KEY en la planta>
CF_ACCESS_CLIENT_ID=<client id del service token>
CF_ACCESS_CLIENT_SECRET=<client secret del service token>
```

El conector manda esas dos cabeceras solo si las variables existen, así que el
mismo JSON sirve con o sin Access (en local, sin ellas, no estorban).

**Comprobación desde fuera de la planta:**

```bash
curl -H "CF-Access-Client-Id: $CF_ACCESS_CLIENT_ID" \
     -H "CF-Access-Client-Secret: $CF_ACCESS_CLIENT_SECRET" \
     https://erp-planta1.orcalabs.mx/health
# {"status":"ok","service":"orca-erp-edge-gateway","mode":"firebird",...}
```

Sin las cabeceras debe responder el login de Access, **no** el JSON. Si responde
el JSON, la policy no está aplicada.

**Tres capas de defensa**, y ninguna sustituye a la otra:

1. Cloudflare Access — solo quien tiene el service token llega al túnel.
2. `ERP_API_KEY` — el gateway rechaza lo que no traiga la key.
3. El gateway **solo hace SELECT** — aunque alguien pase las dos anteriores, no
   puede escribir en el ERP.

**Más de una planta:** un túnel por planta (`erp-planta2.orcalabs.mx`) y un JSON
de conector por planta, cada uno con su `asset.plant_id` y su propia variable de
URL. El resto de la plataforma no cambia.

**Alternativas** (documentadas por si cambia el escenario): Tailscale, metiendo
la máquina del ERP y el contenedor de Railway en la misma tailnet; o invertir la
dirección — correr el conector *dentro* de la planta con
`CONNECTORS_PUBLISH_MODE=http`, `CENTRAL_API_URL` y `CENTRAL_API_KEY`, de modo que
el tráfico sea solo de salida y no haga falta túnel. Esta última impide para
siempre cualquier consulta al ERP iniciada desde la nube.

## 4. El conector central

Un conector se declara en **JSON** — agregar otro ERP, un MES o una pasarela de
PLCs **no requiere escribir código**, solo otro archivo en `src/data/connectors/`.

```jsonc
{
  "id": "erp_microsip",
  "enabled": true,
  "intervalMs": 60000,                       // cada cuánto sondea
  "module": { "id": "erp_connector", "version": "1.0.0" },
  "source": {
    "type": "http",
    "baseUrlEnv": "ERP_GATEWAY_URL",         // la URL vive en el entorno, no aquí
    "apiKeyEnv": "ERP_GATEWAY_KEY",
    "apiKeyHeader": "X-API-Key",
    "headers": {                             // service token de Cloudflare Access;
      "CF-Access-Client-Id": "$env.CF_ACCESS_CLIENT_ID",        // si la variable no
      "CF-Access-Client-Secret": "$env.CF_ACCESS_CLIENT_SECRET" // existe, se omite
    }
  },
  "asset": { "asset_id": "erp-microsip-01", "asset_type": "erp", "plant_id": "plant_01" },
  "params": { "erpType": "microsip", "warehouseId": "ALM-01", "minStock": 10 },
  "pulls": [{
    "id": "inventario",
    "path": "/api/inventario",
    "query": { "limit": 200 },
    "cursor": { "param": "desde_id", "field": "DOCTO_VE_ID", "type": "number" },
    "fields": { "skuId": "CLAVE", "quantity": "EXISTENCIA" },   // ERP -> negocio
    "emits": [
      { "mode": "summary", "event": { "type": "ERP_DATA_SYNCED", "category": "productivity", "severity": "low" },
        "data": { "recordsSynced": "$count", "syncTimestamp": "$now" } },
      { "mode": "rows", "when": "$row.quantity <= $params.minStock", "key": "$row.skuId",
        "event": { "type": "ERP_STOCK_BELOW_MINIMUM", "category": "productivity", "severity": "medium" },
        "data": { "skuId": "$row.skuId", "quantity": "$row.quantity" } }
    ]
  }]
}
```

**Modos de emisión**

- `summary`: **un** evento agregado por ciclo (resumen de la sincronización).
  Con `skipIfEmpty: false` se emite aunque no haya filas.
- `rows`: **un** evento por fila que cumpla `when`. Requiere `key`: es la clave de
  negocio que hace idempotente la publicación.

**Plantillas** (dentro de `data`, `key`, `when`, `severity`):

| Token | Valor |
|---|---|
| `$row.<campo>` | valor ya mapeado por `fields` |
| `$raw.<COLUMNA>` | valor crudo tal como vino del ERP |
| `$params.<x>` | parámetro del conector o del pull |
| `$count` | filas leídas en el ciclo |
| `$now` | timestamp ISO del ciclo |
| `$cursor` | cursor con el que se leyó |

`when` acepta la misma gramática que los `triggerCondition` del bus
(`always`, `AND`, `OR`, `IN [..]`, `== != >= <= > <`), con la diferencia de que
**ambos lados** pueden ser plantillas.

### Idempotencia y cursores — por qué no se duplican eventos

- El `event_id` es **determinista**: `sha1(conector | pull | emit | clave)`. Si el
  mismo renglón del ERP se lee dos veces (reintento, redeploy, cursor reiniciado),
  la ingesta lo marca `duplicate` y **no** vuelve a disparar el router.
- El cursor de cada pull se guarda en la tabla `connector_state`, así que un
  redeploy de Railway **no** relee el ERP entero.
- Si un ciclo falla, el cursor **se conserva** (un error de red no obliga a
  reprocesar) y el conector aplica *backoff* exponencial hasta
  `CONNECTORS_MAX_BACKOFF_MS`.
- Un pull que falla no cancela a los demás.

### Variables de la plataforma

```bash
CONNECTORS_ENABLED=true
CONNECTORS_INTERVAL_MS=60000
CONNECTORS_PUBLISH_MODE=inprocess   # o "http" si el conector corre aparte
ERP_GATEWAY_URL=https://erp-planta1.orcalabs.mx
ERP_GATEWAY_KEY=<secreto>
CF_ACCESS_CLIENT_ID=<service token de Cloudflare Access>
CF_ACCESS_CLIENT_SECRET=<service token de Cloudflare Access>
# solo para CONNECTORS_PUBLISH_MODE=http
CENTRAL_API_URL=https://<plataforma>.up.railway.app
CENTRAL_API_KEY=<api key con scope events:write>
```

---

## 5. API de administración

| Método y ruta | Scope | Para qué |
|---|---|---|
| `GET /api/v1/connectors` | `events:read` | Estado de todos los conectores, cursores y último ciclo |
| `GET /api/v1/connectors/:id` | `events:read` | Detalle de uno |
| `POST /api/v1/connectors/:id/run` | `events:write` | Forzar un ciclo ahora |
| `POST /api/v1/connectors/:id/run?dry_run=true` | `events:write` | Ver los eventos que **se publicarían**, sin publicarlos |
| `POST /api/v1/connectors/:id/reset?pull=ventas` | `events:write` | Reiniciar el cursor (seguro: lo ya publicado sale como duplicado) |

`dry_run` es la forma de depurar un mapeo nuevo sin ensuciar el log de evidencia.

---

## 6. Eventos que publica hoy el conector `erp_microsip`

| Evento | Cuándo | `data` |
|---|---|---|
| `ERP_DATA_SYNCED` | Un resumen por ciclo de inventario | `erpType`, `warehouseId`, `recordsSynced`, `syncTimestamp`, `errors`, `tables[]` |
| `ERP_STOCK_BELOW_MINIMUM` | Artículo con existencia ≤ `minStock` | `skuId`, `articuloId`, `nombre`, `quantity`, `minStock`, `warehouseId`, `alert` |
| `ERP_SALES_ORDER_REGISTERED` | Documento de venta nuevo | `orderId`, `folio`, `date`, `documentType`, `amount`, `status` |
| `ERP_PURCHASE_ORDER_REGISTERED` | Documento de compra nuevo (pull deshabilitado por defecto) | `orderId`, `folio`, `date`, `amount`, `status` |

`ERP_DATA_SYNCED` ya está enrutado por `rule-erp-001` hacia `get_inventory_status`.
Para enrutar los demás, **crea la regla en su rama** `comm/<source>__<target>` y
documenta la nota en `cerebro/comunicaciones/` (ver `CLAUDE.md`). Candidatas
naturales:

- `erp_connector → get_inventory_status` con `ERP_STOCK_BELOW_MINIMUM`
- `erp_connector → forecast_revenue` con `ERP_SALES_ORDER_REGISTERED`

### Cómo lo consume una Tool

Igual que cualquier otro evento — la Tool **no sabe** que el origen fue un ERP:

```bash
# incremental por cursor (recomendado)
curl -H "x-api-key: $API_KEY" \
  "$CENTRAL/api/v1/events?since_seq=$cursor&types=ERP_STOCK_BELOW_MINIMUM"

# o directamente lo que la Tool declara consumir
curl -H "x-api-key: $API_KEY" "$CENTRAL/api/v1/events/subscriptions/get_inventory_status"
```

---

## 7. Agregar otro sistema (otro ERP, un PLC, un MES)

1. Levanta un gateway que exponga el sistema por HTTP en JSON (puede ser
   `app.py` con otras consultas, o cualquier endpoint que ya tenga el proveedor).
2. Copia `src/data/connectors/erp-microsip.json` con otro `id` y ajusta
   `source`, `asset`, `params`, `pulls` y `emits`.
3. Define sus variables (`<X>_GATEWAY_URL`, `<X>_GATEWAY_KEY`) en Railway.
4. Verifica el mapeo con `POST /api/v1/connectors/<id>/run?dry_run=true`.
5. Declara las reglas de enrutamiento en su rama `comm/…` y documenta la nota.

Si la respuesta del sistema viene envuelta (`{ "data": [...] }`), usa
`"rowsPath": "data"` en el pull.

---

## 8. Reglas de esta capa

- El gateway **solo hace SELECT**. Ninguna escritura al ERP desde aquí.
- Las credenciales del ERP viven **solo** en la máquina del ERP, como variables
  de entorno. Nunca en el repo ni en la plataforma.
- Las Tools **no consultan el ERP**, ni siquiera a través del conector: leen los
  eventos que la plataforma ya tiene (ver §1). No existe un endpoint de consulta
  en vivo al ERP, y es una decisión de diseño, no una pieza pendiente.
- El conector **nunca** llama a una Tool: publica el evento y el Communication
  Router decide. Si necesitas que una Tool nueva reciba estos datos, la respuesta
  es una **regla**, no una llamada.
- Todo evento se valida contra el estándar IES **antes** de entrar al bus: un
  conector jamás mete al log un evento fuera de contrato.
