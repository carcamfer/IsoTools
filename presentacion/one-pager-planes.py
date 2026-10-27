#!/usr/bin/env python3
"""
One-pager (A4, 1 página) de la diapositiva 2 del deck ISO 9001:
los 3 planes y las 17 tools, con una descripción breve de cada tool.

Sin precio por tool y sin la nota de "audit_report listo para el 15-ago":
este documento es para compartir con cliente/socio.

La tipografía se auto-escala para llenar la página: `fit_scale()` busca el
factor más grande con el que las tres columnas siguen cabiendo.

Genera: presentacion/IsoTools-one-pager-planes.pdf
Correr:  python3 presentacion/one-pager-planes.py
"""
from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

# ---------------------------------------------------------------- paleta (deck)
BG = HexColor('#0b1220')
BG2 = HexColor('#0f1a2e')
PANEL = HexColor('#131f36')
INK = HexColor('#eaf0fb')
MUTED = HexColor('#93a2c0')
LINE = HexColor('#243453')
ACCENT = HexColor('#38e0c4')
ACCENT2 = HexColor('#f5b544')
GOOD = HexColor('#3ddc97')
DARKBOX = HexColor('#16233c')
PLC_C, PLC_B = HexColor('#7ee0ff'), HexColor('#2f6f8c')
ERP_C, ERP_B = HexColor('#c9a6ff'), HexColor('#5d4290')

W, H = A4
M = 32.0                       # margen lateral
GAP = 11.0                     # separación entre columnas
PAD = 9.5                      # padding interno del card
COL = (W - 2 * M - 2 * GAP) / 3
RESERVE = 172.0                # espacio reservado abajo: leyenda + caja de integración + pie

