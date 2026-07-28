---
tipo: tool
id: inspect_product_quality
nombre: "Inspeccionar Calidad de Producto"
categoria: vision
agente: vision-artificial-industrial
estado: externa
consume: [FRAME_CAPTURED]
produce: [DEFECT_FOUND]
programador:
actualizado: 2026-07-27
tags: [tool, vision, externa]
---
# Inspeccionar Calidad de Producto
> `inspect_product_quality` · Edge · categoría **vision** · estado **externa** (sin handler nativo)
> Pertenece al agente [[../agentes/vision-artificial-industrial|Agente de Visión Artificial Industrial]]
## Qué hace
Detecta defectos superficiales en piezas en la línea de producción usando CNN embebida.
## Contrato de eventos
- **Consume:** `FRAME_CAPTURED`
- **Produce:** `DEFECT_FOUND`
## Notas de implementación (tools-dev-spec)
**Por qué estos inputs:** cameraId identifica la cámara industrial instalada en el punto de inspección de la línea. productType permite al modelo de visión cargar los criterios de defecto correctos para ese producto. confidenceThreshold define el umbral mínimo de confianza para declarar un defecto — umbral alto = menos falsos positivos pero más defectos pasan.

**Cálculos:** Capturar el frame actual de la cámara. Pre-procesar la imagen (normalización, recorte de ROI). Ejecutar inferencia con el modelo CNN (ResNet, EfficientDet o YOLO) entrenado para productType. Si la probabilidad del defecto más probable supera confidenceThreshold, marcar como defectFound=true. Extraer boundingBox con las coordenadas del defecto para localización visual.

**Por qué estos outputs:** defectFound es el flag que dispara la eyección automática de la pieza defectuosa en la línea. defectType permite clasificar el defecto para ajustar el proceso. confidence permite al operador saber cuándo revisar manualmente. boundingBox permite marcar visualmente el defecto en la pantalla del inspector.

**Sugerencia de UI:** Vista de cámara en tiempo real con overlay del boundingBox del defecto resaltado en rojo. Contador de piezas inspeccionadas/buenas/defectuosas con tasas porcentuales. Galería de últimos defectos detectados con tipo y confianza. Indicador de estado del sistema de eyección.
## Comunicaciones
**Esta tool dispara a:**
- [[../comunicaciones/inspect_product_quality__analyze_visual_patterns]] — `DEFECT_FOUND` → [[analyze_visual_patterns]]
- [[../comunicaciones/inspect_product_quality__manage_nonconformances]] — `DEFECT_FOUND` → [[manage_nonconformances]]
**Esta tool es disparada por:**
- [[capture_video_stream]] — `FRAME_CAPTURED` → [[../comunicaciones/capture_video_stream__inspect_product_quality]]
## Bitácora de cambios
<!-- Anota aquí cada cambio de contrato/lógica que pueda afectar a otras tools.
     Formato sugerido:  - [YYYY-MM-DD] (tu-nombre) qué cambió y a quién afecta -->
- [2026-06-28] (auto) nota inicial generada desde la configuración.
- [2026-07-27] (Carlos) Sale del bus nativo: se eliminó `src/tools/inspect_product_quality.js` y la regla `rule-vision-001`. La implementa ahora un **servicio EXTERNO** que consume `FRAME_CAPTURED` y publica `DEFECT_FOUND` por la API. Sigue en `tools.json`, así que el externo puede usar `GET /api/v1/events/subscriptions/inspect_product_quality?since_seq=N`. **No volver a registrar un handler nativo:** se inspeccionaría el mismo frame dos veces.
