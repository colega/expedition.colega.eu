// Las trampillas del garaje: las puertas de debajo de la cama, una en cada
// costado (R116 y R117).
//
// Cada una corta el muro de la caja y el costado del garaje, y pone en el hueco
// la hoja, con su brida y su junta por fuera. Van cerradas: el visor no las abre.
import { CAJA, caja, muros, ord } from './geo.js';

export function trampilla(modelo) {
  const R = modelo.reglas;
  // lado: hacia donde mira el costado, -1 el derecho y 1 el izquierdo
  const trampillas = [
    { nombre: 'trampilla_garaje', T: R.TRAMPILLA_GARAJE, lado: -1, dentro: R.COSTADO_PUERTA },
    { nombre: 'trampilla_garaje_izq', T: R.TRAMPILLA_GARAJE_IZQ, lado: 1, dentro: R.COSTADO_COCINA },
  ];
  for (const t of trampillas) poner(modelo, R, t);
}

function poner(modelo, R, { nombre, T, lado, dentro }) {
  const { x: X, z: Z, brida: ancho } = T;
  const fuera = dentro + lado * (R.MURO.panel + R.MURO.aislamiento);  // cara de fuera de la caja
  const vuelo = R.PUERTA_DE_COMUN.brida;                // lo que vuela por fuera
  const J = R.JUNTA;
  // el tramo en y que va de la cara de fuera hacia fuera una distancia d
  const sobre = (d) => ord(fuera, fuera + lado * d);

  // ------------------------------------------------------- hueco en el muro y el garaje
  // Solo en la envolvente y en el garaje, que es lo que llega al hueco.
  const corte = caja(X, ord(fuera + lado * 10, dentro - lado * (R.ESPESOR + 10)), Z);
  const destinos = [...modelo.dentroDe(modelo.buscar('paredes').ruta), modelo.buscar('garaje')];
  for (const comp of destinos) {
    for (const cuerpo of muros(comp, corte)) comp.restar(cuerpo, corte);
  }

  // ------------------------------------------------------------ la hoja y sus marcos
  const comp = modelo.nuevo(CAJA, nombre);
  const bloque = (n, x, y, z) => comp.poner(n, caja(x, y, z));
  // Marco rectangular alrededor del hueco, entre dos distancias a su canto.
  const anillo = (n, a, b, y) => {
    const largo = (d) => [X[0] - d, X[1] + d];
    bloque(n + '_abajo', largo(b), y, [Z[0] - b, Z[0] - a]);
    bloque(n + '_arriba', largo(b), y, [Z[1] + a, Z[1] + b]);
    bloque(n + '_izq', [X[0] - b, X[0] - a], y, [Z[0] - a, Z[1] + a]);
    bloque(n + '_der', [X[1] + a, X[1] + b], y, [Z[0] - a, Z[1] + a]);
  };
  anillo('tg_brida', 0, ancho, sobre(vuelo));
  // R114: la junta de silicona alrededor de la brida, sobre el panel
  anillo('tg_junta', ancho, ancho + J.ancho, sobre(J.grueso));
  bloque('tg_hoja', X, ord(fuera + lado * vuelo, dentro), Z);
  // la cerradura en el canto de la x menor, a media altura; la bisagra en el de
  // la x mayor, hacia la cabina, como en la puerta de la caja (R99)
  const herraje = ord(fuera + lado * vuelo, fuera + lado * (vuelo + 3));
  const medio = (Z[0] + Z[1]) / 2.0;
  bloque('tg_cerradura', [X[0] + 60, X[0] + 170], herraje, [medio - 110, medio + 110]);
  bloque('tg_bisagra', [X[1] - 12, X[1] + 8], herraje, [Z[0] + 60, Z[1] - 60]);
}
