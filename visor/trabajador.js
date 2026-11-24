// Construye el camion en un hilo aparte y manda las mallas al visor, con los
// colores de sus materiales.
//
// Es el mismo codigo que corre en Node con modelo/construir.js: lo que se ve es
// lo que se comprueba.
import opencascade from 'replicad-opencascadejs';
import wasmUrl from 'replicad-opencascadejs/wasm?url';
import { setOC } from 'replicad';
import { construir } from '../modelo/camion.js';
import { materiales } from '../modelo/materiales.js';

// tolerancia de la malla en mm y en radianes: de sobra para mirar
const MALLA = { tolerance: 0.5, angularTolerance: 0.25 };

// OpenCascade arranca en cuanto se carga el hilo
const inicio = performance.now();
const listo = opencascade({ locateFile: () => wasmUrl }).then(setOC);

// el visor dice que ramas quiere ver (?solo): las demas no se mallan
const pedido = new Promise((resolver) => { onmessage = ({ data }) => resolver(data.solo); });
const dentro = (ruta, solo) => !solo || solo.some((r) => ruta === r || ruta.startsWith(r + '/'));

async function trabajar() {
  await listo;
  const arrancado = performance.now();
  const modelo = construir((paso) => postMessage({ tipo: 'paso', nombre: paso }));
  const construido = performance.now();
  const componentes = [];
  const enviar = [];
  const solo = await pedido;
  for (const comp of modelo.componentes.values()) {
    if (!dentro(comp.ruta.join('/'), solo)) continue;
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
  postMessage({ tipo: 'modelo', componentes, notas: modelo.notas,
    colores: materiales(modelo.reglas), altura_piso: modelo.reglas.ALTURA_PISO,
    tiempos: { arrancar: arrancado - inicio, construir: construido - arrancado, mallar: performance.now() - construido } }, enviar);
}

trabajar().catch((err) => postMessage({ tipo: 'error', mensaje: String(err && (err.stack || err)) }));
