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
  // R121: la torre centrada en el ancho y en el fondo que queda
  const xb = [(XM + XW - b.fondo) / 2.0, (XM + XW + b.fondo) / 2.0];
  const yb = [-b.ancho / 2.0, b.ancho / 2.0];
  const zBalda = Z[0] + b.alto + E.hueco_bornes;
  const bornes = [];
  [Z[0], zBalda + E.balda].forEach((z0, k) => {
    const zt = z0 + b.alto;
    poner(comp, `bateria${k + 1}`, xb, yb, [z0, zt]);
    // los bornes en el canto de la pared: el positivo hacia el costado de la puerta
    const xBorne = xb[1] - b.borne_canto;
    const pos = [xBorne, yb[0] + b.borne_extremo, zt + 15.0];
    const neg = [xBorne, yb[1] - b.borne_extremo, zt + 15.0];
    for (const [polo, p] of [['pos', pos], ['neg', neg]]) {
      comp.poner(`borne_bateria${k + 1}_${polo}`, cilindroEntre('z', [p[0], p[1]], [zt, p[2]], 10.0));
    }
    bornes.push({ pos, neg });
  });
  // R124: el bastidor de 4040, con los montantes en los costados de la torre
  const B = R.BASTIDOR;
  const f = B.perfil;
  const lado = yb[1] + h;                        // donde acaba la torre con su holgura
  const fin = lado + f;                          // y donde acaba el bastidor
  const xm = [[XM + B.holgura_mampara, XM + B.holgura_mampara + f], [XW - f, XW]];  // delante, detras
  const zArriba = zBalda + E.balda + b.alto + B.alto_sobre_torre;
  const zLarguero = [zBalda - f, zBalda];
  for (const [n, y] of [['puerta', [-fin, -lado]], ['cocina', [lado, fin]]]) {
    xm.forEach((x, k) => poner(comp, `bastidor_montante_${n}_${['delante', 'detras'][k]}`, x, y, [Z[0], zArriba]));
    for (const [m, z] of [['abajo', [Z[0], Z[0] + f]], ['balda', zLarguero], ['arriba', [zArriba - f, zArriba]]]) {
      poner(comp, `bastidor_travesano_${n}_${m}`, [xm[0][1], xm[1][0]], y, z);
    }
  }
  xm.forEach((x, k) => poner(comp, `bastidor_larguero_${['delante', 'detras'][k]}`, x, [-lado, lado], zLarguero));
  poner(comp, 'balda_baterias', [xm[0][0], XW], [-fin, fin], [zBalda, zBalda + E.balda]);
  const zTorre = zBalda + E.balda + b.alto;      // cara de arriba de la torre

  // la cadena Lynx encima de la torre, centrada, de un modulo al siguiente
  const cadena = [['lynx_entrada', V.lynx_entrada], ['lynx_bms', V.lynx_bms],
    ['lynx_distribuidor1', V.lynx_distribuidor], ['lynx_distribuidor2', V.lynx_distribuidor]];
  const zL = zTorre + E.hueco_bornes;
  let y = -cadena.reduce((s, [, e]) => s + e.ancho, 0) / 2.0;
  const lynx = {};
  for (const [nombre, e] of cadena) {
    lynx[nombre] = enPared(comp, nombre, e, y, zL + (V.lynx_entrada.alto - e.alto) / 2.0);
    y += e.ancho;
  }

  // del lado de la cocina: el MultiPlus pasado el paso de cables, y el cuadro
  const paso = fin + E.paso_cables;
  const mp = enPared(comp, 'multiplus', V.multiplus, paso, Z[0] + E.bajo_multiplus);
  const C = R.CUADRO_230;
  const yc = (mp.y[1] + Y[1]) / 2.0;
  const cuadro = enPared(comp, 'cuadro_230', C, yc - C.ancho / 2.0, E.cuadro_z);
  const modulos = C.diferencial + C.automaticos;
  let ym = yc - modulos * C.modulo / 2.0;
  const zm = (cuadro.z[0] + cuadro.z[1]) / 2.0;
  const maneta = (nombre, n) => {
    poner(comp, nombre, [cuadro.x[0] - 10, cuadro.x[0]], [ym + 1, ym + n * C.modulo - 1],
      [zm - C.maneta / 2, zm + C.maneta / 2]);
    ym += n * C.modulo;
  };
  maneta('cuadro_diferencial', C.diferencial);
  for (let k = 1; k <= C.automaticos; k++) maneta(`cuadro_automatico_${k}`, 1);

  // del lado de la puerta: el BatteryProtect junto a la torre, abajo
  const p = V.protector;
  const yp1 = -paso;
  const zp = Z[0] + E.bajo_multiplus + p.alto / 2.0;
  poner(comp, 'protector_bateria', [XW - p.fondo, XW], [yp1 - p.ancho, yp1], [zp - p.alto / 2, zp + p.alto / 2]);
  const yp = yp1 - p.ancho / 2.0;
  const protector = [yp - p.bornes / 2, yp + p.bornes / 2].map((yy, k) => {
    comp.poner(`borne_protector_${['entrada', 'salida'][k]}`,
      cilindroEntre('x', [yy, zp], [XW - p.fondo - p.borne_alto, XW - p.fondo], 3.0));
    return [XW - p.fondo - p.borne_alto, yy, zp];
  });
  // la columna de cargadores, con 100 libres arriba y abajo
  const g = E.holgura_cargador;
  const cy = E.columna_cargadores_y;
  const columna = {};
  let techo = Z[1] - g;
  for (const [nombre, e] of [['mppt1', V.mppt], ['mppt2', V.mppt], ['orion_xs', V.orion_xs]]) {
    columna[nombre] = enPared(comp, nombre, e, cy - e.ancho / 2.0, techo - e.alto);
    techo -= e.alto + g;
  }
  // y la del Orion-Tr y el Cerbo, contra el costado con los 23.5 de la bateria
  const y2 = Y[0] + 23.5;
  columna.orion_tr = enPared(comp, 'orion_tr', V.orion_tr, y2, E.orion_tr_z);
  enPared(comp, 'cerbo', V.cerbo, y2 + (V.orion_tr.ancho - V.cerbo.ancho) / 2.0, E.cerbo_z);

  return { bornes, lynx, zL, mp, cuadro, protector, columna, fin };
}

