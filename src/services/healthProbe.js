// src/services/healthProbe.js
// -----------------------------------------------------------------------------
// Sonda de salud de las tools federadas, para los indicadores del dashboard.
//
// La sonda la hace el SERVIDOR, no el navegador. Si cada pestana abierta probara
// 3 subdominios cada 10 segundos tendriamos preflights CORS, ruido en los logs de
// cada equipo y N veces el trafico. Aqui se hace una vez, se cachea, y todos los
// navegadores leen el mismo resultado.
//
// Resiliencia: timeout corto por tool y sondas en paralelo. Una tool caida deja su
// mosaico en rojo; nunca cuelga el dashboard ni retrasa a las demas. Un fallo de
// red es informacion valida ("no responde"), no una excepcion que propagar.
// -----------------------------------------------------------------------------
import config from "../config.js";
import { listToolViews } from "./deploymentService.js";

let cache = { at: 0, results: null };
let inFlight = null;

async function probeOne (view) {
  if (view.kind === "native") {
    // Corre dentro de este proceso: si esto responde, la tool esta viva.
    return { toolId: view.id, state: "up", detail: "en proceso" };
  }
  if (!view.healthUrl) {
    return { toolId: view.id, state: "unknown", detail: "sin desplegar" };
  }

  const started = Date.now();
  try {
    const response = await fetch(view.healthUrl, {
      signal: AbortSignal.timeout(config.console.healthTimeoutMs),
      headers: { accept: "application/json" },
      redirect: "manual",
    });
    return {
      toolId: view.id,
      state: response.ok ? "up" : "down",
      httpStatus: response.status,
      latencyMs: Date.now() - started,
    };
  } catch (error) {
    // DNS, TLS, timeout o conexion rechazada: para el operador todo es "no
    // responde". El motivo se guarda por si sirve al diagnosticar.
    return {
      toolId: view.id,
      state: "down",
      detail: error.name === "TimeoutError" ? "timeout" : error.message,
      latencyMs: Date.now() - started,
    };
  }
}

// Salud de todas las tools desplegadas. Cachea por `CONSOLE_HEALTH_TTL_MS` y
// colapsa las peticiones concurrentes en una sola ronda de sondas: diez pestanas
// abiertas no son diez rondas.
export async function probeAll () {
  const now = Date.now();
  if (cache.results && now - cache.at < config.console.healthTtlMs) {
    return cache.results;
  }
  if (inFlight) return inFlight;

  const targets = listToolViews().filter((v) => v.kind !== "planned");
  inFlight = Promise.all(targets.map(probeOne))
    .then((results) => {
      cache = { at: Date.now(), results };
      return results;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

// Igual que `probeAll` pero indexado por id, que es como lo consume el dashboard.
export async function probeMap () {
  const results = await probeAll();
  return Object.fromEntries(results.map((r) => [r.toolId, r]));
}

export function invalidateHealthCache () {
  cache = { at: 0, results: null };
}

export default { probeAll, probeMap, invalidateHealthCache };
