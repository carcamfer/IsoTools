---
tipo: tool
id: manage_product_specs
nombre: "Gestionar Especificaciones de Producto"
categoria: quality
agente: calidad-spc
estado: implementada
consume: [CAPABILITY_BELOW_TARGET]
produce: [PRODUCT_SPEC_UPDATED]
programador:
actualizado: 2026-06-28
tags: [tool, quality, implementada]
---
# Gestionar Especificaciones de Producto
> `manage_product_specs` · Cloud · categoría **quality** · estado **implementada**
> Pertenece al agente [[../agentes/calidad-spc|Agente de Calidad & SPC]]
## Qué hace
Administra el árbol de características críticas (CTQ), tolerancias, límites de especificación y documentos de control.
## Contrato de eventos
- **Consume:** `CAPABILITY_BELOW_TARGET`
- **Produce:** `PRODUCT_SPEC_UPDATED`
## Notas de implementación (tools-dev-spec)
**Por qué estos inputs:** Se necesita `partId` para identificar el número de parte en el sistema PLM/ERP y acceder a su árbol de características. `action` determina la operación: 'get' recupera las especificaciones actuales, 'create' registra un nuevo número de parte con sus CTQs, 'update' modifica los límites de especificación (requiere control de cambios documentado). `characteristics` es el array de objetos que define cada CTQ: solo se requiere en 'create' y 'update', donde cada objeto incluye nombre, usl, lsl, nominal e isCritical.

**Cálculos:** Para 'get': recuperar todas las características del partId desde la tabla de especificaciones, filtrando solo las vigentes (no históricas). Para 'create': validar que LSL < nominal < USL para cada característica antes de insertar. Calcular la tolerancia total = USL - LSL. Para 'update': comparar los nuevos límites con los anteriores y generar un registro de cambio (ECN) con la diferencia. Marcar las características con `isCritical: true` como características de control en el plan de control del producto.

**Por qué estos outputs:** `characteristics` es el catálogo de referencia que el agente usa al recibir mediciones de calidad para evaluar el cumplimiento. `usl` y `lsl` por característica son los inputs directos para el cálculo de Cpk. `isCritical` permite al agente aplicar mayor frecuencia de muestreo y límites de alarma más estrictos a las características que son seguridad o función del producto.

**Sugerencia de UI:** Tabla de características del producto con columnas: Nombre, Nominal, LSL, USL, Tolerancia (calculada), Crítica (toggle), Cpk vigente. Indicador visual de tolerancia: barra horizontal con marcadores de LSL, nominal y USL. Formulario modal para agregar/editar característica. Botón de exportar plan de control a Excel.
## Comunicaciones
**Esta tool dispara a:**
- [[../comunicaciones/manage_product_specs__collect_quality_measurements]] — `PRODUCT_SPEC_UPDATED` → [[collect_quality_measurements]]
**Esta tool es disparada por:**
- [[calculate_cpk_ppk]] — `CAPABILITY_BELOW_TARGET` → [[../comunicaciones/calculate_cpk_ppk__manage_product_specs]]
## Bitácora de cambios
<!-- Anota aquí cada cambio de contrato/lógica que pueda afectar a otras tools.
     Formato sugerido:  - [YYYY-MM-DD] (tu-nombre) qué cambió y a quién afecta -->
- [2026-06-28] (auto) nota inicial generada desde la configuración.
- [2026-09-30] (Carlos+Claude) consume tambien `ERP_ITEM_CREATED`: un articulo nuevo del ERP siembra la parte con `characteristics: []`. Las tolerancias las sigue poniendo calidad — el ERP no las tiene.
