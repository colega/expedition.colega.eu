// Carpinteria del interior de la caja, agrupada por mueble.
//
// Cada mueble sale como un componente propio, asi que en el visor se puede
// ocultar como una unidad. Las cotas salen del reglas.js de su version y van en el
// marco del modelo: x hacia la cabina, y hacia el costado de la cocina y z
// desde el suelo interior de la caja.
//
// De la trasera a la cabina:
//   - costado de la cocina: encimera con sus altos, baño y colchoneta de los
//     perros
//   - costado de la puerta: sofa en L con la mesa, aparador, puerta de la caja
//     y almohadas
//   - contra la cabina, la cama atravesada, con sus altos en U
import * as R from './reglas.js';
import {
  COCINA, COMEDOR, DORMITORIO, BANO as RUTA_BANO, INTERIOR,
  caja as cajaForma, cilindro as cilindroForma, placa as placaForma,
  prisma as prismaForma, envolvente, muros, ord, redondear,
} from '../../modelo/geo.js';

const ALTO = R.ALTO_INTERIOR;
const ESPESOR = R.ESPESOR;
const SUELO = R.PISO;                      // R3: donde posan los muebles
const { TRASERA, FRONTAL, COSTADO_PUERTA, COSTADO_COCINA } = R;
const VUELO = R.FRENTE.vuelo;

// ------------------------------------------------------------------- planta
// R84: la carcasa de la encimera acaba donde empieza su tablero
export const COTA_ENCIMERA = SUELO + R.ENCIMERA.hueco + R.ENCIMERA.tablero;
const CAMA_PIES = R.CAMA_PIES;

// El baño, de fuera a fuera y por dentro (R32). HACIA va de la pared de la
// caja al pasillo, y s mide esa distancia desde la pared.
const BANO = R.BANO;
const BANO_T = BANO.espesor;
const BANO_DENTRO = { x: [BANO.x[0] + BANO_T, BANO.x[1] - BANO_T],
  y: ord(BANO.y_fondo, BANO.y_muro) };
const HACIA = BANO.y_fondo > BANO.y_muro ? -1.0 : 1.0;
const BANO_MURO = ord(BANO.y_muro, BANO.y_muro + HACIA * BANO_T);
const BANO_ANCHO = Math.abs(BANO.y_muro - BANO.y_fondo);
// R70: el chaflan de la esquina, y lo que entra hacia dentro contando el
// grueso del tabique: un corte a 45 grados de un tabique de t se mete
// t * (raiz de 2 - 1) mas de lo que dice el chaflan
const BANO_CHAFLAN = BANO.chaflan;
const BANO_CHAFLAN_DENTRO = BANO_CHAFLAN + BANO_T * (Math.SQRT2 - 1);

// La y a s de la pared de la caja, hacia el pasillo.
const banoY = (s) => BANO.y_fondo + HACIA * s;
const banoYs = (a, b) => ord(banoY(a), banoY(b));

// R103: la puerta giratoria de la ducha
const DG = R.DUCHA_GIRATORIA;
const DG_EJE_S = DG.grueso / 2.0;          // eje de la puerta, pegada a la pared
const DG_LARGO = DG.largo;
// cerrada llega a su holgura de la columna de la cocina
const DG_BISAGRA_X = BANO_DENTRO.x[0] + DG.columna + DG.holgura + DG_LARGO + DG.grueso / 2.0;
const DG_PLATO_X = [BANO_DENTRO.x[0], DG_BISAGRA_X + DG.grueso / 2.0];
// el plato se queda antes de la corredera (R10)
const DG_S_MAX = BANO_ANCHO - BANO.retranqueo;
const DG_TECHO_HOJA = ALTO - DG.holgura;
// R103c: el inodoro, en el suelo de la casa, de espaldas a la pared de la caja
// y centrado entre el tablero de la ducha y el tabique de la cama
const INODORO = R.INODORO;
const X_WC = (DG_PLATO_X[1] + ESPESOR + BANO_DENTRO.x[1]) / 2.0;
const BANO_INODORO = { x: [X_WC - INODORO.ancho / 2.0, X_WC + INODORO.ancho / 2.0],
  y: banoYs(0.0, INODORO.fondo), z: [SUELO, SUELO + INODORO.alto] };
const INODORO_PARED = ['y', HACIA < 0 ? 1 : 0];                 // la de la caja

// R93: las ventanas, cada una centrada en lo suyo y rematando con las de su
// costado
const DINTEL = { 'ancho+': R.dintelVentanas(R.ALTOS_BAJO_COCINA),
  'ancho-': R.dintelVentanas(R.ALTOS_BAJO_COMEDOR) };
const CENTRO_VENTANA = {
  ventana_cocina: (TRASERA + BANO.x[0]) / 2.0,
  // R93: con su persiana a su holgura del tabique de la cama
  ventana_bano: BANO_DENTRO.x[1] - R.VENTANA_BANO_TABIQUE - R.persianaCh('RA-03').fuera[1] / 2.0,
  ventana_perros: (CAMA_PIES + FRONTAL) / 2.0,
  ventana_comedor: (TRASERA + R.SOFA.fin_x) / 2.0,
  ventana_almohadas: R.VENTANA_ALMOHADAS_X,
};

// el modelo sobre el que se trabaja, y lo que se apunta de cada mueble
let M = null;
let resumen = {};

// --------------------------------------------------------------- primitivas
const componente = (nombre, ruta) => M.nuevo(ruta, nombre);

function bloque(comp, nombre, x, y, z) {
  const forma = cajaForma(x, y, z);
  return forma ? comp.poner(nombre, forma) : null;
}

// Cilindro vertical. centro es [x, y] y la base va en z = alto[0].
function cilindro(comp, nombre, centro, alto, radio) {
  return comp.poner(nombre, cilindroForma(centro, alto, radio));
}

// Corta un cuerpo con otro del mismo componente, que se gasta en el corte.
function restar(comp, objetivo, herramienta) {
  comp.quitar(herramienta);
  return comp.restar(objetivo, herramienta.forma);
}

// Une un cuerpo con otro del mismo componente, que desaparece en la union.
function unir(comp, objetivo, herramienta) {
  comp.quitar(herramienta);
  return comp.unir(objetivo, herramienta.forma);
}

// Extruye una seccion [[a, z], ...] por un eje horizontal, centrada en centro.
// Sirve para piezas que no son cajas, como el respaldo trapezoidal del sofa.
function prisma(comp, nombre, eje, centro, longitud, seccion) {
  return comp.poner(nombre, prismaForma(eje, centro, longitud, seccion));
}

function apuntar(comp, nombre, espesor, ancho, largo) {
  const r1 = (v) => Math.round(v * 10) / 10;
  M.despiece.push({ mueble: comp.nombre, pieza: nombre, espesor: r1(espesor),
    largo: r1(largo), ancho: r1(ancho), area_m2: Math.round(largo * ancho / 1e3) / 1e3 });
}

const tres = (x, y, z) => [x[1] - x[0], y[1] - y[0], z[1] - z[0]].sort((a, b) => a - b);

// Un tablero: un bloque que ademas va al despiece.
function panel(comp, nombre, x, y, z) {
  const cuerpo = bloque(comp, nombre, x, y, z);
  if (cuerpo) apuntar(comp, nombre, ...tres(x, y, z));
  return cuerpo;
}

