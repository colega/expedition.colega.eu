// Redondeos y materiales: es lo que separa una maqueta de un camion.
//
// Las cajas de expedicion llevan las esquinas verticales redondeadas y el borde
// del techo tambien. La cabina, igual. Aqui se buscan esas aristas por geometria
// y se les aplica un radio, y despues se asigna un material a cada cuerpo. Los
// colores de cada material estan en materiales.js.
import { redondear } from './geo.js';
import { C } from './cabina.js';

// R34: el borde de techo baja de 60 a 40. El techo es una pieza suelta de
// 50 mm de canto, y un redondeo de 60 no cabe en 50. Las esquinas verticales
// se quedan en 120 porque los costados envuelven la esquina.
const RADIOS = { caja_vertical: 120.0, caja_techo: 40.0, cabina_vertical: 150.0, cabina_techo: 90.0 };

// El material de cada componente, para los cuerpos que no tienen uno propio.
const MATERIALES = {
  paredes: 'Verde militar',
  cabina: 'Verde militar',
  chasis: 'Negro chasis',
  ruedas: 'Goma',
  remates: 'Aluminio anodizado',
  bajos: 'Negro chasis',
  techo: 'Aluminio anodizado',
  puerta_lateral: 'Aluminio',

  instalaciones_bano: 'Esmalte blanco',
  // R27: la carpinteria es de plastico blanco lacado
  cama: 'Blanco lacado',
  alto_pies: 'Blanco lacado',
  rampa: 'Acero',
  alto_cabina: 'Blanco lacado',
  encimera: 'Blanco lacado',
  altos_cocina: 'Blanco lacado',
  sofa: 'Blanco lacado',
  mesa: 'Blanco lacado',
  altos_comedor: 'Blanco lacado',
  escalon_cama: 'Blanco lacado',
  alto_almohadas: 'Blanco lacado',
  aparador: 'Blanco lacado',
  // R103: la ducha giratoria y, en la v17, la plataforma del inodoro y su
  // armario
  ducha_cerrada: 'Blanco lacado',
  ducha_abierta: 'Blanco lacado',
  plataforma_wc: 'Roble',
  armario_wc: 'Blanco lacado',
  alto_bano: 'Blanco lacado',              // R107
  toallero: 'Esmalte blanco',          // R106
  tabiques_y_puerta: 'Blanco lacado',
  fregadero: 'Inox',
  vitroceramica: 'Esmalte negro',
  suelo_elevado: 'Roble',
};

// El de un cuerpo con nombre propio, que manda sobre todo lo demas.
const CUERPO_MATERIAL = {
  // R101: la tapa del escalon es donde se pisa, asi que va en la madera del
  // suelo y no en el lacado del resto del mueble
  escalon_cama_techo: 'Roble',
  parabrisas: 'Vidrio',
  calandra: 'Negro mate',
  parachoques: 'Negro mate',
  espejo_izq: 'Negro mate',
  espejo_der: 'Negro mate',
  faro_izq: 'Vidrio oscuro',
  faro_der: 'Vidrio oscuro',
  llanta_trasero_izq: 'Aluminio',
  llanta_trasero_der: 'Aluminio',
  llanta_delantero_izq: 'Aluminio',
  llanta_delantero_der: 'Aluminio',
  buje_trasero_izq: 'Acero',
  buje_trasero_der: 'Acero',
  buje_delantero_izq: 'Acero',
  buje_delantero_der: 'Acero',
  zocalo_izq: 'Aluminio',
  zocalo_der: 'Aluminio',
  zocalo_izq_delante: 'Aluminio',     // partido por la puerta (R99)
  espejo_lavabo: 'Cromo',                    // R103
  bisagra_ducha: 'Aluminio',          // R103
  remate_techo_izq: 'Aluminio',
  remate_techo_der: 'Aluminio',
  paragolpes_trasero: 'Acero',
  piloto_trasero_izq: 'Piloto rojo',
  piloto_trasero_der: 'Piloto rojo',
  hoja: 'Verde militar',
  escape: 'Acero',
  escape_salida: 'Inox',
  garrafa_1: 'Verde garrafa',
  garrafa_2: 'Verde garrafa',
  colchon: 'Tela clara',
  parasol: 'Negro mate',
  puerta_tirador: 'Inox',     // R10 de la v17
};

// Por el principio del nombre, que manda sobre el del componente.
const POR_PREFIJO = [
  ['vidrio', 'Vidrio'],
  ['ventanilla', 'Vidrio'],
  // guardabarros y faldillas, delante y detras, en plastico negro
  ['guardabarros', 'Negro mate'],
  ['faldilla', 'Negro mate'],
  // los peldaños de la cabina y los focos del techo (R108)
  ['peldano', 'Aluminio'],
  ['foco_soporte', 'Negro mate'],
  ['foco_', 'Cromo'],
  // R90: las ventanas de Outbound tienen el marco negro
  ['ra_', 'Negro mate'],
  // R96: y su persiana, a juego
  ['ch_', 'Negro mate'],
  // R99: y el marco de la puerta, con la hoja del color de la caja
  ['de_', 'Negro mate'],
  // R49: las almohadas van por prefijo y no por contenido, que
  // 'alto_almohadas' tambien lleva la palabra dentro y el armario salia
  // forrado de tela
  ['almohada', 'Tela clara'],
  // R27 y R34: por dentro se ve el aislamiento, que va en seis piezas
  ['aisl_', 'Blanco lacado'],
  // R54: los listones de la rampa son madera vista
  ['rampa_liston', 'Roble'],
  // R37: la tapa de arriba esta en el componente 'techo', que es de aluminio,
  // pero el panel de la caja sigue siendo verde
  ['panel_', 'Verde militar'],
  // R10: los carriles de la corredera del baño
  ['carril_', 'Aluminio'],
  // R10 de la v17: las bisagras de la puerta abatible
  ['puerta_bisagra', 'Aluminio'],
  ['puerta_metacrilato', 'Metacrilato'],
  ['grifo', 'Cromo'], ['ducha_', 'Cromo'], ['desague', 'Cromo'],
];

