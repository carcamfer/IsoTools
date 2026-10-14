README — Scripts de pruebas y visualización (IsoTools)

Propósito
---------
Documento local para seguir el ciclo de los scripts de prueba, comprobar compliance de outputs con los esquemas `tools.json` y recomendaciones para gráficas y dashboards.

Dónde están los datos y cómo obtenerlos
--------------------------------------
- Eventos simulados (stream): scripts/simulateStream.js — envía eventos POST a la API (API_KEY + API_BASE_URL).
- Seed de eventos a base de datos: scripts/seedEvents.js — inserta en la tabla `industrial_events` vía src/db/index.js (PG pool).
- Scripts de prueba (unit/smoke): scripts/test_calculate_control_charts.js, scripts/test_detect_business_anomalies.js, scripts/test_generate_kpis.js
- Contratos / esquemas: src/data/agents/tools.json, src/data/agents/event-standard.json, src/data/agents/tools-dev-spec.json

Cómo ejecutar (seguimiento rápido)
----------------------------------
1. Instalar dependencias: npm ci
2. Levantar API local (opcional): docker compose --profile api up -d
3. Seed DB: node scripts/seedEvents.js 100
4. Stream de eventos: set API_KEY=...; node scripts/simulateStream.js
5. Ejecutar pruebas unitarias: node scripts/test_calculate_control_charts.js && node scripts/test_detect_business_anomalies.js && node scripts/test_generate_kpis.js

API keys y permisos
-------------------
- Crear una API key (por defecto incluye scopes: events:read, events:write, artifacts:read):
  node scripts/createApiKey.js my-client --scopes=events:read,events:write,artifacts:read
- Uso ejemplo para listar artefactos (requiere artifacts:read):
  curl -H "x-api-key: <RAW_KEY>" http://localhost:3000/api/v1/artifacts/list
- Para crear una key con permisos limitados solo read de eventos:
  node scripts/createApiKey.js readonly-client --scopes=events:read

Recomendaciones de seguridad
- Guardar la raw key en un secret manager (AWS Secrets Manager / Azure Key Vault / Vault).
- No subir raw keys al repositorio. Rotar periódicamente.

Validación (esquemas y compliance)
----------------------------------
Se recomienda validar la salida de cada tool contra los esquemas declarados en src/data/agents/tools.json y event-standard.json usando AJV.
Ejemplo rápido (node):

// validate-output.js (ejemplo)
// const Ajv = require('ajv'); const schema = require('./src/data/agents/tools.json'); const output = require('./path/to/output.json');
// const ajv = new Ajv(); const valid = ajv.validate(schema.definitions.someToolOutput, output); console.log(valid, ajv.errors);

Recomendaciones prácticas
-------------------------
- Añadir un test de CI que: ejecute los scripts de prueba, luego valide outputs con AJV.
- Registrar versiones de contrato (tools.json) y conservar compatibilidad.
- Log estructurado (JSON) para facilitar ingest y dashboards.
- Guardar artefactos gráficos (SVG/PNG) en artifacts/ para auditoría.

Visualización y dashboards (opciones)
-------------------------------------
1) Industrial-grade (recomendado para planta): TimescaleDB/InfluxDB + Grafana
   - Flujo: herramientas → DB (serie temporal) → Grafana dashboards + alertas.
   - Pros: escalable, paneles predefinidos, alerting y autenticación empresarial.

2) Elastic Stack (Elasticsearch + Kibana)
   - Flujo: herramientas → Logstash/Beats → Elasticsearch → Kibana.
   - Pros: búsqueda libre-text y dashboards flexibles.

3) Ligero / integrado (rápido de prototipar): Node server + Express + socket.io + frontend (Chart.js / Recharts / Vega-Lite)
   - Generar SVG/PNG server-side con chartjs-node-canvas o vega; exponer HTTP/SSE/WebSocket para charts vivos.
   - Útil para demos internas y pruebas en local.

4) Notebooks / Reports: Jupyter/Observable + Plotly/Vega
   - Para análisis ad-hoc y prototipos de dashboards ejecutivos.