// Extruye un contorno en planta entre dos cotas (R69).
//
// El despiece la cuenta por su rectangulo envolvente, que es la plancha de la
// que sale; con una pieza que dobla, como la esquina del baño (R70), hay que
// darle el desarrollo a mano.
function placa(comp, nombre, contorno, z, despiece = null) {
  const cuerpo = comp.poner(nombre, placaForma(contorno, z));
  if (despiece === null) {
    const xs = contorno.map((p) => p[0]);
    const ys = contorno.map((p) => p[1]);
    apuntar(comp, nombre, ...tres([Math.min(...xs), Math.max(...xs)],
      [Math.min(...ys), Math.max(...ys)], z));
  } else {
    apuntar(comp, nombre, ...despiece);
  }
  return cuerpo;
}

function envolventeDe(cajas) {
  const salida = {};
  for (const eje of ['x', 'y', 'z']) {
    salida[eje] = [Math.min(...cajas.map((c) => c[eje][0])), Math.max(...cajas.map((c) => c[eje][1]))];
  }
  return salida;
}

// Cota de una pared del mueble y el sentido que apunta hacia dentro.
function cara(c, [eje, lado]) {
  return [c[eje][lado], lado === 1 ? -1.0 : 1.0];
}

// Cara que da a la pared mas cercana: ahi va la trasera del mueble.
//
// Cuando dos caras estan a la misma distancia gana la primera de la lista,
// que no tiene por que ser la que interesa. Con forzada se dice cual es la
// trasera y se acaba la discusion.
function caraTrasera(c, forzada = null) {
  if (forzada) return forzada;
  const distancias = [
    [['x', 0], c.x[0] - TRASERA],
    [['x', 1], FRONTAL - c.x[1]],
    [['y', 0], c.y[0] - COSTADO_PUERTA],
    [['y', 1], COSTADO_COCINA - c.y[1]],
  ];
  let mejor = distancias[0];
  for (const d of distancias) if (d[1] < mejor[1]) mejor = d;
  return mejor[0];
}

const otroEje = (eje) => (eje === 'x' ? 'y' : 'x');

// Arma {x, y, z} a partir de los tramos de un eje, del otro horizontal y de z.
const ejes = (eje, a, otro, b, z) => ({ [eje]: a, [otro]: b, z });

// ------------------------------------------------------------ carpinteria
// Caja de paneles con el frente abierto, la trasera contra la pared.
//
// reborde es lo que los costados suben por encima del techo (R100). Con
// delantera el frente se cierra con una tapa como la trasera (R101).
function carcasa(comp, nombre, c, { t = ESPESOR, trasera = null, reborde = 0.0, delantera = false } = {}) {
  const [eje, lado] = caraTrasera(c, trasera);
  const otro = otroEje(eje);
  let tras, dentro;
  if (lado === 0) {
    tras = [c[eje][0], c[eje][0] + t]; dentro = [c[eje][0] + t, c[eje][1]];
  } else {
    tras = [c[eje][1] - t, c[eje][1]]; dentro = [c[eje][0], c[eje][1] - t];
  }
  let e = ejes(eje, tras, otro, c[otro], c.z);
  panel(comp, nombre + '_trasera', e.x, e.y, e.z);
  if (delantera) {
    const delante = lado === 0 ? [dentro[1] - t, dentro[1]] : [dentro[0], dentro[0] + t];
    dentro = lado === 0 ? [dentro[0], dentro[1] - t] : [dentro[0] + t, dentro[1]];
    e = ejes(eje, delante, otro, c[otro], c.z);
    panel(comp, nombre + '_delantera', e.x, e.y, e.z);
  }
  [c[otro][0], c[otro][1] - t].forEach((extremo, k) => {
    e = ejes(eje, dentro, otro, [extremo, extremo + t], [c.z[0], c.z[1] + reborde]);
    panel(comp, `${nombre}_costado${k + 1}`, e.x, e.y, e.z);
  });
  const entre = [c[otro][0] + t, c[otro][1] - t];
  for (const [etiqueta, z] of [['suelo', [c.z[0], c.z[0] + t]], ['techo', [c.z[1] - t, c.z[1]]]]) {
    e = ejes(eje, dentro, otro, entre, z);
    panel(comp, `${nombre}_${etiqueta}`, e.x, e.y, e.z);
  }
}

const cerca = (a, b, tol = 1e-3) => Math.abs(a - b) < tol;
const mismoPunto = (p, q) => cerca(p.x, q.x) && cerca(p.y, q.y) && cerca(p.z, q.z);
const esArista = (e, [p, q]) => (mismoPunto(e.startPoint, p) && mismoPunto(e.endPoint, q))
  || (mismoPunto(e.startPoint, q) && mismoPunto(e.endPoint, p));

// Redondea el canto de arriba de la punta de cada costado (R100).
//
// La punta es la que queda mas lejos de la trasera, o sea la del paso.
function redondearPunta(comp, nombre, radio) {
  const tb = envolvente(comp.cuerpo(nombre + '_trasera').forma);
  for (const k of [1, 2]) {
    const cuerpo = comp.cuerpo(`${nombre}_costado${k}`);
    const bb = envolvente(cuerpo.forma);
    const luces = { x: bb.x[1] - bb.x[0], y: bb.y[1] - bb.y[0] };
    const largo = luces.x >= luces.y ? 'x' : 'y';  // el eje que va de la pared al paso
    const trasera = (tb[largo][0] + tb[largo][1]) / 2.0;
    const corta = Math.min(luces.x, luces.y);
    let mejor = null, lejos = -1.0;
    for (const arista of cuerpo.forma.edges) {
      const a = arista.startPoint, b = arista.endPoint;
      // solo los cantos cortos de la cara de arriba, los del espesor
      if (Math.abs(a.z - bb.z[1]) > 1e-3 || Math.abs(b.z - bb.z[1]) > 1e-3
          || a.sub(b).Length > corta + 1e-3) continue;
      const d = Math.abs((a[largo] + b[largo]) / 2.0 - trasera);
      if (d > lejos) { mejor = [a, b]; lejos = d; }
    }
    redondear(cuerpo, radio, (e) => esArista(e, mejor));
  }
}

function estante(comp, nombre, c, cotas, trasera = null) {
  const [eje, lado] = caraTrasera(c, trasera);
  const otro = otroEje(eje);
  const dentro = lado === 0 ? [c[eje][0] + ESPESOR, c[eje][1]] : [c[eje][0], c[eje][1] - ESPESOR];
  const entre = [c[otro][0] + ESPESOR, c[otro][1] - ESPESOR];
  cotas.forEach((z, k) => {
    const e = ejes(eje, dentro, otro, entre, [z, z + ESPESOR]);
    panel(comp, `${nombre}_estante${k + 1}`, e.x, e.y, e.z);
  });
}