# ------------------------------------------------------------------ contenido
PLANS = [
    {
        'name': 'Starter',
        'tag': 'Cumplimiento básico y gestión',
        'for': 'PYME de 10 a 50 empleados, servicios o consultoría. '
               'Todo vive en la nube: cero integración con planta.',
        'price': '$200',
        'per': ' USD / mes',
        'sub': '$2,400 / año  ·  Mantenimiento anual $400',
        'foot': '6 tools incluidas',
        'pop': False,
        'inc': None,
        'tools': [
            ('track_project_progress', None,
             'Monitorea el avance del proyecto de certificación: hitos cumplidos, '
             'responsables y recursos. Es la guía que lleva a la empresa de cero a '
             'auditable siguiendo el orden de la norma.'),
            ('compare_planned_vs_actual', 'ERP',
             'Compara lo planeado contra lo realmente ejecutado en producción, compras '
             'y costos. Traduce la desviación a dinero: OTIF, merma y variación de costo '
             'por orden.'),
            ('generate_kpis', 'ERP',
             'Consolida los KPIs operativos, financieros y de calidad en un reporte '
             'único. Es la evidencia que pide la Revisión por la Dirección (9.3), '
             'incluidas las quejas del CRM.'),
            ('manage_nonconformances', 'ERP',
             'Registra, clasifica y asigna cada no conformidad interna o de cliente con '
             'flujo de aprobación. Al detectar el defecto bloquea el lote en inventario '
             'para que no se embarque.'),
            ('automate_followups', None,
             'Persigue los seguimientos de acciones correctivas, proveedores y pendientes '
             'abiertos. Cierra el ciclo de mejora sin depender de que alguien se acuerde.'),
            ('audit_report', None,
             'Compila la evidencia que generan todas las demás tools y arma el reporte de '
             'auditoría ordenado por cláusula. Es el entregable final: la carpeta lista '
             'sin armarla a mano.'),
        ],
    },
    {
        'name': 'Professional',
        'tag': 'Control de producción e ingeniería',
        'for': 'Manufactura ligera, talleres y laboratorios (51 a 250). '
               'Primer contacto real con piso de planta y ERP.',
        'price': '$900',
        'per': ' USD / mes',
        'sub': '$10,800 / año  ·  Mantenimiento anual $1,600',
        'foot': '5 tools + las 6 de Starter',
        'pop': True,
        'inc': 'Todo lo de Starter',
        'tools': [
            ('manage_product_specs', 'ERP',
             'Administra el árbol de características críticas (CTQ), tolerancias, límites '
             'de especificación y documentos de control. Jala nominales y tolerancias '
             'directo de la orden de trabajo.'),
            ('manage_device_registry', 'ERP',
             'Mantiene el inventario de instrumentos y dispositivos con su versión, '
             'configuración y estado de calibración (7.1.5). Cuando un equipo vence, '
             'dispara la orden de compra o el servicio.'),
            ('collect_quality_measurements', 'PLC',
             'Captura mediciones dimensionales y de atributos directo del instrumento '
             '(CMM, calibre, visión) en la línea. Elimina la captura manual en Excel y '
             'con ella el error de dedo.'),
            ('inspect_product_quality', None,
             'Detecta defectos superficiales pieza por pieza con una CNN embebida en '
             'cámara. Sostiene la liberación de producto (8.6) con evidencia visual de '
             'cada unidad.'),
            ('generate_8d_report', 'ERP',
             'Arma el 8D completo: equipo, contención, causa raíz (5 Whys / Ishikawa), '
             'acción correctiva y verificación de eficacia. Cruza datos del proveedor y '
             'del lote afectado.'),
        ],
    },
    {
        'name': 'Enterprise',
        'tag': 'Estadística avanzada y monitoreo continuo',
        'for': 'Automotriz, dispositivo médico, IATF 16949. Aquí el PLC es '
               'obligatorio: sin flujo continuo no hay SPC.',
        'price': '$3,500',
        'per': ' USD / mes',
        'sub': '$42,000 / año  ·  Mantenimiento anual $6,300',
        'foot': '6 tools + las 11 de Professional',
        'pop': False,
        'inc': 'Todo lo de Professional',
        'tools': [
            ('analyze_failure_modes', None,
             'Ejecuta FMEA y mantenimiento centrado en confiabilidad (RCM) para priorizar '
             'por riesgo (NPR). Dice qué atender primero, antes de que la falla llegue al '
             'producto.'),
            ('run_msa_analysis', None,
             'Corre estudios Gage R&R, linealidad y sesgo. Valida que el sistema de '
             'medición sea confiable: sin esto, todo el SPC está midiendo ruido del '
             'instrumento.'),
            ('calculate_control_charts', 'PLC',
             'Genera cartas de control Xbar-R, Xbar-S, I-MR y p/np sobre el flujo continuo '
             'de la máquina. SPC en vivo, no un muestreo de fin de turno.'),
            ('detect_out_of_control_signals', 'PLC',
             'Aplica reglas de Nelson y Western Electric para hallar patrones de causa '
             'asignable en la carta. Avisa (o detiene la línea) antes de producir la '
             'merma, no después.'),
            ('calculate_cpk_ppk', None,
             'Calcula Cp/Cpk (corto plazo) y Pp/Ppk (largo plazo) con histograma y PPM de '
             'defectos. Es el número que el cliente automotriz o médico exige para aprobar '
             'el proceso.'),
            ('detect_business_anomalies', 'PLC',
             'Cruza con IA los paros y micro-paros de máquina contra la variabilidad de '
             'calidad y las métricas de negocio. Encuentra la correlación que nadie está '
             'buscando a mano.'),
        ],
    },
]

LEGEND = [
    ('PLC', 'Señales de piso en tiempo real',
     'collect_quality_measurements · calculate_control_charts · '
     'detect_out_of_control_signals · detect_business_anomalies'),
    ('ERP', 'Contexto de negocio (orden de trabajo, BOM, inventario, compras, CRM)',
     'manage_product_specs · manage_nonconformances · generate_8d_report · '
     'generate_kpis · compare_planned_vs_actual · manage_device_registry'),
]

