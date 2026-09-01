CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS industrial_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    platform_version TEXT NOT NULL,
    module_id TEXT NOT NULL,
    module_version TEXT,
    asset_id TEXT NOT NULL,
    asset_type TEXT,
    plant_id TEXT,
    area_id TEXT,
    line_id TEXT,
    location TEXT,
    event_type TEXT NOT NULL,
    category TEXT,
    severity TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    correlation_id TEXT,
    causation_id TEXT,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Cursor monotono para paginacion por keyset (orden de insercion). Es la base
    -- del consumo incremental barato: WHERE seq > $cursor, sin escanear ventanas.
    seq BIGINT GENERATED ALWAYS AS IDENTITY
);

-- Migración idempotente para bases ya existentes (no rompe instalaciones previas).
-- correlation_id: agrupa todos los eventos de una misma cadena causal.
-- causation_id:  apunta al event_id del evento "padre" que disparó este.
-- seq:            cursor monotono para consumo incremental por keyset.
ALTER TABLE industrial_events ADD COLUMN IF NOT EXISTS correlation_id TEXT;
ALTER TABLE industrial_events ADD COLUMN IF NOT EXISTS causation_id TEXT;
ALTER TABLE industrial_events ADD COLUMN IF NOT EXISTS seq BIGINT GENERATED ALWAYS AS IDENTITY;

-- Ingesta idempotente: un mismo event_id reintentado no crea filas duplicadas
-- (el productor usa el id de su outbox como event_id). ON CONFLICT lo apoya.
CREATE UNIQUE INDEX IF NOT EXISTS uq_industrial_events_event_id ON industrial_events (event_id);
CREATE INDEX IF NOT EXISTS idx_industrial_events_timestamp ON industrial_events (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_industrial_events_module_id ON industrial_events (module_id);
CREATE INDEX IF NOT EXISTS idx_industrial_events_plant_id ON industrial_events (plant_id);
CREATE INDEX IF NOT EXISTS idx_industrial_events_asset_id ON industrial_events (asset_id);
CREATE INDEX IF NOT EXISTS idx_industrial_events_correlation_id ON industrial_events (correlation_id);
CREATE INDEX IF NOT EXISTS idx_industrial_events_seq ON industrial_events (seq);
-- Sostiene /events/latest y el filtro por tipo con cursor (latest-per-type).
CREATE INDEX IF NOT EXISTS idx_industrial_events_type_seq ON industrial_events (event_type, seq DESC);
CREATE INDEX IF NOT EXISTS idx_industrial_events_module_seq ON industrial_events (module_id, seq DESC);

-- Estado del plano de conectores (ERP/PLC -> Industrial Events): un renglon por
-- recurso sondeado, con su cursor de lectura incremental y el resultado del
-- ultimo ciclo. Sin esto, un redeploy volveria a leer el ERP desde cero.
CREATE TABLE IF NOT EXISTS connector_state (
    connector_id TEXT NOT NULL,
    pull_id      TEXT NOT NULL,
    cursor       TEXT,
    last_run_at  TIMESTAMPTZ,
    last_status  TEXT,
    last_error   TEXT,
    stats        JSONB NOT NULL DEFAULT '{}'::jsonb,
    PRIMARY KEY (connector_id, pull_id)
);

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key_hash TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    scopes TEXT[] NOT NULL DEFAULT ARRAY['events:read','events:write'],
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys (active);

-- Basic read-only role for future dashboards/BI tools
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'industrial_reader') THEN
      CREATE ROLE industrial_reader LOGIN PASSWORD 'industrial_reader';
      EXECUTE format('GRANT CONNECT ON DATABASE %I TO industrial_reader', current_database());
      GRANT USAGE ON SCHEMA public TO industrial_reader;
      GRANT SELECT ON industrial_events TO industrial_reader;
   END IF;
END$$;