// Caja cerrada por los seis lados: el garaje bajo la cama (R7).
function cerrada(comp, nombre, c, t = ESPESOR) {
  panel(comp, nombre + '_fondo', c.x, c.y, [c.z[0], c.z[0] + t]);
  panel(comp, nombre + '_tapa', c.x, c.y, [c.z[1] - t, c.z[1]]);
  const dentroZ = [c.z[0] + t, c.z[1] - t];
  panel(comp, nombre + '_frontal', [c.x[0], c.x[0] + t], c.y, dentroZ);
  panel(comp, nombre + '_trasera', [c.x[1] - t, c.x[1]], c.y, dentroZ);
  const dentroX = [c.x[0] + t, c.x[1] - t];
  panel(comp, nombre + '_costado1', dentroX, [c.y[0], c.y[0] + t], dentroZ);
  panel(comp, nombre + '_costado2', dentroX, [c.y[1] - t, c.y[1]], dentroZ);
}

// Puerta o cajon: panel que sobresale del frente del mueble.
function frente(comp, nombre, c, eje, lado, rango, z) {
  const cara_ = lado === 1 ? c[eje][1] : c[eje][0];
  const signo = lado === 1 ? 1 : -1;
  const e = ejes(eje, ord(cara_, cara_ + signo * VUELO), otroEje(eje), rango, z);
  return panel(comp, nombre, e.x, e.y, e.z);
}

// Tapas y puertas de un mueble, en la cara que da a la habitacion (R26).
//
// La cara de servicio es la contraria a la trasera, que es la que toca la
// pared. bahias parte el frente a lo ancho y bandas a lo alto.
function frentes(comp, nombre, c, { bahias = 1, bandas = null, t = ESPESOR, trasera = null } = {}) {
  const [eje, ladoTrasera] = caraTrasera(c, trasera);
  const lado = ladoTrasera === 1 ? 0 : 1;
  const otro = otroEje(eje);
  const junta = R.FRENTE.junta;
  bandas = bandas || [[c.z[0] + t, c.z[1] - t]];
  const paso = (c[otro][1] - c[otro][0]) / bahias;
  bandas.forEach((banda, i) => {
    for (let k = 0; k < bahias; k++) {
      const rango = [c[otro][0] + paso * k + junta / 2, c[otro][0] + paso * (k + 1) - junta / 2];
      const etiqueta = bandas.length === 1 ? `${nombre}_puerta_${k + 1}` : `${nombre}_tapa_${i + 1}_${k + 1}`;
      frente(comp, etiqueta, c, eje, lado, rango, banda);
    }
  });
}

// Un mueble de una pieza: carcasa, estantes y puertas.
function mueble(nombre, ruta, c, { trasera = null, puertas = false, bahias = null,
  estantes = [], bandas = null, reborde = null, delantera = false } = {}) {
  const comp = componente(nombre, ruta);
  carcasa(comp, nombre, c, { trasera, reborde: reborde ? reborde.alto : 0.0, delantera });
  if (reborde) redondearPunta(comp, nombre, reborde.radio);
  const alto = c.z[1] - c.z[0];
  const cotas = estantes.map((f) => c.z[0] + alto * f);
  if (cotas.length) estante(comp, nombre, c, cotas, trasera);
  if (puertas) {
    frentes(comp, nombre, c, { trasera, bandas, bahias: Math.trunc(bahias || R.FRENTE.bahias_altos) });
  }
  resumen[nombre] = comp.cuerpos.length;
  return comp;
}

// Un alto contra la pared, con sus puertas (R80).
function altoDePared(nombre, ruta, c, { trasera = null, t = ESPESOR } = {}) {
  const comp = componente(nombre, ruta);
  carcasa(comp, nombre, c, { t, trasera });
  frentes(comp, nombre, c, { trasera, t, bahias: Math.trunc(R.FRENTE.bahias_altos) });
  resumen[nombre] = comp.cuerpos.length;
  return comp;
}

// Suelo elevado: tablero, cerco perimetral y travesaños (R3).
function plataforma(comp, nombre, c) {
  const t = ESPESOR;
  const tablero = [c.z[1] - t, c.z[1]];
  const cerco = [c.z[0], tablero[0]];
  panel(comp, nombre + '_tablero', c.x, c.y, tablero);
  panel(comp, nombre + '_cerco_x0', [c.x[0], c.x[0] + t], c.y, cerco);
  panel(comp, nombre + '_cerco_x1', [c.x[1] - t, c.x[1]], c.y, cerco);
  for (const [lado, banda] of [[0, [c.y[0], c.y[0] + t]], [1, [c.y[1] - t, c.y[1]]]]) {
    panel(comp, `${nombre}_cerco_y${lado}`, [c.x[0] + t, c.x[1] - t], banda, cerco);
  }
  const largo = c.x[1] - c.x[0] - 2 * t;
  const huecos = Math.max(1, Math.trunc(largo / R.SUELO_ELEVADO.travesanos + 0.999));
  for (let k = 1; k < huecos; k++) {
    const centro = c.x[0] + t + (largo / huecos) * k;
    panel(comp, `${nombre}_travesano${k}`, [centro - t / 2, centro + t / 2],
      [c.y[0] + t, c.y[1] - t], cerco);
  }
}

// ----------------------------------------------------------------- cocina
// Cajones y puertas bajo la encimera, en bahias iguales (R26).
//
// Van en la cara del pasillo, la contraria al costado de la cocina.
function frentesDeEncimera(comp, nombre, c, t = ESPESOR) {
  const conf = R.FRENTE;
  const bahias = Math.trunc(conf.bahias_encimera);
  const junta = conf.junta;
  const [x0, x1] = c.x;
  const paso = (x1 - x0) / bahias;
  const zInt = [c.z[0] + t, c.z[1] - t];
  const zCajon = [zInt[1] - conf.alto_cajon, zInt[1]];
  const zPuerta = [zInt[0], zCajon[0] - junta];
  for (let k = 0; k < bahias; k++) {
    const rango = [x0 + paso * k + junta / 2, x0 + paso * (k + 1) - junta / 2];
    frente(comp, `${nombre}_cajon_${k + 1}`, c, 'y', 0, rango, zCajon);
    frente(comp, `${nombre}_puerta_${k + 1}`, c, 'y', 0, rango, zPuerta);
  }
}

// Abre un hueco en la encimera para el fregadero o la vitro.
function huecoEnTablero(comp, tablero, x, y, z) {
  const herramienta = bloque(comp, 'corte_encimera', x, y, [z[0] - 5, z[1] + 5]);
  restar(comp, tablero, herramienta);
}

// Fregadero embutido: aro, cuba y grifo (R28, R73).
//
// El hueco se abre en el componente de la encimera. hacia va de la pared al
// pasillo.
function fregaderoDeCocina(comp, compEncimera, x, yPared, hacia, cota, tablero) {
  const conf = R.FREGADERO;
  const y = ord(yPared + hacia * conf.pared, yPared + hacia * (conf.pared + conf.fondo));
  huecoEnTablero(compEncimera, tablero, [x[0] + 25, x[1] - 25], [y[0] + 25, y[1] - 25], [cota - 40, cota]);
  bloque(comp, 'fregadero_aro', x, y, [cota - 8, cota]);
  bloque(comp, 'fregadero_cuba', [x[0] + 40, x[1] - 40], [y[0] + 40, y[1] - 40],
    [cota - conf.cuba, cota - 8]);
  const centroX = (x[0] + x[1]) / 2.0;
  // el grifo, del lado de la pared, y el caño hacia el pasillo
  const grifoY = hacia < 0 ? y[1] - 30 : y[0] + 30;
  cilindro(comp, 'fregadero_grifo', [centroX, grifoY], [cota, cota + 260], 18.0);
  bloque(comp, 'fregadero_cano', [centroX - 16, centroX + 16],
    ord(grifoY, grifoY + hacia * 170), [cota + 225, cota + 260]);
}

