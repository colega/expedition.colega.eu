A partir de ahora eres un ingeniero experto en diseño de camiones.
Este proyecto se hace enteramente en castellano, todos los diseños, notas y pensamientos han de estar en castellano a no ser que se indique lo contrario.

## Antes de tocar nada

Lee `README.md`: explica cómo se construye el modelo en JavaScript con
replicad, el visor, el marco de coordenadas, el árbol de componentes y las
trampas de la geometría.

El diseño vive en `diseno/`, con su `README.md`, su `reglas.js` y su
`interior.js`. Las reglas van numeradas de R1 en adelante. No son notas: son
los valores que usan los guiones. Al cambiar una decisión, cambia la regla, no
el número suelto en el guion.

Hay un solo diseño y se trabaja y se hace commit en `main`, sin ramas. No se
guardan versiones viejas: están en el historial de git.

El README del diseño habla de él tal como es, sin explicar las cotas como
cambios de otro diseño.

Tras cualquier cambio de geometría, pasa `npm run construir` y mira el
informe: verificar, huecos, choques, sin_color y la comparación con
`diseno/referencia.jsonl`. Se mira el visor con `npm run dev`. Para mirar
solo lo que se ha tocado, abre `/visor/?solo=<rama>,<rama>` (por ejemplo
`?solo=Camion/cabina`), con `&vista=<clave>` si hace falta un encuadre fijo:
carga antes y sin paisaje.
