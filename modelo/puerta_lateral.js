// La puerta de la caja: una Outbound DE-20 en el costado derecho (R99).
//
// El costado derecho es el de la acera, el de y negativa. La puerta va entre el
// aparador y los pies de la cama, montada en su hueco escalonado, con el umbral
// a ras del piso. Por fuera no lleva peldaños (R15).
import { BANO, CAJA, INTERIOR, caja, envolvente, muros } from './geo.js';

export function puertaLateral(modelo) {
  const R = modelo.reglas;
  const DE = R.puertaDe(R.PUERTA_OUTBOUND);
  const D = {
    x: [...R.PUERTA_CAJA_X],
    // el umbral es su paso libre, a ras del piso
    z: [R.PISO, R.PISO + DE.libre[0]],
    pared_y: R.COSTADO_PUERTA,      // paramento interior
    muro: R.MURO.panel + R.MURO.aislamiento,
  };

  const comp = modelo.nuevo(CAJA, 'puerta_lateral');
  const paredes = modelo.buscar('paredes');
  // Los muebles son todo lo que vive dentro de Caja / Interior. Ni el baño ni
  // el suelo se recortan: el paso de la puerta es para los muebles.
  const fueraDelPaso = new Set(modelo.dentroDe(BANO).map((c) => c.clave));
  const muebles = modelo.dentroDe(INTERIOR).filter((c) => c.cuerpos.length
    && c.nombre !== 'suelo_elevado' && !fueraDelPaso.has(c.clave));

  const bloque = (destino, nombre, x, y, z) => {
    const forma = caja(x, y, z);
    return forma ? destino.poner(nombre, forma) : null;
  };

  // ------------------------------------------------------------ hueco en el muro
  const fueraY = D.pared_y - D.muro;
  const centro = [(D.x[0] + D.x[1]) / 2.0, D.z[0] + DE.libre[0] / 2.0];
  // Los tramos en x y en z de un rectangulo [alto, ancho] de la puerta.
  const centrado = (tam) => [[centro[0] - tam[1] / 2.0, centro[0] + tam[1] / 2.0],
    [centro[1] - tam[0] / 2.0, centro[1] + tam[0] / 2.0]];

  // rebaje desde fuera y paso de ahi hasta dentro
  let [x, z] = centrado(DE.rebaje);
  const cortes = [caja(x, [fueraY - 20, fueraY + DE.fondo_rebaje], z)];
  [x, z] = centrado(DE.paso);
  cortes.push(caja(x, [fueraY - 20, D.pared_y + 20], z));
  for (const corte of cortes) {
    for (const cuerpo of muros(paredes, corte)) paredes.restar(cuerpo, corte);
  }

  // Marco rectangular en el plano de la pared: cuatro tiras.
  const anillo = (nombre, fuera, dentro, y) => {
    const [xf, zf] = centrado(fuera);
    const [xd, zd] = centrado(dentro);
    bloque(comp, nombre + '_abajo', xf, y, [zf[0], zd[0]]);
    bloque(comp, nombre + '_arriba', xf, y, [zd[1], zf[1]]);
    bloque(comp, nombre + '_izq', [xf[0], xd[0]], y, zd);
    bloque(comp, nombre + '_der', [xd[1], xf[1]], y, zd);
  };

  // ------------------------------------------------- la DE-20 en su hueco
  // Todo se mide desde la cara de fuera de la pared hacia dentro, como en las
  // ventanas: la brida y la hoja vuelan 4 por fuera, el cuerpo entra 42 en el
  // rebaje, con la hoja cerrando contra su fondo, y el escalon de dentro llega
  // hasta el paramento.
  const tope = fueraY + DE.fondo_cuerpo - DE.pared;
  anillo('de_brida', DE.marco, DE.hoja, [fueraY - DE.brida, fueraY]);
  anillo('de_cuerpo', DE.cuerpo, DE.hoja, [fueraY, tope]);
  anillo('de_tope', DE.cuerpo, DE.libre, [tope, fueraY + DE.fondo_cuerpo]);
  anillo('de_interior', DE.interior, DE.libre, [fueraY + DE.fondo_cuerpo, D.pared_y]);
  [x, z] = centrado(DE.hoja);
  bloque(comp, 'hoja', x, [fueraY - DE.brida, tope], z);
  // la cerradura en el canto de la x menor, a media altura, con el pomo por
  // dentro; las bisagras en el de la x mayor, hacia la cabina
  bloque(comp, 'de_cerradura', [x[0] + 60, x[0] + 170], [fueraY - DE.brida - 3, tope + 20],
    [centro[1] - 110, centro[1] + 110]);
  bloque(comp, 'de_bisagra', [x[1] - 12, x[1] + 8], [fueraY - DE.brida - 3, fueraY - DE.brida],
    [z[0] + 60, z[1] - 60]);

  // el zocalo de la caja se corta donde monta la brida: queda en dos trozos y
  // el de detras conserva el nombre
  const remates = modelo.buscar('remates');
  const [xb, zb] = centrado(DE.marco);
  for (const cuerpo of [...remates.cuerpos]) {
    const bb = envolvente(cuerpo.forma);
    if (!(cuerpo.nombre.startsWith('zocalo_') && bb.y[1] < 0 && bb.z[1] > zb[0])) continue;
    const nombre = cuerpo.nombre;
    const trozos = remates.restar(cuerpo, caja(xb, [bb.y[0] - 1, bb.y[1] + 1], [bb.z[0] - 1, bb.z[1] + 1]));
    trozos.sort((a, b) => envolvente(a.forma).x[0] - envolvente(b.forma).x[0]);
    trozos.forEach((trozo, k) => { trozo.nombre = nombre + ['', '_delante'][k]; });
  }

  // R15: sin peldaños bajo la puerta. El umbral queda a 1310 del suelo firme
  // (R108), asi que hara falta algo, pero se decidira despues.
  // Sin asidero junto a la puerta (R21).

  // ------------------------------- nada puede estorbar el paso de una puerta
  const zona = caja([...D.x], [D.pared_y, D.pared_y + 620], [D.z[0] + 20, D.z[1]]);
  const recortados = [];
  for (const mueble of muebles) {
    for (const cuerpo of [...mueble.cuerpos]) {
      const bb = envolvente(cuerpo.forma);
      const solapa = bb.x[1] > D.x[0] && bb.x[0] < D.x[1]
        && bb.y[0] < D.pared_y + 620 && bb.y[1] > D.pared_y
        && bb.z[1] > D.z[0] + 20;
      if (!solapa) continue;
      mueble.restar(cuerpo, zona);
      recortados.push(`${mueble.nombre}/${cuerpo.nombre}`);
    }
  }
  modelo.notas.puerta = { hueco_mm: { x: D.x, z: D.z }, modelo: DE.modelo,
    paso_libre_mm: { alto: DE.libre[0], ancho: DE.libre[1] }, carpinteria_recortada: recortados };
}