// Vitroceramica de dos fuegos, atravesada en la encimera (R28).
//
// El lado largo cruza el camion, asi que en el sentido de la marcha solo ocupa
// 300 mm y deja mas encimera libre. xBorde es el canto de la encimera desde
// el que se retranquea.
function vitroceramica(comp, compEncimera, xBorde, yPared, hacia, cota, tablero) {
  const conf = R.VITRO;
  const x = [xBorde + conf.margen, xBorde + conf.margen + conf.ancho];
  const y = ord(yPared + hacia * conf.retranqueo, yPared + hacia * (conf.retranqueo + conf.largo));
  const holgura = conf.holgura_hueco;
  huecoEnTablero(compEncimera, tablero, [x[0] + holgura / 2, x[1] - holgura / 2],
    [y[0] + holgura / 2, y[1] - holgura / 2], [cota - 40, cota]);
  bloque(comp, 'vitro_cristal', x, y, [cota, cota + conf.grueso]);
  const centroX = (x[0] + x[1]) / 2.0;
  for (let k = 0; k < Math.trunc(conf.fuegos); k++) {
    const centroY = yPared + hacia * (conf.retranqueo + conf.largo * (0.28 + 0.44 * k));
    cilindro(comp, `vitro_fuego_${k + 1}`, [centroX, centroY],
      [cota + conf.grueso, cota + conf.grueso + 2], 95.0);
  }
}

// Encimera de la trasera al baño, en dos modulos iguales, y sus altos.
//
// R79, R95 y R84: la carcasa va del suelo al tablero, con el fondo de la
// regla menos lo que vuela el tablero. El fregadero va junto al baño y la
// vitro junto a la trasera (R28).
function cocina() {
  const enc = R.ENCIMERA;
  const fin = BANO.x[0];
  const medio = (TRASERA + fin) / 2.0;
  const y = [COSTADO_COCINA - (enc.fondo - enc.vuelo), COSTADO_COCINA];
  const z = [SUELO, COTA_ENCIMERA - enc.tablero];
  const cajas = [{ x: [TRASERA, medio], y: [...y], z: [...z] },
    { x: [medio, fin], y: [...y], z: [...z] }];
  const comp = componente('encimera', COCINA);
  cajas.forEach((c, k) => carcasa(comp, `encimera_${k + 1}`, c));
  const env = envolventeDe(cajas);
  const tablero = panel(comp, 'encimera_tablero', env.x, [env.y[0] - enc.vuelo, env.y[1]],
    [env.z[1], COTA_ENCIMERA]);
  const f = R.FREGADERO;
  fregaderoDeCocina(componente('fregadero', COCINA), comp,
    [fin - f.margen - f.ancho, fin - f.margen], COSTADO_COCINA, -1.0, COTA_ENCIMERA, tablero);
  vitroceramica(componente('vitroceramica', COCINA), comp,
    TRASERA, COSTADO_COCINA, -1.0, COTA_ENCIMERA, tablero);
  frentesDeEncimera(comp, 'encimera', env);
  resumen.encimera = comp.cuerpos.length;

  // R86: los altos, de la trasera al baño, de tablero de 20 por el horno
  altoDePared('altos_cocina', COCINA,
    { x: [TRASERA, fin], y: [COSTADO_COCINA - R.ALTO_COCINA_FONDO, COSTADO_COCINA],
      z: [R.ALTOS_BAJO_COCINA, ALTO] },
    { trasera: ['y', 1], t: R.ALTO_COCINA.espesor });
}

// ---------------------------------------------------------------- comedor
// Respaldo trapezoidal contra una pared (R19).
//
// eje y lado dicen contra que cara va: la de la pared queda vertical y el
// trapecio engorda hacia la habitacion. rango es el tramo que cubre en el
// otro eje horizontal.
function respaldoTrapecio(comp, nombre, c, eje, lado, z0, z1, rango) {
  const pared = lado === 1 ? c[eje][1] : c[eje][0];
  const signo = lado === 1 ? -1 : 1;
  const r = R.RESPALDO;
  const seccion = [[pared, z0], [pared + signo * r.abajo, z0],
    [pared + signo * r.arriba, z1], [pared, z1]];
  const largo = rango[1] - rango[0];
  const centro = (rango[0] + rango[1]) / 2.0;
  return prisma(comp, nombre, otroEje(eje), centro, largo, seccion);
}

// Modulo de sofa: arcon cerrado con tapa, cojin corrido y respaldos.
//
// paredes es una lista de [eje, lado, rango] con las paredes que llevan
// respaldo. La esquina lleva dos, formando la L.
function moduloSofa(comp, nombre, c, paredes, t = ESPESOR) {
  const suelo = c.z[0];
  const tapaZ = [suelo + R.ASIENTO - R.COJIN_ASIENTO - t, suelo + R.ASIENTO - R.COJIN_ASIENTO];
  panel(comp, nombre + '_fondo', c.x, c.y, [suelo, suelo + t]);
  const dentroZ = [suelo + t, tapaZ[0]];
  [[c.x[0], c.x[0] + t], [c.x[1] - t, c.x[1]]].forEach((x, k) => {
    panel(comp, `${nombre}_lado_x${k + 1}`, x, c.y, dentroZ);
  });
  [[c.y[0], c.y[0] + t], [c.y[1] - t, c.y[1]]].forEach((y, k) => {
    panel(comp, `${nombre}_lado_y${k + 1}`, [c.x[0] + t, c.x[1] - t], y, dentroZ);
  });
  panel(comp, nombre + '_tapa', c.x, c.y, tapaZ);

  const zCojin = [tapaZ[1], tapaZ[1] + R.COJIN_ASIENTO];
  bloque(comp, nombre + '_cojin', [c.x[0] + 15, c.x[1] - 15], [c.y[0] + 15, c.y[1] - 15], zCojin);

  paredes.forEach(([eje, lado, rango], k) => {
    respaldoTrapecio(comp, `${nombre}_respaldo${k + 1}`, c, eje, lado,
      zCojin[1], suelo + R.RESPALDO.alto, rango);
  });
}

// Mesa de altura ajustable: tablero, columna y base (R13).
//
// R69: la esquina del tablero que da al paso de la cocina, la de la x mayor y
// la y mayor, va cortada a 45 grados.
function mesa(comp, nombre, c) {
  const m = R.MESA;
  const tablero = [c.z[1] - m.tablero, c.z[1]];
  const ch = m.chaflan;
  const [x0, x1] = c.x;
  const [y0, y1] = c.y;
  placa(comp, nombre + '_tablero', [[x0, y1], [x1 - ch, y1], [x1, y1 - ch], [x1, y0], [x0, y0]], tablero);
  const cx = (x0 + x1) / 2.0;
  const cy = (y0 + y1) / 2.0;
  bloque(comp, nombre + '_columna', [cx - 45, cx + 45], [cy - 45, cy + 45], [c.z[0] + 20, tablero[0]]);
  bloque(comp, nombre + '_base', [cx - 200, cx + 200], [cy - 160, cy + 160], [c.z[0], c.z[0] + 20]);
}