// Por un trozo del nombre en cualquier sitio, si no hay prefijo que valga.
const POR_CONTIENE = [
  ['cojin', 'Tela gris'], ['respaldo', 'Tela gris'],
  // antes que 'colchon', que si no la colchoneta cae en esa
  ['colchoneta', 'Tela gris'], ['colchon', 'Tela clara'],
  ['placa_solar', 'Fotovoltaico'], ['aire_', 'Blanco mate'],
  ['_cajon_', 'Gris lacado'], ['_puerta_', 'Gris lacado'],
];

const cerca = (a, b, tol = 1.0) => Math.abs(a - b) < tol;

// La direccion de una arista recta: 'x', 'y', 'z' u otra.
function direccion(e, tolerancia = 0.02) {
  if (e.geomType !== 'LINE') return null;
  const d = e.endPoint.sub(e.startPoint).normalized();
  if (Math.abs(Math.abs(d.z) - 1.0) < tolerancia) return 'z';
  if (Math.abs(d.z) > tolerancia) return null;
  if (Math.abs(Math.abs(d.x) - 1.0) < tolerancia) return 'x';
  if (Math.abs(Math.abs(d.y) - 1.0) < tolerancia) return 'y';
  return null;
}
const esHorizontal = (e) => direccion(e) === 'x' || direccion(e) === 'y';

function redondeos(modelo) {
  // R34: la envolvente va partida en piezas, asi que cada una se redondea por
  // su cuenta. Las esquinas verticales las tienen el suelo, el techo y los dos
  // costados, que son los que envuelven la esquina; el borde de arriba lo tiene
  // solo el techo. R37: la tapa de arriba vive en el componente 'techo'.
  const paredes = modelo.buscar('paredes');
  const techo = modelo.buscar('techo');
  const pieza = (nombre) => paredes.cuerpo(nombre) || techo.cuerpo(nombre);
  for (const nombre of ['panel_suelo', 'panel_techo', 'panel_costado_izq', 'panel_costado_der']) {
    redondear(pieza(nombre), RADIOS.caja_vertical, (e) => direccion(e) === 'z'
      && cerca(Math.abs(e.startPoint.x), 2350) && cerca(Math.abs(e.startPoint.y), 1250));
  }
  // la cara de fuera del techo, de la regla (R1)
  redondear(pieza('panel_techo'), RADIOS.caja_techo, (e) => esHorizontal(e)
    && cerca(e.startPoint.z, modelo.reglas.TECHO_EXT)
    && (cerca(Math.abs(e.startPoint.y), 1250) || cerca(Math.abs(e.startPoint.x), 2350)));

  // esquinas de la cabina
  const cabina = modelo.buscar('cabina').cuerpo('cabina');
  redondear(cabina, RADIOS.cabina_vertical, (e) => direccion(e) === 'z'
    && cerca(e.startPoint.x, C.frontal) && cerca(Math.abs(e.startPoint.y), C.ancho / 2));
  // las dos aristas del techo, la de detras y la de encima del parabrisas, que
  // cruzan la cabina entera. Van de una en una, y la que no cabe se apunta.
  const techoCabina = cabina.forma.edges.filter((e) => esHorizontal(e) && cerca(e.startPoint.z, C.techo)
    && e.endPoint.sub(e.startPoint).Length > C.ancho - 1).map((e) => [e.startPoint, e.endPoint]);
  modelo.notas.redondeos_fallidos = [];
  for (const [a, b] of techoCabina) {
    try {
      redondear(cabina, RADIOS.cabina_techo, (e) => cerca(e.startPoint.x, a.x, 1e-3) && cerca(e.endPoint.x, b.x, 1e-3)
        && cerca(e.startPoint.z, a.z, 1e-3) && cerca(e.endPoint.z, b.z, 1e-3) && esHorizontal(e));
    } catch {
      modelo.notas.redondeos_fallidos.push(`cabina: techo en x ${a.x}, radio ${RADIOS.cabina_techo}`);
    }
  }
}

export function materialDe(comp, cuerpo) {
  const especifico = CUERPO_MATERIAL[cuerpo.nombre];
  if (especifico) return especifico;
  const prefijo = POR_PREFIJO.find(([p]) => cuerpo.nombre.startsWith(p));
  if (prefijo) return prefijo[1];
  const trozo = POR_CONTIENE.find(([t]) => cuerpo.nombre.includes(t));
  if (trozo) return trozo[1];
  return MATERIALES[comp.nombre] || null;
}

export function acabado(modelo) {
  redondeos(modelo);
  for (const { comp, cuerpo } of modelo.todos()) cuerpo.material = materialDe(comp, cuerpo);
}
