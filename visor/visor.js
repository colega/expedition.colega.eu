// Visor del camion: el modelo se construye en trabajador.js y aqui se pinta con
// three.js. A la izquierda va el arbol de componentes: cada casilla muestra u
// oculta un componente con todo lo que lleva dentro, o un cuerpo suelto. Un clic
// en el modelo elige un cuerpo y da su ruta, su material y sus cotas; con el
// modo de medir, mide entre aristas (medir.js).
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { SIN_MATERIAL } from '../modelo/materiales.js';
import { crearMedir } from './medir.js';
import { crearPaisaje, DIRECCION_SOL } from './paisaje.js';

// El modelo se empieza a construir lo primero, mientras se monta la escena.
const inicio = performance.now();
const trabajador = new Worker(new URL('./trabajador.js', import.meta.url), { type: 'module' });

// Para trabajar en una parte: ?solo=Camion/ruedas,Caja/Interior/Bano malla y
// pinta solo esas ramas, sin paisaje y sin tocar lo guardado en el navegador;
// ?vista=frontal elige el encuadre. El modelo se construye entero, que los
// cortes de unas piezas dependen de otras.
const PARAMETROS = new URLSearchParams(location.search);
const SOLO = PARAMETROS.get('solo')?.split(',').map((r) => r.trim().replace(/^\/+|\/+$/g, '')).filter(Boolean) || null;
trabajador.postMessage({ solo: SOLO });

// Encuadres fijos, para comparar de una pasada a otra: ojo, objetivo y
// vertical, en mm y en el marco del modelo.
const VISTAS = {
  iso: [[11500, -9000, 5600], [400, 0, -350], [0, 0, 1]],
  iso_trasera: [[-10000, -9000, 5600], [-400, 0, -250], [0, 0, 1]],
  tres_cuartos: [[9000, -11000, 3300], [0, 0, -350], [0, 0, 1]],
  tres_cuartos_izq: [[-9000, 11000, 3300], [0, 0, -350], [0, 0, 1]],
  tres_cuartos_frente_izq: [[11000, 10000, 2500], [600, 0, -350], [0, 0, 1]],
  lateral: [[600, -15000, 1300], [600, 0, -250], [0, 0, 1]],
  lateral_izq: [[600, 15000, 1300], [600, 0, -250], [0, 0, 1]],
  frontal: [[14000, -300, 1300], [2000, 0, -250], [0, 0, 1]],
  planta: [[600, 0, 18650], [600, 0, -350], [1, 0, 0]],
  planta_interior: [[600, 0, 22650], [600, 0, -350], [1, 0, 0]],
  iso_alta: [[12500, -10000, 9650], [0, 0, -450], [0, 0, 1]],
  interior_trasera: [[-9000, 7000, 4850], [-400, -100, -400], [0, 0, 1]],
  dormitorio: [[600, 3300, 1650], [1650, -900, 1150], [0, 0, 1]],
  bano: [[-250, -1450, 1950], [490, 500, 700], [0, 0, 1]],
  bano_dentro: [[490, -200, 1650], [490, 900, 800], [0, 0, 1]],
  cocina_frente: [[-1100, -5600, 1950], [-1100, 850, 0], [0, 0, 1]],
  cocina: [[-400, 6800, 2050], [-1400, 600, 300], [0, 0, 1]],
};

// lo que sale oculto la primera vez: la ducha se enseña cerrada, y la rampa
// abierta (R111). La clave cambia con esta lista, para que se vea la nueva.
const OCULTOS_DE_SERIE = ['Caja/Interior/Bano/ducha_abierta', 'Caja/rampa'];
const CLAVE_OCULTOS = 'caja_atego.ocultos.2';

const $ = (id) => document.getElementById(id);
const estado = $('estado');

// ------------------------------------------------------------------ escena
const lienzo = $('lienzo');
const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
// sombras del sol, solo con paisaje: el camion se posa en el prado
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const escena = new THREE.Scene();
const oscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
escena.background = new THREE.Color(oscuro ? 0x1b1d19 : 0xeef0ec);
// los reflejos de los metales; se preparan cuando llega el modelo, para no
// retrasar el arranque del hilo de trabajo
function reflejos() {
  escena.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  escena.environmentIntensity = 0.6;
}
const camara = new THREE.PerspectiveCamera(28.6, 1, 10, 200000);
camara.up.set(0, 0, 1);
const controles = new OrbitControls(camara, lienzo);
controles.enableDamping = true;
controles.dampingFactor = 0.15;