// Sofa en L, mesa, aparador y alto, en el costado de la puerta.
//
// R20: el tramo largo va de la trasera al aparador y la esquina al extremo
// del lado de la puerta (R77), con el retorno hacia el centro (R82).
function comedor() {
  const s = R.SOFA;
  const fin = s.fin_x, fondo = s.fondo;
  const yLargo = [COSTADO_PUERTA, COSTADO_PUERTA + fondo];
  const tramo = { x: [TRASERA, fin - fondo], y: [...yLargo], z: [SUELO, SUELO] };
  const esquina = { x: [fin - fondo, fin], y: [...yLargo], z: [SUELO, SUELO] };
  const retorno = { x: [fin - fondo, fin], y: [yLargo[1], yLargo[1] + s.retorno], z: [SUELO, SUELO] };
  const abajo = R.RESPALDO.abajo;
  let comp = componente('sofa', COMEDOR);
  // el respaldo del tramo se retranquea 15 del canto libre, el de la trasera
  moduloSofa(comp, 'sofa_tramo', tramo, [['y', 0, [tramo.x[0] + 15, tramo.x[1]]]]);
  moduloSofa(comp, 'sofa_esquina', esquina,
    [['y', 0, [...esquina.x]], ['x', 1, [esquina.y[0] + abajo, esquina.y[1] - 15]]]);
  moduloSofa(comp, 'sofa_retorno', retorno, [['x', 1, [retorno.y[0], retorno.y[1] - 15]]]);
  resumen.sofa = comp.cuerpos.length;

  const m = R.MESA;
  comp = componente('mesa', COMEDOR);
  mesa(comp, 'mesa', { x: [...m.x], y: [...m.y], z: [SUELO, SUELO + m.alto] });
  resumen.mesa = comp.cuerpos.length;

  // R66: el alto, de la trasera al final del comedor
  altoDePared('altos_comedor', COMEDOR,
    { x: [TRASERA, R.FIN_COMEDOR], y: [COSTADO_PUERTA, COSTADO_PUERTA + R.ALTO_COMEDOR_FONDO],
      z: [R.ALTOS_BAJO_COMEDOR, ALTO] },
    { trasera: ['y', 0] });

  // R36: el aparador, del final del sofa al del comedor y hasta cubrir el
  // retorno, a la altura de la encimera
  const a = R.APARADOR;
  mueble('aparador', COMEDOR,
    { x: [fin, R.FIN_COMEDOR], y: [COSTADO_PUERTA, retorno.y[1]], z: [SUELO, COTA_ENCIMERA] },
    { puertas: true, bahias: a.bahias, estantes: a.estantes, reborde: R.APARADOR_REBORDE });
}

// ------------------------------------------------------------- dormitorio
// Dos almohadas en el extremo del costado de la puerta (R49).
function almohadas(comp, nombre, c, z0) {
  const a = R.ALMOHADA;
  const y = [c.y[0], c.y[0] + a.fondo];
  const libre = c.x[1] - c.x[0] - 2 * a.margen - a.junta;
  const ancho = libre / 2.0;
  for (let k = 0; k < 2; k++) {
    const x0 = c.x[0] + a.margen + k * (ancho + a.junta);
    bloque(comp, `${nombre}${k + 1}`, [x0, x0 + ancho], y, [z0, z0 + a.alto]);
  }
}

// Cama atravesada contra la cabina, sus altos en U y el escalon.
function dormitorio() {
  const cama = R.CAMA;
  const somier = cama.somier;
  const c = { x: [CAMA_PIES, FRONTAL], y: [COSTADO_PUERTA, COSTADO_COCINA], z: [0.0, somier] };
  const comp = componente('cama', DORMITORIO);
  cerrada(comp, 'garaje', c);                                       // R7
  const perros = [...R.CAMA_PERROS];                                // R53
  const colchonZ = [somier, somier + cama.colchon];
  bloque(comp, 'colchon', c.x, [c.y[0], perros[0]], colchonZ);
  bloque(comp, 'colchoneta_perros', c.x, perros, colchonZ);
  almohadas(comp, 'almohada', c, colchonZ[1]);
  resumen.cama = comp.cuerpos.length;

  // R65: los altos en U. El de los pies, sobre los perros, de 422 (R97)
  mueble('alto_pies', DORMITORIO,
    { x: [CAMA_PIES, FRONTAL], y: perros, z: [R.ALTOS_BAJO_COCINA, ALTO] },
    { trasera: ['y', 1], puertas: true });
  // el del fondo, entre las caras de las puertas de los dos de los costados
  const yAlmohadas = [COSTADO_PUERTA, COSTADO_PUERTA + R.ALTO_COMEDOR_FONDO];
  altoDePared('alto_cabina', DORMITORIO,
    { x: [FRONTAL - R.ALTO_FONDO_CAMA, FRONTAL], y: [yAlmohadas[1] + VUELO, perros[0] - VUELO],
      z: [R.ALTOS_BAJO_CAMA, ALTO] });
  // el de las almohadas, con el fondo del alto del comedor (R68)
  mueble('alto_almohadas', DORMITORIO,
    { x: [CAMA_PIES, FRONTAL], y: yAlmohadas, z: [R.ALTOS_BAJO_CAMA, ALTO] },
    { trasera: ['y', 0], puertas: true });

  // R101: el escalon de la esquina, contra la cama y el tabique del baño
  const e = R.ESCALON_CAMA;
  mueble('escalon_cama', DORMITORIO,
    { x: [CAMA_PIES - e.fondo, CAMA_PIES], y: [BANO_MURO[0] - e.ancho, BANO_MURO[0]],
      z: [SUELO, SUELO + e.alto] },
    { trasera: ['x', 1], delantera: true });
}

// R3: de la trasera a los pies de la cama y de costado a costado.
function sueloElevado() {
  const comp = componente('suelo_elevado', INTERIOR);
  plataforma(comp, 'suelo_elevado',
    { x: [TRASERA, CAMA_PIES], y: [COSTADO_PUERTA, COSTADO_COCINA], z: [0.0, SUELO] });
  resumen.suelo_elevado = comp.cuerpos.length;
}

