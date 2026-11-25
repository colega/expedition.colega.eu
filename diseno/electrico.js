// La instalacion electrica del garaje (R119 a R123): la mampara de metacrilato,
// los equipos de Victron entre ella y la cabina, el cuadro de 230 y el cableado
// principal.
//
// Todo va en el marco del modelo. Los equipos de pared cuelgan del tablero del
// garaje contra la cabina, con la espalda en XW, y miran hacia la mampara.
import * as R from './reglas.js';
import { GARAJE, caja, cilindroEntre } from '../modelo/geo.js';

const T = R.ESPESOR;
const XW = R.FRONTAL - T;                         // cara del tablero del garaje, 2267
const XM = R.FRONTAL - R.MAMPARA.desde_frontal;   // cara de la mampara hacia la cabina, 2015
const Y = [R.COSTADO_PUERTA + T, R.COSTADO_COCINA - T];  // costados del garaje por dentro
const Z = [T, R.CAMA.somier - T];                 // del fondo a la base del colchon
const V = R.VICTRON;
const E = R.ELECTRICO;

const poner = (comp, nombre, x, y, z) => comp.poner(nombre, caja(x, y, z));

// Un equipo colgado de la pared, desde y0 a lo ancho y desde z0 hacia arriba.
function enPared(comp, nombre, e, y0, z0) {
  const c = { x: [XW - e.fondo, XW], y: [y0, y0 + e.ancho], z: [z0, z0 + e.alto] };
  poner(comp, nombre, c.x, c.y, c.z);
  return c;
}

// Un cable por una lista de puntos [x, y, z], de tramos rectos por los ejes.
// Cada tramo se alarga un radio en los codos para que no queden mellas; los
// extremos no, que tocan justo el borne o la cara del equipo.
function cable(comp, nombre, puntos, diametro) {
  const r = diametro / 2.0;
  let forma = null;
  for (let i = 0; i + 1 < puntos.length; i++) {
    const [p, q] = [puntos[i], puntos[i + 1]];
    const ejes = [0, 1, 2].filter((k) => p[k] !== q[k]);
    if (ejes.length !== 1) throw new Error(`${nombre}: el tramo ${i} no va por un eje`);
    const k = ejes[0];
    const s = Math.sign(q[k] - p[k]);
    const a = p[k] - (i > 0 ? s * r : 0);
    const b = q[k] + (i + 2 < puntos.length ? s * r : 0);
    const tramo = cilindroEntre('xyz'[k], p.filter((_, j) => j !== k), a < b ? [a, b] : [b, a], r);
    forma = forma ? forma.fuse(tramo) : tramo;
  }
  return comp.poner(nombre, forma);
}

// R119: la mampara en sus carriles, con dos tiradores del lado del garaje.
function mampara(M) {
  const comp = M.nuevo(GARAJE, 'mampara');
  const m = R.MAMPARA;
  const x = [XM - m.grueso, XM];
  poner(comp, 'mampara_metacrilato', x, Y, Z);
  const ancho = [x[0] - (m.carril - m.grueso) / 2, x[1] + (m.carril - m.grueso) / 2];
  poner(comp, 'carril_mampara_abajo', ancho, Y, [Z[0], Z[0] + m.carril]);
  poner(comp, 'carril_mampara_arriba', ancho, Y, [Z[1] - m.carril, Z[1]]);
  const medio = (Z[0] + Z[1]) / 2.0;
  [-600.0, 600.0].forEach((y, k) => poner(comp, `tirador_mampara_${k + 1}`,
    [x[0] - 25, x[0]], [y - 15, y + 15], [medio - 60, medio + 60]));
}

