// El prado: cielo, hierba, matas, flores, arboles, colinas y nubes alrededor
// del camion, para verlo en su habitat (R112).
//
// Todo relativo al suelo firme, que es donde posan las ruedas: el grupo entero
// se baja a -altura_piso cuando llega el modelo. Semilla fija: el prado es
// siempre el mismo prado. Las texturas se pintan aqui, en un canvas: no hay
// ficheros que bajar.
import * as THREE from 'three';
import { ATEGO } from '../diseno/reglas.js';

// de donde viene el sol; el visor pone ahi su luz, para que cuadren el
// resplandor del cielo y las sombras
export const DIRECCION_SOL = new THREE.Vector3(6000, -8000, 12000).normalize();

const AZUL_ZENIT = new THREE.Color(0x3f7fc4);
const AZUL_HORIZONTE = new THREE.Color(0xcfe3f2);
const RESPLANDOR = new THREE.Color(0xfff1d0);
const COLORES_FLOR = [0xffffff, 0xf3d04a, 0xe58fb1, 0xb59ddd];

const RADIO_PRADO = 62000;
const RADIO_CIELO = 70000;
const MATAS = 6000;
const FLORES = 260;
// las roderas del camion: entra por detras y se para en el prado
const RODERAS = { x: [-30000, 5200], y: 1650 };

