# Plantillas de integración

Lo que **cada equipo copia a su propio repo** para que su tool entre a la
plataforma: autenticación única y despliegue automático.

Esto no se clona ni se hace fork. Se copian archivos.

```
plantillas/integracion/
├── sso/           código OIDC listo para copiar + guía por stack
└── despliegue/    GitHub Actions -> Railway (1 tool y varias tools)
```

---

## Antes de tocar código

Lee **[`docs/PLATAFORMA-SSO.md`](../../docs/PLATAFORMA-SSO.md)**. Es el contrato
entre los cinco equipos: topología, vocabulario de roles, quién entrega qué a quién.
Estas plantillas son el *cómo*; ese documento es el *qué* y el *por qué*, y sin él
las decisiones de aquí parecen arbitrarias.

## Los tres valores que necesitas de plataforma

```
OIDC_ISSUER          https://auth.<dominio>
OIDC_CLIENT_ID       <de tu tool, no es secreto>
OIDC_CLIENT_SECRET   <de tu tool, secreto>
```

Todo lo demás se descubre solo desde
`<issuer>/.well-known/openid-configuration`. Ningún equipo escribe una lista de
endpoints a mano.

Y uno que viaja al revés: **tus URIs de callback**, para que plataforma las autorice
en el IdP. Pide la de producción **y** la de `localhost` desde el primer día, o tu
primera corrida local se queda esperando un cambio en una consola ajena.

Aparte, para el plano máquina: tu **API key del core** (`x-api-key`) con scopes
`events:read,events:write`, y tu **token de proyecto Railway**.

## El orden que funciona

1. **[`sso/`](./sso/)** — copia el módulo, edita `role-mapping.js` con los roles de
   tu dominio, cablea las cinco piezas. Sin `OIDC_ISSUER` tu servicio sigue corriendo
   abierto, así que puedes avanzar antes de que exista el IdP.
2. **[`despliegue/`](./despliegue/)** — copia el workflow, guarda tu token como
   secreto, apunta tu subdominio.
3. **Regístrate en el core** — una entrada en
   [`src/data/platform/deployments.json`](../../src/data/platform/deployments.json)
   con tu `subdomain`, `owner`, `isoClause` y `requiredRoles`. Eso es lo que hace
   aparecer tu tool en la barra lateral del dashboard, sin tocar ni una línea del
   dashboard.

## Las tres cosas que se rompen siempre

**El IdP no libera el claim `roles`.** El usuario entra pero no puede hacer nada, y
se ve **idéntico** a un bug de permisos, así que se buscan horas en el código
equivocado. Revisa `/auth/me`: si `roles` viene vacío, el problema está en la consola
del IdP.

**El rol autorizante llega en el payload.** Cualquiera manda
`authorizedByRole: "QualityDirector"` y la matriz de autoridad lo acepta: la política
se cumple correctamente contra un rol que el cliente se inventó. Se sella desde el
token en la frontera — [`sso/README.md` §4](./sso/README.md), y no es opcional.

**La API key termina en el navegador.** El plano máquina (`x-api-key`) es
**servidor a servidor**. El navegador solo lleva la cookie de sesión. Si alguien
propone "simplificar" llamando al core desde el SPA, la propuesta es filtrar la clave.

## Si tu tool no es de Node

El código es JavaScript, pero el contrato no. La especificación de lo que hay que
implementar —diez puntos, independientes del lenguaje— está en
[`sso/README.md` §6](./sso/README.md). Usa la librería OIDC certificada de tu stack;
nadie implementa OIDC a mano.

El workflow de despliegue sirve tal cual para cualquier lenguaje: Railway construye
desde tu Dockerfile y no le importa qué hay dentro.
