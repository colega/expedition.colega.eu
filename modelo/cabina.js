// Cabina del Atego: silueta lateral extruida a lo ancho, mas los detalles.
//
// Es la cabina L de serie, la del camion de verdad (R108): techo plano, mas
// baja que la caja, parabrisas inclinado, puerta con su ventanilla y una
// ventanilla trasera detras de la puerta. Las cotas salen de las fotos de
// perfil, escaladas con la caja. La silueta se dibuja en el plano XZ, asi que el
// parabrisas queda inclinado de verdad.
import { CAMION, caja, cilindroCentrado, cilindroEntre, prisma, ord } from './geo.js';

export const C = {
  trasera: 2460.0,          // 110 mm de holgura con la caja
  frontal: 4515.0,          // la cara de la calandra
  ancho: 2300.0,
  bajo: -305.0,             // lo mas bajo de la chapa, delante y detras del paso de rueda
  techo: 1490.0,
  capo: 597.0,              // donde arranca el parabrisas, abajo
  parabrisas_x: 4250.0,     // donde acaba el parabrisas, arriba
  puerta: { x: [3273.0, 4232.0], z: [202.0, 1380.0] },
  ventanilla: { x: [3400.0, 4180.0], z: [600.0, 1290.0] },
  ventanilla_trasera: { x: [2740.0, 3180.0], z: [770.0, 1290.0] },
  parachoques: { x: [4515.0, 4640.0], z: [-760.0, -320.0] },
  // la calandra va hundida en el frente, bajo el capo, con su estrella
  calandra: { y: 850.0, z: [-290.0, 95.0], fondo: 30.0 },
  estrella: { z: -95.0, radio: 175.0 },
  // retrovisores: un tubo vertical a cada lado, con el espejo y, debajo, el gran angular
  espejo: { x: [4235.0, 4285.0], tubo_y: 1300.0, y: [1320.0, 1500.0], z: [880.0, 1310.0], angular_z: [680.0, 840.0] },
};

// la x del parabrisas a una altura, por la recta que va del capo al techo
const xParabrisas = (z) => C.frontal - (z - C.capo) * (C.frontal - C.parabrisas_x) / (C.techo - C.capo);

