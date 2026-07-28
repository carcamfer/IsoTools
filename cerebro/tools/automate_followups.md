---
tipo: tool
id: automate_followups
nombre: "Automatizar Seguimientos"
categoria: erp
agente: erp-gestion-empresarial
estado: externa
consume: [SALES_PREDICTED, 8D_REPORT_ISSUED, PROJECT_AT_RISK]
produce: []
programador:
actualizado: 2026-07-27
tags: [tool, erp, externa]
---
# Automatizar Seguimientos
> `automate_followups` · Cloud · categoría **erp** · estado **externa** (sin handler nativo)
> Pertenece al agente [[../agentes/erp-gestion-empresarial|Agente ERP & Gestión Empresarial]]
## Qué hace
Genera y envía seguimientos automáticos a leads, proveedores y órdenes pendientes.
## Contrato de eventos
- **Consume:** `SALES_PREDICTED`, `8D_REPORT_ISSUED`, `PROJECT_AT_RISK`
- **Produce:** — (es hoja o aún sin regla)
## Notas de implementación (tools-dev-spec)
**Por qué estos inputs:** targetType define el tipo de destinatario ('lead', 'client', 'opportunity') para usar la plantilla y el tono correcto de comunicación. targetIds es la lista de IDs sobre los que el agente ejecutará la secuencia de seguimiento automático según las reglas del CRM.

**Cálculos:** Para cada targetId, verificar el historial de interacciones y determinar si cumple los criterios de seguimiento (ej: sin respuesta en X días). Seleccionar la plantilla de mensaje adecuada según el stage del target. Personalizar el mensaje con datos del CRM. Enviar vía el canal configurado (email/WhatsApp/LinkedIn) usando el gateway de mensajería.

**Por qué estos outputs:** sent confirma cuántos seguimientos se ejecutaron exitosamente para el reporte de actividad del equipo de ventas. failed permite identificar problemas de configuración (correos inválidos, límites de API). scheduledIds lista los seguimientos programados para futuras fechas para que el agente los monitoree.

**Sugerencia de UI:** Panel de actividad de seguimientos con contador de enviados/fallidos/programados. Lista de seguimientos con estado por destinatario. Timeline de actividades programadas por fecha. Alert de seguimientos fallidos con causa del error.
## Comunicaciones
**Esta tool dispara a:**
- _ninguna declarada_
**Esta tool es disparada por:**
- [[predict_sales]] — `SALES_PREDICTED` → [[../comunicaciones/predict_sales__automate_followups]]
- [[generate_8d_report]] — `8D_REPORT_ISSUED` → [[../comunicaciones/generate_8d_report__automate_followups]]
- [[track_project_progress]] — `PROJECT_AT_RISK` → [[../comunicaciones/track_project_progress__automate_followups]]
## Bitácora de cambios
<!-- Anota aquí cada cambio de contrato/lógica que pueda afectar a otras tools.
     Formato sugerido:  - [YYYY-MM-DD] (tu-nombre) qué cambió y a quién afecta -->
- [2026-06-28] (auto) nota inicial generada desde la configuración.
- [2026-07-27] (Carlos) Sale del bus nativo: se eliminó `src/tools/automate_followups.js` y las reglas `rule-pkg-003`, `rule-pkg-012`, `rule-erp-009`. La tool la implementa ahora un **servicio EXTERNO** que consume por `GET /api/v1/events` y publica `FOLLOWUP_SCHEDULED` por `POST /api/v1/events`. Sigue en `tools.json`, así que el externo puede usar `GET /api/v1/events/subscriptions/automate_followups?since_seq=N`. **No volver a registrar un handler nativo:** se agendaría el mismo seguimiento dos veces.