escena.add(new THREE.HemisphereLight(0xffffff, 0x8a8a80, 1.6));
const sol = new THREE.DirectionalLight(0xffffff, 1.6);
sol.position.copy(DIRECCION_SOL).multiplyScalar(20000);
sol.shadow.mapSize.set(4096, 4096);
Object.assign(sol.shadow.camera, { left: -9000, right: 9000, top: 9000, bottom: -9000, near: 1000, far: 40000 });
sol.shadow.camera.updateProjectionMatrix();
sol.shadow.normalBias = 8;
escena.add(sol);

const suelo = new THREE.GridHelper(20000, 40, 0x9aa093, oscuro ? 0x2c3028 : 0xd3d7cf);
suelo.rotation.x = Math.PI / 2;
escena.add(suelo);

// R112: el prado, con su cielo, sus flores y sus arboles. Se monta la primera
// vez que se enciende y se baja al suelo firme, igual que la rejilla.
let paisaje = null;
// Con paisaje se apagan las aristas y la rejilla del suelo, que el prado la
// sustituye; sin paisaje se encienden, para mirar el modelo de cerca.
function ponerPaisaje(on) {
  if (on && !paisaje) {
    paisaje = crearPaisaje();
    paisaje.grupo.position.z = suelo.position.z;
    escena.add(paisaje.grupo);
  }
  $('paisaje').checked = on;
  if (paisaje) paisaje.grupo.visible = on;
  sol.castShadow = on;
  escena.fog = on ? paisaje.niebla : null;
  ponerAristas(!on);
  ponerSuelo(!on);
}
function ponerSuelo(on) {
  $('suelo').checked = on;
  suelo.visible = on;
}
$('paisaje').onchange = (e) => ponerPaisaje(e.target.checked);
$('suelo').onchange = (e) => ponerSuelo(e.target.checked);

let sucio = true;
function pedirDibujo() { sucio = true; }

// Los encuadres son para una pantalla apaisada: en una estrecha, como la del
// movil en vertical, la camara se aleja para que quepa lo mismo a lo ancho.
const alejar = () => Math.max(1, 1.5 / camara.aspect);
let alejado = 1;

function ajustar() {
  const { clientWidth: w, clientHeight: h } = lienzo.parentElement;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camara.aspect = w / h;
  camara.updateProjectionMatrix();
  // si cambia la forma del lienzo, como al plegar el panel, se reencuadra
  const nuevo = alejar();
  camara.position.sub(controles.target).multiplyScalar(nuevo / alejado).add(controles.target);
  alejado = nuevo;
  sucio = true;
}
// el lienzo cambia de tamaño con la ventana y, en el movil, al plegar el panel
new ResizeObserver(ajustar).observe(lienzo.parentElement);
ajustar();

function vista(nombre) {
  const [ojo, objetivo, arriba] = VISTAS[nombre];
  alejado = alejar();
  camara.position.set(...objetivo).lerp(new THREE.Vector3(...ojo), alejado);
  camara.up.set(...arriba);
  controles.target.set(...objetivo);
  controles.update();
}

// Como se llama cada encuadre en el selector, por grupos. Derecha e izquierda
// son las del conductor: la cocina esta a la izquierda (y+).
const NOMBRES_VISTAS = {
  Exterior: {
    iso: 'Isométrica delantera derecha',
    iso_trasera: 'Isométrica trasera derecha',
    iso_alta: 'Isométrica alta',
    tres_cuartos: 'Tres cuartos delantera derecha',
    tres_cuartos_frente_izq: 'Tres cuartos delantera izquierda',
    tres_cuartos_izq: 'Tres cuartos trasera izquierda',
    lateral: 'Lateral derecho',
    lateral_izq: 'Lateral izquierdo',
    frontal: 'Frontal',
    planta: 'Planta',
  },
  Interior: {
    planta_interior: 'Planta del interior',
    interior_trasera: 'Interior desde atrás',
    dormitorio: 'Dormitorio',
    cocina: 'Cocina',
    cocina_frente: 'Cocina de frente',
    bano: 'Baño',
    bano_dentro: 'Baño por dentro',
  },
};
const VISTA_INICIAL = VISTAS[PARAMETROS.get('vista')] ? PARAMETROS.get('vista') : 'iso_trasera';
const selectorVistas = $('vistas');
for (const [grupo, vistas] of Object.entries(NOMBRES_VISTAS)) {
  const og = document.createElement('optgroup');
  og.label = grupo;
  for (const [nombre, texto] of Object.entries(vistas)) og.append(new Option(texto, nombre, false, nombre === VISTA_INICIAL));
  selectorVistas.append(og);
}
selectorVistas.onchange = () => vista(selectorVistas.value);
vista(VISTA_INICIAL);

