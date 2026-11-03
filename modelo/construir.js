// Construye las versiones del camion en Node, escribe su despiece y sus
// ventanas, y pasa las comprobaciones.
//
//   node modelo/construir.js                  todas las versiones
//   node modelo/construir.js v17              solo esa
//   node modelo/construir.js v17 --referencia ademas guarda su inventario como
//                                             referencia.jsonl
//
// Cada version vive en versiones/<nombre>/ y lo que se escribe va a esa
// carpeta. Sale con error si algo queda fuera de sitio en alguna.
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { iniciar } from './oc_node.js';
import { construir } from './camion.js';
import { verificar, huecos, choques } from './comprobaciones.js';
import { inventario, leerReferencia, escribirReferencia, comparar } from './inventario.js';
import { materiales } from './materiales.js';

const VERSIONES = new URL('../versiones/', import.meta.url);
const pedidas = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const nombres = pedidas.length ? pedidas
  : readdirSync(VERSIONES, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
const guardarReferencia = process.argv.includes('--referencia');

await iniciar();
let fallos = 0;
for (const nombre of nombres) {
  const carpeta = new URL(`${nombre}/`, VERSIONES);
  const aqui = (fichero) => new URL(fichero, carpeta);
  const version = await import(aqui('version.js'));
  const inicio = Date.now();
  console.log(`=== ${nombre}: ${version.DESCRIPCION}`);
  const modelo = construir(version, (paso, descripcion) => console.log(`== ${paso.padEnd(16)} ${descripcion}`));
  const segundos = (Date.now() - inicio) / 1000;

  // el despiece de la carpinteria, de mayor a menor dentro de cada mueble
  const piezas = [...modelo.despiece].sort((a, b) => (a.mueble < b.mueble ? -1 : a.mueble > b.mueble ? 1 : b.area_m2 - a.area_m2));
  writeFileSync(aqui('despiece.csv'), 'mueble,pieza,espesor_mm,largo_mm,ancho_mm,area_m2\n'
    + piezas.map((p) => [p.mueble, p.pieza, p.espesor.toFixed(1), p.largo.toFixed(1), p.ancho.toFixed(1),
      p.area_m2.toFixed(3)].join(',') + '\n').join(''));
  writeFileSync(aqui('ventanas.json'), JSON.stringify({ ventanas: modelo.notas.ventanas }, null, 1) + '\n');

  const filas = inventario(modelo);
  const v = verificar(modelo);
  const h = huecos(modelo);
  const c = choques(modelo);
  const colores = materiales(modelo.reglas);
  const ref = existsSync(aqui('referencia.jsonl')) ? leerReferencia(readFileSync(aqui('referencia.jsonl'), 'utf8')) : [];
  const { cambios, renombrados } = comparar(ref, filas);
  if (guardarReferencia) {
    writeFileSync(aqui('referencia.jsonl'), escribirReferencia(filas));
  }

  const area = piezas.reduce((s, p) => s + p.area_m2, 0);
  console.log(JSON.stringify({
    version: nombre,
    segundos,
    cuerpos: filas.length,
    interior: filas.filter((f) => f.ruta.startsWith('Caja/Interior')).length,
    paneles: piezas.length,
    area_tablero_m2: Math.round(area * 100) / 100,
    tableros_2440x1220: Math.round(area / (2.44 * 1.22) * 10) / 10,
    verificar: v,
    huecos: h.avisos,
    choques: c.interferencias,
    redondeos_fallidos: modelo.notas.redondeos_fallidos,
    // cuerpos sin material o con uno que el visor no sabe pintar
    sin_color: filas.filter((f) => !colores[f.material]).map((f) => `${f.ruta}/${f.nombre}`),
    contra_referencia: { cambios, renombrados },
  }, null, 1));
  if (v.fuera_de_sitio.length) fallos++;
}
process.exit(fallos ? 1 : 0);