// R120 a R122: los equipos. Devuelve sus cajas y bornes, que el cableado usa.
function equipos(M) {
  const comp = M.nuevo(GARAJE, 'electrico');
  const b = V.bateria;
  const h = E.holgura_bateria;
  // las baterias en el suelo, centradas en el fondo que queda
  const xb = [(XM + XW - b.fondo) / 2.0, (XM + XW + b.fondo) / 2.0];
  const bornes = [];
  for (const k of [1, 2]) {
    const y0 = Y[0] + h + (k - 1) * (b.ancho + h);
    const zt = Z[0] + b.alto;
    poner(comp, `bateria${k}`, xb, [y0, y0 + b.ancho], [Z[0], zt]);
    // los bornes en el canto de la pared: el positivo hacia el costado de la puerta
    const xBorne = xb[1] - b.borne_canto;
    const pos = [xBorne, y0 + b.borne_extremo, zt + 15.0];
    const neg = [xBorne, y0 + b.ancho - b.borne_extremo, zt + 15.0];
    for (const [polo, p] of [['pos', pos], ['neg', neg]]) {
      comp.poner(`borne_bateria${k}_${polo}`, cilindroEntre('z', [p[0], p[1]], [zt, p[2]], 10.0));
    }
    bornes.push({ pos, neg });
  }
  const finBaterias = Y[0] + h + 2 * b.ancho + h;

  // el MultiPlus colgado a continuacion, y la columna de cargadores a su lado
  const mp = enPared(comp, 'multiplus', V.multiplus, finBaterias + h, Z[0] + E.bajo_multiplus);
  const g = E.holgura_cargador;
  const centro = (mp.y[1] + Y[1]) / 2.0;
  const columna = [];
  let techo = Z[1] - g;
  for (const [nombre, e] of [['mppt1', V.mppt], ['mppt2', V.mppt], ['orion_xs', V.orion_xs]]) {
    columna.push(enPared(comp, nombre, e, centro - e.ancho / 2.0, techo - e.alto));
    techo -= e.alto + g;
  }
  // el BatteryProtect encima del MultiPlus, con los bornes hacia fuera
  const p = V.protector;
  const yp = (mp.y[0] + mp.y[1]) / 2.0;
  const zp = (mp.z[1] + Z[1]) / 2.0;
  poner(comp, 'protector_bateria', [XW - p.fondo, XW], [yp - p.ancho / 2, yp + p.ancho / 2],
    [zp - p.alto / 2, zp + p.alto / 2]);
  const protector = [yp - p.bornes / 2, yp + p.bornes / 2].map((y, k) => {
    const nombre = `borne_protector_${['entrada', 'salida'][k]}`;
    comp.poner(nombre, cilindroEntre('x', [y, zp], [XW - p.fondo - p.borne_alto, XW - p.fondo], 3.0));
    return [XW - p.fondo - p.borne_alto, y, zp];
  });

  // la cadena Lynx, encima de las baterias, de un modulo al siguiente
  const lynx = {};
  let y = E.lynx_y;
  for (const [nombre, e] of [['lynx_entrada', V.lynx_entrada], ['lynx_bms', V.lynx_bms],
    ['lynx_distribuidor1', V.lynx_distribuidor], ['lynx_distribuidor2', V.lynx_distribuidor]]) {
    lynx[nombre] = enPared(comp, nombre, e, y, E.lynx_z + (V.lynx_entrada.alto - e.alto) / 2.0);
    y += e.ancho;
  }
  const bms = lynx.lynx_bms;
  enPared(comp, 'cerbo', V.cerbo, (bms.y[0] + bms.y[1]) / 2.0 - V.cerbo.ancho / 2.0, E.cerbo_z);
  const orionTr = enPared(comp, 'orion_tr', V.orion_tr, E.orion_tr_y, E.lynx_z);

  // R122: el cuadro de 230, con el diferencial y los automaticos asomando
  const C = R.CUADRO_230;
  const cuadro = { x: [XW - C.fondo, XW], y: [E.cuadro_y, E.cuadro_y + C.ancho], z: [E.lynx_z, E.lynx_z + C.alto] };
  poner(comp, 'cuadro_230', cuadro.x, cuadro.y, cuadro.z);
  const modulos = C.diferencial + C.automaticos;
  let ym = (cuadro.y[0] + cuadro.y[1] - modulos * C.modulo) / 2.0;
  const zm = (cuadro.z[0] + cuadro.z[1]) / 2.0;
  const maneta = (nombre, n) => {
    poner(comp, nombre, [cuadro.x[0] - 10, cuadro.x[0]], [ym + 1, ym + n * C.modulo - 1],
      [zm - C.maneta / 2, zm + C.maneta / 2]);
    ym += n * C.modulo;
  };
  maneta('cuadro_diferencial', C.diferencial);
  for (let k = 1; k <= C.automaticos; k++) maneta(`cuadro_automatico_${k}`, 1);

  return { bornes, mp, columna, protector, lynx, orionTr, cuadro };
}

