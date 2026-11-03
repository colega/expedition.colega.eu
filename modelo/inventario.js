// Inventario de todos los cuerpos del modelo, para comparar dos construcciones.
//
// Cada fila: ruta del componente, nombre, caja en mm (x0, x1, y0, y1, z0, z1),
// volumen en litros, area en m2, material y caras.
//
// El referencia.jsonl de cada version guarda una fila por linea, tal cual. Tras
// un cambio que no debe mover geometria, el inventario tiene que salir igual.
import { measureArea, measureVolume } from 'replicad';
import { envolvente } from './geo.js';

const r = (v, n) => Math.round(v * 10 ** n) / 10 ** n;

export function inventario(modelo) {
  const filas = [];
  for (const { comp, cuerpo } of modelo.todos()) {
    const b = envolvente(cuerpo.forma);
    filas.push({
      ruta: comp.clave, nombre: cuerpo.nombre,
      caja: [b.x[0], b.x[1], b.y[0], b.y[1], b.z[0], b.z[1]].map((v) => r(v, 1)),
      litros: r(measureVolume(cuerpo.forma) / 1e6, 3),
      area: r(measureArea(cuerpo.forma) / 1e6, 4),
      material: cuerpo.material || null,
      caras: cuerpo.forma.faces.length,
    });
  }
  return filas;
}

// Lee y escribe un referencia.jsonl.
export const leerReferencia = (texto) => texto.trim().split('\n').map((linea) => JSON.parse(linea));
export const escribirReferencia = (filas) => filas.map((f) => JSON.stringify(f)).join('\n') + '\n';

// Compara dos inventarios. Empareja primero por nombre y geometria, luego por
// geometria dentro del mismo componente, porque dos trozos de un mismo corte
// pueden salir con los nombres cruzados, y al final por nombre. Devuelve los
// cambios de geometria o material y, aparte, los renombrados.
export function comparar(antes, despues, { mm = 0.2, litros = 0.01 } = {}) {
  const clave = (f) => `${f.ruta}/${f.nombre}`;
  const igualGeo = (a, b) => a.caja.every((v, i) => Math.abs(v - b.caja[i]) <= mm)
    && Math.abs(a.litros - b.litros) <= Math.max(litros, Math.abs(a.litros) * 1e-4);
  const libres = new Set(despues);
  const pares = [];
  const renombrados = [];
  let quedan = [...antes];
  const emparejar = (casa, alCasar) => {
    quedan = quedan.filter((a) => {
      const b = [...libres].find((f) => casa(a, f));
      if (!b) return true;
      libres.delete(b);
      pares.push([a, b]);
      if (alCasar) alCasar(a, b);
      return false;
    });
  };
  emparejar((a, b) => clave(a) === clave(b) && igualGeo(a, b));
  emparejar((a, b) => a.ruta === b.ruta && igualGeo(a, b),
    (a, b) => renombrados.push(`${clave(a)}: ahora se llama ${b.nombre}`));
  emparejar((a, b) => clave(a) === clave(b));
  const cambios = [];
  for (const [a, b] of pares) {
    const lista = [];
    if (!igualGeo(a, b)) lista.push(`caja ${a.caja} -> ${b.caja}, litros ${a.litros} -> ${b.litros}`);
    if (a.material !== b.material) lista.push(`material ${a.material} -> ${b.material}`);
    if (a.caras !== b.caras) lista.push(`caras ${a.caras} -> ${b.caras}`);
    if (lista.length) cambios.push(`${clave(b)}: ${lista.join('; ')}`);
  }
  for (const a of quedan) cambios.push(`${clave(a)}: falta`);
  for (const b of libres) cambios.push(`${clave(b)}: sobra`);
  return { cambios, renombrados };
}