// Azar con semilla: el mismo prado en cada visita.
function dado(semilla) {
  let a = semilla;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Ruido suave en el plano, de 0 a 1: rejilla de valores al azar interpolada,
// en tres escalas. Sirve para las manchas del prado y el perfil de las colinas.
function ruido(x, y) {
  const valor = (i, j) => {
    let h = Math.imul(i, 374761393) + Math.imul(j, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const suave = (t) => t * t * (3 - 2 * t);
  let total = 0, peso = 0;
  for (const [escala, w] of [[1, 0.6], [2.1, 0.28], [4.3, 0.12]]) {
    const u = x * escala, v = y * escala;
    const i = Math.floor(u), j = Math.floor(v), fu = suave(u - i), fv = suave(v - j);
    const a = valor(i, j) + (valor(i + 1, j) - valor(i, j)) * fu;
    const b = valor(i, j + 1) + (valor(i + 1, j + 1) - valor(i, j + 1)) * fu;
    total += (a + (b - a) * fv) * w;
    peso += w;
  }
  return total / peso;
}

function lienzo(ancho, alto) {
  const c = document.createElement('canvas');
  c.width = ancho; c.height = alto;
  return [c, c.getContext('2d')];
}

// La hierba de cerca: trazos cortos de verdes sobre un fondo verde, en mosaico.
function texturaHierba(azar) {
  const [c, g] = lienzo(512, 512);
  g.fillStyle = '#86a656';
  g.fillRect(0, 0, 512, 512);
  const tonos = ['#6f9244', '#8aac5a', '#9cbb66', '#64873c', '#a9c374', '#93a85a', '#b3b778'];
  g.lineCap = 'round';
  for (let i = 0; i < 9000; i++) {
    const x = azar() * 512, y = azar() * 512, l = 3 + azar() * 7, a = -Math.PI / 2 + (azar() - 0.5) * 1.2;
    g.strokeStyle = tonos[Math.floor(azar() * tonos.length)];
    g.lineWidth = 0.8 + azar() * 1.2;
    // tres copias, para que el trazo que se sale por un borde entre por el otro
    for (const [dx, dy] of [[0, 0], [-512, 0], [0, -512]]) {
      g.beginPath();
      g.moveTo(x + dx, y + dy);
      g.lineTo(x + dx + Math.cos(a) * l, y + dy + Math.sin(a) * l);
      g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// El suelo: un disco con manchas de hierba mas verde y mas seca, que da la
// escala de lejos, y la textura de la hierba, que la da de cerca.
function prado(azar) {
  const geo = new THREE.RingGeometry(0, RADIO_PRADO, 160, 80);
  const pos = geo.getAttribute('position');
  const colores = new Float32Array(pos.count * 3);
  const verde = new THREE.Color(0xdfe9c8), seco = new THREE.Color(0xf2e6b8), oscuro = new THREE.Color(0xb9cf9c);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    const n = ruido(x / 9000 + 40, y / 9000 + 40);
    const m = ruido(x / 2500 - 7, y / 2500 + 3);
    c.copy(verde).lerp(seco, THREE.MathUtils.smoothstep(n, 0.55, 0.8)).lerp(oscuro, THREE.MathUtils.smoothstep(m, 0.5, 0.85) * 0.6);
    colores[i * 3] = c.r; colores[i * 3 + 1] = c.g; colores[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colores, 3));
  const mapa = texturaHierba(azar);
  mapa.repeat.set((RADIO_PRADO * 2) / 1600, (RADIO_PRADO * 2) / 1600);
  const malla = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: mapa, vertexColors: true }));
  malla.position.z = -2;
  malla.receiveShadow = true;
  return malla;
}

// Las roderas: dos franjas de tierra pisada que vienen de detras del camion y
// una mancha mas gastada donde esta aparcado. Van en una lamina transparente.
function roderas() {
  const { via } = ATEGO;
  const [c, g] = lienzo(2048, 128);
  const largo = RODERAS.x[1] - RODERAS.x[0];
  const px = (x) => ((x - RODERAS.x[0]) / largo) * 2048;
  const py = (y) => ((y + RODERAS.y) / (2 * RODERAS.y)) * 128;
  // se van borrando hacia atras, lejos del camion
  const desvanece = g.createLinearGradient(0, 0, 2048, 0);
  desvanece.addColorStop(0, 'rgba(120, 98, 66, 0)');
  desvanece.addColorStop(0.55, 'rgba(120, 98, 66, 0.55)');
  desvanece.addColorStop(1, 'rgba(120, 98, 66, 0.75)');
  g.fillStyle = desvanece;
  for (const y of [-via / 2, via / 2]) {
    g.filter = 'blur(2px)';
    g.fillRect(0, py(y - 230), 2048, py(y + 230) - py(y - 230));
  }
  // la mancha bajo el camion
  const mancha = g.createRadialGradient(px(500), 64, 4, px(500), 64, 120);
  mancha.addColorStop(0, 'rgba(110, 92, 64, 0.45)');
  mancha.addColorStop(1, 'rgba(110, 92, 64, 0)');
  g.filter = 'none';
  g.fillStyle = mancha;
  g.fillRect(px(-4500), 0, px(5200) - px(-4500), 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const lamina = new THREE.Mesh(new THREE.PlaneGeometry(largo, RODERAS.y * 2),
    new THREE.MeshLambertMaterial({ map: t, transparent: true, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  lamina.position.set((RODERAS.x[0] + RODERAS.x[1]) / 2, 0, 1);
  lamina.receiveShadow = true;
  return lamina;
}

// Una mata de hierba: unas briznas finas, oscuras abajo y claras en la punta.
function mataGeo(azar) {
  const vertices = [], colores = [];
  const base = new THREE.Color(0x5b7a36), punta = new THREE.Color(0xbcd086);
  for (let k = 0; k < 7; k++) {
    const a = azar() * Math.PI * 2, r = azar() * 30, h = 50 + azar() * 80;
    const x = Math.cos(a) * r, y = Math.sin(a) * r, giro = azar() * Math.PI, ancho = 7 + azar() * 6;
    const lean = (azar() - 0.5) * 50;
    const dx = Math.cos(giro) * ancho, dy = Math.sin(giro) * ancho;
    vertices.push(x - dx, y - dy, 0, x + dx, y + dy, 0, x + Math.cos(a) * lean, y + Math.sin(a) * lean, h);
    colores.push(...base.toArray(), ...base.toArray(), ...punta.toArray());
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colores, 3));
  geo.computeVertexNormals();
  return geo;
}

function enRoderas(x, y) {
  return x > RODERAS.x[0] && x < RODERAS.x[1] && Math.abs(y) < RODERAS.y;
}

// Matas por el prado, mas tupidas cerca del camion, y alguna flor entre ellas.
function matas(azar) {
  const malla = new THREE.InstancedMesh(mataGeo(azar),
    new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), MATAS);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  const eje = new THREE.Vector3(0, 0, 1), c = new THREE.Color();
  let n = 0;
  while (n < MATAS) {
    const d = 2600 + Math.pow(azar(), 1.6) * 22000, a = azar() * Math.PI * 2;
    const x = Math.cos(a) * d, y = Math.sin(a) * d;
    // van a rodales, donde el ruido lo dice, y sueltas por el resto
    if (enRoderas(x, y) || ruido(x / 3000 + 5, y / 3000 - 5) < 0.45 + azar() * 0.25) continue;
    const t = 0.5 + azar() * 0.6;
    p.set(x, y, 0); q.setFromAxisAngle(eje, azar() * Math.PI * 2); s.set(t, t, t * (0.8 + azar() * 0.5));
    m.compose(p, q, s);
    malla.setMatrixAt(n, m);
    c.setHSL(0.2 + azar() * 0.07, 0.3 + azar() * 0.2, 0.55 + azar() * 0.2);
    malla.setColorAt(n, c);
    n++;
  }
  malla.receiveShadow = true;
  return malla;
}

function flores(azar) {
  const malla = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), new THREE.MeshLambertMaterial(), FLORES);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  const c = new THREE.Color();
  let n = 0;
  while (n < FLORES) {
    const d = 3000 + azar() * 12000, a = azar() * Math.PI * 2;
    const x = Math.cos(a) * d, y = Math.sin(a) * d;
    if (enRoderas(x, y)) continue;
    const t = 0.6 + azar() * 0.6;
    p.set(x, y, 120 + azar() * 90); s.set(22 * t, 22 * t, 12 * t);
    m.compose(p, q, s);
    malla.setMatrixAt(n, m);
    malla.setColorAt(n, c.set(COLORES_FLOR[Math.floor(azar() * COLORES_FLOR.length)]));
    n++;
  }
  return malla;
}

// Los arboles van en bosquetes: frondosos, de copa hecha de varias bolas, y
// pinos, de conos apilados. Mas lejos, una linea de pinos cierra el prado.
function arboles(azar) {
  const sitios = [];
  // bosquetes a media distancia, dejando libre lo que se ve por detras y de lado
  for (let b = 0; b < 7; b++) {
    const a = azar() * Math.PI * 2, d = 17000 + azar() * 16000;
    const cx = Math.cos(a) * d, cy = Math.sin(a) * d;
    const cuantos = 3 + Math.floor(azar() * 5);
    for (let k = 0; k < cuantos; k++) {
      sitios.push({ x: cx + (azar() - 0.5) * 7000, y: cy + (azar() - 0.5) * 7000, pino: azar() < 0.35 });
    }
  }
  // la linea de lejos
  for (let k = 0; k < 140; k++) {
    const a = (k / 140) * Math.PI * 2 + azar() * 0.04, d = 40000 + azar() * 9000;
    sitios.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, pino: azar() < 0.7 });
  }
  const frondosos = sitios.filter((s) => !s.pino), pinos = sitios.filter((s) => s.pino);
  const BOLAS = 5, CONOS = 3;

  const troncoGeo = new THREE.CylinderGeometry(0.7, 1, 1, 7);
  troncoGeo.rotateX(Math.PI / 2);
  const conoGeo = new THREE.ConeGeometry(1, 1, 9);
  conoGeo.rotateX(Math.PI / 2);
  const troncos = new THREE.InstancedMesh(troncoGeo, new THREE.MeshLambertMaterial({ color: 0x5a4330 }), sitios.length);
  const bolas = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), new THREE.MeshLambertMaterial(), frondosos.length * BOLAS);
  const conos = new THREE.InstancedMesh(conoGeo, new THREE.MeshLambertMaterial(), pinos.length * CONOS);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  const c = new THREE.Color();
  let t = 0;

  frondosos.forEach((a, i) => {
    const h = 2600 + azar() * 3200, r = 1700 + azar() * 1600;
    p.set(a.x, a.y, h * 0.4); s.set(r * 0.12, r * 0.12, h * 0.8); m.compose(p, q, s);
    troncos.setMatrixAt(t++, m);
    const tinte = c.setHSL(0.26 + azar() * 0.05, 0.38 + azar() * 0.15, 0.24 + azar() * 0.1).clone();
    for (let k = 0; k < BOLAS; k++) {
      const b = k === 0 ? 0 : 0.55;
      const ang = azar() * Math.PI * 2;
      p.set(a.x + Math.cos(ang) * r * b, a.y + Math.sin(ang) * r * b, h + (azar() - 0.3) * r * 0.6);
      const e = r * (k === 0 ? 1 : 0.55 + azar() * 0.3);
      s.set(e, e, e * 0.85); m.compose(p, q, s);
      bolas.setMatrixAt(i * BOLAS + k, m);
      bolas.setColorAt(i * BOLAS + k, c.copy(tinte).offsetHSL(0, 0, (azar() - 0.5) * 0.06));
    }
  });

  pinos.forEach((a, i) => {
    const h = 5000 + azar() * 5000, r = 1300 + azar() * 900;
    p.set(a.x, a.y, h * 0.15); s.set(r * 0.15, r * 0.15, h * 0.3); m.compose(p, q, s);
    troncos.setMatrixAt(t++, m);
    const tinte = c.setHSL(0.33 + azar() * 0.05, 0.3 + azar() * 0.12, 0.18 + azar() * 0.07).clone();
    for (let k = 0; k < CONOS; k++) {
      const f = k / CONOS;
      p.set(a.x, a.y, h * (0.3 + f * 0.5)); s.set(r * (1 - f * 0.45), r * (1 - f * 0.45), h * 0.45); m.compose(p, q, s);
      conos.setMatrixAt(i * CONOS + k, m);
      conos.setColorAt(i * CONOS + k, tinte);
    }
  });
  for (const malla of [troncos, bolas, conos]) malla.castShadow = true;
  return [troncos, bolas, conos];
}

