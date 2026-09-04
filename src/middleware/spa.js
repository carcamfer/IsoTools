// src/middleware/spa.js
// -----------------------------------------------------------------------------
// Sirve el dashboard compilado (`web/dist`) DESDE EL MISMO ORIGEN que la API.
//
// Un solo origen es la decision que elimina trabajo, no la que lo agrega: la cookie
// de sesion es first-party, CORS no participa en absoluto, y ninguna credencial
// necesita viajar en un query string (donde se filtraria por el historial del
// navegador, la cabecera Referer y los logs de acceso).
//
// El shell HTML se protege; los assets no. Un 302 al IdP en respuesta a un `.js`
// no lo sigue nadie: rompe la carga en vez de iniciar sesion. Se redirige la
// navegacion, que es la que un humano puede completar.
// -----------------------------------------------------------------------------
import express from "express";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import config from "../config.js";
import { authEnabled, gateway } from "../auth/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DIST = path.join(__dirname, "../../web/dist");

// Devuelve el router del SPA, o `null` si no hay build. Que devuelva null es un
// caso normal: permite desplegar el core como API pura, y en desarrollo el SPA lo
// sirve Vite con su proxy hacia aqui.
export function createSpaRouter () {
  const distDir = config.console.webDistDir
    ? path.resolve(config.console.webDistDir)
    : DEFAULT_DIST;

  const indexHtml = path.join(distDir, "index.html");
  if (!existsSync(indexHtml)) {
    console.warn(`[web] sin build del dashboard en ${distDir}; se sirve solo la API`);
    return null;
  }

  const router = express.Router();

  // Assets. Vite les pone hash en el nombre, asi que se pueden cachear fuerte y
  // para siempre: un deploy cambia el nombre del archivo, no su contenido.
  router.use(
    express.static(distDir, {
      index: false,
      maxAge: "1y",
      immutable: true,
      setHeaders (res, filePath) {
        if (filePath.endsWith(".html")) res.setHeader("cache-control", "no-store");
      },
    })
  );

  // Fallback de history: cualquier ruta que no sea API ni asset devuelve el shell,
  // para que un deep link como /herramientas/manage_nonconformances funcione al
  // pegarlo en la barra de direcciones y no solo al navegar dentro del SPA.
  router.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    // Una peticion que pide JSON no es una navegacion: es un fetch a un endpoint
    // que no existe. Devolverle el HTML del shell le daria un error de parseo en
    // vez de un 404 claro.
    if (req.accepts(["html", "json"]) !== "html") return next();

    if (authEnabled && !req.session) return gateway.challenge(req, res);

    res.set("cache-control", "no-store");
    return res.sendFile(indexHtml);
  });

  return router;
}

export default { createSpaRouter };
