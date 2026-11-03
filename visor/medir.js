// Medir en el visor: la distancia entre dos aristas del modelo.
//
// Con el modo de medir encendido, un clic elige la arista mas cercana al raton
// y otro clic la segunda. La medida es la distancia minima entre las dos, con
// sus componentes en x, y y z, y se queda dibujada en el modelo con una
// etiqueta flotante hasta que se borra. Las medidas se guardan por version.
//
// Las aristas son las de cada cuerpo, tal como las da OpenCascade: una recta o
// un arco, partido en segmentos. Solo vale una arista que se vea: la que tapa
// otra pieza no se puede elegir.
import * as THREE from 'three';

// a cuantos pixeles del raton se busca una arista
const RADIO_PX = 8;
const COLOR = 0xe0601f;
const r1 = (v) => Math.round(v * 10) / 10;

// Los puntos mas cercanos entre los segmentos p1-q1 y p2-q2 (Ericson,
// Real-Time Collision Detection, 5.1.9).
function entreSegmentos(p1, q1, p2, q2) {
  const d1 = q1.clone().sub(p1), d2 = q2.clone().sub(p2), r = p1.clone().sub(p2);
  const a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r);
  let s, t;
  if (a <= 1e-9 && e <= 1e-9) {
    s = 0; t = 0;
  } else if (a <= 1e-9) {
    s = 0; t = THREE.MathUtils.clamp(f / e, 0, 1);
  } else {
    const c = d1.dot(r);
    if (e <= 1e-9) {
      t = 0; s = THREE.MathUtils.clamp(-c / a, 0, 1);
    } else {
      const b = d1.dot(d2), den = a * e - b * b;
      s = den > 1e-9 ? THREE.MathUtils.clamp((b * f - c * e) / den, 0, 1) : 0;
      t = (b * s + f) / e;
      if (t < 0) { t = 0; s = THREE.MathUtils.clamp(-c / a, 0, 1); }
      else if (t > 1) { t = 1; s = THREE.MathUtils.clamp((b - c) / a, 0, 1); }
    }
  }
  const c1 = p1.clone().addScaledVector(d1, s), c2 = p2.clone().addScaledVector(d2, t);
  return [c1, c2, c1.distanceTo(c2)];
}

// La distancia minima entre dos aristas, cada una una lista de segmentos.
export function entreAristas(a, b) {
  let mejor = null;
  for (const [p1, q1] of a) {
    for (const [p2, q2] of b) {
      const r = entreSegmentos(p1, q1, p2, q2);
      if (!mejor || r[2] < mejor[2]) mejor = r;
    }
  }
  return mejor;
}

// Los segmentos de la arista del grupo que contiene el vertice indice.
function arista(borde, indice) {
  const g = borde.userData.grupos;
  const pos = borde.geometry.attributes.position;
  for (let k = 0; k < g.length; k += 2) {
    const [inicio, cuantos] = [g[k], g[k + 1]];
    if (indice < inicio || indice >= inicio + cuantos) continue;
    const segmentos = [];
    for (let i = inicio; i < inicio + cuantos; i += 2) {
      segmentos.push([new THREE.Vector3().fromBufferAttribute(pos, i), new THREE.Vector3().fromBufferAttribute(pos, i + 1)]);
    }
    return segmentos;
  }
  return null;
}

// Una linea por encima de todo, que no la tapen las piezas.
function linea(puntos, color, opacidad = 1) {
  const geo = new THREE.BufferGeometry().setFromPoints(puntos);
  const l = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color, depthTest: false, transparent: true, opacity: opacidad }));
  l.renderOrder = 10;
  return l;
}

const aPuntos = (segmentos) => segmentos.flat();