// Colinas en el horizonte: un anillo con el perfil sacado del ruido, que la
// niebla tiñe de azul como de lejos.
function colinas() {
  const N = 256, filas = [[50000, 0], [55000, 0.7], [59000, 1]];
  const vertices = [], indices = [];
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2;
    const h = 900 + Math.pow(ruido(Math.cos(a) * 3 + 10, Math.sin(a) * 3 + 10), 1.5) * 9000;
    for (const [r, f] of filas) vertices.push(Math.cos(a) * r, Math.sin(a) * r, h * f);
  }
  for (let i = 0; i < N; i++) {
    for (let f = 0; f < filas.length - 1; f++) {
      const a = i * filas.length + f, b = a + filas.length;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0x5d7a48, side: THREE.DoubleSide }));
}

// Cielo: esfera invertida con el degradado pintado por vertice y el
// resplandor alrededor del sol.
function cielo() {
  const geo = new THREE.SphereGeometry(RADIO_CIELO, 64, 32);
  geo.rotateX(Math.PI / 2);
  const pos = geo.getAttribute('position');
  const colores = new Float32Array(pos.count * 3);
  const c = new THREE.Color(), v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const t = Math.max(0, v.z);
    c.copy(AZUL_HORIZONTE).lerp(AZUL_ZENIT, Math.pow(t, 0.6));
    c.lerp(RESPLANDOR, Math.pow(Math.max(0, v.dot(DIRECCION_SOL)), 12) * 0.75);
    colores[i * 3] = c.r; colores[i * 3 + 1] = c.g; colores[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colores, 3));
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true,
    side: THREE.BackSide, fog: false, depthWrite: false }));
}

