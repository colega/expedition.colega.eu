// La distancia entre aristas: npm run prueba
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { entreAristas } from './medir.js';

const v = (x, y, z) => new Vector3(x, y, z);
const recta = (a, b) => [[v(...a), v(...b)]];
const cerca = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} no es ${b}`);

test('dos aristas paralelas, una frente a otra', () => {
  const [p, q, d] = entreAristas(recta([0, 0, 0], [1000, 0, 0]), recta([200, 50, 0], [600, 50, 0]));
  cerca(d, 50);
  cerca(p.y, 0);
  cerca(q.y, 50);
});

test('paralelas sin solaparse: de punta a punta', () => {
  cerca(entreAristas(recta([0, 0, 0], [100, 0, 0]), recta([130, 40, 0], [300, 40, 0]))[2], 50);
});

test('cruzadas a distinta altura', () => {
  cerca(entreAristas(recta([-100, 0, 0], [100, 0, 0]), recta([0, -100, 70], [0, 100, 70]))[2], 70);
});

test('un arco partido en segmentos contra una recta', () => {
  const arco = [];
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI, b = ((k + 1) / 16) * Math.PI;
    arco.push([v(100 * Math.cos(a), 100 * Math.sin(a), 0), v(100 * Math.cos(b), 100 * Math.sin(b), 0)]);
  }
  // la recta y = 150 queda a 50 de lo alto del arco
  cerca(entreAristas(arco, recta([-300, 150, 0], [300, 150, 0]))[2], 50);
});

test('la misma arista dos veces', () => {
  cerca(entreAristas(recta([0, 0, 0], [10, 0, 0]), recta([0, 0, 0], [10, 0, 0]))[2], 0);
});
