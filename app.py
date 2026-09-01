# app.py
# -----------------------------------------------------------------------------
# ORCA · ERP Edge Gateway
#
# Este archivo NO es una Tool ni la plataforma central: es el AGENTE LOCAL que se
# instala junto al ERP (Microsip / Firebird) dentro de la planta. Su unico trabajo
# es exponer, en solo-lectura, los datos crudos del ERP por HTTP para que el
# CONECTOR de la plataforma central los lea, los convierta al Industrial Event
# Standard y los publique en Industrial Events.
#
#   ERP (Firebird)  ->  app.py (edge, aqui)  ->  Conector central (Node)
#                                                    -> Industrial Events
#                                                    -> Communication Router
#                                                    -> Tool(s)
#
# Reglas de esta capa:
#   * SOLO SELECT. Nada de escrituras al ERP desde aqui.
#   * Nada de logica de negocio: el mapeo al estandar ORCA ocurre en el conector.
#   * Credenciales por variable de entorno, nunca en el codigo.
#   * Modo MOCK (ERP_MOCK=1) para desarrollar el conector sin Firebird ni Windows.
# -----------------------------------------------------------------------------
import os
import random
from datetime import date, datetime, timedelta
from decimal import Decimal
from functools import wraps

from flask import Flask, jsonify, request

# firebirdsql solo se necesita cuando NO estamos en modo MOCK. Asi el gateway
# arranca en Linux/CI (para probar el conector) aunque no exista el driver.
try:
    import firebirdsql
except ImportError:  # pragma: no cover - depende del entorno de instalacion
    firebirdsql = None


def _env_bool(name, default=False):
    v = os.getenv(name)
    if v is None or v == "":
        return default
    return v.strip().lower() in ("1", "true", "yes", "on")


def _env_int(name, default):
    try:
        return int(os.getenv(name, default))
    except (TypeError, ValueError):
        return default


app = Flask(__name__)

# --- Configuracion -----------------------------------------------------------
MOCK = _env_bool("ERP_MOCK", False)
API_KEY = os.getenv("ERP_API_KEY", "")          # si esta vacio, el gateway queda abierto (solo dev)
MAX_ROWS = _env_int("ERP_MAX_ROWS", 500)        # tope duro por respuesta
ERP_TYPE = os.getenv("ERP_TYPE", "microsip")
PLANT_ID = os.getenv("ERP_PLANT_ID", "plant_01")

DB_CONFIG = {
    "host": os.getenv("FB_HOST", "localhost"),
    "database": os.getenv("FB_DATABASE", r"C:\Microsip Datos\AGTE.FDB"),
    "user": os.getenv("FB_USER", "SYSDBA"),
    "password": os.getenv("FB_PASSWORD", "masterkey"),
    "port": _env_int("FB_PORT", 3050),
    "charset": os.getenv("FB_CHARSET", "WIN1252"),
}


# --- Utilidades --------------------------------------------------------------
def jsonable(value):
    """Convierte tipos de Firebird (Decimal/date/datetime/bytes) a JSON-safe."""
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    if isinstance(value, str):
        return value.strip()
    return value