// Nubes: laminas que miran a la camara, cada una unos borrones blancos.
function nubes(azar) {
  const grupo = new THREE.Group();
  const texturas = [0, 1, 2].map(() => {
    const [c, g] = lienzo(256, 128);
    for (let k = 0; k < 14; k++) {
      const x = 40 + azar() * 176, y = 50 + azar() * 40, r = 18 + azar() * 34;
      const d = g.createRadialGradient(x, y, 0, x, y, r);
      d.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
      d.addColorStop(1, 'rgba(255, 255, 255, 0)');
      g.fillStyle = d;
      g.fillRect(0, 0, 256, 128);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });
  for (let k = 0; k < 16; k++) {
    const a = azar() * Math.PI * 2, d = 38000 + azar() * 20000;
    const nube = new THREE.Sprite(new THREE.SpriteMaterial({ map: texturas[k % 3], fog: false,
      depthWrite: false, opacity: 0.75 + azar() * 0.2, transparent: true }));
    nube.position.set(Math.cos(a) * d, Math.sin(a) * d, 6000 + azar() * 9000);
    const ancho = 14000 + azar() * 14000;
    nube.scale.set(ancho, ancho / 2, 1);
    grupo.add(nube);
  }
  return grupo;
}

export function crearPaisaje() {
  const grupo = new THREE.Group();
  grupo.visible = false;
  const azar = dado(2026);
  grupo.add(cielo(), nubes(azar), colinas(), prado(azar), roderas(), matas(azar), flores(azar));
  for (const arbol of arboles(azar)) grupo.add(arbol);

  // la niebla funde el prado con las colinas y el horizonte; sin paisaje, sin niebla
  const niebla = new THREE.Fog(AZUL_HORIZONTE.getHex(), 22000, 78000);
  return { grupo, niebla };
}