export function cabina(modelo) {
  const { ATEGO, ALTURA_PISO } = modelo.reglas;
  const comp = modelo.nuevo(CAMION, 'cabina');
  const bloque = (nombre, x, y, z) => comp.poner(nombre, caja(x, y, z));
  const mitad = C.ancho / 2;
  const P = C.parachoques;

  // cuerpo de la cabina
  const cuerpo = comp.poner('cabina', prisma('y', 0.0, C.ancho, [
    [C.trasera, C.bajo],
    [C.frontal, C.bajo],
    [C.frontal, C.capo],
    [C.parabrisas_x, C.techo],
    [C.trasera, C.techo],
  ]));

  // pasos de rueda: se restan de la cabina
  // el paso de rueda va por encima de la rueda, no centrado en ella
  const p = { x: ATEGO.eje_delantero, z: -ALTURA_PISO + ATEGO.rueda_diam / 2.0 + 170.0, radio: 655.0 };
  comp.restar(cuerpo, cilindroCentrado('y', [p.x, 0.0, p.z], C.ancho + 100, p.radio));

  // huecos de parabrisas y ventanillas, para que los cristales se vean
  const parabrisasZ = [C.capo + 60, C.techo - 170];
  comp.restar(cuerpo, caja([C.parabrisas_x - 140, C.frontal + 20], [-1000.0, 1000.0], parabrisasZ));
  const huecos = [];
  for (const signo of [-1, 1]) {
    for (const v of [C.ventanilla, C.ventanilla_trasera]) {
      const hueco = caja(v.x, ord(signo * (mitad + 40), signo * (mitad - 90)), v.z);
      comp.restar(cuerpo, hueco);
      huecos.push(hueco);
    }
  }

  // parabrisas y ventanillas
  const [z0, z1] = parabrisasZ;
  comp.poner('parabrisas', prisma('y', 0.0, C.ancho - 300, [
    [xParabrisas(z0) - 20, z0], [xParabrisas(z1) - 20, z1],
    [xParabrisas(z1) - 5, z1], [xParabrisas(z0) + 5, z0],
  ]));

  // los limpiaparabrisas, tumbados al pie del cristal
  const zLimpia = parabrisasZ[0] + 40;
  for (const [lado, signo] of [['izq', -1], ['der', 1]]) {
    bloque('limpiaparabrisas_' + lado, [xParabrisas(zLimpia) + 2, xParabrisas(zLimpia) + 20],
      ord(signo * 120, signo * 820), [zLimpia - 12, zLimpia + 12]);
  }

  for (const [lado, signo] of [['izq', -1], ['der', 1]]) {
    const cristal = ord(signo * (mitad - 70), signo * (mitad - 85));
    bloque('ventanilla_' + lado, C.ventanilla.x, cristal, C.ventanilla.z);
    bloque('ventanilla_trasera_' + lado, C.ventanilla_trasera.x, cristal, C.ventanilla_trasera.z);
    // linea de puerta, hundida para que se lea, con el hueco de su ventanilla
    const puerta = bloque('puerta_' + lado, C.puerta.x, ord(signo * mitad, signo * (mitad - 8)), C.puerta.z);
    for (const hueco of huecos) comp.restar(puerta, hueco);
    // el tirador, abajo en el canto de atras de la puerta
    bloque('tirador_cabina_' + lado, [C.puerta.x[0] + 50, C.puerta.x[0] + 190], ord(signo * mitad, signo * (mitad + 18)), [330.0, 370.0]);
    // el retrovisor: un tubo vertical sujeto por dos brazos a la cabina, con
    // el espejo grande arriba y el gran angular debajo. La luna mira atras.
    const E = C.espejo;
    const tuboX = (E.x[0] + E.x[1]) / 2;
    const [zBajo, zAlto] = [E.angular_z[0] - 60, E.z[1] + 30];
    comp.poner('espejo_tubo_' + lado, cilindroEntre('z', [tuboX, signo * E.tubo_y], [zBajo, zAlto], 14.0));
    for (const [k, z] of [['alto', zAlto], ['bajo', zBajo]]) {
      comp.poner(`espejo_brazo_${k}_${lado}`, cilindroEntre('y', [tuboX, z], ord(signo * (mitad - 40), signo * (E.tubo_y + 14)), 14.0));
    }
    const yEspejo = ord(signo * E.y[0], signo * E.y[1]);
    const yLuna = ord(signo * (E.y[0] + 15), signo * (E.y[1] - 15));
    bloque('espejo_' + lado, E.x, yEspejo, E.z);
    bloque('espejo_angular_' + lado, E.x, yEspejo, E.angular_z);
    bloque('luna_espejo_' + lado, [E.x[0] - 6, E.x[0]], yLuna, [E.z[0] + 15, E.z[1] - 15]);
    bloque('luna_angular_' + lado, [E.x[0] - 6, E.x[0]], yLuna, [E.angular_z[0] + 15, E.angular_z[1] - 15]);
    // los faros, en las puntas de arriba del parachoques, y los antiniebla debajo
    bloque('faro_' + lado, [P.x[1] - 10, P.x[1] + 6], ord(signo * 820, signo * 1100), [P.z[1] - 100, P.z[1] - 20]);
    bloque('antiniebla_' + lado, [P.x[1] - 30, P.x[1] - 20], ord(signo * 850, signo * 1050), [-590.0, -480.0]);
    // dos peldaños delante de la rueda, bajo la puerta
    for (const [k, z] of [[1, -405.0], [2, -800.0]]) {
      bloque(`peldano_${k}_${lado}`, [4030.0, 4420.0], ord(signo * (mitad - 150), signo * (mitad + 20)), [z - 15, z + 15]);
    }
    for (const [k, x] of [[1, 4030.0], [2, 4390.0]]) {
      bloque(`peldano_soporte_${k}_${lado}`, [x, x + 30], ord(signo * (mitad + 20), signo * (mitad + 25)), [-815.0, C.bajo]);
    }
    // el guardabarros de la rueda: un arco negro por encima del paso de rueda
    const y = signo * ATEGO.via / 2;
    const ancho = ATEGO.rueda_ancho + 110;
    const arco = comp.poner('guardabarros_delantero_' + lado, cilindroCentrado('y', [p.x, y, p.z], ancho, p.radio));
    comp.restar(arco, cilindroCentrado('y', [p.x, y, p.z], ancho + 30, p.radio - 55));
    comp.restar(arco, caja([p.x - p.radio - 20, p.x + p.radio + 20], ord(y - ancho, y + ancho), [p.z - p.radio - 20, p.z]));
    // y la faldilla, detras de la rueda
    bloque('faldilla_delantera_' + lado, [2640.0, 2660.0],
      ord(y - ATEGO.rueda_ancho / 2 - 40, y + ATEGO.rueda_ancho / 2 + 40), [-ALTURA_PISO + 130, p.z]);
  }

  // la calandra: un hueco en el frente con el fondo negro, tres lamas
  // tumbadas, una rejilla de barras finas y la estrella en el centro
  const K = C.calandra;
  const fondoX = C.frontal - K.fondo;
  comp.restar(cuerpo, caja([fondoX, C.frontal + 20], [-K.y, K.y], K.z));
  bloque('calandra', [fondoX, fondoX + 8], [-K.y, K.y], K.z);
  const alto = K.z[1] - K.z[0];
  [0.2, 0.5, 0.8].forEach((f, k) => {
    const z = K.z[0] + f * alto;
    bloque(`calandra_lama_${k + 1}`, [fondoX + 8, C.frontal - 4], [-K.y + 10, K.y - 10], [z - 20, z + 20]);
  });
  for (let k = 0, y = -K.y + 110; y < K.y - 60; k++, y += 160) {
    bloque(`calandra_barra_${k + 1}`, [fondoX + 8, C.frontal - 14], [y - 7, y + 7], [K.z[0] + 10, K.z[1] - 10]);
  }
  const S = C.estrella;
  const aro = comp.poner('estrella_aro', cilindroCentrado('x', [C.frontal - 6, 0.0, S.z], 18.0, S.radio));
  comp.restar(aro, cilindroCentrado('x', [C.frontal - 6, 0.0, S.z], 40.0, S.radio - 22));
  // la estrella de tres puntas, en el plano del frente
  const punta = S.radio - 22;
  const estrella = [];
  for (let k = 0; k < 6; k++) {
    const a = Math.PI / 2 + k * Math.PI / 3;
    const r = k % 2 === 0 ? punta : 28.0;
    estrella.push([Math.cos(a) * r, S.z + Math.sin(a) * r]);
  }
  comp.poner('estrella', prisma('x', C.frontal - 8, 12.0, estrella));

  // el parachoques (negro, R29), con los huecos de los antiniebla
  const defensa = bloque('parachoques', P.x, [-mitad + 50, mitad - 50], P.z);
  for (const signo of [-1, 1]) {
    comp.restar(defensa, caja([P.x[1] - 30, P.x[1] + 10], ord(signo * 840, signo * 1060), [-600.0, -470.0]));
  }
  // y, en el techo, un parasol con dos focos
  bloque('parasol', [4180.0, 4380.0], [-mitad + 50, mitad - 50], [C.techo - 50, C.techo]);
  for (const [lado, signo] of [['izq', -1], ['der', 1]]) {
    bloque('foco_soporte_' + lado, [4260.0, 4300.0], ord(signo * 580, signo * 620), [C.techo, C.techo + 40]);
    comp.poner('foco_' + lado, cilindroCentrado('x', [4290.0, signo * 600, C.techo + 120], 140.0, 85.0));
  }
}
