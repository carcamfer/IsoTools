// src/connectors/registry.js
// ─────────────────────────────────────────────────────────────────────────────
// Carga los conectores declarados en src/data/connectors/*.json.
// Un conector = un sistema externo (un ERP, una pasarela de PLCs, un MES).
// Agregar uno nuevo NO requiere codigo: se agrega su JSON aqui.
// ─────────────────────────────────────────────────────────────────────────────
import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(__dirname, '../data/connectors');

function validateShape (c, file) {
  const problems = [];
  if (!c.id) problems.push('falta "id"');
  if (!c.module?.id || !c.module?.version) problems.push('falta "module.id"/"module.version"');
  if (!c.asset?.asset_id) problems.push('falta "asset.asset_id"');
  if (!Array.isArray(c.pulls) || !c.pulls.length) problems.push('falta "pulls[]"');
  for (const p of c.pulls || []) {
    if (!p.id) problems.push('un pull sin "id"');
    if (!p.path) problems.push(`pull ${p.id}: falta "path"`);
    if (!Array.isArray(p.emits) || !p.emits.length) problems.push(`pull ${p.id}: falta "emits[]"`);
    for (const e of p.emits || []) {
      if (!e.event?.type) problems.push(`pull ${p.id}: un emit sin "event.type"`);
      if (e.mode === 'rows' && !e.key) problems.push(`pull ${p.id}: emit "rows" sin "key" (haria falta para la idempotencia)`);
    }
  }
  if (problems.length) throw new Error(`${file}: ${problems.join('; ')}`);
}

let cache = null;

export function loadConnectors ({ reload = false } = {}) {
  if (cache && !reload) return cache;
  const out = [];
  let files = [];
  try {
    files = readdirSync(DIR).filter(f => f.endsWith('.json'));
  } catch {
    files = [];
  }
  for (const file of files) {
    try {
      const conf = JSON.parse(readFileSync(path.join(DIR, file), 'utf-8'));
      validateShape(conf, file);
      out.push(conf);
    } catch (err) {
      console.error('[connectors] configuracion invalida, se omite:', err.message);
    }
  }
  cache = out;
  return out;
}

export function getConnector (id) {
  return loadConnectors().find(c => c.id === id) || null;
}

export default { loadConnectors, getConnector };
