// src/routes/authRoutes.js
// -----------------------------------------------------------------------------
// El handshake OIDC del dashboard. Vive en /auth/* (no bajo /api/v1) porque son
// navegaciones del navegador, no llamadas de API: redirigen, ponen cookies y no
// devuelven JSON salvo /auth/me.
//
// `/auth/callback` debe coincidir EXACTO con la URI permitida en el IdP.
// -----------------------------------------------------------------------------
import { Router } from 'express';
import { authEnabled, gateway, describeSession } from '../auth/index.js';

const router = Router();

// Quien soy. Siempre responde JSON, tambien con el SSO apagado, para que el SPA
// pueda distinguir "no hay sesion" de "no hay IdP configurado" sin adivinar.
router.get('/me', (req, res) => {
  res.set('cache-control', 'no-store');
  const payload = describeSession(req);
  return res.status(payload.authenticated || !authEnabled ? 200 : 401).json(payload);
});

// Con el SSO apagado el resto del handshake no existe: devolver 404 es mas honesto
// que fingir un login que no lleva a ningun lado.
router.use((req, res, next) => {
  if (!authEnabled) {
    return res.status(404).json({
      error: 'sso_disabled',
      message: 'OIDC_ISSUER no esta configurado; la plataforma corre en modo abierto'
    });
  }
  return next();
});

router.get('/login', (req, res) => gateway.handleRoute(req, res, 'login'));
router.get('/callback', (req, res) => gateway.handleRoute(req, res, 'callback'));
router.get('/logout', (req, res) => gateway.handleRoute(req, res, 'logout'));

export default router;
