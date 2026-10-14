import { Router } from 'express';
import {
  listConnectors,
  getConnectorDetail,
  runConnectorNow,
  resetConnectorCursor
} from '../controllers/connectorsController.js';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = Router();

// Lectura del estado del plano de conectores.
router.get('/', apiKeyAuth(['events:read']), rateLimit(), listConnectors);
router.get('/:connectorId', apiKeyAuth(['events:read']), rateLimit(), getConnectorDetail);

// Operaciones que producen eventos o mueven cursores: requieren escritura.
router.post('/:connectorId/run', apiKeyAuth(['events:write']), rateLimit(), runConnectorNow);
router.post('/:connectorId/reset', apiKeyAuth(['events:write']), rateLimit(), resetConnectorCursor);

export default router;