// Se dibuja solo cuando algo cambia: la camara, el tamaño o cualquier cosa del
// panel. Quieto, el visor no gasta.
controles.addEventListener('change', pedirDibujo);
for (const evento of ['change', 'click', 'pointerup']) document.addEventListener(evento, pedirDibujo, true);
renderer.setAnimationLoop(() => {
  // con la inercia, update() sigue moviendo la camara un rato tras soltar
  if (controles.update() || sucio) {
    sucio = false;
    renderer.render(escena, camara);
    medir.colocar();
  }
});

// --------------------------------------------------------------- materiales
// los colores llegan con el modelo, que son los de sus reglas
let colores = {};
const cacheMateriales = new Map();
function material(nombre) {
  if (!cacheMateriales.has(nombre)) {
    const m = colores[nombre] || SIN_MATERIAL;
    const color = new THREE.Color().setRGB(m.color[0] / 255, m.color[1] / 255, m.color[2] / 255, THREE.SRGBColorSpace);
    const transparente = m.opacidad !== undefined;
    cacheMateriales.set(nombre, new THREE.MeshStandardMaterial({
      color, roughness: m.rugosidad, metalness: m.metal ? 1.0 : 0.0,
      transparent: transparente, opacity: transparente ? m.opacidad : 1.0, depthWrite: !transparente,
      side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
    }));
  }
  return cacheMateriales.get(nombre);
}
// ------------------------------------------------------- color del camion
// El color de la caja y la cabina (R29) es el material 'Verde militar': el
// selector lo cambia en vivo, sin reconstruir el modelo, y se recuerda entre
// recargas. 'Original' vuelve al de las reglas.
const VERDE = 'Verde militar';
const CLAVE_COLOR = 'caja_atego.color';
let colorOriginal = null;
const aHex = (rgb) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
function ponerColor(hex) {
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  colores[VERDE].color = rgb;
  cacheMateriales.get(VERDE)?.color.setRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, THREE.SRGBColorSpace);
  $('color').value = hex;
  pedirDibujo();
}
function guardarColor(hex) {
  try {
    if (hex) localStorage.setItem(CLAVE_COLOR, hex); else localStorage.removeItem(CLAVE_COLOR);
  } catch { /* sin almacenamiento */ }
}
$('color').oninput = (e) => { ponerColor(e.target.value); guardarColor(e.target.value); };
$('colorOriginal').onclick = () => { ponerColor(aHex(colorOriginal)); guardarColor(null); };
// al llegar el modelo, antes de crear las mallas: se activa el selector y se
// pone el color recordado, si lo hay
function iniciarColor() {
  colorOriginal = [...colores[VERDE].color];
  let guardado = null;
  try { guardado = localStorage.getItem(CLAVE_COLOR); } catch { /* sin almacenamiento */ }
  ponerColor(/^#[0-9a-f]{6}$/.test(guardado) ? guardado : aHex(colorOriginal));
  $('color').disabled = $('colorOriginal').disabled = false;
}

const materialAristas = new THREE.LineBasicMaterial({ color: 0x15170f, transparent: true, opacity: 0.45 });
const materialElegido = new THREE.MeshStandardMaterial({ color: 0xff9a1f, emissive: 0x6b3300, roughness: 0.5 });

// ---------------------------------------------------------- ocultos guardados
// Lo que se oculta se recuerda entre recargas, que al cambiar una regla la
// pagina se recarga sola. Si el navegador no deja guardar, se empieza de cero.
function leerOcultos() {
  if (SOLO) return new Set(OCULTOS_DE_SERIE);
  try {
    const guardado = localStorage.getItem(CLAVE_OCULTOS);
    return new Set(guardado ? JSON.parse(guardado) : OCULTOS_DE_SERIE);
  } catch {
    return new Set(OCULTOS_DE_SERIE);
  }
}
const ocultos = leerOcultos();
function guardarOcultos() {
  if (SOLO) return;
  try { localStorage.setItem(CLAVE_OCULTOS, JSON.stringify([...ocultos])); } catch { /* sin almacenamiento */ }
}

// -------------------------------------------------------------------- arbol
const raiz = new THREE.Group();
escena.add(raiz);
const nodos = new Map();       // clave -> { grupo, casilla, detalles }
const mallas = [];
const aristas = [];

function nodo(ruta) {
  const clave = ruta.join('/');
  if (nodos.has(clave)) return nodos.get(clave);
  const padre = ruta.length > 1 ? nodo(ruta.slice(0, -1)) : null;
  const grupo = new THREE.Group();
  (padre ? padre.grupo : raiz).add(grupo);
  const detalles = document.createElement('details');
  const resumen = document.createElement('summary');
  const casilla = document.createElement('input');
  casilla.type = 'checkbox';
  casilla.onclick = (e) => e.stopPropagation();
  casilla.onchange = () => alternar(clave, casilla.checked);
  const nombre = document.createElement('span');
  nombre.textContent = ruta[ruta.length - 1];
  const cuenta = document.createElement('span');
  cuenta.className = 'n';
  resumen.append(casilla, nombre, cuenta);
  detalles.append(resumen);
  (padre ? padre.detalles : $('arbol')).append(detalles);
  const n = { clave, grupo, casilla, detalles, resumen, cuenta, cuerpos: 0 };
  nodos.set(clave, n);
  return n;
}

function alternar(clave, visible) {
  const n = nodos.get(clave);
  n.grupo.visible = visible;
  n.casilla.checked = visible;
  if (visible) ocultos.delete(clave); else ocultos.add(clave);
  guardarOcultos();
  pintaPares();
}

function cuerpoDelArbol(n, malla) {
  const fila = document.createElement('div');
  fila.className = 'cuerpo';
  const casilla = document.createElement('input');
  casilla.type = 'checkbox';
  const clave = `${n.clave}//${malla.userData.nombre}`;
  casilla.checked = !ocultos.has(clave);
  malla.visible = casilla.checked;
  casilla.onchange = () => {
    malla.visible = casilla.checked;
    if (casilla.checked) ocultos.delete(clave); else ocultos.add(clave);
    guardarOcultos();
  };
  casilla.onclick = (e) => e.stopPropagation();
  const nombre = document.createElement('span');
  nombre.textContent = malla.userData.nombre;
  fila.append(casilla, nombre);
  fila.onclick = () => elegir(malla);
  n.detalles.append(fila);
  malla.userData.fila = fila;
  malla.userData.casilla = casilla;
}

function cargar(componentes) {
  for (const comp of componentes) {
    const n = nodo(comp.ruta);
    for (const c of comp.cuerpos) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(c.vertices, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(c.normales, 3));
      geo.setIndex(new THREE.BufferAttribute(c.triangulos, 1));
      geo.computeBoundingBox();
      const malla = new THREE.Mesh(geo, material(c.material));
      malla.castShadow = !malla.material.transparent;
      malla.receiveShadow = true;
      malla.userData = { nombre: c.nombre, material: c.material, ruta: n.clave, original: malla.material };
      const lineas = new THREE.BufferGeometry();
      lineas.setAttribute('position', new THREE.BufferAttribute(c.aristas, 3));
      const borde = new THREE.LineSegments(lineas, materialAristas);
      borde.userData.grupos = c.grupos;
      borde.visible = $('aristas').checked;
      malla.add(borde);
      aristas.push(borde);
      n.grupo.add(malla);
      mallas.push(malla);
      cuerpoDelArbol(n, malla);
    }
  }
  // cuantos cuerpos lleva cada rama, y que ramas no tienen hijos
  for (const n of nodos.values()) {
    n.cuerpos = mallas.filter((m) => m.userData.ruta === n.clave || m.userData.ruta.startsWith(n.clave + '/')).length;
    n.cuenta.textContent = n.cuerpos;
    n.casilla.checked = !ocultos.has(n.clave);
    n.grupo.visible = n.casilla.checked;
  }
  // R111: el boton de cada pareja, solo si hay la abierta
  for (const [id, { abierta }] of Object.entries(PARES)) $(id).hidden = !nodos.has(abierta);
  $('abrir').hidden = Object.keys(PARES).every((id) => $(id).hidden);
  pintaPares();
}

