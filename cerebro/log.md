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
