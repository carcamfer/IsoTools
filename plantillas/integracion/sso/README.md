# Plantilla de SSO — integración OIDC para tu tool

Código listo para copiar que convierte tu servicio en un **relying party de OpenID
Connect** de la plataforma IsoTools. Es exactamente el mismo diseño que corre en el
core (`src/auth/`) y en las tools de calidad, adaptado para vivir en el repo de tu
equipo.

El contrato entre equipos (topología, roles, quién entrega qué) está en
[`docs/PLATAFORMA-SSO.md`](../../../docs/PLATAFORMA-SSO.md). **Léelo primero.** Este
documento es el *cómo*, aquel es el *qué* y el *por qué*.

---

## 1. Qué te llevas

| Archivo | ¿Editar? | Qué hace |
| --- | --- | --- |
| `signed-value.js` | no | Firma HMAC de cargas de cookie. Comparación en tiempo constante. |
| `session-cookie.js` | no | Tu cookie de sesión: firmada, sin estado, host-only. |
| `oidc-config.js` | una línea | Lee el entorno. Falla al arrancar si está a medias. |
| `auth-gateway.js` | no | El handshake: `login`, `callback`, `logout`. Code flow + PKCE. |
| `index.js` | no | Los dos planos de credencial, los middlewares y `bindActor`. |
| **`role-mapping.js`** | **SÍ** | Traduce roles de plataforma → roles de **tu** dominio. |
| `ejemplo-servidor.js` | referencia | Cómo se arma todo junto. |
| `env-tool.example` | copiar a `.env` | Todas las variables, documentadas. |

**Solo `role-mapping.js` lleva trabajo tuyo de verdad.** El resto se copia.

## 2. Instalación

```bash
mkdir -p src/auth
cp plantillas/integracion/sso/*.js src/auth/
rm src/auth/ejemplo-servidor.js          # es referencia, no código tuyo
npm i openid-client@^6                   # requiere Node 20+
```

Copia `env-tool.example` a `.env` y rellena. Los tres valores OIDC te los da el
equipo de plataforma; ver §7 del contrato.

> **¿No usas Node?** Salta a la [§6](#6-si-no-estás-en-node): la especificación de
> lo que tienes que implementar es corta y no depende del lenguaje.

## 3. Cableado — las cinco cosas

`ejemplo-servidor.js` las muestra completas. En orden, porque el orden importa:

**1) Salud abierta, antes de todo.** El healthcheck del contenedor y los mosaicos
del dashboard no tienen sesión.

```js
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/ready',  (req, res) => res.json({ status: 'ready' }));
app.use(attachCaller);   // ← resuelve quién llama, no rechaza a nadie
```

**2) El handshake** en `/auth/login`, `/auth/callback`, `/auth/logout`, `/auth/me`.

**3) Tu API con `requireCaller`,** que responde **`401` JSON, nunca `302`**. Un
`fetch` de tu SPA que recibe una redirección al IdP termina intentando parsear el
HTML del login, y el error que ves no se parece en nada al problema real.

**4) Tu SPA y tu API por el MISMO origen.** SPA en `/`, API en `/api/*`. Este es el
paso que borra CORS de tu vida: la cookie es first-party, no hay preflights, y
`EventSource` lleva la cookie sola — sin credenciales en el query string, donde se
filtrarían por historial del navegador, cabecera `Referer` y logs de acceso.

En navegación de navegador sí se redirige (`requireBrowserSession`), conservando la
ruta pedida para que los deep links sobrevivan. Los **assets van abiertos**: un
`302` al IdP como respuesta a un `.js` no lo sigue nadie, rompe la carga.

**5) `bindActor` antes de tocar tu dominio.** Sigue leyendo.

## 4. La pieza que no puedes saltarte: `bindActor`

Este agujero fue real y lo tuvimos en producción. El rol autorizante llegaba
**dentro del payload**:

```jsonc
POST /api/ncs/NC-7/disposicion
{ "disposition": { "type": "UseAsIs", "authorizedByRole": "QualityDirector" } }
```

Cualquiera podía escribir `QualityDirector` y satisfacer la matriz de autoridad. La
política se cumplía **correctamente**… contra un rol que el propio cliente se había
inventado. No era un bug de la política: era que la política recibía basura.

ISO 9001:2015 **7.5.2** y **8.7.1** exigen que la parte que autoriza esté
*identificada*, y **7.5.3.2 / 8.7.2** que esa identidad quede retenida. Un rol
autodeclarado en un payload no es identificación.

La solución es sellar los campos de actor desde el token verificado, **pisando lo
que mandó el cliente**, en la frontera:

```js
const command = bindActor(req.caller, req.body, {
  'disposition.authorizedByRef':  'subject',
  'disposition.authorizedByRole': 'role',
});
```

### Qué sellar y qué no

**La regla:** sella los campos de *"esto lo hice yo"*. **Nunca** los de *"esto lo
hace alguien más"*.

| Sella | No selles |
| --- | --- |
| quién aprueba, quién autoriza, quién verifica | a quién se le **asigna** una acción correctiva |
| quién ejecutó la contención | qué laboratorio externo calibró el equipo |

