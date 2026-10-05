---
title: Bitácora del cerebro
updated: 2026-07-27
---

# Bitácora del cerebro de IsoTools

Registro cronológico de cambios significativos en el vault. Una línea por evento.

## [2026-06-28] init
- Vault creado al separar las tools de la plataforma web en el repo **IsoTools**.
- Generadas las notas iniciales: 125 tools, 90 comunicaciones, 13 agentes (`npm run cerebro:generar`).
- 16 tools marcadas como `implementada` (paquete de calidad ISO 9001).

## [2026-07-21] detect_out_of_control_signals sale del bus nativo
- La tool pasa a un servicio EXTERNO. Se quitó el handler y la regla `rule-qual-002` (commit `a0c9e50`).
- Motivo: doble detección (placeholder nativo + runner externo) → NC/8D duplicados.
- Se conserva `rule-qual-003`: cuando el externo publica `OUT_OF_CONTROL_DETECTED`, el bus crea UNA sola NC.

## [2026-07-27] automate_followups sale del bus nativo
- La tool pasa al servicio EXTERNO de seguimientos. Se quitó `src/tools/automate_followups.js` y las reglas `rule-pkg-003`, `rule-pkg-012` y `rule-erp-009`.
- Motivo: al conectar el servicio externo se agendó dos veces el mismo seguimiento (placeholder nativo + externo).
- `FOLLOWUP_SCHEDULED` es terminal: ninguna regla reacciona a él, así que la duplicación no propagó cadena.
- Bitácoras actualizadas: [[comunicaciones/generate_8d_report__automate_followups]], [[comunicaciones/track_project_progress__automate_followups]], [[comunicaciones/predict_sales__automate_followups]].
- Documentado además el **arranque en frío del cursor** (no empezar en `since_seq=0`) en `README.md` § 5.3, `pasos/08` y `pasos/09`.

### Nota de evidencia: eventos `FOLLOWUP_SCHEDULED` seq 56–64 (producción)
- **Qué son:** 9 `FOLLOWUP_SCHEDULED` **espurios**, publicados por el servicio externo de seguimientos al arrancar su polling con el cursor en `since_seq=0`. Reprocesó el backlog de `8D_REPORT_ISSUED` / `PROJECT_AT_RISK` ya atendido en su momento por el placeholder nativo.
- **Por qué NO se borraron:** el log de eventos es append-only y es la evidencia ISO; no hay endpoint de borrado y purgarlos exigiría SQL directo contra producción. Como `FOLLOWUP_SCHEDULED` es terminal (nadie reacciona a él), no generaron NCs, 8Ds ni ninguna cadena: el impacto quedó contenido en el propio log.
- **Cómo identificarlos en una auditoría:** son los `FOLLOWUP_SCHEDULED` con `seq` entre 56 y 64. Su `timestamp` es del 2026-07-27, pero el `causation_id` apunta a eventos padre muy anteriores — esa discrepancia es la huella del reproceso.
- **Efecto residual:** `GET /api/v1/events/latest?type=FOLLOWUP_SCHEDULED` devuelve el seq 64 como "el último seguimiento" hasta que entre uno legítimo más nuevo.
- **Acción correctiva:** ver arriba (retiro del placeholder nativo + documentación del arranque en frío). No se requiere acción sobre los datos.

## [2026-07-27] inspect_product_quality sale del bus nativo
- Misma tool externa (`tool-vision-followups`) se hace cargo también de la inspección de visión. Se eliminó `src/tools/inspect_product_quality.js` y la regla `rule-vision-001` (`FRAME_CAPTURED` → inspección).
- **Se conservan** las reglas donde la tool es FUENTE: `rule-pkg-001` (`DEFECT_FOUND` → `manage_nonconformances`) y `rule-vision-004` (→ `analyze_visual_patterns`). Cuando el externo publica `DEFECT_FOUND`, el bus abre UNA sola NC.
- ⚠️ **Riesgo asumido y comunicado:** la plataforma ya no genera `DEFECT_FOUND` por su cuenta. Si el servicio externo deja de publicarlo, **se apagan las NCs de inspección**. No hay red de seguridad nativa.
- ⚠️ **Contrato para el externo:** el `data` de `DEFECT_FOUND` debe incluir `defectFound: true`; esa condición la evalúa el bus sobre el payload publicado (`rule-pkg-001`).
- Con esto son 3 las tools con dueño externo: `detect_out_of_control_signals`, `automate_followups` e `inspect_product_quality`. Todas siguen en `tools.json` para poder usar `/events/subscriptions/:toolId`.

## [2026-09-30] El ERP entra al bus: 4 eventos de inventario y ventas
- Se conectó el ERP Microsip (inventario + ventas) al Communication Router con **4 eventos nuevos**, elegidos hacia atrás desde el `inputSchema` de las tools reales, no desde las tablas del ERP.
- Reglas nuevas: `rule-conn-001..004`. Bitácoras: [[comunicaciones/sync_erp_data_local__compare_planned_vs_actual]], [[comunicaciones/sync_erp_data_local__manage_nonconformances]], [[comunicaciones/sync_erp_data_local__manage_product_specs]], [[comunicaciones/sync_erp_data_local__automate_followups]].