// ------------------------------------------------------------------- baño
// R32: tres tabiques y la puerta de paso; el fondo es la pared de la caja.
function tabiquesYPuerta(bano_) {
  const t = BANO_T;
  const z = [SUELO, ALTO];
  const pz = [z[0], z[0] + BANO.puerta_alto];
  const muro = [...BANO_MURO];
  const dentro = [...BANO_DENTRO.y];
  const puerta = [...BANO.puerta_x];

  // R70: la esquina del lado de la cocina se corta a 45 grados, y los dos
  // tabiques de esa esquina salen como una pieza sola con sus dos ingletes.
  // Las cotas van en (u, v): u a lo largo del tabique de la puerta desde la
  // esquina y v hacia el fondo del baño, que asi el contorno se lee.
  const x0 = BANO.x[0];
  const haciaDentro = -HACIA;                    // del pasillo hacia el baño
  const caraMuro = BANO.y_muro - haciaDentro * t; // cara de fuera del tabique
  const vFondo = haciaDentro * (BANO.y_fondo - caraMuro);
  const uPuerta = puerta[0] - x0;
  const uv = [[0.0, vFondo], [0.0, BANO_CHAFLAN], [BANO_CHAFLAN, 0.0],
    [uPuerta, 0.0], [uPuerta, t], [BANO_CHAFLAN_DENTRO, t],
    [t, BANO_CHAFLAN_DENTRO], [t, vFondo]];
  const desarrollo = (vFondo - BANO_CHAFLAN) + BANO_CHAFLAN * Math.SQRT2 + (uPuerta - BANO_CHAFLAN);
  placa(bano_, 'tabique_esquina', uv.map(([u, v]) => [x0 + u, caraMuro + haciaDentro * v]), z,
    [t, Math.round(desarrollo * 10) / 10, z[1] - z[0]]);
  panel(bano_, 'tabique_puerta_der', [puerta[1], BANO.x[1]], muro, z);
  panel(bano_, 'tabique_puerta_dintel', puerta, muro, [pz[1], z[1]]);
  panel(bano_, 'tabique_lado_cama', [BANO.x[1] - t, BANO.x[1]], dentro, z);

  // R10: la corredera, por dentro del baño, con su carril arriba y el del
  // suelo. La hoja se dibuja cerrada; abierta se corre hasta dejar libre el
  // hueco, y los carriles cubren las dos posiciones.
  const p = R.PUERTA_BANO;
  const hojaX = [puerta[0] - p.solape, puerta[1] + p.solape];
  const carrilX = [hojaX[0], puerta[1] + (hojaX[1] - hojaX[0])];
  const eje = BANO_ANCHO - p.separacion - p.grueso / 2.0;
  const [ancho, alto] = p.carril_suelo;
  bloque(bano_, 'carril_suelo', carrilX, banoYs(eje - ancho / 2.0, eje + ancho / 2.0), [SUELO, SUELO + alto]);
  const [fondo, altoTecho] = p.carril_techo;
  bloque(bano_, 'carril_techo', carrilX, banoYs(BANO_ANCHO - fondo, BANO_ANCHO), [ALTO - altoTecho, ALTO]);
  panel(bano_, 'puerta_metacrilato', hojaX, banoYs(eje - p.grueso / 2.0, eje + p.grueso / 2.0),
    [SUELO + alto + p.holgura, ALTO - altoTecho]);
}

// La puerta giratoria de la ducha, cerrada y abierta (R103).
//
// En fijo van el tablero de la ducha, la bisagra y la columna, en equipo el
// plato y la alcachofa. La puerta, con el lavabo, el grifo, la balda y el
// espejo, se hace dos veces, una por posicion, cada una en su componente. Se
// describe en (u, v): u a lo largo de la hoja desde el eje de la bisagra y v
// hacia la pared de la caja.
function duchaGiratoria(fijo, equipo) {
  const g = DG.grueso, h = DG.holgura;
  const x0 = BANO_DENTRO.x[0];
  const xb = DG_BISAGRA_X, sb = DG_EJE_S;
  const platoZ = SUELO + DG.plato;

  // R103b: el tablero de la ducha, pegado a la bisagra, del suelo al techo,
  // y la columna del hueco de la puerta cerrada
  const x1 = xb + g / 2.0;
  panel(fijo, 'tablero_ducha', [x1, x1 + ESPESOR], banoYs(0.0, DG.fondo), [SUELO, ALTO]);
  cilindro(fijo, 'bisagra_ducha', [xb, banoY(sb)], [platoZ, ALTO], g / 2.0);
  const c = DG.columna;
  panel(fijo, 'columna_ducha_cocina', [x0, x0 + c], banoYs(0.0, g), [platoZ, ALTO]);

  // plato plano, con la esquina del chaflan cortada (R70)
  let contorno = [[x0, 0.0], [DG_PLATO_X[1], 0.0], [DG_PLATO_X[1], DG_S_MAX]];
  const d = BANO_CHAFLAN_DENTRO - BANO_T;
  if (d > BANO.retranqueo) {
    contorno = contorno.concat([[x0 + d - BANO.retranqueo, DG_S_MAX], [x0, BANO_ANCHO - d]]);
  } else {
    contorno.push([x0, DG_S_MAX]);
  }
  placa(equipo, 'plato_ducha', contorno.map(([x, s]) => [x, banoY(s)]), [SUELO, platoZ]);
  const desague = [(x0 + xb - g / 2.0) / 2.0, banoY(BANO_ANCHO / 2.0)];
  cilindro(equipo, 'desague', desague, [platoZ - 8, platoZ + 1], 45.0);
  // la alcachofa, en el centro del tabique de la cocina y encima del desague
  const alc = DG.alcachofa;
  const punta = x0 + alc.brazo;
  bloque(equipo, 'ducha_brazo', [x0, punta], [desague[1] - 12, desague[1] + 12], [alc.z + 20, alc.z + 40]);
  cilindro(equipo, 'ducha_alcachofa', [punta, desague[1]], [alc.z, alc.z + 20], alc.diametro / 2.0);

  const lav = DG.lavabo, bal = DG.balda, esp = DG.espejo;
  for (const estado of ['cerrada', 'abierta']) {
    const comp = componente('ducha_' + estado, RUTA_BANO);

    // cerrada la hoja va hacia la x menor y v hacia la pared; abierta va
    // hacia el pasillo y v mira al plato
    const xs = (u, v) => (estado === 'cerrada'
      ? [[xb - u[1], xb - u[0]], [sb - v[1], sb - v[0]]]
      : [[xb - v[1], xb - v[0]], [sb + u[0], sb + u[1]]]);

    const pieza = (nombre, u, v, z, contar = false) => {
      const [x, s] = xs(u, v);
      const hacer = contar && estado === 'cerrada' ? panel : bloque;
      return hacer(comp, nombre, x, banoYs(...s), z);
    };

    pieza('puerta_ducha', [g / 2.0, g / 2.0 + DG_LARGO], [-g / 2.0, g / 2.0], [platoZ + h, DG_TECHO_HOJA], true);
    // lavabo con su seno, grifo encima, balda y espejo, por la cara del baño
    const mu = lav.ancho / 2.0;
    const cu = DG.fondo - DG_EJE_S + lav.holgura + mu;
    const caraV = -g / 2.0;
    const lavabo = pieza('lavabo', [cu - mu, cu + mu], [caraV - lav.vuelo, caraV],
      [lav.borde - lav.alto, lav.borde]);
    const seno = pieza('lavabo_seno', [cu - mu + 25, cu + mu - 25], [caraV - lav.vuelo + 25, caraV - 40],
      [lav.borde - lav.alto + 25, lav.borde + 5]);
    restar(comp, lavabo, seno);
    pieza('grifo_cuerpo', [cu - 15, cu + 15], [caraV - 30, caraV], [lav.borde, lav.borde + 70]);
    pieza('grifo_cano', [cu - 12, cu + 12], [caraV - 90, caraV - 30], [lav.borde + 45, lav.borde + 70]);
    pieza('balda_lavabo', [cu - mu, cu + mu], [caraV - bal.fondo, caraV],
      [bal.arriba - ESPESOR, bal.arriba], true);
    pieza('espejo_lavabo', [cu - esp.ancho / 2.0, cu + esp.ancho / 2.0], [caraV - esp.grueso, caraV], [...esp.z]);
    resumen['ducha_' + estado] = comp.cuerpos.length;
  }
}