Un ejemplo concreto de por qué la segunda columna importa: bajo ISO **7.1.5.2** la
calibración la realiza un laboratorio acreditado externo y la *registra* un técnico
días después. Sellar `calibration.performedByRef` con quien capturó el dato
destruiría exactamente la trazabilidad que la cláusula existe para proteger. Que un
campo *no* se selle puede ser una decisión deliberada — escríbela en el código.

**Los callers de servicio pasan intactos.** La saga que levanta una no conformidad
no tiene humano detrás; su payload registra el proceso que la originó.

## 5. Probar sin IdP

Sin `OIDC_ISSUER` tu servicio corre **abierto**, igual que antes de esta plantilla.
Ese es el default de desarrollo y mantiene tu repo usable sin levantar nada.

Para probar el gating de roles sin un IdP real, firma tú una cookie válida:

```bash
node -e "
import('./src/auth/signed-value.js').then(({signValue}) => {
  console.log(signValue({
    sub:'u-1', name:'Ana Torres', roles:['QualityEngineer'],
    exp: Math.floor(Date.now()/1000)+3600
  }, process.env.SESSION_SECRET));
});"
```

```bash
curl -H "Cookie: nc_session=<lo-que-imprimió>" localhost:8103/api/ncs
```

Cambia el arreglo `roles` y verás `403` donde toca. Es la forma más rápida de
comprobar que tu matriz de autoridad hace lo que crees.

## 6. Si no estás en Node

La plantilla es JavaScript, pero **el contrato no lo es**. Usa la librería OIDC
certificada de tu stack —`authlib` en Python, `openid-connect` en Go,
`Microsoft.Identity` en .NET— y cumple esto:

1. **Authorization code + PKCE.** Nada de implicit flow: está deprecado.
2. **Valida el ID token completo:** firma contra `jwks_uri`, `iss`, `aud`, `exp`,
   `nonce`, y el `state` del handshake. Saltarse cualquiera es exactamente cómo se
   rompe una relying party. **No desactives ninguna de esas verificaciones** para
   "que funcione ya".
3. **Descubre los endpoints** desde `<issuer>/.well-known/openid-configuration`.
   Nunca los escribas a mano: el IdP rota llaves y nadie debería redesplegar.
4. **Intercambia el code servidor a servidor** con el client secret. Ningún token
   llega al navegador.
5. **Cookie de sesión propia:** `HttpOnly; Secure; SameSite=Lax; Path=/`, y
   **host-only** — nunca acotada a `.<dominio>`. Esa es la decisión de radio de
   explosión: comprometer una tool no se puede reproducir contra sus hermanas.
6. **Guarda el estado del handshake fuera de la memoria del proceso** (cookie
   firmada y corta, o un store compartido). Si vive en memoria, escalar a dos
   instancias rompe el login de forma intermitente.
7. **Mapea roles → tu vocabulario y descarta los desconocidos.** Un rol que no
   reconoces jamás debe convertirse en una concesión por accidente.
8. **Sella la identidad del actor en la frontera** (§4). Esto aplica en todos los
   lenguajes y es lo más importante de la lista.
9. **API responde `401` JSON; navegación responde `302`.** Nunca al revés.
10. `/health` y `/ready` abiertos.

## 7. Checklist antes de decir "listo"

- [ ] `/health` responde `200` **sin** credenciales.
- [ ] Un deep link anónimo (`/ncs/NC-7`) redirige al IdP y, tras firmar, **vuelve a
      `/ncs/NC-7`** — no a la portada.
- [ ] `GET /api/...` sin cookie devuelve **`401` JSON**, no un `302`.
- [ ] Con `OIDC_ISSUER` puesto y `SESSION_SECRET` borrado, el proceso **no arranca**.
- [ ] Un usuario sin rol mapeado entra pero **no puede autorizar nada**.
- [ ] Mandar `authorizedByRole: "QualityDirector"` en el body **no** concede nada.
- [ ] Tu SPA y tu API salen por el **mismo origen** (no hay cabeceras CORS).
- [ ] `ISOTOOLS_API_KEY` y `TOOL_API_KEY` **no aparecen** en el bundle del navegador.
- [ ] Registraste tu entrada en `src/data/platform/deployments.json` del core.

## 8. Fallas comunes, en orden de frecuencia

**«Entro pero no puedo hacer nada / no tengo roles.»** El IdP no está liberando el
claim `roles`. Es el error de configuración más común y se ve **idéntico** a un bug
de permisos, así que se pierden horas buscando en el lugar equivocado. Revisa
`/auth/me`: si `roles` viene vacío, el problema está en la consola del IdP, no en tu
código.

**`redirect_uri_mismatch`.** Tu `OIDC_REDIRECT_URI` no coincide **carácter por
carácter** con lo permitido en el IdP. Revisa `http` vs `https`, el slash final y el
puerto.

**El login funciona y al recargar se pierde la sesión.** `Secure` puesto sobre HTTP
plano. En local usa `SESSION_INSECURE_COOKIES=true`.

**El login falla de forma intermitente en producción.** Estado del handshake en
memoria con más de una instancia. La plantilla ya lo resuelve con la cookie firmada;
si portaste el código, no lo cambies por un `Map` global.

**«Bloqueado esperando al equipo de plataforma para correr en local.»** Pide desde
el primer día que autoricen también `http://localhost:<puerto>/auth/callback`.