INTEGRATION = {
    'title': 'La integración se cotiza aparte · el plan ya cubre todas las líneas del sitio',
    'cols': [
        ('PLC · por máquina', [
            ('Setup, primera línea', '$2,500'),
            ('Setup, línea replicada idéntica', '$750'),
            ('Mensual, 1 a 20 máquinas', '$150'),
            ('Mensual, 21 máquinas o más', '$115'),
        ]),
        ('ERP · por conector', [
            ('Setup por conector', '$4,000'),
            ('Mensual por conector', '$250'),
            ('Mantenimiento anual del contrato', '~15%'),
        ]),
        ('Ejemplo · 7 líneas iguales de 4 máquinas', [
            ('Setup: 4 x $2,500 + 24 x $750', '$28,000'),
            ('Mensual: $3,500 + 28 x $115', '$6,720'),
            ('Suscripciones Enterprise a pagar', '1'),
        ]),
    ],
    'note': 'Línea replicada = mismo equipo y mismo mapeo de tags que una línea ya integrada: '
            'el 30% cubre validación y puesta en marcha, no la ingeniería de nuevo. La mensualidad '
            'por máquina no se descuenta: son señales que se procesan y almacenan todos los días.',
}


# ------------------------------------------------------------------- tipografía
def sizes(s):
    """Tamaños de fuente y espaciados para un factor de escala `s`."""
    return {
        'plan': 12.5 * s, 'tag': 6.4 * s, 'tagl': 7.8 * s,
        'for': 6.2 * s, 'forl': 7.5 * s,
        'price': 15.5 * s, 'per': 6.4 * s, 'sub': 6.1 * s,
        'inc': 6.8 * s,
        'name': 7.0 * s, 'desc': 6.4 * s, 'descl': 8.2 * s,
        'gap_name_desc': 4.0 * s,      # nombre de tool -> primera línea de desc
        'gap_tool': 6.0 * s,           # entre tools
        'foot': 6.3 * s,
    }


def wrap(text, font, size, width):
    """Parte `text` en líneas que caben en `width`."""
    lines, cur = [], ''
    for w in text.split():
        probe = f'{cur} {w}'.strip()
        if stringWidth(probe, font, size) <= width:
            cur = probe
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def draw_wrapped(c, text, x, y, font, size, width, leading, color):
    """Dibuja texto envuelto. `y` es la baseline de la primera línea."""
    c.setFont(font, size)
    c.setFillColor(color)
    for ln in wrap(text, font, size, width):
        c.drawString(x, y, ln)
        y -= leading
    return y


def badge_w(kind, size):
    return stringWidth(kind, 'Helvetica-Bold', size) + 5.5


def io_badge(c, x, y, kind, size):
    """Etiqueta PLC / ERP con la baseline en `y`. Devuelve el ancho consumido."""
    fg, br = (PLC_C, PLC_B) if kind == 'PLC' else (ERP_C, ERP_B)
    bw, bh = badge_w(kind, size), size * 1.45
    c.setStrokeColor(br)
    c.setFillColor(DARKBOX)
    c.setLineWidth(0.5)
    c.roundRect(x, y - size * 0.3, bw, bh, 1.7, stroke=1, fill=1)
    c.setFillColor(fg)
    c.setFont('Helvetica-Bold', size)
    c.drawString(x + 2.75, y, kind)
    return bw


def name_font_size(name, io, base, avail):
    """Encoge el nombre de la tool si no cabe junto a su etiqueta I/O."""
    size = base
    while size > 4.5:
        need = stringWidth(name, 'Courier-Bold', size)
        if io:
            need += 3.5 + badge_w(io, size * 0.78)
        if need <= avail:
            break
        size -= 0.1
    return size


def check(c, x, y, color, s):
    c.setStrokeColor(color)
    c.setLineWidth(1.15)
    c.setLineCap(1)
    p = c.beginPath()
    p.moveTo(x, y + s * 0.45)
    p.lineTo(x + s * 0.4, y)
    p.lineTo(x + s * 1.05, y + s * 0.95)
    c.drawPath(p)


def arrow(c, x, y, color, s):
    c.setFillColor(color)
    p = c.beginPath()
    p.moveTo(x, y)
    p.lineTo(x, y + s * 1.5)
    p.lineTo(x + s, y + s * 0.75)
    p.close()
    c.drawPath(p, fill=1, stroke=0)