| Evento | Origen en el ERP | Destino |
|---|---|---|
| `ERP_SALES_PERIOD_CLOSED` | cierre del periodo en `DOCTOS_VE` | `compare_planned_vs_actual` |
| `ERP_CUSTOMER_RETURN_REGISTERED` | devoluciones, una fila por partida | `manage_nonconformances` |
| `ERP_ITEM_CREATED` | altas en `ARTICULOS` | `manage_product_specs` |
| `ERP_SALES_ORDER_UNFULFILLABLE` | pedidos vigentes × existencia ≤ 0 | `automate_followups` |

- **Descartadas por contrato**, aunque parecían candidatas: `manage_device_registry` (los instrumentos están en activos fijos, no en inventario ni ventas) y `generate_8d_report` (solo toma un `ncId`; recibe datos del ERP por la cadena de la NC, no como suscriptor).
- **Tres enum decidieron el diseño**, no la opinión: `compare_planned_vs_actual.module` no tenía `sales` (se agregó); `automate_followups.targetType` no admite `sku`, así que el seguimiento se le da al **pedido** comprometido y no al artículo; `manage_nonconformances.severity` usa `minor|major|critical`, que **no** es la escala del IES.
- **Sin presupuesto.** Microsip no lleva presupuesto de ventas y se decidió que la meta es gobernanza, no operación: vive en `METAS` de `src/tools/compare_planned_vs_actual.js`, versionada en git. El handler dejó de inventar una desviación: sin meta publica `status: "sin_meta"` y `deviationPercent: null`.
- **Pendiente de verificar contra la base real:** las letras de `TIPO_DOCTO` (`F`/`D`/`P`) y la existencia de `DOCTOS_VE_DET`. Se sacaron a variables de entorno (`ERP_TIPO_FACTURA`, `ERP_TIPO_DEVOLUCION`, `ERP_TIPO_PEDIDO`, `ERP_ESTATUS_VIGENTE`) para que un cambio de letra no obligue a tocar código ni a redesplegar el gateway.
- ⚠️ `npm run validate` reporta 2 errores **previos** a este cambio: `deployments.json` marca `inspect_product_quality` y `automate_followups` como `native`, pero ambas salieron del bus nativo el 2026-07-27. Mientras no se corrija, `rule-conn-004` guarda el evento pero el router no ejecuta nada.

## [2026-09-30] inspect_product_quality y automate_followups quedan declaradas como federadas
- `deployments.json` las tenía como `native` desde que salieron del bus nativo el 2026-07-27. La entrada nunca se actualizó, así que `npm run validate` fallaba con dos errores de integridad y, como el job `desplegar` tiene `needs: verificar`, **el despliegue estaba bloqueado**.
- Ahora son `federated` con `subdomain: ipq` y `subdomain: af` (→ `ipq.orcalabs.mx`, `af.orcalabs.mx`), `localPort` 8104/8105 y `repo: tool-vision-followups`. Los roles se heredan de su categoría (`vision` y `erp`), sin override.
- Efecto en el bus: con la URL resoluble, `isHandledExternally()` devuelve `true` y el router **delega** en el servicio del equipo en lugar de ignorar la regla en silencio. Eso es lo que habilita `rule-conn-004` (`ERP_SALES_ORDER_UNFULFILLABLE` → `automate_followups`).
- Ojo en local: sin `PLATFORM_DOMAIN` la URL no se resuelve, así que `isHandledExternally()` da `false` y —al no haber handler nativo— el bus no ejecuta nada. En local el evento entra al log y a la suscripción; la delegación solo se ve con el dominio configurado.
- **Pendiente:** el nombre del equipo dueño. Solo consta el repo. Queda igual `detect_out_of_control_signals`, que sigue sin `subdomain` — eso es un aviso, no un error, y el dashboard la pinta registrada sin desplegar, que es la verdad.

