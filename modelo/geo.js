// Geometria y arbol de componentes del modelo, compartidos por todos los
// guiones. Los solidos los hace OpenCascade a traves de replicad.
//
// Todo va en mm, en el marco del modelo: origen en el centro del suelo
// interior de la caja, x hacia la cabina, y hacia la cocina y z arriba.
//
// El arbol es el de siempre:
//
//     Camion            cabina, chasis, ruedas, bajos, frontal
//     Caja              paredes, remates, techo, rampa, puerta lateral
//       paredes         envolvente menos la tapa de arriba (R34)
//       techo           la tapa de arriba mas el equipo que va sobre ella (R37)
//       Interior        suelo elevado y las cuatro estancias
//         Dormitorio    cama, altos, escalon, ventanas
//         Cocina        encimera, altos, fregadero, vitro, ventana
//         Bano          tabiques con puerta, ducha, plataforma, armario, ventana
//         Comedor       sofa, mesa, aparador, altos, ventana
//
// Las ventanas van en su estancia: el hueco es un corte en el cuerpo del panel,
// y el vidrio y el marco son cuerpos aparte. Ocultar una ventana no cierra el
// hueco.
import {
  makeBox, makeCylinder, makePolygon, basicFaceExtrusion, Vector, Solid,
} from 'replicad';

export const CAMION = ['Camion'];
export const CAJA = ['Caja'];
export const INTERIOR = ['Caja', 'Interior'];
export const DORMITORIO = ['Caja', 'Interior', 'Dormitorio'];
export const COCINA = ['Caja', 'Interior', 'Cocina'];
export const BANO = ['Caja', 'Interior', 'Bano'];
export const COMEDOR = ['Caja', 'Interior', 'Comedor'];

// Por debajo de esto una pieza no existe: bloque() devuelve null.
const MINIMO = 0.01;

// [min, max] de dos numeros, que es lo que pide cada tramo
export const ord = (a, b) => (a <= b ? [a, b] : [b, a]);

// --------------------------------------------------------------- arbol
// Un componente es una lista de cuerpos con nombre. El modelo guarda los
// componentes por ruta, en el orden en que se crean, que es el del visor.
export class Componente {
  constructor(ruta) {
    this.ruta = ruta;
    this.nombre = ruta[ruta.length - 1];
    this.cuerpos = [];
  }

  get clave() { return this.ruta.join('/'); }

  poner(nombre, forma) {
    const cuerpo = { nombre, forma };
    this.cuerpos.push(cuerpo);
    return cuerpo;
  }

  cuerpo(nombre) {
    return this.cuerpos.find((c) => c.nombre === nombre) || null;
  }

  quitar(cuerpo) {
    const i = this.cuerpos.indexOf(cuerpo);
    if (i >= 0) this.cuerpos.splice(i, 1);
  }

  // Corta un cuerpo con una herramienta. Si queda en varios trozos, el primero
  // conserva el nombre y los demas se llaman nombre_1, nombre_2... (R34).
  restar(cuerpo, herramienta) {
    const trozos = solidos(cuerpo.forma.cut(herramienta));
    const i = this.cuerpos.indexOf(cuerpo);
    if (!trozos.length) {
      this.cuerpos.splice(i, 1);
      return [];
    }
    cuerpo.forma = trozos[0];
    const nuevos = trozos.slice(1).map((forma, k) => ({ nombre: `${cuerpo.nombre}_${k + 1}`, forma }));
    this.cuerpos.splice(i + 1, 0, ...nuevos);
    return [cuerpo, ...nuevos];
  }

  unir(cuerpo, otra) {
    cuerpo.forma = cuerpo.forma.fuse(otra);
    return cuerpo;
  }
}

export class Modelo {
  constructor() {
    this.componentes = new Map();
    // lo que los guiones apuntan para fuera: despiece, ventanas, avisos
    this.despiece = [];
    this.notas = {};
  }

  // Componente al final de una ruta, creando lo que falte.
  grupo(ruta) {
    let actual = null;
    for (let i = 1; i <= ruta.length; i++) {
      const parte = ruta.slice(0, i);
      const clave = parte.join('/');
      actual = this.componentes.get(clave);
      if (!actual) {
        actual = new Componente(parte);
        this.componentes.set(clave, actual);
      }
    }
    return actual;
  }

