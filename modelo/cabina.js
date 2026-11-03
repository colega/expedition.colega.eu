// Cabina del Atego: silueta lateral extruida a lo ancho, mas los detalles.
//
// Es la cabina L de serie, la del camion de verdad (R108): techo plano, mas
// baja que la caja, parabrisas inclinado, puerta con su ventanilla y una
// ventanilla trasera detras de la puerta. Las cotas salen de las fotos de
// perfil, escaladas con la caja. La silueta se dibuja en el plano XZ, asi que el
// parabrisas queda inclinado de verdad.
import { CAMION, caja, cilindroCentrado, prisma, ord } from './geo.js';

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
  parachoques: { x: [4515.0, 4640.0], z: [-650.0, -165.0] },
  espejo_y: 1330.0,
};

// la x del parabrisas a una altura, por la recta que va del capo al techo
const xParabrisas = (z) => C.frontal - (z - C.capo) * (C.frontal - C.parabrisas_x) / (C.techo - C.capo);

export function cabina(modelo) {
  const { ATEGO, ALTURA_PISO } = modelo.reglas;
  const comp = modelo.nuevo(CAMION, 'cabina');
  const bloque = (nombre, x, y, z) => comp.poner(nombre, caja(x, y, z));
  const mitad = C.ancho / 2;

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

  for (const [lado, signo] of [['izq', -1], ['der', 1]]) {
    const cristal = ord(signo * (mitad - 70), signo * (mitad - 85));
    bloque('ventanilla_' + lado, C.ventanilla.x, cristal, C.ventanilla.z);
    bloque('ventanilla_trasera_' + lado, C.ventanilla_trasera.x, cristal, C.ventanilla_trasera.z);
    // linea de puerta, hundida para que se lea, con el hueco de su ventanilla
    const puerta = bloque('puerta_' + lado, C.puerta.x, ord(signo * mitad, signo * (mitad - 8)), C.puerta.z);
    for (const hueco of huecos) comp.restar(puerta, hueco);
    // el retrovisor, en un brazo que sale del pie del parabrisas
    bloque('espejo_brazo_' + lado, [4380.0, 4420.0], ord(signo * (mitad - 30), signo * C.espejo_y), [1150.0, 1190.0]);
    bloque('espejo_' + lado, [4300.0, 4420.0], ord(signo * (C.espejo_y - 60), signo * (C.espejo_y + 60)), [560.0, 1150.0]);
    // los faros, en las puntas del parachoques
    bloque('faro_' + lado, [C.parachoques.x[1] - 40, C.parachoques.x[1] + 5], ord(signo * 700, signo * 1050), [-450.0, -300.0]);
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

  // parachoques, calandra y, en el techo, un parasol con dos focos
  bloque('parachoques', C.parachoques.x, [-mitad + 50, mitad - 50], C.parachoques.z);
  bloque('calandra', [C.frontal - 10, C.frontal + 15], [-800.0, 800.0], [-120.0, C.capo - 80]);
  bloque('parasol', [4180.0, 4380.0], [-mitad + 50, mitad - 50], [C.techo - 50, C.techo]);
  for (const [lado, signo] of [['izq', -1], ['der', 1]]) {
    bloque('foco_soporte_' + lado, [4260.0, 4300.0], ord(signo * 580, signo * 620), [C.techo, C.techo + 40]);
    comp.poner('foco_' + lado, cilindroCentrado('x', [4290.0, signo * 600, C.techo + 120], 140.0, 85.0));
  }
}