# --------------------------------------------------------------------- medición
def card_height(plan, s):
    """
    Alto que necesita el card del plan con escala `s`.

    Espeja exactamente los avances verticales de draw_card(): si se toca uno,
    hay que tocar el otro o el contenido se sale del card.
    """
    z = sizes(s)
    inner = COL - 2 * PAD
    tool_inner = inner - 8.0 * s

    h = 11 * s + z['plan'] * 1.17                                 # padding + nombre del plan
    h += (len(wrap(plan['tag'], 'Helvetica-Bold', z['tag'], inner)) + 1) * z['tagl']
    h += len(wrap(plan['for'], 'Helvetica', z['for'], inner)) * z['forl'] + 3 * s
    h += z['price'] + 5 * s
    h += z['sub'] + 4 * s
    h += 9 * s                                                    # separador
    if plan['inc']:
        h += z['inc'] + 5.5 * s
    for _name, _io, desc in plan['tools']:
        h += z['name'] + z['gap_name_desc']
        h += len(wrap(desc, 'Helvetica', z['desc'], tool_inner)) * z['descl']
        h += z['gap_tool']
    h += 15 * s                                                   # footer del card
    return h


def fit_scale(available):
    """Mayor escala con la que la columna más alta cabe en `available`."""
    s = 1.60
    while s > 1.0:
        if max(card_height(p, s) for p in PLANS) <= available:
            return s
        s -= 0.01
    return 1.0


# ----------------------------------------------------------------------- dibujo
def draw_card(c, plan, x, top, height, s):
    z = sizes(s)
    inner = COL - 2 * PAD
    bottom = top - height
    pop = plan['pop']

    c.setFillColor(PANEL)
    c.setStrokeColor(ACCENT if pop else LINE)
    c.setLineWidth(1.4 if pop else 0.7)
    c.roundRect(x, bottom, COL, height, 9, stroke=1, fill=1)

    if pop:
        label = 'RECOMENDADO'
        lsz = 5.4 * s
        bw = stringWidth(label, 'Helvetica-Bold', lsz) + 12
        bh = lsz * 1.6
        c.setFillColor(ACCENT)
        c.roundRect(x + (COL - bw) / 2, top - bh / 2, bw, bh, bh / 2, stroke=0, fill=1)
        c.setFillColor(HexColor('#04231d'))
        c.setFont('Helvetica-Bold', lsz)
        c.drawCentredString(x + COL / 2, top - lsz * 0.35, label)

    tx = x + PAD
    y = top - 11 * s - z['plan'] * 0.82

    c.setFont('Helvetica-Bold', z['plan'])
    c.setFillColor(INK)
    c.drawString(tx, y, plan['name'])
    y -= z['plan'] * 0.35 + z['tagl']

    y = draw_wrapped(c, plan['tag'], tx, y, 'Helvetica-Bold', z['tag'], inner, z['tagl'], ACCENT)
    y = draw_wrapped(c, plan['for'], tx, y, 'Helvetica', z['for'], inner, z['forl'], MUTED)
    y -= 3 * s

    # precio
    c.setFont('Helvetica-Bold', z['price'])
    c.setFillColor(INK)
    c.drawString(tx, y - z['price'] * 0.78, plan['price'])
    c.setFont('Helvetica-Bold', z['per'])
    c.setFillColor(MUTED)
    c.drawString(tx + stringWidth(plan['price'], 'Helvetica-Bold', z['price']) + 2.5,
                 y - z['price'] * 0.78, plan['per'])
    y -= z['price'] + 5 * s

    c.setFont('Helvetica', z['sub'])
    c.setFillColor(MUTED)
    c.drawString(tx, y - z['sub'] * 0.8, plan['sub'])
    y -= z['sub'] + 4 * s

    c.setStrokeColor(LINE)
    c.setLineWidth(0.6)
    c.line(tx, y - 3 * s, tx + inner, y - 3 * s)
    y -= 9 * s

    # "incluye el plan anterior"
    if plan['inc']:
        base = y - z['inc'] * 0.8
        check(c, tx + 0.5, base + 0.6, GOOD, 4.6 * s)
        c.setFont('Helvetica-Bold', z['inc'])
        c.setFillColor(GOOD)
        c.drawString(tx + 8 * s, base, plan['inc'])
        y -= z['inc'] + 5.5 * s

    # tools
    tool_inner = inner - 8.0 * s
    for name, io, desc in plan['tools']:
        base = y - z['name'] * 0.8
        arrow(c, tx + 0.8, base + 0.3, ACCENT, 3.4 * s)
        nx = tx + 8.0 * s
        nsz = name_font_size(name, io, z['name'], tool_inner)
        c.setFont('Courier-Bold', nsz)
        c.setFillColor(INK)
        c.drawString(nx, base, name)
        if io:
            io_badge(c, nx + stringWidth(name, 'Courier-Bold', nsz) + 3.5, base, io, nsz * 0.78)
        y -= z['name'] + z['gap_name_desc']
        # draw_wrapped devuelve la baseline siguiente; se reajusta al tope de línea
        # para que el avance total sea exactamente n_líneas * descl (ver card_height).
        y = draw_wrapped(c, desc, nx, y - z['desc'] * 0.8, 'Helvetica', z['desc'],
                         tool_inner, z['descl'], MUTED) + z['desc'] * 0.8
        y -= z['gap_tool']

    # footer del card
    fy = bottom + 13 * s
    c.setStrokeColor(LINE)
    c.setLineWidth(0.6)
    c.line(tx, fy, tx + inner, fy)
    c.setFont('Helvetica-Bold', z['foot'])
    c.setFillColor(ACCENT2 if pop else MUTED)
    c.drawString(tx, bottom + 5 * s, plan['foot'])