## [2026-10-04] Todas las tools del registro pasan a `federated`
- `native` ya no se usa en `deployments.json`: las 16 tools registradas son `federated`, porque cada equipo va a ser dueño de su servicio. Los handlers de `src/tools/` **no se borraron**: dejan de ser "la tool" y pasan a ser dos cosas — el **fallback** que mantiene viva la cadena mientras el servicio real no existe, y la **referencia del contrato** para quien lo implemente.
- **No se inventaron subdominios.** Una tool `federated` sin `subdomain` no tiene URL resoluble, así que `isHandledExternally()` da `false` y el bus ejecuta su handler. Declarar el `subdomain` es lo único que hace que el router delegue — se activa solo, sin bandera que nadie tenga que acordarse de cambiar. Es el fallback que ya documentaba `CLAUDE.md`.
- Delegan hoy (tienen servicio): `manage_product_specs`, `manage_device_registry`, `manage_nonconformances`, `inspect_product_quality`, `automate_followups`. Las otras 11 corren el fallback.
- **Cambio visible en el dashboard:** las 11 pasan de verde "en proceso" a gris "sin desplegar", y el conteo dice 16 federadas / 0 nativas. Es la verdad: no hay servicio desplegado. La sonda de salud no les pega porque no tienen URL.
- `status` quedó en `pending` para las que no tienen servicio y `live` para las cinco que sí. Antes `detect_out_of_control_signals` decía `live` sin tener subdominio, lo cual era falso.
- ⚠️ **Único hueco real:** `detect_out_of_control_signals` no tiene subdominio **ni** handler de respaldo (se retiró el 2026-07-21). Su regla `rule-qual-002`/`CHART_POINTS_UPDATED` no ejecuta nada y el bus la ignora en silencio. O su equipo declara el `subdomain`, o la cadena de SPC se queda cortada ahí.
- `npm run validate`: OK con 11 avisos — uno por cada tool que aún no declara subdominio. Son avisos a propósito: el archivo describe un estado de transición y lo dice.

## [2026-10-04] `cpa` y `rdp`: dos subdominios más, y la cadena de SPC se destraba
- `compare_planned_vs_actual` → `cpa.orcalabs.mx` (`status: pending`) y `detect_out_of_control_signals` → `rdp.orcalabs.mx` (`status: live`). Con eso delegan 7 de 16.
- **`rdp` cierra el hueco real.** Estaba federada sin subdominio **y** sin handler de respaldo desde el 2026-07-21 (se retiró porque el placeholder del core disparaba `OUT_OF_CONTROL_DETECTED` por duplicado → NC y 8D dobles). Su regla no ejecutaba nada y el bus la ignoraba en silencio: la cadena de SPC se cortaba ahí. Declarar el subdominio es el arreglo correcto del duplicado — el dueño del comportamiento es el servicio, no el core.
- ⚠️ **`cpa` tiene un riesgo asumido.** La delegación se decide por **URL resoluble, no por que el servicio responda**. En producción el bus ya no ejecuta `src/tools/compare_planned_vs_actual.js`, así que si `cpa.orcalabs.mx` no publica `PRODUCTION_VARIANCE_DETECTED`, se queda muda toda la cascada de dirección: `generate_kpis`, `detect_business_anomalies` y `track_project_progress` dejan de recibir. El `ERP_SALES_PERIOD_CLOSED` sigue entrando al log y a su suscripción — no se pierde nada —, pero nadie reacciona.
  - Por eso quedó en `status: pending`: la ruta está lista, el servicio no.
  - **Vuelta atrás en una línea:** quitar el `subdomain` de esa entrada y el fallback se reactiva solo.
  - En local no aplica: sin `PLATFORM_DOMAIN` la URL no resuelve y el handler sigue corriendo.
- El handler de `compare_planned_vs_actual` pasa a ser referencia del contrato, incluida la constante `METAS`: el ERP aporta el real, **la meta la pone el servicio**.
- Falta el nombre del equipo dueño de las dos. Avisos de `validate`: de 11 a 9.

## [2026-10-04] `cpa` confirmado en línea: las 7 federadas con subdominio están `live`
- `GET https://cpa.orcalabs.mx/health` → `200 {"status":"ok","service":"isotools-tool"}` y `GET https://rdp.orcalabs.mx/health` → `200 {"status":"ok","tool":"detect_out_of_control_signals"}`. `compare_planned_vs_actual` pasa a `status: live`; el riesgo de cascada muda que se anotó antes **no aplica**: el servicio existe.
- Queda el modo de falla, que no es lo mismo: **el fallback no es un failover.** La delegación se decide por URL resoluble, no por que el servicio responda. Si `cpa` se cae, `ERP_SALES_PERIOD_CLOSED` sigue entrando al log y a su suscripción —no se pierde nada, lo lee al volver desde su cursor— pero mientras esté caída la cascada de dirección se queda muda.
- Dos cosas observadas al sondear, ninguna rompe nada hoy:
  - El `/health` de `cpa` se identifica como `"service":"isotools-tool"`, el valor genérico de la plantilla. El de `rdp` sí dice `"tool":"detect_out_of_control_signals"`. Conviene que cada servicio se nombre: cuando haya 16 subdominios, un `/health` genérico no dice a quién sondeaste.
  - `cpa` **no implementa `/ready`**: devuelve 200 con el HTML del SPA, o sea que el catch-all se lo come. Un 200 ahí no significa nada. Hoy es inofensivo porque `deploymentService.js:107` solo construye `healthUrl` y `readyPath` de `defaults` no se usa en ningún lado — pero es el mismo patrón que nos mordió con el gateway de la planta (404 con la página de Flask).