// R123: el cableado principal. Las rutas van por niveles para no cruzarse con
// nada de otro componente: los de las baterias por el plano de los bornes, los
// del MultiPlus bajo el cuadro y por el hueco entre la bateria y el MultiPlus,
// y los de los cargadores por delante de los equipos, junto a la mampara.
function cableado(M, q) {
  const comp = M.nuevo(GARAJE, 'cableado');
  const C = R.CABLES;
  const L = q.lynx;
  const zL = E.lynx_z;                           // cara de abajo de la cadena Lynx

  // de las baterias al Power In: cada cable sube, corre y entra por abajo
  const entrada = L.lynx_entrada;
  const [b1, b2] = q.bornes;
  const rutas = [
    ['cable_pos_bateria1', b1.pos, null],
    ['cable_neg_bateria1', b1.neg, 300.0],
    ['cable_pos_bateria2', b2.pos, 330.0],
    ['cable_neg_bateria2', b2.neg, 360.0],
  ];
  rutas.forEach(([nombre, p, nivel], k) => {
    const y = entrada.y[0] + 38.8 + 40.0 * k;
    const puntos = nivel === null ? [p, [p[0], p[1], zL]]
      : [p, [p[0], p[1], nivel], [p[0], y, nivel], [p[0], y, zL]];
    cable(comp, nombre, puntos, C.bateria);
  });

  // del segundo distribuidor al MultiPlus: dos cables por polo, que bajan por
  // el hueco entre la bateria y el MultiPlus y le entran por abajo
  const d2 = L.lynx_distribuidor2;
  const yHueco = (q.mp.y[0] + q.bornes[1].neg[1] + V.bateria.borne_extremo) / 2.0;
  [['cable_pos_multiplus_1', 2256.0, -420.0, 610.0], ['cable_pos_multiplus_2', 2238.0, -420.0, 630.0],
    ['cable_neg_multiplus_1', 2214.0, -330.0, 680.0], ['cable_neg_multiplus_2', 2196.0, -330.0, 700.0],
  ].forEach(([nombre, x, y, yBorne]) => {
    if (y < d2.y[0] || y > d2.y[1]) throw new Error(`${nombre} no sale del distribuidor`);
    cable(comp, nombre, [[x, y, zL], [x, y, 400.0], [x, yHueco, 400.0], [x, yHueco, 80.0],
      [x, yBorne, 80.0], [x, yBorne, q.mp.z[0]]], C.multiplus);
  });

  // del segundo distribuidor al Orion-Tr, por debajo de la cadena
  const ot = q.orionTr;
  cable(comp, 'cable_pos_orion_tr', [[2250.0, -260.0, zL], [2250.0, -260.0, 415.0],
    [2250.0, ot.y[0] + 60, 415.0], [2250.0, ot.y[0] + 60, ot.z[0]]], C.orion_tr);
  cable(comp, 'cable_neg_orion_tr', [[2225.0, -230.0, zL], [2225.0, -230.0, 415.0],
    [2225.0, ot.y[0] + 90, 415.0], [2225.0, ot.y[0] + 90, ot.z[0]]], C.orion_tr);

  // del primer distribuidor a la columna de cargadores y al BatteryProtect: bajan
  // a 380, salen hacia la mampara, corren por delante hasta el hueco entre el
  // MultiPlus y la columna y de ahi van a su equipo. Cuanto mas al costado de la
  // puerta sale un cable, mas cerca de la mampara corre, y asi no se cruzan.
  const [mppt1, mppt2, orionXs] = q.columna;
  const yHuecoCol = (q.mp.y[1] + mppt1.y[0]) / 2.0;
  const zCorre = 380.0;
  // [nombre, equipo, nivel bajo el equipo, x en el equipo, y del borne]
  const cargadores = [
    ['cable_pos_orion_xs', orionXs, orionXs.z[0] - 45, 2245.0, 0.65],
    ['cable_neg_orion_xs', orionXs, orionXs.z[0] - 30, 2222.0, 0.35],
    ['cable_pos_protector', null],
    ['cable_pos_mppt2', mppt2, mppt2.z[0] - 45, 2245.0, 0.65],
    ['cable_neg_mppt2', mppt2, mppt2.z[0] - 30, 2222.0, 0.35],
    ['cable_pos_mppt1', mppt1, mppt1.z[0] - 30, 2245.0, 0.65],
    ['cable_neg_mppt1', mppt1, mppt1.z[0] - 45, 2222.0, 0.35],
  ];
  const d1 = L.lynx_distribuidor1;
  cargadores.forEach(([nombre, eq, nivel, xEq, frac], k) => {
    const y = d1.y[0] + 15.3 + 30.0 * k;
    const xc = XM + 5.0 + 10.0 * k;              // carril por delante, junto a la mampara
    const inicio = [[2240.0, y, zL], [2240.0, y, zCorre], [xc, y, zCorre], [xc, yHuecoCol, zCorre]];
    if (!eq) {
      // al BatteryProtect, por encima del MultiPlus hasta su borne de entrada
      const [xb, yb, zb] = q.protector[0];
      cable(comp, nombre, [...inicio, [xc, yHuecoCol, zb], [xc, yb, zb], [xb, yb, zb]], C.cargador);
      return;
    }
    const yBorne = eq.y[0] + frac * (eq.y[1] - eq.y[0]);
    cable(comp, nombre, [...inicio, [xc, yHuecoCol, nivel], [xEq, yHuecoCol, nivel],
      [xEq, yBorne, nivel], [xEq, yBorne, eq.z[0]]], C.cargador);
  });

  // R122: la salida AC-OUT 1 del MultiPlus al cuadro, por debajo de todo
  const cu = q.cuadro;
  const yAc = (cu.y[0] + cu.y[1]) / 2.0 + 52.0;
  cable(comp, 'cable_ac_multiplus', [[2150.0, q.mp.y[1] - 45, q.mp.z[0]], [2150.0, q.mp.y[1] - 45, 60.0],
    [2150.0, yHueco, 60.0], [2150.0, yHueco, 420.0], [2150.0, yAc, 420.0], [2200.0, yAc, 420.0],
    [2200.0, yAc, cu.z[0]]], C.alterna);
}

export function electrico(modelo) {
  mampara(modelo);
  const q = equipos(modelo);
  cableado(modelo, q);
  modelo.notas.electrico = { hueco_mm: { x: [XM, XW], y: Y, z: Z },
    equipos: Object.fromEntries(Object.entries(V).map(([k, e]) => [k, e.modelo])) };
}