def draw_integration(c, top):
    """Caja de precios de integración: 3 columnas (PLC · ERP · ejemplo) + nota."""
    pad = 10.0
    bw = W - 2 * M
    cw = (bw - 2 * pad - 2 * 14) / 3          # 14pt de aire a cada lado del separador
    nlines = wrap(INTEGRATION['note'], 'Helvetica-Oblique', 6.0, bw - 2 * pad)
    rows = max(len(rr) for _, rr in INTEGRATION['cols'])
    bh = 9 + 8.4 + 3 + 8.6 + rows * 8.4 + 3 + len(nlines) * 7.4 + 8

    bottom = top - bh
    c.setFillColor(DARKBOX)
    c.setStrokeColor(ACCENT2)
    c.setLineWidth(0.6)
    c.roundRect(M, bottom, bw, bh, 4, stroke=1, fill=1)

    y = top - 9 - 6.2
    c.setFont('Helvetica-Bold', 7.2)
    c.setFillColor(ACCENT2)
    c.drawString(M + pad, y, INTEGRATION['title'])
    y -= 8.4 + 3

    head_y = y
    for i, (title, rows_) in enumerate(INTEGRATION['cols']):
        x = M + pad + i * (cw + 14)
        xr = x + cw
        if i:                                  # separador vertical
            c.setStrokeColor(HexColor('#3c5484'))   # LINE no contrasta sobre DARKBOX
            c.setLineWidth(0.5)
            c.line(x - 7, bottom + len(nlines) * 7.4 + 11, x - 7, head_y + 6)

        c.setFont('Helvetica-Bold', 6.4)
        c.setFillColor(ACCENT if i < 2 else GOOD)
        c.drawString(x, head_y, title)
        yy = head_y - 8.6
        for label, value in rows_:
            c.setFont('Helvetica', 6.3)
            c.setFillColor(MUTED)
            c.drawString(x, yy, label)
            c.setFont('Helvetica-Bold', 6.6)
            c.setFillColor(INK)
            c.drawRightString(xr, yy, value)
            yy -= 8.4

    y = head_y - 8.6 - rows * 8.4 - 3
    c.setFont('Helvetica-Oblique', 6.0)
    c.setFillColor(MUTED)
    for ln in nlines:
        c.drawString(M + pad, y, ln)
        y -= 7.4


