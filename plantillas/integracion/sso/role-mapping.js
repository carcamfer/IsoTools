// plantillas/integracion/sso/role-mapping.js
// -----------------------------------------------------------------------------
// >>> ESTE ES EL UNICO ARCHIVO QUE TIENES QUE EDITAR. <<<
//
// Traduccion del vocabulario de roles de la PLATAFORMA al vocabulario de TU
// dominio. Es una frontera anticorrupcion:
//
//   El IdP publica una lista plana de roles que comparten los cinco equipos
//   (`quality.engineer`, `maintenance.manager`, `operator`, ...). Tus reglas de
//   negocio hablan otro idioma: `QualityDirector`, `SupervisorDeTurno`, lo que sea
//   que digan tus politicas. Ninguno de los dos vocabularios debe filtrarse al
//   otro, y por eso la traduccion es UN SOLO LUGAR y no un `if` regado por el codigo.
//
// El catalogo completo de roles de plataforma esta en el repo del core:
// `src/data/platform/roles.json`. Si necesitas uno que no existe, pidelo — no
// inventes strings, porque un rol que el IdP no emite nunca se cumple.
// -----------------------------------------------------------------------------

/**
 * EDITA ESTA TABLA con los roles de tu dominio.
 *
 * El ORDEN ES LA JERARQUIA. Un usuario que trae varios roles se resuelve al
 * primero que coincida, o sea el mas fuerte, porque las matrices de autoridad
 * suelen aceptar un rol unico. Pon arriba el que manda.
 *
 * El ejemplo es el de las tools de calidad (ISO 7.5.2 aprobacion de
 * especificaciones, 8.7.1 disposiciones). Borralo y pon el tuyo.
 */
export const DEFAULT_ROLE_MAPPINGS = [
  { platformRole: 'quality.director', domainRole: 'QualityDirector' },
  { platformRole: 'quality.technical-authority', domainRole: 'TechnicalAuthority' },
  { platformRole: 'quality.manager', domainRole: 'QualityManager' },
  { platformRole: 'quality.engineer', domainRole: 'QualityEngineer' }
];

// Permite pisar la tabla sin recompilar, con `ROLE_MAP` en el entorno:
//   ROLE_MAP="quality.director=DirectorCalidad,quality.engineer=IngenieroCalidad"
// Con la variable vacia se usa la tabla de arriba, para que un env mal escrito
// nunca acabe concediendo nada en silencio.
export function parseRoleMap (raw) {
  if (!raw || !raw.trim()) return DEFAULT_ROLE_MAPPINGS;
  const mappings = raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const eq = entry.indexOf('=');
      if (eq < 1) return undefined;
      const platformRole = entry.slice(0, eq).trim();
      const domainRole = entry.slice(eq + 1).trim();
      return platformRole && domainRole ? { platformRole, domainRole } : undefined;
    })
    .filter(Boolean);
  return mappings.length > 0 ? mappings : DEFAULT_ROLE_MAPPINGS;
}

/**
 * Mapea los roles del token verificado a roles de tu dominio, el mas fuerte
 * primero y sin repetir.
 *
 * LOS ROLES DESCONOCIDOS SE DESCARTAN, no se dejan pasar tal cual. Un rol que no
 * reconoces jamas debe convertirse en una concesion por accidente. Un usuario sin
 * ningun rol mapeado queda autenticado pero SIN autoridad, y tus politicas lo
 * rechazan con su propio codigo de error — que es exactamente lo que debe pasar.
 */
export function mapRoles (platformRoles, mappings) {
  const held = new Set(platformRoles.map((role) => String(role).toLowerCase()));
  const domainRoles = [];
  for (const mapping of mappings) {
    if (held.has(mapping.platformRole.toLowerCase()) && !domainRoles.includes(mapping.domainRole)) {
      domainRoles.push(mapping.domainRole);
    }
  }
  return domainRoles;
}

/**
 * Extrae la lista de roles de los claims del ID token.
 *
 * Los proveedores no se ponen de acuerdo en donde viven: un `roles` de primer
 * nivel, un `groups`, o un claim propio con namespace. Por eso el nombre del claim
 * es configurable (`OIDC_ROLES_CLAIM`) y se aceptan tanto arreglo de strings como
 * cadena delimitada.
 *
 * Si tu usuario entra pero no puede hacer NADA, empieza aqui: lo mas probable es
 * que el IdP no este liberando el claim de roles. Es el error de configuracion mas
 * comun y se ve identico a un bug de permisos.
 */
export function extractIdpRoles (claims, claimName) {
  const raw = claims?.[claimName];
  if (Array.isArray(raw)) return raw.filter((r) => typeof r === 'string');
  if (typeof raw === 'string') return raw.split(/[\s,]+/).filter(Boolean);
  return [];
}

export default { DEFAULT_ROLE_MAPPINGS, parseRoleMap, mapRoles, extractIdpRoles };