// el arbol arranca oculto; este boton lo muestra
$('verArbol').onclick = (e) => {
  const ver = $('arbol').hidden;
  $('arbol').hidden = !ver;
  e.currentTarget.setAttribute('aria-expanded', String(ver));
};
function ponerAristas(on) {
  $('aristas').checked = on;
  for (const a of aristas) a.visible = on;
}
$('aristas').onchange = (e) => ponerAristas(e.target.checked);
ponerPaisaje(!SOLO);   // arranca con paisaje, sin aristas ni rejilla; con ?solo, al reves
// Deja a la vista solo esas ramas, con todo lo que llevan dentro. Las ramas de
// encima siguen encendidas, pero sin sus otros hijos. Lo de apagar se apaga
// aunque caiga dentro.
function mostrarSolo(claves, apagar = []) {
  const dentro = (a, b) => a === b || a.startsWith(b + '/');
  ocultos.clear();
  for (const m of mallas) { m.visible = true; m.userData.casilla.checked = true; }
  for (const n of nodos.values()) {
    const visible = (!claves || claves.some((c) => dentro(n.clave, c) || dentro(c, n.clave)))
      && !apagar.some((c) => dentro(n.clave, c));
    n.grupo.visible = visible;
    n.casilla.checked = visible;
    if (!visible) ocultos.add(n.clave);
  }
  pintaPares();
  guardarOcultos();
}
// Todo es la vista de serie: la rampa y la ducha abiertas o cerradas, no las dos
$('mostrarTodo').onclick = () => { mostrarSolo(null, OCULTOS_DE_SERIE); ponerPaisaje(true); };
$('soloInterior').onclick = () => mostrarSolo(['Caja/Interior', 'Caja/puerta_lateral', 'Caja/trampilla_garaje',
  'Caja/trampilla_garaje_izq'], OCULTOS_DE_SERIE);
