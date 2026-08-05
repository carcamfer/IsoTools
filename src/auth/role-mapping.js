// src/auth/role-mapping.js
// -----------------------------------------------------------------------------
// Traduccion de los roles que emite el IdP al vocabulario de roles de la
// PLATAFORMA (`src/data/platform/roles.json`).
//
// El dashboard es el dueno del vocabulario: es el unico artefacto que todos los
// equipos comparten. Cada tool, del otro lado, traduce ese vocabulario al suyo de
// dominio (las tools de calidad hablan QualityDirector/QualityManager/...). Ese
// segundo salto NO ocurre aqui: el core nunca decide autoridad de dominio ajena.
//
// El catalogo de roles es DATO, no codigo: agregar un rol es editar un JSON.
// -----------------------------------------------------------------------------
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROLES_PATH = path.join(__dirname, '../data/platform/roles.json');

let catalog = null;

function loadCatalog () {
  if (catalog) return catalog;
  const raw = JSON.parse(readFileSync(ROLES_PATH, 'utf-8'));
  const roles = Array.isArray(raw.roles) ? raw.roles : [];
  catalog = {
    roles,
    byId: new Map(roles.map((r) => [r.id, r])),
    // El orden del JSON es la jerarquia: el primero que coincida es el mas fuerte.
    order: roles.map((r) => r.id)
  };
  return catalog;
}

// Recarga el catalogo (util en pruebas o tras editar el JSON en caliente).
export function reloadRoleCatalog () {
  catalog = null;
  return loadCatalog();
}

export function listRoles () {
  return loadCatalog().roles;
}

export function getRole (id) {
  return loadCatalog().byId.get(id) || null;
}

// Mapeo por defecto: identidad sobre el catalogo. El IdP de la plataforma se
// configura con ESTOS identificadores, asi que no hay traduccion que hacer; el
// mapeo existe para el caso en que el IdP de un cliente use otro vocabulario.
export function defaultRoleMappings () {
  return loadCatalog().order.map((id) => ({ idpRole: id, platformRole: id }));
}

// Parsea el formato de `OIDC_ROLE_MAP`: `rolIdp=rolPlataforma,rolIdp=rolPlataforma`,
// el mas fuerte primero. Con la variable vacia devuelve el mapeo por defecto, para
// que un env mal escrito nunca acabe concediendo nada en silencio.
export function parseRoleMap (raw) {
  if (!raw || !raw.trim()) return defaultRoleMappings();
  const mappings = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const eq = entry.indexOf('=');
      if (eq < 1) return undefined;
      const idpRole = entry.slice(0, eq).trim();
      const platformRole = entry.slice(eq + 1).trim();
      return idpRole && platformRole ? { idpRole, platformRole } : undefined;
    })
    .filter(Boolean);
  return mappings.length > 0 ? mappings : defaultRoleMappings();
}

// Mapea los roles del token verificado a roles de plataforma, el mas fuerte
// primero y sin repetir.
//
// Los roles desconocidos SE DESCARTAN en vez de pasar tal cual: un rol que no
// reconocemos jamas debe convertirse en una concesion por accidente. Un usuario
// sin ningun rol mapeado queda autenticado pero sin autoridad; el dashboard le
// muestra solo lo abierto y cada tool rechaza sus acciones con su propia regla.
export function mapRoles (idpRoles, mappings) {
  const held = new Set(idpRoles.map((role) => String(role).toLowerCase()));
  const platformRoles = [];
  for (const mapping of mappings) {
    if (held.has(mapping.idpRole.toLowerCase()) && !platformRoles.includes(mapping.platformRole)) {
      platformRoles.push(mapping.platformRole);
    }
  }
  return platformRoles;
}

// Extrae la lista de roles de los claims del ID token.
//
// Los proveedores no se ponen de acuerdo en donde viven: un `roles` de primer
// nivel, un `groups`, o un claim propio con namespace. Por eso el nombre del claim
// es configurable y se aceptan tanto arreglo de strings como cadena delimitada.
export function extractIdpRoles (claims, claimName) {
  const raw = claims?.[claimName];
  if (Array.isArray(raw)) return raw.filter((r) => typeof r === 'string');
  if (typeof raw === 'string') return raw.split(/[\s,]+/).filter(Boolean);
  return [];
}

// True si alguno de los roles del usuario ve TODAS las tools del dashboard.
// Ojo: es visibilidad, no autoridad de dominio (ver notas de roles.json).
export function seesAllTools (roles = []) {
  const { byId } = loadCatalog();
  return roles.some((role) => byId.get(role)?.seesAllTools === true);
}

export default {
  reloadRoleCatalog,
  listRoles,
  getRole,
  defaultRoleMappings,
  parseRoleMap,
  mapRoles,
  extractIdpRoles,
  seesAllTools
};