def require_key(fn):
    """Auth minima por cabecera. El conector central manda X-API-Key."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if API_KEY:
            sent = request.headers.get("X-API-Key") or request.args.get("api_key")
            if sent != API_KEY:
                return jsonify({"error": "unauthorized"}), 401
        return fn(*args, **kwargs)
    return wrapper


def ejecutar_consulta(query, params=()):
    """Ejecuta un SELECT y devuelve List[dict]. Devuelve None si algo falla."""
    if firebirdsql is None:
        print("Error: el driver firebirdsql no esta instalado (pip install firebirdsql)")
        return None
    conn = None
    cursor = None
    try:
        conn = firebirdsql.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute(query, params)

        columnas = [desc[0] for desc in cursor.description]
        return [
            {col: jsonable(val) for col, val in zip(columnas, fila)}
            for fila in cursor.fetchall()
        ]
    except Exception as e:
        print(f"Error de conexion o consulta: {e}")
        return None
    finally:
        # Cerrar siempre: Firebird mantiene la transaccion abierta si no se cierra
        # y el gateway hace polling continuo (una conexion colgada por ciclo).
        try:
            if cursor is not None:
                cursor.close()
            if conn is not None:
                conn.close()
        except Exception:
            pass


def limit_of(default=None):
    """Tope de filas pedido por el cliente, acotado por ERP_MAX_ROWS."""
    try:
        n = int(request.args.get("limit", default or MAX_ROWS))
    except (TypeError, ValueError):
        n = default or MAX_ROWS
    return max(1, min(n, MAX_ROWS))


def responder(datos, recurso):
    if datos is None:
        return jsonify({"error": f"No se pudo consultar {recurso}"}), 500
    return jsonify(datos)


# --- Datos simulados (ERP_MOCK=1) --------------------------------------------
# Deterministas por recurso para que el conector pueda probarse end-to-end sin
# el ERP real: mismas claves de columna que devuelve Firebird (MAYUSCULAS).
def mock_inventario(limit):
    rnd = random.Random(42)
    filas = []
    for i in range(1, min(limit, 25) + 1):
        filas.append({
            "ARTICULO_ID": i,
            "ARTICULO": f"Articulo demo {i:03d}",
            "CLAVE": f"SKU-{i:04d}",
            "EXISTENCIA": float(rnd.randint(0, 120)),
        })
    return filas


def mock_ventas(limit, desde_id=0):
    rnd = random.Random(7)
    filas = []
    base = datetime.utcnow()
    for i in range(1, min(limit, 20) + 1):
        docto_id = int(desde_id) + i
        filas.append({
            "DOCTO_VE_ID": docto_id,
            "FOLIO": f"F-{docto_id:06d}",
            "FECHA": (base - timedelta(hours=i)).date().isoformat(),
            "TIPO_DOCTO": "F",
            "IMPORTE_NETO": round(rnd.uniform(500, 25000), 2),
            "ESTATUS": "N",
        })
    return filas


def mock_compras(limit, desde_id=0):
    rnd = random.Random(11)
    filas = []
    base = datetime.utcnow()
    for i in range(1, min(limit, 15) + 1):
        docto_id = int(desde_id) + i
        filas.append({
            "DOCTO_CM_ID": docto_id,
            "FOLIO": f"C-{docto_id:06d}",
            "FECHA": (base - timedelta(days=i)).date().isoformat(),
            "TIPO_DOCTO": "C",
            "IMPORTE_NETO": round(rnd.uniform(1000, 60000), 2),
            "ESTATUS": "N",
        })
    return filas


# --- Salud y catalogo --------------------------------------------------------
@app.route("/health", methods=["GET"])
def health():
    """Liveness. Sin auth: lo usan el conector y el orquestador."""
    return jsonify({
        "status": "ok",
        "service": "orca-erp-edge-gateway",
        "erp_type": ERP_TYPE,
        "plant_id": PLANT_ID,
        "mode": "mock" if MOCK else "firebird",
        "time": datetime.utcnow().isoformat() + "Z",
    })


@app.route("/ready", methods=["GET"])
def ready():
    """Readiness: en modo real comprueba que Firebird responde de verdad."""
    if MOCK:
        return jsonify({"status": "ready", "mode": "mock"})
    datos = ejecutar_consulta("SELECT FIRST 1 1 AS OK FROM RDB$DATABASE")
    if datos is None:
        return jsonify({"status": "not_ready", "error": "sin conexion al ERP"}), 503
    return jsonify({"status": "ready", "mode": "firebird"})


@app.route("/api/catalogo", methods=["GET"])
@require_key
def catalogo():
    """Recursos que este gateway expone. El conector central lo usa para descubrir."""
    return jsonify({
        "erp_type": ERP_TYPE,
        "plant_id": PLANT_ID,
        "resources": [
            {"path": "/api/inventario", "cursor": None, "params": ["limit", "almacen"]},
            {"path": "/api/ventas", "cursor": "DOCTO_VE_ID", "params": ["limit", "fecha", "desde_id"]},
            {"path": "/api/compras", "cursor": "DOCTO_CM_ID", "params": ["limit", "fecha", "desde_id"]},
            {"path": "/api/articulos", "cursor": "ARTICULO_ID", "params": ["limit", "desde_id"]},
        ],
    })


# --- Recurso 1: inventario disponible en tiempo real -------------------------
@app.route("/api/inventario", methods=["GET"])
@require_key
def obtener_inventario():
    limit = limit_of()
    almacen = request.args.get("almacen")

    if MOCK:
        return jsonify(mock_inventario(limit))

    filtro_almacen = "AND D.ALMACEN_ID = ?" if almacen else ""
    query = f"""
        SELECT FIRST {limit}
            A.ARTICULO_ID,
            A.NOMBRE AS ARTICULO,
            C.CLAVE_ARTICULO AS CLAVE,
            COALESCE((
                SELECT SUM(D.UNIDADES * CASE WHEN D.TIPO_MOVTO = 'E' THEN 1 ELSE -1 END)
                FROM DOCTOS_IN_DET D
                WHERE D.ARTICULO_ID = A.ARTICULO_ID {filtro_almacen}
            ), 0) AS EXISTENCIA
        FROM ARTICULOS A
        LEFT JOIN CLAVES_ARTICULOS C ON A.ARTICULO_ID = C.ARTICULO_ID
        ORDER BY A.ARTICULO_ID
    """
    params = (almacen,) if almacen else ()
    return responder(ejecutar_consulta(query, params), "el inventario")


# --- Recurso 2: ventas (facturacion) -----------------------------------------
@app.route("/api/ventas", methods=["GET"])
@require_key
def obtener_ventas():
    limit = limit_of(50)
    fecha = request.args.get("fecha")
    desde_id = request.args.get("desde_id")

    if MOCK:
        return jsonify(mock_ventas(limit, desde_id or 0))

    # Lectura INCREMENTAL: el conector guarda el ultimo DOCTO_VE_ID que vio y lo
    # manda como desde_id. Asi cada ciclo trae solo lo nuevo (nada de re-escanear).
    if desde_id:
        query = f"""
            SELECT FIRST {limit} DOCTO_VE_ID, FOLIO, FECHA, TIPO_DOCTO, IMPORTE_NETO, ESTATUS
            FROM DOCTOS_VE
            WHERE DOCTO_VE_ID > ? AND ESTATUS = 'N'
            ORDER BY DOCTO_VE_ID ASC
        """
        datos = ejecutar_consulta(query, (desde_id,))
    elif fecha:
        query = f"""
            SELECT FIRST {limit} DOCTO_VE_ID, FOLIO, FECHA, TIPO_DOCTO, IMPORTE_NETO, ESTATUS
            FROM DOCTOS_VE
            WHERE FECHA = ? AND ESTATUS = 'N'
            ORDER BY FOLIO DESC
        """
        datos = ejecutar_consulta(query, (fecha,))
    else:
        query = f"""
            SELECT FIRST {limit} DOCTO_VE_ID, FOLIO, FECHA, TIPO_DOCTO, IMPORTE_NETO, ESTATUS
            FROM DOCTOS_VE
            WHERE ESTATUS = 'N'
            ORDER BY FECHA DESC, FOLIO DESC
        """
        datos = ejecutar_consulta(query)

    return responder(datos, "las ventas")


# --- Recurso 3: compras ------------------------------------------------------
@app.route("/api/compras", methods=["GET"])
@require_key
def obtener_compras():
    """Documentos de compra. Verifica DOCTOS_CM contra tu base antes de usarlo."""
    limit = limit_of(50)
    desde_id = request.args.get("desde_id")

    if MOCK:
        return jsonify(mock_compras(limit, desde_id or 0))

    if desde_id:
        query = f"""
            SELECT FIRST {limit} DOCTO_CM_ID, FOLIO, FECHA, TIPO_DOCTO, IMPORTE_NETO, ESTATUS
            FROM DOCTOS_CM
            WHERE DOCTO_CM_ID > ?
            ORDER BY DOCTO_CM_ID ASC
        """
        datos = ejecutar_consulta(query, (desde_id,))
    else:
        query = f"""
            SELECT FIRST {limit} DOCTO_CM_ID, FOLIO, FECHA, TIPO_DOCTO, IMPORTE_NETO, ESTATUS
            FROM DOCTOS_CM
            ORDER BY FECHA DESC
        """
        datos = ejecutar_consulta(query)

    return responder(datos, "las compras")


# --- Recurso 4: catalogo de articulos ----------------------------------------
@app.route("/api/articulos", methods=["GET"])
@require_key
def obtener_articulos():
    limit = limit_of()
    desde_id = request.args.get("desde_id")

    if MOCK:
        return jsonify([
            {"ARTICULO_ID": r["ARTICULO_ID"], "NOMBRE": r["ARTICULO"], "CLAVE": r["CLAVE"]}
            for r in mock_inventario(limit)
        ])

    if desde_id:
        query = f"""
            SELECT FIRST {limit} A.ARTICULO_ID, A.NOMBRE, C.CLAVE_ARTICULO AS CLAVE
            FROM ARTICULOS A
            LEFT JOIN CLAVES_ARTICULOS C ON A.ARTICULO_ID = C.ARTICULO_ID
            WHERE A.ARTICULO_ID > ?
            ORDER BY A.ARTICULO_ID ASC
        """
        datos = ejecutar_consulta(query, (desde_id,))
    else:
        query = f"""
            SELECT FIRST {limit} A.ARTICULO_ID, A.NOMBRE, C.CLAVE_ARTICULO AS CLAVE
            FROM ARTICULOS A
            LEFT JOIN CLAVES_ARTICULOS C ON A.ARTICULO_ID = C.ARTICULO_ID
            ORDER BY A.ARTICULO_ID ASC
        """
        datos = ejecutar_consulta(query)

    return responder(datos, "los articulos")


if __name__ == "__main__":
    port = _env_int("ERP_GATEWAY_PORT", 5000)
    debug = _env_bool("ERP_DEBUG", False)
    print(f"[erp-edge] {ERP_TYPE} · modo={'mock' if MOCK else 'firebird'} · puerto={port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
