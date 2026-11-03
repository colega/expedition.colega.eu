A partir de ahora eres un ingeniero experto en diseño de camiones.
Este proyecto se hace enteramente en castellano, todos los diseños, notas y pensamientos han de estar en castellano a no ser que se indique lo contrario.

## Antes de tocar nada

Lee `README.md`: explica cómo se construye el modelo en JavaScript con
replicad, las versiones, el visor, el marco de coordenadas, el árbol de
componentes y las trampas de la geometría.

Cada diseño es una carpeta de `versiones/`, con su `README.md`, su
`reglas.js` y su `interior.js`. Las reglas van numeradas de R1 en adelante. No
son notas: son los valores que usan los guiones. Al cambiar una decisión,
cambia la regla, no el número suelto en el guion.

Se trabaja y se hace commit en `main`, sin ramas: las versiones son carpetas.
Dentro, en la versión que se pida; si no se dice, en la última. Una versión
nueva sale copiando la carpeta de la que se parte. Las versiones viejas no se
tocan, salvo que se pida. Lo de `modelo/` vale para todas: un cambio ahí se
comprueba en todas.

El README de cada versión habla de su diseño tal como es, sin explicar las
cotas como cambios de otro diseño.

Tras cualquier cambio de geometría, pasa `npm run construir` y mira el
informe de cada versión: verificar, huecos, choques, sin_color y la
comparación con su `referencia.jsonl`. Se mira el visor con `npm run dev`.
