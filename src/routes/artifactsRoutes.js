import { Router } from 'express';
import { listArtifacts } from '../controllers/artifactsController.js';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';

const router = Router();

// GET /api/v1/artifacts/list
// Requiere scope específico 'artifacts:read' para separar permisos de lectura de artefactos
router.get('/list', apiKeyAuth(['artifacts:read']), listArtifacts);

export default router;