// R123: el cableado principal. Va por calles para no pisar nada de otro
// componente: los de las baterias por el plano de la pared, rodeando la torre
// por el costado de la puerta; los del MultiPlus por encima de la torre y el
// paso de cables; y los de los cargadores por delante de los equipos, junto a
// la mampara, cada uno en su calle.
function cableado(M, q) {
  const comp = M.nuevo(GARAJE, 'cableado');
  const C = R.CABLES;
  const L = q.lynx;
  const zL = q.zL;                               // cara de abajo de la cadena Lynx
  const [b1, b2] = q.bornes;
  const ySube = q.fin + E.paso_cables / 2.0;     // medio del paso de cables
  const entrada = L.lynx_entrada;
  const dentro = (nombre, e, y) => {
    if (!Number.isFinite(y) || y < e.y[0] || y > e.y[1]) throw new Error(`${nombre} no entra en su equipo`);
    return y;
  };

  // de las baterias al Power In. Los de la de arriba suben derechos o por
  // encima de ella; los de la de abajo salen por el hueco de los bornes hasta el
  // paso del costado de la puerta y suben por ahi.
  const z2 = b2.pos[2];
  cable(comp, 'cable_pos_bateria2', [b2.pos, [b2.pos[0], dentro('bateria2+', entrada, b2.pos[1]), zL]], C.bateria);
  const yNeg2 = dentro('bateria2-', entrada, entrada.y[1] - 57.6);
  cable(comp, 'cable_neg_bateria2', [b2.neg, [b2.neg[0], b2.neg[1], z2 + 27.0],
    [b2.neg[0], yNeg2, z2 + 27.0], [b2.neg[0], yNeg2, zL]], C.bateria);
  // por el hueco de los bornes, por debajo de los largueros del bastidor (R124),
  // y arriba por el paso de cables, uno junto al otro. El negativo corre por
  // delante de los montantes y vuelve a la pared ya fuera del bastidor.
  const zHueco = b1.pos[2] + 21.0;
  const yIn1 = dentro('bateria1+', entrada, entrada.y[0] + 24.6);
  const yIn2 = dentro('bateria1-', entrada, entrada.y[0] + 54.6);
  const xPos = b1.pos[0], yPos = -(q.fin + 10.0), zPos = zL - 18.0;
  cable(comp, 'cable_pos_bateria1', [b1.pos, [xPos, b1.pos[1], zHueco], [xPos, yPos, zHueco],
    [xPos, yPos, zPos], [xPos, yIn1, zPos], [xPos, yIn1, zL]], C.bateria);
  const xDelante = 2190.0, xNeg = 2245.0, yNeg = -(q.fin + 30.0), zNeg = zL - 28.0;
  cable(comp, 'cable_neg_bateria1', [b1.neg, [b1.neg[0], b1.neg[1], zHueco], [xDelante, b1.neg[1], zHueco],
    [xDelante, yNeg, zHueco], [xDelante, yNeg, zNeg], [xNeg, yNeg, zNeg], [xNeg, yIn2, zNeg], [xNeg, yIn2, zL]],
  C.bateria);

  // del segundo distribuidor al MultiPlus: dos cables por polo, cada uno en su
  // calle; corren por encima de la torre, bajan por el paso y entran por abajo
  const d2 = L.lynx_distribuidor2;
  const zMp = zL - 33.0;
  [['cable_pos_multiplus_1', 2194.0, 0.75, 40.0], ['cable_pos_multiplus_2', 2216.0, 0.75, 60.0],
    ['cable_neg_multiplus_1', 2238.0, 0.9, 100.0], ['cable_neg_multiplus_2', 2259.0, 0.9, 120.0],
  ].forEach(([nombre, x, frac, borne]) => {
    const y = dentro(nombre, d2, d2.y[0] + frac * (d2.y[1] - d2.y[0]));
    const yB = q.mp.y[0] + borne;
    cable(comp, nombre, [[x, y, zL], [x, y, zMp], [x, ySube, zMp], [x, ySube, 80.0], [x, yB, 80.0],
      [x, yB, q.mp.z[0]]], C.multiplus);
  });

  // a los cargadores y al BatteryProtect: bajan del distribuidor, salen hacia
  // la mampara y corren por delante hasta su borne. Cuanto mas al costado de la
  // cocina sale un cable, mas cerca de la mampara corre, y asi no se cruzan.
  const col = q.columna;
  const d1 = L.lynx_distribuidor1;
  const zCorre = zL - 13.0;
  // [nombre, distribuidor, equipo o null, x del borne, fraccion del ancho]
  const lista = [
    ['cable_pos_mppt1', d1, col.mppt1, 2235.0, 0.65], ['cable_neg_mppt1', d1, col.mppt1, 2235.0, 0.35],
    ['cable_pos_mppt2', d1, col.mppt2, 2235.0, 0.65], ['cable_neg_mppt2', d1, col.mppt2, 2235.0, 0.35],
    ['cable_pos_orion_xs', d1, col.orion_xs, 2240.0, 0.65], ['cable_neg_orion_xs', d1, col.orion_xs, 2240.0, 0.35],
    ['cable_pos_orion_tr', d1, col.orion_tr, 2230.0, 0.65], ['cable_neg_orion_tr', d1, col.orion_tr, 2230.0, 0.35],
    ['cable_pos_protector', d2, null, null, null],
  ].map((c, k) => [...c, k < 8 ? d1.y[0] + 14.95 + 30.0 * k : d2.y[0] + 27.65]);
  lista.sort((a, b) => b[5] - a[5]).forEach(([nombre, d, eq, xEq, frac, y], k) => {
    dentro(nombre, d, y);
    const xc = XM + 10.0 + 10.0 * k;
    const grosor = nombre.endsWith('orion_tr') ? C.orion_tr : C.cargador;
    const inicio = [[2240.0, y, zL], [2240.0, y, zCorre], [xc, y, zCorre]];
    if (!eq) {
      const [xb, yb, zb] = q.protector[0];
      cable(comp, nombre, [...inicio, [xc, yb, zCorre], [xc, yb, zb], [xb, yb, zb]], grosor);
      return;
    }
    const yB = eq.y[0] + frac * (eq.y[1] - eq.y[0]);
    const nivel = eq.z[0] - 30.0;
    cable(comp, nombre, [...inicio, [xc, yB, zCorre], [xc, yB, nivel], [xEq, yB, nivel],
      [xEq, yB, eq.z[0]]], grosor);
  });

  // R122: la salida AC-OUT 1 del MultiPlus al cuadro, por debajo
  const cu = q.cuadro;
  const yAc = q.mp.y[1] - 40.0;
  const yCu = (cu.y[0] + cu.y[1]) / 2.0;
  cable(comp, 'cable_ac_multiplus', [[2150.0, yAc, q.mp.z[0]], [2150.0, yAc, 60.0], [2150.0, yCu, 60.0],
    [2210.0, yCu, 60.0], [2210.0, yCu, cu.z[0]]], C.alterna);
}

export function electrico(modelo) {
  mampara(modelo);
  const q = equipos(modelo);
  cableado(modelo, q);
  modelo.notas.electrico = { hueco_mm: { x: [XM, XW], y: Y, z: Z },
    equipos: Object.fromEntries(Object.entries(V).map(([k, e]) => [k, e.modelo])) };
}
