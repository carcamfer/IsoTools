---
tipo: tool
id: manage_nonconformances
nombre: "Gestionar No Conformidades"
categoria: quality
agente: calidad-spc
estado: implementada
consume: [OUT_OF_CONTROL_DETECTED, DEFECT_FOUND, FMEA_CRITICAL_FOUND]
produce: [NC_CREATED, NC_REQUIRES_8D]
programador:
actualizado: 2026-06-28
tags: [tool, quality, implementada]
---
# Gestionar No Conformidades
> `manage_nonconformances` · Cloud · categoría **quality** · estado **implementada**
> Pertenece al agente [[../agentes/calidad-spc|Agente de Calidad & SPC]]
## Qué hace
Registra, clasifica, asigna y da seguimiento a no conformidades internas y de cliente con flujo de aprobación.
## Contrato de eventos
- **Consume:** `OUT_OF_CONTROL_DETECTED`, `DEFECT_FOUND`, `FMEA_CRITICAL_FOUND`
- **Produce:** `NC_CREATED`, `NC_REQUIRES_8D`
## Notas de implementación (tools-dev-spec)
**Por qué estos inputs:** Se necesita `action` para determinar si se crea un registro nuevo, se actualiza el estado/datos de uno existente, se cierra o se consulta la lista. `ncType` clasifica el origen: 'internal' es una falla detectada antes de despachar, 'customer' es una reclamación post-entrega, 'supplier' es material no conforme recibido, 'audit' surge de una auditoría del SGC. `severity` (minor/major/critical) determina el tiempo máximo de respuesta y si se requiere CAPA inmediata. `affectedPartId` vincula la NC al componente específico para análisis de recurrencia y cálculo de scrap.

**Cálculos:** Para 'create': generar `ncId` con nomenclatura estándar (NC-YYYY-MM-SECUENCIAL). Asignar responsable según la matriz de escalado: minor → calidad local, major → gerente de calidad, critical → director. Calcular `dueDate` según severity: critical = +1 día hábil, major = +5 días hábiles, minor = +15 días hábiles. Estimar `estimatedCost` = (cantidad_afectada × costo_unitario) + (horas_análisis × tarifa_hora_calidad). Para 'close': verificar que existe evidencia de acción correctiva documentada. Para 'list': filtrar por status y tipo con paginación.

**Por qué estos outputs:** `ncId` es la referencia que alimenta el reporte 8D y el CAPA. `status` permite al agente identificar NCs estancadas que requieren escalación. `assignedTo` habilita notificaciones al responsable. `dueDate` permite calcular si la NC está en riesgo de vencimiento. `estimatedCost` alimenta el costo de calidad (CoQ) del período.

**Sugerencia de UI:** Formulario de creación de NC con campos condicionales según `ncType`. Lista de NCs con filtros por estado, tipo y severity. Indicadores de semáforo en columna de vencimiento (rojo=vencido, amarillo=vence esta semana, verde=en plazo). Botón de acción por fila para cambiar estado o generar 8D. Counter de NCs abiertas por tipo en el dashboard.
## Comunicaciones
**Esta tool dispara a:**
- [[../comunicaciones/manage_nonconformances__generate_8d_report]] — `NC_REQUIRES_8D` → [[generate_8d_report]]
**Esta tool es disparada por:**
- [[detect_out_of_control_signals]] — `OUT_OF_CONTROL_DETECTED` → [[../comunicaciones/detect_out_of_control_signals__manage_nonconformances]]
- [[inspect_product_quality]] — `DEFECT_FOUND` → [[../comunicaciones/inspect_product_quality__manage_nonconformances]]
- [[analyze_failure_modes]] — `FMEA_CRITICAL_FOUND` → [[../comunicaciones/analyze_failure_modes__manage_nonconformances]]
## Bitácora de cambios
<!-- Anota aquí cada cambio de contrato/lógica que pueda afectar a otras tools.
     Formato sugerido:  - [YYYY-MM-DD] (tu-nombre) qué cambió y a quién afecta -->
- [2026-06-28] (auto) nota inicial generada desde la configuración.
- [2026-09-30] (Carlos+Claude) consume tambien `ERP_CUSTOMER_RETURN_REGISTERED`: una devolucion de cliente del ERP abre una NC de tipo `customer`, una por partida devuelta. Solo se agrego el tipo a `consumes`; no cambio su contrato de salida.
- [2026-10-01] (Carlos+Claude) produce tambien `NC_CREATED`, una por CADA no conformidad abierta sin importar su severidad. Es la evidencia de ISO 9001 8.7 que ya buscaba el reporte de auditoria; `NC_REQUIRES_8D` se queda solo para `major`/`critical`. Ninguna tool lo consume todavia, asi que no hay regla nueva. **El servicio federado (repo `ai-iso`) debe empezar a publicarlo**; el handler nativo de respaldo ya lo emite.