  // Componente de trabajo dentro de una ruta: se rehace en cada pasada.
  nuevo(ruta, nombre) {
    const comp = this.grupo([...ruta, nombre]);
    comp.cuerpos = [];
    return comp;
  }

  // Busca un componente por su nombre en todo el arbol.
  buscar(nombre) {
    for (const comp of this.componentes.values()) {
      if (comp.nombre === nombre) return comp;
    }
    return null;
  }

  // Los componentes que cuelgan de una ruta, ella incluida.
  dentroDe(ruta) {
    const clave = ruta.join('/');
    return [...this.componentes.values()].filter(
      (c) => c.clave === clave || c.clave.startsWith(clave + '/'));
  }

  // Todos los cuerpos, con su componente.
  *todos() {
    for (const comp of this.componentes.values()) {
      for (const cuerpo of comp.cuerpos) yield { comp, cuerpo };
    }
  }
}

// ------------------------------------------------------------- formas
// Los solidos que hay dentro de una forma, que un corte puede partir.
export function solidos(forma) {
  if (!forma) return [];
  if (forma instanceof Solid) return [forma];
  return forma.solids;
}

export function envolvente(forma) {
  const [[x0, y0, z0], [x1, y1, z1]] = forma.boundingBox.bounds;
  return { x: [x0, x1], y: [y0, y1], z: [z0, z1] };
}

// Caja entre tres tramos, o null si alguno mide cero.
export function caja(x, y, z) {
  if (Math.min(x[1] - x[0], y[1] - y[0], z[1] - z[0]) <= MINIMO) return null;
  return makeBox([x[0], y[0], z[0]], [x[1], y[1], z[1]]);
}

// Cilindro con el eje en x, y o z, que va de a a b en ese eje. centro son las
// otras dos coordenadas, en el orden x, y, z.
export function cilindroEntre(eje, centro, [a, b], radio) {
  const [p, q] = centro;
  const base = { x: [a, p, q], y: [p, a, q], z: [p, q, a] }[eje];
  const dir = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }[eje];
  return makeCylinder(radio, b - a, base, dir);
}

// Cilindro vertical: centro es [x, y] y z el tramo en altura.
export function cilindro(centro, z, radio) {
  return cilindroEntre('z', centro, z, radio);
}

// Cilindro con el eje en un eje, centrado en un punto [x, y, z] y con esa
// longitud total.
export function cilindroCentrado(eje, punto, longitud, radio) {
  const i = { x: 0, y: 1, z: 2 }[eje];
  const otros = punto.filter((_, k) => k !== i);
  return cilindroEntre(eje, otros, [punto[i] - longitud / 2, punto[i] + longitud / 2], radio);
}

// Extruye un poligono de puntos 3D a lo largo de un vector.
function extruir(puntos, vector) {
  return basicFaceExtrusion(makePolygon(puntos), new Vector(vector));
}

// Contorno en planta [[x, y], ...] extruido entre dos cotas.
export function placa(contorno, z) {
  return extruir(contorno.map(([x, y]) => [x, y, z[0]]), [0, 0, z[1] - z[0]]);
}

// Seccion [[a, z], ...] extruida por un eje horizontal, centrada en centro.
// eje es 'x' o 'y' y marca la direccion; a es el otro eje horizontal.
export function prisma(eje, centro, longitud, seccion) {
  const inicio = centro - longitud / 2;
  const puntos = seccion.map(([a, z]) => (eje === 'x' ? [inicio, a, z] : [a, inicio, z]));
  return extruir(puntos, eje === 'x' ? [longitud, 0, 0] : [0, longitud, 0]);
}

// Redondea las aristas de un cuerpo que cumplan una condicion.
export function redondear(cuerpo, radio, condicion) {
  cuerpo.forma = cuerpo.forma.fillet((e) => (condicion(e) ? radio : null));
}

// ---------------------------------------------------------- envolvente
// Cuerpos de un componente que atraviesa una herramienta de corte (R34).
//
// Las paredes van partidas en doce cuerpos, asi que un hueco no se corta
// contra dos cuerpos fijos: hay que ver a cuales llega de verdad.
export function muros(comp, herramienta, holgura = 1.0) {
  const h = envolvente(herramienta);
  return comp.cuerpos.filter((cuerpo) => {
    const b = envolvente(cuerpo.forma);
    return ['x', 'y', 'z'].every((e) => h[e][0] < b[e][1] - holgura && b[e][0] + holgura < h[e][1]);
  });
}
