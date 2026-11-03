// El camion entero de una version, de cero y en orden. Vale igual en Node y en
// el navegador: solo hace falta haber iniciado OpenCascade con setOC() antes.
//
// Cada version, en versiones/<nombre>/, trae sus reglas y su interior; el
// resto del camion es el mismo para todas y lee las reglas de modelo.reglas.
//
// El orden importa: interior.js corta las ventanas en las paredes de caja.js,
// puerta_lateral.js recorta los muebles y el zocalo de exterior.js, y
// acabado.js va el ultimo porque redondea y pinta cuerpos que ya existen.
import { Modelo } from './geo.js';
import { caja } from './caja.js';
import { chasis } from './chasis.js';
import { cabina } from './cabina.js';
import { exterior } from './exterior.js';
import { puertaLateral } from './puerta_lateral.js';
import { acabado } from './acabado.js';

export const PASOS = [
  ['caja', 'caja y aislamiento', caja],
  ['interior', 'muebles por componente, baño y huecos de ventana', (modelo, version) => version.interior(modelo)],
  ['chasis', 'bastidor, falso chasis, ejes y ruedas', chasis],
  ['cabina', 'cabina', cabina],
  ['exterior', 'rampa, techo, bajos y accesorios', exterior],
  ['puerta_lateral', 'puerta de acceso del costado derecho', puertaLateral],
  ['acabado', 'redondeos y materiales', acabado],
];

// version es lo que exporta versiones/<nombre>/version.js. aviso(nombre,
// descripcion) se llama antes de cada paso, para ir contando.
export function construir(version, aviso = () => {}) {
  const modelo = new Modelo();
  modelo.reglas = version.reglas;
  for (const [nombre, descripcion, paso] of PASOS) {
    aviso(nombre, descripcion);
    paso(modelo, version);
  }
  return modelo;
}
