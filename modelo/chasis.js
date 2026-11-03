// Bastidor, falso chasis, ejes y ruedas del Atego bajo la caja.
//
// Marco del modelo, en mm: origen en el centro del suelo interior de la caja.
// X crece hacia la cabina, Y es el ancho, Z la altura. El suelo interior esta a
// 0, la cara inferior exterior de la caja a -65 y el suelo firme a -1260. Los
// ejes y las ruedas son los del camion de verdad (R108).
import { CAMION, caja, cilindroCentrado, ord } from './geo.js';

export function chasis(modelo) {
  const { ALTURA_PISO, ATEGO } = modelo.reglas;
  const P = {
    suelo: -ALTURA_PISO,      // cota del terreno
    caja_fondo: -65.0,        // cara inferior de la caja
    caja_trasera: -2350.0,    // cara exterior trasera
    caja_frontal: 2350.0,     // cara exterior delantera
    falso_alto: 100.0,        // canto del falso chasis
    larguero_alto: 200.0,     // canto del larguero
    larguero_ancho: 70.0,
    bastidor_ancho: 850.0,    // exterior entre largueros
    bastidor_trasero: -2200.0, // acaba 150 antes que la caja
    bastidor_frontal: 4450.0,
    eje_trasero: ATEGO.eje_trasero,
    eje_delantero: ATEGO.eje_delantero,
    eje_diam: 140.0,
    rueda_diam: ATEGO.rueda_diam,
    rueda_ancho: ATEGO.rueda_ancho,
    llanta_diam: ATEGO.llanta_diam,
    via: ATEGO.via,             // entre centros de rueda
  };
  P.batalla = P.eje_delantero - P.eje_trasero;
  P.eje_z = P.suelo + P.rueda_diam / 2.0;
  P.larguero_top = P.caja_fondo - P.falso_alto;
  P.larguero_bot = P.larguero_top - P.larguero_alto;

  const ch = modelo.nuevo(CAMION, 'chasis');
  const ruedas = modelo.nuevo(CAMION, 'ruedas');
  const bloque = (comp, nombre, x, y, z) => comp.poner(nombre, caja(x, y, z));
  // cilindro con el eje en y, centrado en [x, y, z]
  const rueda = (x, y, z, ancho, radio) => cilindroCentrado('y', [x, y, z], ancho, radio);

  const mitad = P.bastidor_ancho / 2.0;
  const alma = [P.larguero_bot, P.larguero_top];

  // largueros
  for (const [lado, signo] of [['izq', -1], ['der', 1]]) {
    bloque(ch, 'larguero_' + lado, [P.bastidor_trasero, P.bastidor_frontal],
      ord(signo * mitad, signo * (mitad - P.larguero_ancho)), alma);
  }

  // travesaños
  [P.bastidor_trasero + 60, -1200, 0, 1200, 2300, 3400, 4300].forEach((x, k) => {
    bloque(ch, `travesano_${k + 1}`, [x - 60, x + 60],
      [-mitad + P.larguero_ancho, mitad - P.larguero_ancho], [alma[0] + 30, alma[1] - 30]);
  });

  // falso chasis: dos perfiles y sus travesaños, entre bastidor y caja
  const falso = [P.larguero_top, P.caja_fondo];
  for (const [lado, signo] of [['izq', -1], ['der', 1]]) {
    bloque(ch, 'falso_' + lado, [P.caja_trasera, P.caja_frontal],
      ord(signo * (mitad + 40), signo * (mitad - 60)), falso);
  }
  [-2200, -1000, 400, 1600, 2200].forEach((x, k) => {
    bloque(ch, `falso_travesano_${k + 1}`, [x - 50, x + 50], [-mitad + 40, mitad - 40],
      [falso[0] + 20, falso[1]]);
  });

  // ejes, ruedas y guardabarros
  const via = P.via / 2.0;
  for (const [nombre, x] of [['trasero', P.eje_trasero], ['delantero', P.eje_delantero]]) {
    ch.poner('eje_' + nombre, rueda(x, 0.0, P.eje_z, via * 2 - P.rueda_ancho, P.eje_diam / 2.0));
    bloque(ch, `ballesta_${nombre}_izq`, [x - 500, x + 500], [-mitad - 20, -mitad + 20], [P.eje_z + 60, alma[0]]);
    bloque(ch, `ballesta_${nombre}_der`, [x - 500, x + 500], [mitad - 20, mitad + 20], [P.eje_z + 60, alma[0]]);
    for (const [lado, signo] of [['izq', -1], ['der', 1]]) {
      // el neumatico es un anillo: sin vaciarlo, la llanta queda enterrada y
      // la rueda se lee como un disco negro macizo
      const neumatico = ruedas.poner(`rueda_${nombre}_${lado}`,
        rueda(x, signo * via, P.eje_z, P.rueda_ancho, P.rueda_diam / 2.0));
      ruedas.restar(neumatico, rueda(x, signo * via, P.eje_z, P.rueda_ancho + 20, P.llanta_diam / 2.0));
      ruedas.poner(`llanta_${nombre}_${lado}`,
        rueda(x, signo * via, P.eje_z, P.rueda_ancho * 0.62, P.llanta_diam / 2.0 + 4));
      ruedas.poner(`buje_${nombre}_${lado}`,
        rueda(x, signo * (via + P.rueda_ancho * 0.22), P.eje_z, P.rueda_ancho * 0.18, 130.0));
    }
  }
}