for (const [id, zona] of [['soloDormitorio', 'Dormitorio'], ['soloGaraje', 'Garaje'], ['soloBano', 'Bano'],
  ['soloCocina', 'Cocina'], ['soloComedor', 'Comedor']]) {
  $(id).onclick = () => { mostrarSolo([`Caja/Interior/${zona}`], OCULTOS_DE_SERIE); ponerPaisaje(false); };
}

// R111: la rampa y la ducha se ven cerradas o abiertas, nunca las dos. Si no se
// ve ninguna, el boton vuelve a la cerrada. Cada boton dice como esta.
const PARES = {
  rampa: { abierta: 'Caja/rampa_abierta', cerrada: 'Caja/rampa' },
  ducha: { abierta: 'Caja/Interior/Bano/ducha_abierta', cerrada: 'Caja/Interior/Bano/ducha_cerrada' },
};
const seVeRama = (clave) => nodos.has(clave) && seVe(nodos.get(clave).grupo);
function pintaPares() {
  for (const [id, { abierta, cerrada }] of Object.entries(PARES)) {
    const estado = seVeRama(abierta) ? 'abierta' : seVeRama(cerrada) ? 'cerrada' : 'oculta';
    $(id).setAttribute('aria-pressed', String(estado === 'abierta'));
    $(id).querySelector('.par-estado').textContent = estado;
  }
}
for (const [id, { abierta, cerrada }] of Object.entries(PARES)) {
  $(id).onclick = () => {
    if (!nodos.has(abierta)) return;
    if (seVeRama(abierta)) {                         // abierta a la vista: cerrada
      alternar(abierta, false);
      alternar(cerrada, true);
    } else if (seVeRama(cerrada)) {                  // cerrada a la vista: abierta
      alternar(cerrada, false);
      alternar(abierta, true);
    } else {                                         // ninguna a la vista: cerrada
      alternar(cerrada, true);
    }
  };
}
$('plegar').onclick = () => {
  const plegado = $('lateral').classList.toggle('plegado');
  $('plegar').setAttribute('aria-expanded', String(!plegado));
};

// ------------------------------------------------------------------ elegir
let elegido = null;
const info = $('info');
const r1 = (v) => Math.round(v * 10) / 10;

function elegir(malla) {
  if (elegido) {
    elegido.material = elegido.userData.original;
    elegido.userData.fila.classList.remove('elegido');
  }
  elegido = malla;
  if (!malla) { info.style.display = 'none'; return; }
  malla.material = materialElegido;
  malla.userData.fila.classList.add('elegido');
  // abre las ramas hasta el cuerpo, para verlo en el arbol
  for (let d = malla.userData.fila.parentElement; d && d.tagName === 'DETAILS'; d = d.parentElement) d.open = true;
  malla.userData.fila.scrollIntoView({ block: 'nearest' });
  const b = malla.geometry.boundingBox;
  info.querySelector('.nombre').textContent = `${malla.userData.nombre} · ${malla.userData.material || 'sin material'}`;
  info.querySelector('.ruta').textContent = malla.userData.ruta;
  info.querySelector('.medidas').textContent = `x ${r1(b.min.x)} a ${r1(b.max.x)} · y ${r1(b.min.y)} a ${r1(b.max.y)}`
    + ` · z ${r1(b.min.z)} a ${r1(b.max.z)} · ${r1(b.max.x - b.min.x)} x ${r1(b.max.y - b.min.y)} x ${r1(b.max.z - b.min.z)} mm`;
  info.style.display = 'block';
}