// El Separett Tiny con su forma: una D en planta, de espaldas a la pared
// (R104).
//
// Las piezas se describen en (u, w): u desde la pared hacia el frente y w a lo
// ancho desde el centro. suelo es la cota hasta la que baja el tubo de
// ventilacion, y plataforma_ el componente cuyo tablero atraviesa.
function wcTiny(comp, c, pared, suelo, plataforma_) {
  const m = INODORO;
  const [eje] = pared;
  const otro = otroEje(eje);
  const [muro, dentro] = cara(c, pared);
  const centro = (c[otro][0] + c[otro][1]) / 2.0;
  const z0 = c.z[0];

  const aXY = (u, w) => {
    const q = { [eje]: muro + dentro * u, [otro]: centro + w };
    return [q.x, q.y];
  };

  const cajaUW = (nombre, u, w, z) => {
    const q = { [eje]: ord(muro + dentro * u[0], muro + dentro * u[1]), [otro]: [centro + w[0], centro + w[1]] };
    return bloque(comp, nombre, q.x, q.y, z);
  };

  // La D: recta de u[0] hasta el semicirculo, que acaba en u[1].
  const forma = (nombre, u, ancho, z, radio = 0.0) => {
    const r = ancho / 2.0;
    const recta = u[1] - r;
    const cuerpo = cajaUW(nombre, [u[0], recta], [-r, r], z);
    const frente_ = cilindro(comp, nombre + '_frente', aXY(recta, 0.0), z, r);
    unir(comp, cuerpo, frente_);
    if (radio) {
      // las dos esquinas de la espalda, que son las aristas verticales de u[0]
      const esquinas = [aXY(u[0], -r), aXY(u[0], r)];
      redondear(cuerpo, radio, (e) => {
        const p = e.startPoint, q = e.endPoint;
        if (Math.abs(p.x - q.x) > 1e-3 || Math.abs(p.y - q.y) > 1e-3) return false;
        return esquinas.some(([ex, ey]) => Math.abs(p.x - ex) < 1e-2 && Math.abs(p.y - ey) < 1e-2);
      });
    }
    return cuerpo;
  };

  const a = m.ancho, f = m.fondo;
  const asiento = z0 + m.asiento_alto;
  // zocalo metido, con el hueco del ventilador por detras
  const dz = m.zocalo_dentro;
  forma('wc_zocalo', [m.hueco_ventilador, f - dz], a - 2 * dz, [z0, z0 + m.zocalo]);
  forma('wc_cuerpo', [0.0, f], a, [z0 + m.zocalo, asiento - m.aro], m.radio_espalda);
  const v = m.aro_vuelo;
  forma('wc_aro', [0.0, f + v], a + 2 * v, [asiento - m.aro, asiento], m.radio_espalda);
  forma('wc_tapa', [m.regleta, f], a, [asiento, z0 + m.alto]);
  cajaUW('wc_regleta', [0.0, m.regleta], [-a / 2.0 + 20, a / 2.0 - 20], [asiento, z0 + m.alto - 4]);

  // el tubo de ventilacion, por debajo de la espalda hasta el suelo
  const radio = m.ventilacion / 2.0;
  const punto = aXY(m.salida_ventilacion, 0.0);
  cilindro(comp, 'wc_ventilacion', punto, [suelo, z0 + m.zocalo], radio);
  const tablero = plataforma_.cuerpo(plataforma_.nombre + '_tablero');
  const hueco = cilindro(plataforma_, plataforma_.nombre + '_paso_tubo', punto, [suelo, z0 + 1], radio + 1);
  restar(plataforma_, tablero, hueco);
}

// El toallero electrico, colgado de una pared perpendicular a x (R106).
//
// xPared es la cara del tabique, y el tramo que ocupa a lo ancho y z0 la cota
// de abajo. Mira hacia la x menor.
function toallero(comp, xPared, y, z0) {
  const t = R.TOALLERO;
  const eje = xPared - t.eje_pared;
  const r = t.colector / 2.0;
  const z1 = z0 + t.alto;
  const centrosY = [y[0] + r, y[1] - r];
  centrosY.forEach((cy, k) => cilindro(comp, `toallero_colector_${k + 1}`, [eje, cy], [z0, z1], r));
  let k = 0;
  const medio = t.barra / 2.0;
  for (const [arranque, cuantas] of t.grupos) {
    for (let j = 0; j < cuantas; j++) {
      const zc = z1 - (arranque + j * t.paso);
      k += 1;
      bloque(comp, `toallero_barra_${k}`, [eje - 10.0, eje + 10.0],
        [centrosY[0] + r, centrosY[1] - r], [zc - medio, zc + medio]);
    }
  }
  // los soportes, de la pared a los colectores, junto a la primera y la
  // ultima barra
  const arriba = z1 - t.grupos[0][0];
  const ultimo = t.grupos[t.grupos.length - 1];
  const abajo = z1 - (ultimo[0] + (ultimo[1] - 1) * t.paso);
  k = 0;
  for (const zc of [arriba, abajo]) {
    for (const cy of centrosY) {
      k += 1;
      bloque(comp, `toallero_soporte_${k}`, [eje, xPared], [cy - 12.0, cy + 12.0], [zc - 15.0, zc + 15.0]);
    }
  }
  // el termostato, debajo del colector de la derecha mirando a la pared, que
  // es el de la y menor
  const term = t.termostato;
  cilindro(comp, 'toallero_termostato', [eje, centrosY[0]], [z0 - term.alto, z0], term.diametro / 2.0);
}

// El baño: tabiques, puerta, ducha, inodoro, alto y toallero.
function bano() {
  // R107: el alto de encima de la ventana, del tablero de la ducha al
  // tabique de la cama, con el fondo del tablero
  mueble('alto_bano', RUTA_BANO,
    { x: [DG_PLATO_X[1] + ESPESOR, BANO_DENTRO.x[1]], y: banoYs(0.0, DG.fondo - ESPESOR),
      z: [ALTO - R.ALTO_BANO.alto, ALTO] },
    { trasera: ['y', HACIA < 0 ? 1 : 0], puertas: true, bahias: R.ALTO_BANO.bahias });
  // R106: el toallero, centrado entre la pared de la caja y el tabique de la
  // puerta
  const centroY = banoY(BANO_ANCHO / 2.0);
  const ancho = R.TOALLERO.ancho;
  const comp = componente('toallero', RUTA_BANO);
  toallero(comp, BANO_DENTRO.x[1], [centroY - ancho / 2.0, centroY + ancho / 2.0], R.TOALLERO.z);
  resumen.toallero = comp.cuerpos.length;

  const fijo = componente('tabiques_y_puerta', RUTA_BANO);
  tabiquesYPuerta(fijo);
  const equipo = componente('instalaciones_bano', RUTA_BANO);
  duchaGiratoria(fijo, equipo);
  resumen.tabiques_y_puerta = fijo.cuerpos.length;
  // el tubo del inodoro baja por el suelo elevado hasta el de la caja
  wcTiny(equipo, BANO_INODORO, INODORO_PARED, 0.0, M.buscar('suelo_elevado'));
  resumen.instalaciones_bano = equipo.cuerpos.length;
}

