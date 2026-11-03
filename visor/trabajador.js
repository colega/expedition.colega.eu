// Construye una version del camion en un hilo aparte y manda las mallas al
// visor, con los colores de sus materiales.
//
// Es el mismo codigo que corre en Node con modelo/construir.js: lo que se ve es
// lo que se comprueba.
import opencascade from 'replicad-opencascadejs';
import wasmUrl from 'replicad-opencascadejs/wasm?url';
import { setOC } from 'replicad';
import { construir } from '../modelo/camion.js';
import { materiales } from '../modelo/materiales.js';

// las versiones, por nombre de carpeta; cada una se carga solo si se pide
const VERSIONES = Object.fromEntries(Object.entries(import.meta.glob('../versiones/*/version.js'))
  .map(([ruta, cargar]) => [ruta.split('/')[2], cargar]));

// tolerancia de la malla en mm y en radianes: de sobra para mirar
const MALLA = { tolerance: 0.5, angularTolerance: 0.25 };

// OpenCascade arranca en cuanto se carga el hilo, sin esperar a saber la version
const inicio = performance.now();
const listo = opencascade({ locateFile: () => wasmUrl }).then(setOC);

async function trabajar(nombre) {
  if (!VERSIONES[nombre]) throw new Error(`no hay version ${nombre}`);
  const [version] = await Promise.all([VERSIONES[nombre](), listo]);
  const arrancado = performance.now();
  const modelo = construir(version, (paso) => postMessage({ tipo: 'paso', nombre: paso }));
  const construido = performance.now();
  const componentes = [];
  const enviar = [];
  for (const comp of modelo.componentes.values()) {
    const cuerpos = comp.cuerpos.map((cuerpo) => {
      const m = cuerpo.forma.mesh(MALLA);
      const bordes = cuerpo.forma.meshEdges(MALLA);
      const malla = {
        nombre: cuerpo.nombre,
        material: cuerpo.material,
        vertices: new Float32Array(m.vertices),
        normales: new Float32Array(m.normals),
        triangulos: new Uint32Array(m.triangles),
        aristas: new Float32Array(bordes.lines),
        // cada arista, como [primer vertice, cuantos] dentro de aristas
        grupos: new Uint32Array(bordes.edgeGroups.flatMap((g) => [g.start, g.count])),
      };
      enviar.push(malla.vertices.buffer, malla.normales.buffer, malla.triangulos.buffer, malla.aristas.buffer, malla.grupos.buffer);
      return malla;
    });
    componentes.push({ ruta: comp.ruta, cuerpos });
  }
  postMessage({ tipo: 'modelo', componentes, notas: modelo.notas, descripcion: version.DESCRIPCION,
    colores: materiales(version.reglas), altura_piso: version.reglas.ALTURA_PISO,
    tiempos: { arrancar: arrancado - inicio, construir: construido - arrancado, mallar: performance.now() - construido } }, enviar);
}

onmessage = ({ data }) => {
  trabajar(data.version).catch((err) => postMessage({ tipo: 'error', mensaje: String(err && (err.stack || err)) }));
};
