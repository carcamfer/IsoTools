// src/connectors/mapping.js
// ─────────────────────────────────────────────────────────────────────────────
// MOTOR DE MAPEO DECLARATIVO
// Traduce un renglon crudo del ERP/PLC (columnas en MAYUSCULAS, nombres propios
// de cada sistema) al bloque `data` del Industrial Event Standard, siguiendo un
// JSON de configuracion. Agregar otro ERP = agregar otro JSON, no otro modulo.
//
// Sintaxis de plantillas dentro del JSON:
//   "$row.skuId"        -> valor mapeado del renglon (conserva el tipo)
//   "$raw.CLAVE"        -> valor crudo tal como vino del ERP
//   "$params.minStock"  -> parametro del conector
//   "$count"            -> numero de renglones leidos en el ciclo
//   "$now"              -> timestamp ISO del ciclo
//   "$cursor"           -> cursor con el que se leyo
//   cualquier otra cosa -> literal (numero, texto, bool, array, objeto)
// ─────────────────────────────────────────────────────────────────────────────

const PATH_ONLY = /^\$[\w.]+$/;

export function resolvePath (ctx, dotted) {
  return dotted.split('.').reduce((o, k) => (o == null ? undefined : o[k]), ctx);
}

// Resuelve plantillas en profundidad (objetos y arrays incluidos).
export function resolveTemplate (value, ctx) {
  if (typeof value === 'string') {
    if (!PATH_ONLY.test(value)) return value;
    const resolved = resolvePath(ctx, value.slice(1));
    return resolved === undefined ? null : resolved;
  }
  if (Array.isArray(value)) return value.map(v => resolveTemplate(v, ctx));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = resolveTemplate(v, ctx);
    return out;
  }
  return value;
}

// Normaliza el renglon crudo a los nombres de negocio declarados en `fields`.
// { "skuId": "CLAVE", "quantity": "EXISTENCIA" } -> { skuId, quantity }
export function mapRow (raw, fields) {
  if (!fields) return { ...raw };
  const out = {};
  for (const [target, source] of Object.entries(fields)) {
    out[target] = typeof source === 'string' && source.startsWith('$')
      ? resolveTemplate(source, { raw, row: raw })
      : raw[source];
  }
  return out;
}

// Evalua un `when` del conector. Misma gramatica que los triggerCondition del
// bus (always / AND / OR / IN [..] / == != >= <= > <), con una diferencia
// necesaria: aqui AMBOS lados pueden ser plantillas, porque comparamos un campo
// del ERP contra un parametro del conector ("$row.quantity <= $params.minStock").
// Ante una expresion que no se sabe parsear se deja pasar la fila, igual que el
// bus: el objetivo es no bloquear la ingesta por un mapeo mal escrito.
export function matches (condition, ctx) {
  if (!condition) return true;
  const cond = String(condition).trim();
  if (!cond || cond.toLowerCase() === 'always') return true;

  const ors = cond.split(/\s+OR\s+/i);
  if (ors.length > 1) return ors.some(c => matches(c, ctx));
  const ands = cond.split(/\s+AND\s+/i);
  if (ands.length > 1) return ands.every(c => matches(c, ctx));

  // campo IN ['a','b']
  const inMatch = cond.match(/^\s*(\S+)\s+IN\s+\[(.+)\]\s*$/i);
  if (inMatch) {
    const value = operandValue(inMatch[1], ctx);
    const list = inMatch[2].split(',').map(x => String(unquote(x.trim())));
    return list.includes(String(value));
  }

  const m = cond.match(/^\s*(\S+)\s*(===|==|!==|!=|>=|<=|>|<)\s*(.+?)\s*$/);
  if (!m) return true;
  const [, lhsRaw, opRaw, rhsRaw] = m;
  const lhs = operandValue(lhsRaw, ctx);
  const rhs = operandValue(rhsRaw, ctx);
  const op = opRaw.replace('===', '==').replace('!==', '!=');

  switch (op) {
    case '==': return lhs == rhs; // eslint-disable-line eqeqeq
    case '!=': return lhs != rhs; // eslint-disable-line eqeqeq
    case '>=': return Number(lhs) >= Number(rhs);
    case '<=': return Number(lhs) <= Number(rhs);
    case '>': return Number(lhs) > Number(rhs);
    case '<': return Number(lhs) < Number(rhs);
    default: return true;
  }
}

// Un operando es una plantilla ("$row.quantity") o un literal (10, true, 'ok').
function operandValue (token, ctx) {
  const t = token.trim();
  if (t.startsWith('$')) return resolvePath(ctx, t.slice(1));
  return coerce(unquote(t));
}

function unquote (s) {
  return s.replace(/^['"]|['"]$/g, '');
}

function coerce (s) {
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === 'null') return null;
  if (s === '') return '';
  const n = Number(s);
  return Number.isNaN(n) ? s : n;
}
