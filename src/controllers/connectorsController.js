// src/controllers/connectorsController.js
// API de administracion del plano de conectores. No sirve datos del ERP: sirve
// el ESTADO de la ingesta (que conector corre, con que cursor, que publico).
import { runConnector, connectorsStatus } from '../connectors/runtime.js';
import { getConnector } from '../connectors/registry.js';
import { resetCursor } from '../db/connectorState.js';

export async function listConnectors (req, res, next) {
  try {
    res.json({ connectors: await connectorsStatus() });
  } catch (err) { next(err); }
}

export async function getConnectorDetail (req, res, next) {
  try {
    const all = await connectorsStatus();
    const found = all.find(c => c.id === req.params.connectorId);
    if (!found) return res.status(404).json({ error: 'Connector not found' });
    res.json(found);
  } catch (err) { next(err); }
}

// Fuerza un ciclo ahora. Con ?dry_run=true devuelve los eventos que SE
// publicarian sin tocar la base ni el cursor: es como se depura un mapeo nuevo.
export async function runConnectorNow (req, res, next) {
  try {
    const { connectorId } = req.params;
    if (!getConnector(connectorId)) return res.status(404).json({ error: 'Connector not found' });
    const dryRun = /^(1|true|yes)$/i.test(String(req.query.dry_run || ''));
    const result = await runConnector(connectorId, { dryRun });
    res.status(result.skipped ? 409 : 200).json(result);
  } catch (err) { next(err); }
}

// Reinicia el cursor: el proximo ciclo relee el recurso desde el principio. Es
// seguro — los event_id son deterministas, asi que lo ya publicado se detecta
// como duplicado y no se reprocesa.
export async function resetConnectorCursor (req, res, next) {
  try {
    const { connectorId } = req.params;
    if (!getConnector(connectorId)) return res.status(404).json({ error: 'Connector not found' });
    const pullId = req.query.pull || null;
    await resetCursor(connectorId, pullId);
    res.json({ status: 'reset', connector: connectorId, pull: pullId || 'all' });
  } catch (err) { next(err); }
}
