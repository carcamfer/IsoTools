---
tipo: tool
id: execute_condition_monitoring
nombre: "Ejecutar Monitoreo de Condición"
categoria: maintenance
agente: mantenimiento-cmms
estado: catalogo
consume: []
produce: [CONDITION_DEGRADED]
programador:
actualizado: 2026-06-28
tags: [tool, maintenance, catalogo]
---
# Ejecutar Monitoreo de Condición
> `execute_condition_monitoring` · Edge · categoría **maintenance** · estado **catalogo**
> Pertenece al agente [[../agentes/mantenimiento-cmms|Agente de Mantenimiento & CMMS]]
## Qué hace
Monitorea vibración, temperatura, corriente y presión del activo en tiempo real para detectar degradación temprana.
## Contrato de eventos
- **Consume:** — (es disparador raíz o aún sin regla)
- **Produce:** `CONDITION_DEGRADED`
## Notas de implementación (tools-dev-spec)
**Por qué estos inputs:** Se necesita `assetId` para saber qué sensores físicos están asociados a ese equipo en el mapa de instrumentación. El array `sensors` permite seleccionar solo los tipos de señal relevantes para el análisis actual (ej: solo vibración y temperatura para un motor), evitando procesar señales innecesarias y reduciendo latencia. `samplingRateHz` (default 100 Hz) define la frecuencia de muestreo: para análisis de vibración se necesitan al menos 2× la frecuencia máxima de interés (teorema de Nyquist); para temperatura puede ser suficiente 1 Hz.

**Cálculos:** Para vibración: calcular RMS y valor de pico de la señal en ventanas de tiempo. Comparar contra límites ISO 10816 según tipo de máquina y potencia. Para temperatura: comparar valor actual contra límite nominal del fabricante y contra variación histórica (z-score). Para corriente: detectar desbalance entre fases, armónicos y variaciones que indiquen desgaste del bobinado. Para presión: detectar fluctuaciones que indiquen cavitación o desgaste de sellos. `conditionIndex` (0-100): promedio ponderado de la distancia normalizada de cada variable a su límite de alarma. `recommendedAction`: matriz de decisión basada en `conditionIndex` y severidad de las alertas activas.

**Por qué estos outputs:** `conditionIndex` es el KPI agregado que el agente supervisa en cada ciclo; una caída sostenida activa la revisión. `alerts` permite al agente identificar exactamente qué sensor está fuera de rango y con qué severidad, para escalar al técnico correcto. `recommendedAction` es la decisión pre-calculada que el agente puede ejecutar directamente sin análisis adicional.

**Sugerencia de UI:** Panel de monitoreo en tiempo real con gauge para cada tipo de sensor activo. Línea de tiempo de tendencias (sparkline) para los últimos 30 minutos por variable. Indicador de `conditionIndex` central tipo notícula. Lista de alertas activas con sensor, valor actual vs threshold y severidad codificada por color.
## Comunicaciones
**Esta tool dispara a:**
- [[../comunicaciones/execute_condition_monitoring__manage_work_orders]] — `CONDITION_DEGRADED` → [[manage_work_orders]]
- `analyze_failure_modes` — `CONDITION_DEGRADED` (consumo por poll directo, sin regla de bus; ver [[analyze_failure_modes]])
**Esta tool es disparada por:**
- _ninguna declarada_
## Bitácora de cambios
<!-- Anota aquí cada cambio de contrato/lógica que pueda afectar a otras tools.
     Formato sugerido:  - [YYYY-MM-DD] (tu-nombre) qué cambió y a quién afecta -->
- [2026-06-28] (auto) nota inicial generada desde la configuración.
- [2026-10-14] (Rumbar) se documenta que `analyze_failure_modes` ya consume `CONDITION_DEGRADED` por poll (su `consumes` en tools.json estaba vacío por error). Si este tool se implementa, cualquier cambio a la forma del `data` de `CONDITION_DEGRADED` debe avisarse al equipo de `analyze_failure_modes`, aunque no exista una regla formal entre ambas.