export function crearMedir({ escena, camara, lienzo, capa, lista, pista, boton, mallas, bordes, seVe, pedirDibujo, version }) {
  const raycaster = new THREE.Raycaster();
  const grupo = new THREE.Group();
  escena.add(grupo);
  const medidas = [];
  let activo = false;
  let primera = null;      // { segmentos, marca }
  let encima = null;       // la arista bajo el raton
  const clave = `caja_atego.medidas.${version}`;

  // ------------------------------------------------------------ elegir
  // La arista visible mas cercana al raton, o null. ndc va de -1 a 1.
  function buscar(ndc) {
    const alto = lienzo.clientHeight;
    raycaster.setFromCamera(ndc, camara);
    const tapa = raycaster.intersectObjects(mallas.filter(seVe), false)[0];
    const distanciaPieza = tapa ? tapa.distance : Infinity;
    // lo que mide un pixel a la distancia de la pieza, o del centro de la vista
    const lejos = Number.isFinite(distanciaPieza) ? distanciaPieza : camara.position.length();
    const pixel = (2 * lejos * Math.tan(THREE.MathUtils.degToRad(camara.fov / 2))) / alto;
    raycaster.params.Line.threshold = pixel * RADIO_PX;
    let mejor = null;
    for (const golpe of raycaster.intersectObjects(bordes.filter((b) => seVe(b.parent)), false)) {
      // una arista de la cara que se ve queda a la distancia de la pieza; la de
      // detras, mas lejos
      if (golpe.distance > distanciaPieza + pixel * RADIO_PX + 1) continue;
      const alRayo = raycaster.ray.distanceToPoint(golpe.point);
      if (!mejor || alRayo < mejor.alRayo) mejor = { golpe, alRayo };
    }
    if (!mejor) return null;
    return arista(mejor.golpe.object, mejor.golpe.index);
  }

  const ndcDe = (e) => {
    const r = lienzo.getBoundingClientRect();
    return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  };

  function quitarEncima() {
    if (encima) { grupo.remove(encima.marca); encima = null; }
  }

  function mover(e) {
    if (!activo) return;
    const segmentos = buscar(ndcDe(e));
    quitarEncima();
    if (segmentos) {
      encima = { segmentos, marca: linea(aPuntos(segmentos), COLOR, 0.5) };
      grupo.add(encima.marca);
    }
    lienzo.style.cursor = segmentos ? 'crosshair' : '';
    pedirDibujo();
  }

  function clic(e) {
    const segmentos = buscar(ndcDe(e));
    if (!segmentos) return;
    if (!primera) {
      primera = { segmentos, marca: linea(aPuntos(segmentos), COLOR) };
      grupo.add(primera.marca);
    } else {
      const [p, q] = entreAristas(primera.segmentos, segmentos);
      grupo.remove(primera.marca);
      primera = null;
      anadir(p, q);
      guardar();
    }
    decir();
    pedirDibujo();
  }

  // ----------------------------------------------------------- medidas
  function anadir(p, q) {
    const m = { p, q, distancia: p.distanceTo(q) };
    m.objeto = new THREE.Group();
    m.objeto.add(linea([p, q], COLOR));
    const extremos = new THREE.Points(new THREE.BufferGeometry().setFromPoints([p, q]),
      new THREE.PointsMaterial({ color: COLOR, size: 7, sizeAttenuation: false, depthTest: false }));
    extremos.renderOrder = 11;
    m.objeto.add(extremos);
    grupo.add(m.objeto);

    const d = q.clone().sub(p);
    const texto = `${r1(m.distancia)} mm`;
    const detalle = `Δx ${r1(Math.abs(d.x))} · Δy ${r1(Math.abs(d.y))} · Δz ${r1(Math.abs(d.z))}`;
    m.etiqueta = document.createElement('div');
    m.etiqueta.className = 'etiqueta';
    m.etiqueta.innerHTML = '<b></b><span></span><button aria-label="Borrar la medida">×</button>';
    m.etiqueta.querySelector('b').textContent = texto;
    m.etiqueta.querySelector('span').textContent = detalle;
    m.etiqueta.querySelector('button').onclick = () => borrar(m);
    capa.append(m.etiqueta);

    m.fila = document.createElement('li');
    m.fila.innerHTML = '<span></span><button aria-label="Borrar la medida">×</button>';
    m.fila.querySelector('span').textContent = `${texto} · ${detalle}`;
    m.fila.querySelector('button').onclick = () => borrar(m);
    lista.append(m.fila);
    medidas.push(m);
  }

  function borrar(m) {
    grupo.remove(m.objeto);
    m.etiqueta.remove();
    m.fila.remove();
    medidas.splice(medidas.indexOf(m), 1);
    guardar();
    decir();
    pedirDibujo();
  }

  function borrarTodas() {
    for (const m of [...medidas]) borrar(m);
  }

  // Lo que se mide se recuerda entre recargas, por version. Si el navegador no
  // deja guardar, se empieza de cero.
  function guardar() {
    try {
      localStorage.setItem(clave, JSON.stringify(medidas.map((m) => [m.p.toArray(), m.q.toArray()])));
    } catch { /* sin almacenamiento */ }
  }
  try {
    for (const [p, q] of JSON.parse(localStorage.getItem(clave) || '[]')) {
      anadir(new THREE.Vector3(...p), new THREE.Vector3(...q));
    }
  } catch { /* sin almacenamiento */ }

  // Coloca las etiquetas sobre el centro de su medida. Se llama tras dibujar.
  function colocar() {
    const w = lienzo.clientWidth, h = lienzo.clientHeight;
    for (const m of medidas) {
      const c = m.p.clone().add(m.q).multiplyScalar(0.5).project(camara);
      const fuera = c.z > 1 || c.z < -1;
      m.etiqueta.style.display = fuera ? 'none' : '';
      if (!fuera) m.etiqueta.style.transform = `translate(${(c.x + 1) / 2 * w}px, ${(1 - c.y) / 2 * h}px) translate(-50%, -130%)`;
    }
  }

  // -------------------------------------------------------------- modo
  function decir() {
    if (!activo) {
      pista.textContent = medidas.length ? `${medidas.length} medida${medidas.length > 1 ? 's' : ''}` : '';
    } else {
      pista.textContent = primera ? 'Elige la segunda arista. Esc para soltar la primera.' : 'Elige la primera arista.';
    }
  }

  function alternar(encender = !activo) {
    activo = encender;
    boton.setAttribute('aria-pressed', String(activo));
    if (!activo) {
      if (primera) { grupo.remove(primera.marca); primera = null; }
      quitarEncima();
      lienzo.style.cursor = '';
    }
    decir();
    pedirDibujo();
  }

  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !activo) return;
    if (primera) { grupo.remove(primera.marca); primera = null; decir(); pedirDibujo(); } else { alternar(false); }
  });

  decir();
  return { get activo() { return activo; }, alternar, clic, mover, colocar, borrarTodas };
}
