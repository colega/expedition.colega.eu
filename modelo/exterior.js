// Equipamiento exterior del camion de expedicion.
//
// Lo que va en la caja por fuera y bajo el chasis: rampa, placas solares, aire
// acondicionado, depositos, cofre, rueda de repuesto, guardabarros traseros y
// la proteccion lateral del camion de verdad (R108).
//
// Las cotas parten de la caja: exterior 4700 x 2500 x 2230, con la cara de abajo
// a -65 y la de arriba a 2165 en el marco del modelo (R1).
import { CAJA, CAMION, caja, cilindroCentrado, muros, ord } from './geo.js';

const ENVOLVENTE = ['panel_', 'aisl_'];

export function exterior(modelo) {
  const R = modelo.reglas;
  const E = {
    caja_x: [-2350.0, 2350.0],
    caja_y: [-1250.0, 1250.0],
    // la cara de fuera del techo la pone la regla: lo de encima cuelga de aqui
    techo: R.TECHO_EXT,
    fondo: -65.0,
    suelo: -R.ALTURA_PISO,
    eje_trasero: R.ATEGO.eje_trasero,
    eje_z: -R.ALTURA_PISO + R.ATEGO.rueda_diam / 2,
    rueda_r: R.ATEGO.rueda_diam / 2,
    rueda_ancho: R.ATEGO.rueda_ancho,
    via: R.ATEGO.via / 2,
  };
  const ALTO = R.INTERIOR.alto;

  // Cada familia de piezas a su grupo: lo del camion bajo Camion, lo de la caja
  // bajo Caja. Asi se puede ocultar el camion entero y trabajar solo en la caja.
  const ext = modelo.nuevo(CAJA, 'remates');
  // R37: 'techo' ya trae el panel y el aislamiento de arriba, que los pone
  // caja.js: aqui solo se añade.
  const techo = modelo.grupo([...CAJA, 'techo']);
  const bajos = modelo.nuevo(CAMION, 'bajos');
  const paredes = modelo.buscar('paredes');

  const bloque = (comp, nombre, x, y, z) => {
    const forma = caja(x, y, z);
    return forma ? comp.poner(nombre, forma) : null;
  };
  const cilindro = (comp, nombre, eje, centro, longitud, radio) =>
    comp.poner(nombre, cilindroCentrado(eje, centro, longitud, radio));

  // Corta un hueco en el panel y el aislamiento, sin tocar nada mas.
  //
  // R37: la envolvente vive en dos componentes, 'paredes' y 'techo'. Hay que
  // buscar el objetivo en los dos. Y solo contra la envolvente: en 'techo' esta
  // tambien el equipo que se monta encima, y un hueco no se come su propio aire
  // acondicionado.
  const cortarMuro = (x, y, z) => {
    const herramienta = caja(x, y, z);
    if (!herramienta) return 0;
    let n = 0;
    for (const duenio of [paredes, techo]) {
      for (const cuerpo of muros(duenio, herramienta)) {
        if (!ENVOLVENTE.some((p) => cuerpo.nombre.startsWith(p))) continue;
        duenio.restar(cuerpo, herramienta);
        n++;
      }
    }
    return n;
  };

  // ---------------------------------------------------------------- trasera
  // R54: en la trasera va la rampa elevadora. Se abre el hueco de arriba abajo y
  // se rellena con la hoja metalica, sus listones de madera por dentro y un
  // panel ciego de la rampa al techo.
  const muroX = [E.caja_x[0], E.caja_x[0] + 65];
  const RA = R.RAMPA;
  const rampa = modelo.nuevo(CAJA, 'rampa');
  cortarMuro([muroX[0] - 10, muroX[1] + 10], [...RA.ancho], [0.0, ALTO]);
  // La hoja y su forro miden 73 y el muro trasero 65: la rampa se corre hacia
  // fuera lo que sobra. Por dentro queda a ras del paramento y por fuera vuela 8,
  // que es lo que hace una trampilla elevadora de verdad.
  const sobra = Math.max(0.0, RA.hoja + RA.liston - (muroX[1] - muroX[0]));
  const hojaX = [muroX[0] - sobra, muroX[0] - sobra + RA.hoja];
  bloque(rampa, 'rampa_hoja', hojaX, [...RA.ancho], [0.0, RA.alto]);
  bloque(rampa, 'panel_ciego', [...muroX], [...RA.ancho], [RA.alto, ALTO]);
  // listones horizontales por dentro, con junta entre ellos
  const dentroX = [hojaX[1], hojaX[1] + RA.liston];
  const yListon = [RA.ancho[0] + 20, RA.ancho[1] - 20];
  const n = Math.trunc(RA.listones);
  const libre = RA.alto - 2 * RA.margen - (n - 1) * RA.junta;
  const canto = libre / n;
  for (let k = 0; k < n; k++) {
    const z0 = RA.margen + k * (canto + RA.junta);
    bloque(rampa, `rampa_liston_${String(k + 1).padStart(2, '0')}`, dentroX, yListon, [z0, z0 + canto]);
  }

  // Sin escalera al techo (regla R21): descartada.

  // ---------------------------------------------------------------------- techo
  // R22: en el techo van las placas y el aire (R23). Sin baca, sin claraboyas,
  // sin ventilador, sin cupula ni antena (R21).
  const PLACA = R.PLACA;
  // las placas se acercan al canto para dejar la banda central al aire
  const BORDE_PLACA = 25.0;
  const HOLGURA_PLACA = 30.0;       // separacion entre placas
  const filaDelante = E.caja_x[1] - BORDE_PLACA;
  const filaDetras = E.caja_x[0] + BORDE_PLACA;
  const filas = { delante: [filaDelante - PLACA.largo, filaDelante],
    detras: [filaDetras, filaDetras + PLACA.largo] };
  const columnas = { izq: [HOLGURA_PLACA / 2, HOLGURA_PLACA / 2 + PLACA.ancho],
    der: [-HOLGURA_PLACA / 2 - PLACA.ancho, -HOLGURA_PLACA / 2] };
  const zPlaca = [E.techo, E.techo + PLACA.grueso];
  for (const [fila, x] of Object.entries(filas)) {
    for (const [columna, y] of Object.entries(columnas)) {
      bloque(techo, `placa_solar_${fila}_${columna}`, x, y, zPlaca);
    }
  }

  // R23: aire acondicionado en el medio de la banda, con su hueco en el techo
  const AIRE = R.AIRE;
  const AX = R.AIRE_X;
  const enX = (a, b) => [AX + a, AX + b];
  const mitad = AIRE.hueco / 2.0;
  cortarMuro([AX - mitad, AX + mitad], [-mitad, mitad], [E.techo - 90, E.techo + 20]);
  bloque(techo, 'aire_base', enX(-AIRE.largo / 2, AIRE.largo / 2),
    [-AIRE.ancho / 2, AIRE.ancho / 2], [E.techo, E.techo + 45]);
  bloque(techo, 'aire_carcasa', enX(-AIRE.largo / 2 + 30, AIRE.largo / 2 - 30),
    [-AIRE.ancho / 2 + 35, AIRE.ancho / 2 - 35], [E.techo + 45, E.techo + AIRE.alto]);
  bloque(techo, 'aire_rejilla', enX(-AIRE.largo / 2 + 60, -AIRE.largo / 2 + 90),
    [-AIRE.ancho / 2 + 90, AIRE.ancho / 2 - 90], [E.techo + 70, E.techo + AIRE.alto - 35]);

  // ----------------------------------------------------------------------- bajos
  // depositos entre largueros
  cilindro(bajos, 'deposito_agua_limpia', 'x', [-1500.0, 0.0, -600.0], 1400.0, 320.0);
  bloque(bajos, 'deposito_grises', [200.0, 1100.0], [-380.0, 380.0], [-950.0, -600.0]);
  cilindro(bajos, 'calderin_aire_1', 'x', [700.0, 620.0, -700.0], 600.0, 160.0);

  // detras de la rueda trasera: el deposito del camion en el costado de la
  // cocina, como en la foto, y un cofre en el de la puerta
  const detras = [-1930.0, -1290.0];
  bloque(bajos, 'deposito_gasoil', detras, [720.0, 1180.0], [-520.0, -150.0]);
  bloque(bajos, 'cofre_der', detras, [-1240.0, -860.0], [-540.0, -120.0]);

  // rueda de repuesto tumbada en el voladizo trasero
  cilindro(bajos, 'rueda_repuesto', 'z', [-1900.0, 0.0, -700.0], E.rueda_ancho, E.rueda_r);
  bloque(bajos, 'soporte_repuesto', [-2200.0, -1600.0], [-500.0, 500.0], [-760.0, -700.0]);

  // guardabarros curvos sobre las ruedas traseras, y la faldilla detras
  for (const [lado, signo] of [['izq', -1], ['der', 1]]) {
    const y = signo * E.via;
    const anchoGb = E.rueda_ancho + 90;
    const rExt = E.rueda_r + 95, rInt = E.rueda_r + 40;
    const fuera = cilindro(bajos, 'guardabarros_' + lado, 'y', [E.eje_trasero, y, E.eje_z], anchoGb, rExt);
    bajos.restar(fuera, cilindroCentrado('y', [E.eje_trasero, y, E.eje_z], anchoGb + 30, rInt));
    // se queda solo el arco de arriba
    bajos.restar(fuera, caja([E.eje_trasero - rExt - 20, E.eje_trasero + rExt + 20],
      ord(y - anchoGb, y + anchoGb), [E.eje_z - rExt - 20, E.eje_z + 40]));
    bloque(bajos, `faldilla_${lado}`, [-1575.0, -1555.0],
      ord(y - E.rueda_ancho / 2 - 45, y + E.rueda_ancho / 2 + 45), [E.suelo + 130, E.eje_z + 240]);
  }

  // la proteccion lateral del camion, entre las ruedas: dos barras con tres
  // montantes, un poco por dentro de la cara de la caja
  for (const [lado, signo] of [['izq', -1], ['der', 1]]) {
    const y = ord(signo * 1200, signo * 1230);
    const tramo = [-65.0, 2465.0];
    bloque(bajos, 'proteccion_alta_' + lado, tramo, y, [-400.0, -310.0]);
    bloque(bajos, 'proteccion_baja_' + lado, tramo, y, [-760.0, -655.0]);
    for (const [k, x] of [[1, tramo[0]], [2, 1200.0], [3, tramo[1] - 40]]) {
      bloque(bajos, `proteccion_montante_${k}_${lado}`, [x, x + 40], ord(signo * 1170, signo * 1200), [-760.0, -170.0]);
    }
  }

  // Sin toldo ni ducha exterior (R21). Las garrafas van por dentro de la
  // proteccion lateral.
  [900.0, 1250.0].forEach((x, k) => {
    bloque(ext, `garrafa_${k + 1}`, [x, x + 320], [1010.0, 1180.0], [-600.0, -160.0]);
  });
  bloque(ext, 'garrafa_soporte', [860.0, 1610.0], [1020.0, 1180.0], [-640.0, -600.0]);

  // ------------------------------------------- detalles de la caja como el real
  // perfileria: zocalo y remate de techo, que es lo que da el aire de caja de
  // aluminio en vez de cubo blanco
  for (const [lado, y] of [['izq', E.caja_y[0]], ['der', E.caja_y[1]]]) {
    const signo = y < 0 ? -1 : 1;
    bloque(ext, 'zocalo_' + lado, [E.caja_x[0] + 120, E.caja_x[1] - 120],
      ord(y - signo * 25, y + signo * 12), [E.fondo, E.fondo + 90]);
    bloque(ext, 'remate_techo_' + lado, [E.caja_x[0] + 120, E.caja_x[1] - 120],
      ord(y - signo * 20, y + signo * 10), [E.techo - 70, E.techo - 10]);
    // Sin portezuela de servicio ni luces de gabarito (R21).
  }

  // paragolpes trasero con sus faldillas y los pilotos al final del bastidor,
  // como el del camion
  bloque(bajos, 'paragolpes_trasero', [E.caja_x[0] - 70, E.caja_x[0] + 50], [-1100.0, 1100.0], [-760.0, -640.0]);
  for (const [lado, signo] of [['izq', -1], ['der', 1]]) {
    bloque(bajos, 'paragolpes_soporte_' + lado, [E.caja_x[0] + 50, E.caja_x[0] + 200],
      ord(signo * 900, signo * 1000), [-700.0, -365.0]);
    bloque(bajos, 'faldilla_trasera_' + lado, [E.caja_x[0] - 90, E.caja_x[0] - 70],
      ord(signo * 420, signo * 1080), [E.suelo + 150, -640.0]);
    bloque(bajos, 'piloto_trasero_' + lado, [-2230.0, -2200.0], ord(signo * 700, signo * 1050), [-420.0, -300.0]);
  }

  // ------------------------------------------------ remates y equipo del costado
  // el escape acaba por delante del eje trasero
  bloque(bajos, 'escape', [-300.0, 1100.0], [-560.0, -420.0], [-980.0, -860.0]);
  cilindro(bajos, 'escape_salida', 'x', [-430.0, -490.0, -920.0], 260.0, 55.0);
  // Sin boca de agua, toma de 220 ni cofre de gas (R21).
}