Librerías recomendadas
----------------------
- Server-side charts (static): chartjs-node-canvas, node-canvas + D3, vega/vega-lite
- Frontend: Chart.js, Recharts (React), Vega-Embed, Plotly
- Time-series storage: TimescaleDB (Postgres extension) o InfluxDB
- Dashboard: Grafana, Kibana, Superset (alternativa BI)

Patrón para charts en tiempo real
---------------------------------
- Emisión de eventos con correlationId.
- Ingestar en TSDB (Timescale/Influx) y construir consultas agregadas (1m,5m,1h).
- Grafana lee directamente TSDB; para paneles web personalizados usar SSE/WebSocket con payloads JSON + front-end Chart.js.
- Alternativa: producir SVGs periódicos y almacenarlos en /artifacts/charts/<chartId>-<ts>.svg

Checklist para integrar nuevas tools
------------------------------------
- [ ] Definir contract en src/data/agents/tools.json
- [ ] Implementar meta + handler en src/tools/<tool>.js
- [ ] Registrar en src/tools/index.js
- [ ] Crear script de prueba en scripts/
- [ ] Añadir validación AJV en tests
- [ ] Documentar en docs/ y en este README

Próximos pasos sugeridos (rápido)
--------------------------------
1. Añadir validación AJV y test CI.
2. Implementar exportador a TimescaleDB (small ETL) y preparar tablero Grafana base (OEE, Scrap, KPIs).
3. Crear endpoint simple /charts/:chartId que devuelva SVG generado por chartjs-node-canvas.

Contacto y notas
----------------
Mantener esta nota en scripts/README.md como origen para QA y handover. Actualizar cada vez que se cambie el contrato en src/data/agents/tools.json.

Operaciones: rotación, revocación y auditoría (guía rápida)
---------------------------------------------------------
1. Crear nueva key (genera raw key una vez):
   node scripts/createApiKey.js my-client --scopes=events:read,events:write,artifacts:read
   Guardar el valor mostrado en un secret manager.

2. Revocar / desactivar key (DB):
   -- Revocación rápida por SQL (psql):
      UPDATE api_keys SET active = false WHERE label = 'my-client';
   -- Alternativa: crear endpoint admin (recomendado en próxima iteración).

3. Rotación de keys (procedimiento):
   a) Crear nueva key para el cliente.
   b) Actualizar cliente con la nueva raw key.
   c) Verificar uso (last_used_at en api_keys).
   d) Desactivar la antigua.

4. Auditoría: extraer last_used_at y scopes:
   SELECT id,label,scopes,active,created_at,last_used_at FROM api_keys ORDER BY created_at DESC;
   Guardar resultado como CSV/JSON y archivar en systema de auditoría.

5. Integración CI (sugerido):
   - Job que instale deps, ejecute npm run test:validate y archive artifacts/ como build artifact.
   - En caso de fallo, notificar canal Slack/Teams y abrir issue automáticamente.

Descargar/obtener el código (pasos)
-----------------------------------
- Desde GitHub (clonado):
  git clone https://github.com/carcamfer/IsoTools.git
  cd IsoTools
  git fetch origin
  git checkout -b alexcprado10-agregar-3-tools-analitica origin/alexcprado10-agregar-3-tools-analitica

- Si prefieres ZIP: en la página https://github.com/carcamfer/IsoTools -> Code -> Download ZIP (atraerá la rama default: main).

Ejecutar localmente (rápido)
---------------------------
1. Instalar dependencias: npm install
2. Crear DB y migrar (local Postgres). Ejecutar db/init.sql o configure env DB_*.
3. Crear API key para pruebas: node scripts/createApiKey.js test-client
4. Ejecutar validador y generar artefactos: npm run test:validate
5. Listar artefactos via API (require artifacts:read):
   curl -H "x-api-key: <RAW_KEY>" http://localhost:3000/api/v1/artifacts/list

Notas
-----
- La rama de trabajo actual contiene los cambios de las 3 tools y scripts de validación.
- Si necesitas, puedo crear un small PR (incluye cambios y README edits) y subirlo al repo para revisión.