// --------------------------------------------------------------- ventanas
// Marco rectangular en el plano de una pared: cuatro tiras.
//
// centro es [lado, z], fuera y dentro son [alto, ancho] y fondo el tramo en el
// eje de la pared.
export function anillo(comp, nombre, clave, lado, centro, fuera, dentro, fondo) {
  const [cl, cz] = centro;
  const fa = fuera[0] / 2.0, fb = fuera[1] / 2.0;
  const da = dentro[0] / 2.0, db = dentro[1] / 2.0;
  const tiras = [
    ['abajo', [cl - fb, cl + fb], [cz - fa, cz - da]],
    ['arriba', [cl - fb, cl + fb], [cz + da, cz + fa]],
    ['izq', [cl - fb, cl - db], [cz - da, cz + da]],
    ['der', [cl + db, cl + fb], [cz - da, cz + da]],
  ];
  for (const [sufijo, l, z] of tiras) {
    const e = { [clave]: [...fondo], [lado]: l, z };
    bloque(comp, `${nombre}_${sufijo}`, e.x, e.y, e.z);
  }
}

// La ventana de Outbound montada en su hueco (R90).
//
// Todo se mide desde la cara de fuera de la pared hacia dentro: la brida y la
// hoja vuelan 4 por fuera, el cuerpo entra 40 en el rebaje y el escalon de
// dentro llega hasta el paramento.
function ventanaOutbound(comp, c, clave, signo, m) {
  const lado = clave === 'x' ? 'y' : 'x';
  const fueraCara = signo === '+' ? c[clave][1] : c[clave][0];
  const dentroCara = signo === '+' ? c[clave][0] : c[clave][1];
  const hacia = signo === '+' ? -1.0 : 1.0;      // de fuera hacia dentro
  const muro = Math.abs(fueraCara - dentroCara);
  const fondo = (a, b) => ord(fueraCara + hacia * a, fueraCara + hacia * b);

  const centro = [(c[lado][0] + c[lado][1]) / 2.0, (c.z[0] + c.z[1]) / 2.0];
  const canto = m.canto_hoja;
  const cristal = [m.hoja[0] - 2 * canto, m.hoja[1] - 2 * canto];
  anillo(comp, 'ra_brida', clave, lado, centro, m.marco, m.hoja, fondo(-m.brida, 0.0));
  anillo(comp, 'ra_hoja', clave, lado, centro, m.hoja, cristal, fondo(-m.brida, m.fondo_cuerpo));
  anillo(comp, 'ra_cuerpo', clave, lado, centro, m.cuerpo, m.hoja, fondo(0.0, m.fondo_cuerpo));
  // el escalon de dentro: un canto fino y el cristal de dentro a ras del
  // paramento
  const int = m.interior;
  anillo(comp, 'ra_interior', clave, lado, centro, int, [int[0] - 2 * 10.0, int[1] - 2 * 10.0],
    fondo(m.fondo_cuerpo, muro));
  for (const [nombre, tam, tramo] of [
    ['vidrio', cristal, fondo(-m.brida + 1, 3.0)],
    ['vidrio_interior', [int[0] - 20.0, int[1] - 20.0], fondo(muro - 4.0, muro)],
  ]) {
    const e = { [clave]: tramo, [lado]: [centro[0] - tam[1] / 2.0, centro[0] + tam[1] / 2.0],
      z: [centro[1] - tam[0] / 2.0, centro[1] + tam[0] / 2.0] };
    bloque(comp, nombre, e.x, e.y, e.z);
  }
}

// La persiana CH de la ventana (R96), por dentro sobre el paramento.
//
// Va centrada sobre el hueco de paso: un cajon arriba, otro abajo y una guia a
// cada lado, todo con el fondo de fuera del fabricante.
function persianaOutbound(comp, c, clave, signo, m) {
  const ch = R.persianaCh(m.modelo);
  const lado = clave === 'x' ? 'y' : 'x';
  const dentroCara = signo === '+' ? c[clave][0] : c[clave][1];
  const hacia = signo === '+' ? -1.0 : 1.0;      // de fuera hacia dentro
  const centro = [(c[lado][0] + c[lado][1]) / 2.0, (c.z[0] + c.z[1]) / 2.0];
  const [alto, ancho] = ch.fuera;
  anillo(comp, 'ch', clave, lado, centro, ch.fuera, [alto - 2 * ch.cajon, ancho - 2 * ch.guia],
    ord(dentroCara, dentroCara + hacia * ch.fondo));
  return ch;
}

// Corta un hueco en las piezas de las paredes a las que llega.
function cortarMuro(x, y, z) {
  const paredes = M.buscar('paredes');
  const herramienta = cajaForma(x, y, z);
  for (const cuerpo of muros(paredes, herramienta)) paredes.restar(cuerpo, herramienta);
}

const RUTA_VENTANA = { ventana_cocina: COCINA, ventana_bano: RUTA_BANO,
  ventana_perros: DORMITORIO, ventana_comedor: COMEDOR, ventana_almohadas: DORMITORIO };

// Cada ventana en su hueco escalonado, con su marco y su persiana (R93).
function ventanas() {
  const muro = R.MURO.panel + R.MURO.aislamiento;
  const puestas = [];
  for (const [nombre, componente_, pared, modelo] of R.VENTANAS) {
    const m = R.ventanaRa(modelo);
    const [alto, ancho] = m.paso;
    const signo = pared[pared.length - 1];
    const y = signo === '+' ? [COSTADO_COCINA, COSTADO_COCINA + muro] : [COSTADO_PUERTA - muro, COSTADO_PUERTA];
    const xCentro = CENTRO_VENTANA[componente_], dintel = DINTEL[pared];
    const c = { x: [xCentro - ancho / 2.0, xCentro + ancho / 2.0], y, z: [dintel - alto, dintel] };
    // el paso, de lado a lado del muro, y el rebaje de fuera, de A x B del
    // fabricante y 42 de fondo
    cortarMuro(c.x, [y[0] - 10, y[1] + 10], c.z);
    const caraFuera = signo === '+' ? y[1] : y[0];
    const hacia = signo === '+' ? -1.0 : 1.0;
    const medio = [(c.x[0] + c.x[1]) / 2.0, (c.z[0] + c.z[1]) / 2.0];
    cortarMuro([medio[0] - m.rebaje[1] / 2.0, medio[0] + m.rebaje[1] / 2.0],
      ord(caraFuera - hacia * 10.0, caraFuera + hacia * m.fondo_rebaje),
      [medio[1] - m.rebaje[0] / 2.0, medio[1] + m.rebaje[0] / 2.0]);
    const comp = componente(componente_, RUTA_VENTANA[componente_]);
    ventanaOutbound(comp, c, 'y', signo, m);
    const ch = persianaOutbound(comp, c, 'y', signo, m);
    resumen[componente_] = comp.cuerpos.length;
    puestas.push({ nombre, componente: componente_, pared, modelo, persiana: ch.modelo, caja_mm: c });
  }
  return puestas;
}

// -------------------------------------------------------------------- todo
export function interior(modelo) {
  M = modelo;
  resumen = {};
  dormitorio();
  cocina();
  comedor();
  sueloElevado();
  bano();
  const puestas = ventanas();
  modelo.notas.ventanas = puestas;
  modelo.notas.muebles = resumen;
  modelo.notas.cota_encimera = COTA_ENCIMERA;
}
