// Las tres comprobaciones que se pasan siempre despues de tocar algo:
//
//   verificar   nada fuera de su zona: los muebles dentro del hueco util y las
//               ventanas, como mucho, en el muro
//   huecos      holguras raras entre los muebles y las paredes
//   choques     interferencias entre cuerpos de muebles distintos
import { measureVolume } from 'replicad';
import { envolvente } from './geo.js';

// Lo que no es casa: la envolvente, el camion y lo que va por fuera.
const VEHICULO = new Set(['paredes', 'chasis', 'ruedas', 'cabina', 'remates',
  'bajos', 'techo', 'puerta_lateral', 'rampa']);

const conCuerpos = (modelo) => [...modelo.componentes.values()].filter((c) => c.cuerpos.length);
const r1 = (v) => Math.round(v * 10) / 10;

// Comprueba que nada se sale de donde debe, cuerpo a cuerpo.
//
// Los solidos del interior tienen que estar dentro del hueco util. Los vidrios
// pueden ocupar el muro, pero no salir del paramento exterior.
export function verificar(modelo) {
  const R = modelo.reglas;
  const int = R.INTERIOR;
  const muro = R.MURO.panel + R.MURO.aislamiento;
  const TOLERANCIA = 1.0;
  const LIMITES = {
    interior: { x: [-int.largo / 2, int.largo / 2], y: [-int.ancho / 2, int.ancho / 2], z: [0, int.alto] },
    // Los marcos de ventana solapan el paramento exterior: 16 mm de vuelo mas
    // holgura de montaje.
    muro: { x: [-int.largo / 2 - muro - 30, int.largo / 2 + muro + 30],
      y: [-int.ancho / 2 - muro - 30, int.ancho / 2 + muro + 30],
      z: [-muro - 30, int.alto + muro + 30] },
  };
  const fallos = [];
  let contados = 0;
  for (const comp of conCuerpos(modelo)) {
    if (VEHICULO.has(comp.nombre)) continue;
    // los vidrios y marcos de ventana pueden ocupar el muro
    const limites = LIMITES[comp.nombre.startsWith('ventan') ? 'muro' : 'interior'];
    for (const cuerpo of comp.cuerpos) {
      contados++;
      const b = envolvente(cuerpo.forma);
      const exceso = {};
      for (const [eje, [lo, hi]] of Object.entries(limites)) {
        const fuera = Math.max(lo - b[eje][0], b[eje][1] - hi);
        if (fuera > TOLERANCIA) exceso[eje] = r1(fuera);
      }
      if (Object.keys(exceso).length) fallos.push({ componente: comp.nombre, cuerpo: cuerpo.nombre, exceso_mm: exceso });
    }
  }
  return { cuerpos_comprobados: contados, fuera_de_sitio: fallos };
}

// Audita separaciones sospechosas entre muebles y paredes.
//
// Un mueble o va pegado a la pared o se separa a proposito. Una holgura de pocos
// centimetros casi siempre es un error de cotas.
export function huecos(modelo) {
  const R = modelo.reglas;
  const SOSPECHOSO = [3.0, 250.0];
  const int = R.INTERIOR;
  const avisos = [];
  for (const comp of conCuerpos(modelo)) {
    // Las ventanas van en el muro por definicion: no son muebles separados de
    // la pared. R103: la puerta de la ducha tampoco, que se mueve y se separa
    // de la pared a proposito, ni el toallero, que cuelga del tabique (R106),
    // ni la plataforma del inodoro, que tiene el armario entre ella y la pared.
    if (VEHICULO.has(comp.nombre) || comp.nombre.startsWith('ventan')
        || comp.nombre.startsWith('ducha_') || comp.nombre === 'toallero'
        || comp.nombre === 'plataforma_wc') continue;
    const cajas = comp.cuerpos.map((c) => envolvente(c.forma));
    const min = (e) => Math.min(...cajas.map((b) => b[e][0]));
    const max = (e) => Math.max(...cajas.map((b) => b[e][1]));
    const holguras = {
      'x-': min('x') + int.largo / 2, 'x+': int.largo / 2 - max('x'),
      'y-': min('y') + int.ancho / 2, 'y+': int.ancho / 2 - max('y'),
    };
    const cerca = {};
    for (const [k, v] of Object.entries(holguras)) {
      if (SOSPECHOSO[0] < v && v < SOSPECHOSO[1]) cerca[k] = r1(v);
    }
    if (Object.keys(cerca).length) avisos.push({ mueble: comp.nombre, holgura_mm: cerca });
  }
  return { avisos, criterio_mm: SOSPECHOSO };
}

// Busca interferencias entre cuerpos de muebles distintos.
//
// Se mide el volumen comun de verdad, no el solape de cajas: hay piezas que no
// son cajas (el tablero de la mesa con la esquina cortada y la esquina del baño
// en ele, R69 y R70), y la caja de una ele abarca tambien el hueco. Tocarse no
// es solaparse: dos caras que coinciden dan volumen cero.
//
// Las piezas de un mismo mueble no se comparan: ahi el solape es de carpinteria
// a proposito, como el marco de la puerta dentro del tabique. La envolvente y
// el camion se quedan fuera: los huecos de ventana y de puerta se cortan de los
// paneles, asi que ahi el solape es el corte.
export function choques(modelo) {
  const FUERA = new Set(['paredes', 'techo', 'remates', 'chasis', 'ruedas', 'cabina', 'bajos']);
  const MINIMO_MM3 = 1.0;
  const cuerpos = [];
  for (const comp of conCuerpos(modelo)) {
    if (FUERA.has(comp.nombre)) continue;
    for (const cuerpo of comp.cuerpos) cuerpos.push({ comp, cuerpo, b: envolvente(cuerpo.forma) });
  }
  const solapan = (a, b) => ['x', 'y', 'z'].every((e) => a[e][0] < b[e][1] && b[e][0] < a[e][1]);
  const lista = [];
  for (let i = 0; i < cuerpos.length; i++) {
    for (let j = i + 1; j < cuerpos.length; j++) {
      const a = cuerpos[i], b = cuerpos[j];
      if (a.comp === b.comp || !solapan(a.b, b.b)) continue;
      const volumen = measureVolume(a.cuerpo.forma.intersect(b.cuerpo.forma));
      if (volumen > MINIMO_MM3) {
        lista.push({ uno: `${a.comp.nombre}/${a.cuerpo.nombre}`, otro: `${b.comp.nombre}/${b.cuerpo.nombre}`,
          litros: Math.round(volumen / 1e3) / 1e3 });
      }
    }
  }
  lista.sort((p, q) => q.litros - p.litros);
  return { cuerpos_comprobados: cuerpos.length, interferencias: lista };
}
