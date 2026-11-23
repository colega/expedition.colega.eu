// El prado: cielo azul, hierba, flores y algun arbol alrededor del camion,
// para verlo en su habitat (R112).
//
// Todo relativo al suelo firme, que es donde posan las ruedas: el grupo entero
// se baja a -altura_piso cuando llega el modelo. Semilla fija: el prado es
// siempre el mismo prado.
import * as THREE from 'three';

const AZUL_ZENIT = new THREE.Color(0x4e8fd0);
const AZUL_HORIZONTE = new THREE.Color(0xd9edfc);
const VERDE_PRADO = 0x7aa25b;
const VERDES_COPA = [0x4e7a3a, 0x5d8a43, 0x6f9e4f];
const MARRON_TRONCO = 0x6b4a2f;
const COLORES_FLOR = [0xffffff, 0xf7d354, 0xe58fb1, 0xb59ddd];

const RADIO_PRADO = 60000;
const RADIO_CIELO = 70000;
const FLORES = 320;
const ARBOLES = 36;

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

// Cielo: esfera invertida con el degradado pintado por vertice.
function cielo() {
  const geo = new THREE.SphereGeometry(RADIO_CIELO, 32, 16);
  const pos = geo.getAttribute('position');
  const colores = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = Math.max(0, pos.getZ(i) / RADIO_CIELO);
    c.copy(AZUL_HORIZONTE).lerp(AZUL_ZENIT, Math.pow(t, 0.75));
    colores[i * 3] = c.r; colores[i * 3 + 1] = c.g; colores[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colores, 3));
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true,
    side: THREE.BackSide, fog: false, depthWrite: false }));
}

// Anillo de flores al pie del camion, cada una un discito de color.
function flores(azar) {
  const malla = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4),
    new THREE.MeshLambertMaterial(), FLORES);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3();
  const s = new THREE.Vector3(), c = new THREE.Color();
  for (let i = 0; i < FLORES; i++) {
    const d = 3000 + azar() * 11000, a = azar() * Math.PI * 2, t = 0.7 + azar() * 0.6;
    p.set(Math.cos(a) * d, Math.sin(a) * d, 6);
    s.set(38 * t, 38 * t, 14 * t);
    m.compose(p, q, s);
    malla.setMatrixAt(i, m);
    c.set(COLORES_FLOR[Math.floor(azar() * COLORES_FLOR.length)]);
    malla.setColorAt(i, c);
  }
  return malla;
}

// Arboles a media y larga distancia: tronco y copa, cada uno su tinte.
function arboles(azar) {
  const troncoGeo = new THREE.CylinderGeometry(0.8, 1.1, 1, 6);
  troncoGeo.rotateX(Math.PI / 2);
  const troncos = new THREE.InstancedMesh(troncoGeo, new THREE.MeshLambertMaterial({ color: MARRON_TRONCO }), ARBOLES);
  const copas = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1),
    new THREE.MeshLambertMaterial(), ARBOLES);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3();
  const s = new THREE.Vector3(), c = new THREE.Color();
  for (let i = 0; i < ARBOLES; i++) {
    const cerca = i < ARBOLES / 3;
    const d = cerca ? 14000 + azar() * 12000 : 26000 + azar() * 22000;
    const a = azar() * Math.PI * 2;
    const h = 2200 + azar() * 2400, r = 1400 + azar() * 1400;
    const x = Math.cos(a) * d, y = Math.sin(a) * d;

    p.set(x, y, h / 2); s.set(r / 4, r / 4, h); m.compose(p, q, s);
    troncos.setMatrixAt(i, m);

    p.set(x, y, h + r * 0.45); s.set(r, r, r * 0.8); m.compose(p, q, s);
    copas.setMatrixAt(i, m);
    c.set(VERDES_COPA[i % VERDES_COPA.length]).lerp(new THREE.Color(0x7ca25b), azar() * 0.35);
    copas.setColorAt(i, c);
  }
  return [troncos, copas];
}

export function crearPaisaje() {
  const grupo = new THREE.Group();
  grupo.visible = false;

  const prado = new THREE.Mesh(new THREE.CircleGeometry(RADIO_PRADO, 48),
    new THREE.MeshLambertMaterial({ color: VERDE_PRADO }));
  prado.position.z = -2;
  grupo.add(prado);

  const azar = dado(2026);
  grupo.add(cielo());
  grupo.add(flores(azar));
  for (const arbol of arboles(azar)) grupo.add(arbol);

  // la niebla funde el canto del prado con el horizonte; sin paisaje, sin niebla
  const niebla = new THREE.Fog(AZUL_HORIZONTE.getHex(), 25000, 65000);
  return { grupo, niebla };
}