$('ocultarElegido').onclick = () => {
  if (!elegido) return;
  const m = elegido;
  elegir(null);
  m.userData.casilla.checked = false;
  m.userData.casilla.onchange();
};

// se ve si el cuerpo y todos los grupos por encima estan visibles
const seVe = (o) => { for (; o; o = o.parent) if (!o.visible) return false; return true; };
const raycaster = new THREE.Raycaster();
let abajo = null;
lienzo.addEventListener('pointerdown', (e) => { abajo = [e.clientX, e.clientY]; });
lienzo.addEventListener('pointerup', (e) => {
  if (!abajo || Math.hypot(e.clientX - abajo[0], e.clientY - abajo[1]) > 4) return;
  if (medir.activo) { medir.clic(e); return; }
  const r = lienzo.getBoundingClientRect();
  raycaster.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1,
    -((e.clientY - r.top) / r.height) * 2 + 1), camara);
  const golpe = raycaster.intersectObjects(mallas.filter(seVe), false)[0];
  elegir(golpe ? golpe.object : null);
});

// ------------------------------------------------------------------ medir
const medir = crearMedir({ escena, camara, lienzo, capa: $('etiquetas'), lista: $('medidas'), pista: $('pista'),
  boton: $('medir'), mallas, bordes: aristas, seVe, pedirDibujo });
$('medir').onclick = () => {
  elegir(null);
  medir.alternar();
  if (medir.activo && !$('aristas').checked) ponerAristas(true);   // se mide entre aristas: que se vean
};
$('borrarMedidas').onclick = () => medir.borrarTodas();
// el resaltado de la arista bajo el raton, una vez por fotograma como mucho
let movido = null;
lienzo.addEventListener('pointermove', (e) => {
  if (!medir.activo || e.buttons) return;
  if (!movido) requestAnimationFrame(() => { medir.mover(movido); movido = null; });
  movido = e;
});

// Encuadra lo cargado, mirando desde donde mira la vista de ahora.
function encuadrar() {
  const caja = new THREE.Box3();
  for (const m of mallas) caja.expandByObject(m);
  if (caja.isEmpty()) return;
  const centro = caja.getCenter(new THREE.Vector3());
  const radio = caja.getSize(new THREE.Vector3()).length() / 2;
  const dir = camara.position.clone().sub(controles.target).normalize();
  const distancia = (radio / Math.sin(THREE.MathUtils.degToRad(camara.fov) / 2)) * alejar() * 1.05;
  controles.target.copy(centro);
  camara.position.copy(centro).addScaledVector(dir, distancia);
  controles.update();
}

// ---------------------------------------------------------------- trabajo
trabajador.onmessage = ({ data }) => {
  if (data.tipo === 'paso') {
    estado.textContent = `Construyendo: ${data.nombre}…`;
  } else if (data.tipo === 'modelo') {
    const llegada = performance.now();
    reflejos();
    colores = data.colores;
    iniciarColor();
    suelo.position.z = -data.altura_piso;
    if (paisaje) paisaje.grupo.position.z = -data.altura_piso;
    cargar(data.componentes);
    if (SOLO && !PARAMETROS.has('vista')) encuadrar();
    const s = ((performance.now() - inicio) / 1000).toFixed(1);
    const avisos = data.notas.redondeos_fallidos?.length ? ` · ${data.notas.redondeos_fallidos.length} redondeo sin hacer` : '';
    estado.textContent = `${mallas.length} cuerpos en ${s} s${avisos}${SOLO ? ` · solo ${SOLO.join(', ')}` : ''}`;
    const t = data.tiempos;
    estado.title = `arrancar ${Math.round(t.arrancar)} ms, construir ${Math.round(t.construir)} ms, mallar ${Math.round(t.mallar)} ms,`
      + ` llega a los ${Math.round(llegada - inicio)} ms y se monta en ${Math.round(performance.now() - llegada)} ms`;
    pedirDibujo();
  } else if (data.tipo === 'error') {
    estado.textContent = 'Fallo al construir';
    $('error').style.display = 'block';
    $('error').textContent = data.mensaje;
  }
};
