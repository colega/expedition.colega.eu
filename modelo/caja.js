// Caja del Mercedes Atego: panel sandwich y aislamiento interior (R1).
//
// Origen: centro del suelo interior. X a lo largo, hacia la cabina; Y a lo
// ancho, hacia el costado de la cocina; Z hacia arriba.
import { CAJA, PAREDES, placa } from './geo.js';

const rectangulo = (x, y) => [[x[0], y[0]], [x[1], y[0]], [x[1], y[1]], [x[0], y[1]]];

export function caja(modelo) {
  const R = modelo.reglas;
  // R1: las cotas de fuera de la caja
  const CAJA_EXT = { largo: 4700.0, ancho: 2500.0, alto: R.CAJA_ALTO_EXT };
  const paredes = modelo.nuevo(CAJA, 'paredes');
  // R34: cada pared, un grupo con su panel y su aislamiento, para poder
  // ocultarla de una pieza en el visor.
  const pared_suelo = modelo.nuevo(PAREDES, 'pared_suelo');
  const pared_costado_izq = modelo.nuevo(PAREDES, 'pared_costado_izq');
  const pared_costado_der = modelo.nuevo(PAREDES, 'pared_costado_der');
  const pared_frontal = modelo.nuevo(PAREDES, 'pared_frontal');
  // R21: sin pared trasera en las versiones que la descartan: el plano lo
  // cubren la rampa y su tapa ciega.
  const pared_trasera = R.FUERA.pared_trasera ? null : modelo.nuevo(PAREDES, 'pared_trasera');
  // R37: el panel y el aislamiento del techo van al componente 'techo', con el
  // equipo que se monta encima. Asi al ocultar el techo se oculta todo el techo,
  // no solo las placas.
  const tapa = modelo.nuevo(CAJA, 'techo');

  const LX = CAJA_EXT.largo / 2.0;
  const LY = CAJA_EXT.ancho / 2.0;
  const PANEL = R.MURO.panel;
  const AISL = R.MURO.aislamiento;
  const BASE = -PANEL - AISL;
  const TOP = BASE + CAJA_EXT.alto;

  const PX = LX - PANEL, PY = LY - PANEL;      // cara de dentro del panel
  const AX = PX - AISL, AY = PY - AISL;        // cara de dentro del aislamiento
  const Z_PANEL = [BASE + PANEL, TOP - PANEL]; // tramo de pared entre suelo y techo
  const Z_AISL = [Z_PANEL[0] + AISL, Z_PANEL[1] - AISL];

  // R34: el costado se lleva las esquinas y las envuelve RETORNO hacia dentro de
  // la cara frontal. Sin ese retorno la esquina se queda con 50 mm de cara y el
  // redondeo de 120 no cabe.
  const RETORNO = 200.0;

  // Contorno en planta de un costado, con los dos retornos de esquina.
  const costado = (signo) => {
    const fuera = signo * LY, dentro = signo * PY, vuelta = signo * (LY - RETORNO);
    return [[-LX, fuera], [LX, fuera], [LX, vuelta], [PX, vuelta], [PX, dentro],
      [-PX, dentro], [-PX, vuelta], [-LX, vuelta]];
  };
  const ENTRE = LY - RETORNO;   // el frontal y la trasera van entre los retornos

  const piezas = [
    // el suelo y el techo son la tapa entera, asi que se llevan tambien el
    // redondeo vertical de las cuatro esquinas
    [pared_suelo, 'panel_suelo', rectangulo([-LX, LX], [-LY, LY]), [BASE, BASE + PANEL]],
    [tapa, 'panel_techo', rectangulo([-LX, LX], [-LY, LY]), [TOP - PANEL, TOP]],
    [pared_costado_izq, 'panel_costado_izq', costado(1), Z_PANEL],
    [pared_costado_der, 'panel_costado_der', costado(-1), Z_PANEL],
    [pared_frontal, 'panel_frontal', rectangulo([PX, LX], [-ENTRE, ENTRE]), Z_PANEL],
    // el aislamiento no lleva redondeos, asi que van seis cajas y ya
    [pared_suelo, 'aisl_suelo', rectangulo([-AX, AX], [-AY, AY]), [Z_PANEL[0], Z_AISL[0]]],
    [tapa, 'aisl_techo', rectangulo([-AX, AX], [-AY, AY]), [Z_AISL[1], Z_PANEL[1]]],
    [pared_costado_izq, 'aisl_costado_izq', rectangulo([-PX, PX], [AY, PY]), Z_AISL],
    [pared_costado_der, 'aisl_costado_der', rectangulo([-PX, PX], [-PY, -AY]), Z_AISL],
    [pared_frontal, 'aisl_frontal', rectangulo([AX, PX], [-AY, AY]), Z_AISL],
  ];
  if (pared_trasera) {
    piezas.push(
      [pared_trasera, 'panel_trasera', rectangulo([-LX, -PX], [-ENTRE, ENTRE]), Z_PANEL],
      [pared_trasera, 'aisl_trasera', rectangulo([-PX, -AX], [-AY, AY]), Z_AISL]);
  }
  for (const [destino, nombre, contorno, z] of piezas) {
    destino.poner(nombre, placa(contorno, z));
  }
}
