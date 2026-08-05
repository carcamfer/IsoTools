// src/routes/consoleRoutes.js
// -----------------------------------------------------------------------------
// API del dashboard. Se autentica SOLO con la cookie de sesion (plano humano); no
// acepta `x-api-key` a proposito, para que ningun proceso automatico dependa de
// endpoints de pantalla que cambian con la UI.
//
// Simetricamente, /api/v1/events no acepta cookie: es el plano maquina. Dos planos,
// dos superficies, ningun endpoint sirviendo a los dos.
// -----------------------------------------------------------------------------
import { Router } from "express";
import { requireSession, requireRole } from "../auth/index.js";
import {
  getBootstrap,
  getTools,
  getToolDetail,
  getHealth,
  getCatalog,
  getSummary,
  getRecentEvents,
  getChain,
  getAuditReport,
} from "../controllers/consoleController.js";

const router = Router();

// Toda la consola exige sesion. Con el SSO apagado hay una sesion sintetica de
// desarrollo, asi que el repo sigue siendo usable sin IdP.
router.use(requireSession);

router.get("/bootstrap", getBootstrap);
router.get("/tools", getTools);
router.get("/tools/:toolId", getToolDetail);
router.get("/health", getHealth);
router.get("/catalog", getCatalog);
router.get("/summary", getSummary);
router.get("/events", getRecentEvents);
router.get("/events/chain/:correlationId", getChain);

// La evidencia de auditoria cruza TODAS las tools, incluidas las de equipos que no
// son el tuyo. Se restringe a los roles que existen justamente para eso.
router.get("/audit-report", requireRole("platform.auditor", "platform.admin"), getAuditReport);

export default router;