def build(path):
    c = canvas.Canvas(str(path), pagesize=A4)
    c.setTitle('IsoTools — Planes y tools · ISO 9001')
    c.setAuthor('IsoTools')
    c.setSubject('One-pager de planes SaaS y catálogo de tools para ISO 9001')

    # fondo: mismo degradado vertical del deck (bg arriba -> bg2 abajo)
    c.setFillColor(BG)
    c.rect(0, 0, W, H, stroke=0, fill=1)
    c.linearGradient(W / 2, H, W / 2, 0, (BG, BG2), extend=True)

    y = H - M

    # marca
    c.setFillColor(ACCENT)
    c.roundRect(M, y - 21, 21, 21, 5.5, stroke=0, fill=1)
    c.setFillColor(HexColor('#04231d'))
    c.setFont('Helvetica-Bold', 13)
    c.drawCentredString(M + 10.5, y - 14.6, 'I')
    c.setFillColor(INK)
    c.setFont('Helvetica-Bold', 13)
    c.drawString(M + 28, y - 14.6, 'IsoTools')
    c.setFillColor(MUTED)
    c.setFont('Helvetica', 7.6)
    c.drawRightString(W - M, y - 14.6, 'Plataforma de auditoría autónoma con IA  ·  ISO 9001')
    y -= 32

    # kicker
    c.setStrokeColor(ACCENT)
    c.setLineWidth(1.6)
    c.line(M, y - 3, M + 22, y - 3)
    c.setFillColor(ACCENT)
    c.setFont('Helvetica-Bold', 6.8)
    c.drawString(M + 28, y - 5.6, 'P R O D U C T O   B A S E   ·   1 7   T O O L S')
    y -= 19

    # título
    c.setFont('Helvetica-Bold', 22)
    c.setFillColor(INK)
    t1 = 'Tres planes. '
    c.drawString(M, y - 17, t1)
    c.setFillColor(ACCENT)
    c.drawString(M + stringWidth(t1, 'Helvetica-Bold', 22), y - 17, 'Cada uno incluye el anterior.')
    y -= 28

    c.setFont('Helvetica', 8.4)
    c.setFillColor(MUTED)
    c.drawString(M, y - 7, 'Cada tool es un módulo autónomo que publica su evidencia en la '
                           'plataforma; las demás la consumen y encadenan el trabajo solas.')
    y -= 12

    # el punto que siempre pregunta el cliente con varias líneas
    c.setFont('Helvetica-Bold', 8.4)
    c.setFillColor(ACCENT)
    t = 'El plan se cobra por planta, no por línea: '
    c.drawString(M, y - 7, t)
    c.setFont('Helvetica', 8.4)
    c.setFillColor(INK)
    c.drawString(M + stringWidth(t, 'Helvetica-Bold', 8.4), y - 7,
                 'una sola suscripción cubre todas las líneas del sitio. '
                 'Lo que escala por máquina es la integración.')
    y -= 20

    # cards, escaladas para llenar la página
    top = y
    s = fit_scale(top - RESERVE)
    hmax = max(card_height(p, s) for p in PLANS)
    for i, plan in enumerate(PLANS):
        draw_card(c, plan, M + i * (COL + GAP), top, hmax, s)

    # leyenda
    ly = top - hmax - 18
    c.setStrokeColor(LINE)
    c.setLineWidth(0.6)
    c.line(M, ly + 9, W - M, ly + 9)

    for kind, title, tools in LEGEND:
        bw = io_badge(c, M, ly - 4, kind, 5.6)
        c.setFont('Helvetica-Bold', 6.8)
        c.setFillColor(INK)
        c.drawString(M + bw + 5, ly - 4, title + ':')
        tw = stringWidth(title + ':', 'Helvetica-Bold', 6.8)
        c.setFont('Courier', 6.3)
        c.setFillColor(MUTED)
        x0 = M + bw + 10 + tw
        lines = wrap(tools, 'Courier', 6.3, W - M - x0)
        c.drawString(x0, ly - 4, lines[0])
        yy = ly - 4
        for ln in lines[1:]:
            yy -= 7.8
            c.drawString(M + bw + 5, yy, ln)
        ly = yy - 11

    draw_integration(c, ly)

    # pie
    c.setFont('Helvetica', 6.0)
    c.setFillColor(MUTED)
    c.drawString(M, 18, 'IsoTools  ·  Precios en USD, suscripción mensual por sitio.  '
                        'Documento interno de referencia comercial.')
    c.drawRightString(W - M, 18, 'isotools-production.up.railway.app')

    c.showPage()
    c.save()
    return s


if __name__ == '__main__':
    out = Path(__file__).resolve().parent / 'IsoTools-one-pager-planes.pdf'
    scale = build(out)
    print(f'ok (escala {scale:.2f}) -> {out}')
