# Camión de expedición sobre Mercedes Atego

Diseño de la caja habitable de un camión de expedición. El modelo **se
construye ejecutando código**, no dibujando a mano: las cotas viven en el
`diseno/reglas.js`, los sólidos los hace OpenCascade a través de
[replicad](https://replicad.xyz) y se miran en un visor propio hecho con
three.js.

El proyecto se lleva enteramente en castellano, código y comentarios incluidos.

## Cómo se trabaja

Hace falta Node (probado con la 24). Una vez por máquina:

```bash
npm install
```

Uso diario:

```bash
npm run dev          # el visor, en http://localhost:5173
npm run construir    # construye en Node, escribe el despiece y comprueba
npm run visor        # deja el visor en dist/, como página estática
npm run prueba       # las pruebas del visor
```

`dist/` se sirve tal cual desde cualquier servidor de ficheros: el modelo se
construye en el navegador. Lo que más pesa es OpenCascade, 23 MB (7 MB
comprimido), que el navegador guarda tras la primera vez.

Cada push a `main` lo publica en GitHub Pages
(`.github/workflows/pages.yml`): construye el modelo, y si deja algo
fuera de sitio no publica nada.

El visor construye el modelo él mismo, en un hilo aparte, con el mismo código
que `npm run construir`: lo que se ve es lo que se comprueba. Tarda un par de
segundos. Al guardar un cambio en `modelo/` o en `diseno/` la página se recarga
sola y el camión se vuelve a levantar.

En el visor:

- A la izquierda, el árbol de componentes. Arranca oculto y plegado: el botón
  **Componentes** lo muestra. Cada casilla muestra u oculta un componente con
  todo lo que lleva dentro, o un cuerpo suelto. Lo oculto se recuerda entre
  recargas. Los botones de **Mostrar** van en dos filas: **Todo** e **Interior**
  arriba y las zonas debajo. **Todo** enciende todo, con paisaje; **Interior**
  deja el interior, la puerta lateral y las trampillas del garaje;
  **Dormitorio**, **Garaje**, **Baño**, **Cocina** y **Comedor** dejan
  únicamente esa zona del interior y apagan el paisaje. El garaje va de la
  `base_colchon` hacia abajo y el dormitorio de ahí hacia arriba (R118); las
  trampillas no salen en **Garaje**, que son del muro.
- El selector de **vista** tiene los encuadres fijos, con nombre y agrupados en
  exterior e interior, los mismos de siempre para comparar de una pasada a
  otra. Derecha e izquierda son las del conductor.
- Con el ratón se gira (botón izquierdo), se desplaza (derecho) y se acerca
  (rueda).
- Un clic sobre una pieza la elige: sale su nombre, su material, su ruta en el
  árbol y sus cotas en el marco del modelo. Desde ahí se puede ocultar.
- **Medir entre aristas**: con el botón **Entre aristas** encendido (que
  enciende las aristas si estaban apagadas), la arista bajo el ratón se
  resalta; un clic elige la primera y otro la segunda. La medida es la
  distancia mínima entre las dos, con su Δx, Δy y Δz, y se queda dibujada con
  una etiqueta hasta que se borra con su ×. Caben las que se quiera, salen
  también en la lista del panel y se recuerdan. Solo se elige una
  arista que se vea: la que tapa otra pieza, no. Esc suelta la primera arista
  y, si no hay, apaga el modo.
- La ducha sale cerrada: `ducha_abierta` viene oculta de serie. La rampa sale
  abierta y `rampa`, la cerrada, oculta (R111). Los botones **Rampa** y
  **Ducha** de "Abrir y cerrar" dicen cómo está cada una y cambian de la
  abierta a la cerrada; si has ocultado las dos, vuelven a enseñar la cerrada.
  Abierta, la tapa ciega de encima acompaña a la rampa y queda horizontal, de
  visera. **Todo** deja la rampa y la ducha como salen de serie, nunca las dos
  a la vez.
- **Color**: el selector cambia el color de la caja y la cabina (el verde
  militar de R29) en vivo, sin reconstruir. Se recuerda entre recargas y
  **Original** vuelve al de las reglas. Para dejar uno de forma definitiva se
  cambia `VERDE_MILITAR` en `diseno/reglas.js`.
- **Paisaje**: prado con manchas y textura de hierba, matas a rodales, flores,
  las roderas por donde ha entrado el camión, bosquetes de frondosos y pinos,
  colinas en el horizonte, nubes y el cielo con el resplandor del sol. El sol
  echa la sombra del camión en el prado. Todo se pinta en `visor/paisaje.js`,
  sin ficheros de textura. Sale encendido, con la niebla fundiendo el prado con
  las colinas, y
  con las aristas y la rejilla del suelo apagadas, que el prado la sustituye.
  El interruptor **Paisaje** lo apaga y entonces enciende aristas y suelo; los
  otros dos se pueden mover aparte.
- **Una parte sola**: `?solo=` con ramas del árbol separadas por comas malla y
  pinta solo esas, sin paisaje, encuadradas y sin tocar lo oculto que guarda
  el navegador. `?vista=` elige el encuadre por su clave de `VISTAS`
  (`visor/visor.js`). Por ejemplo
  `/visor/?solo=Camion/ruedas,Caja/Interior/Bano&vista=lateral`. El modelo se
  construye entero igual, que los cortes de unas piezas dependen de otras.
- En el móvil, el modelo va arriba y el panel debajo, con el árbol dentro;
  **Panel** lo pliega para ver el modelo a pantalla completa. Las vistas fijas
  no salen: con el dedo se gira mejor.

## El diseño

Hay un solo diseño, en `diseno/`. Lleva lo que es suyo:

```
diseno/
  README.md         su diseño y lo que tiene pendiente
  reglas.js         sus reglas, R1 en adelante
  interior.js       sus muebles, su baño y sus ventanas
  electrico.js      la mampara, los equipos y el cableado del garaje
  referencia.jsonl  su inventario, para comparar (ver más abajo)
  despiece.csv      sus tableros, que escribe npm run construir
  ventanas.json     sus ventanas, ídem
```

El resto, la caja, el camión, la puerta lateral, las trampillas, el acabado, las
comprobaciones y el visor, está en `modelo/` y `visor/` y lee las reglas de
`diseno/`. No se guardan versiones viejas: están en el historial de git.

## Construir y comprobar

```bash
npm run construir
```

Levanta el camión en un segundo largo. Sale en este orden: caja,
interior, chasis, cabina, exterior, puerta lateral, trampillas, electricidad y
acabado
(`modelo/camion.js`). El orden importa: el interior corta las ventanas en las
paredes de la caja, la puerta lateral recorta los muebles y el zócalo, las
trampillas cortan el muro y el garaje que ya existen, y el acabado va el último
porque redondea y pinta cuerpos que ya existen.

Escribe en `diseno/` el `despiece.csv`, con los tableros de la
carpintería, y `ventanas.json`, con las ventanas tal como han quedado. Y saca un
informe con las comprobaciones, que hay que mirar siempre después de tocar
algo:

- **verificar**: nada fuera de su zona. Debe dar 0 fuera de sitio; si no, el
  guion sale con error.
- **huecos**: holguras raras contra las paredes. Solo debería avisar del
  fregadero y de la vitro, que van embutidos en la encimera. Salta la puerta de
  la ducha, que se mueve, y el toallero, que cuelga del tabique.
- **choques**: interferencias entre muebles, midiendo el volumen común de
  verdad, no el solape de cajas envolventes. Solo debería sacar las dos del
  fregadero: la cuba pasando por el techo del módulo de abajo (2,1 l) y el aro
  montando sobre el tablero (0,3 l). Que sea de verdad y no de cajas importa
  porque hay piezas que no son cajas: la caja envolvente de una ele, como la
  esquina del baño (R70), abarca también el hueco.
- **sin_color**: cuerpos sin material o con uno que el visor no conoce. Debe
  salir vacío.
- **deposito_agua**: medidas exteriores e interiores del depósito y su
  capacidad en litros (R127).
- **contra_referencia**: lo que cambia respecto a su `referencia.jsonl`.

### La referencia

El `diseno/referencia.jsonl` es el inventario de todos sus cuerpos: ruta, nombre,
caja envolvente, volumen, área, material y caras. Sirve para los cambios que no
deben mover geometría: el informe empareja por nombre y, lo que no case, por
geometría, porque dos trozos de un mismo corte pueden salir con los nombres
cruzados.

Contra la que hay, el informe no debe sacar nada. Cuando un cambio de diseño
mueve geometría a propósito, se mira que lo que cambia es lo que tenía que
cambiar y se guarda la nueva con:

```bash
node modelo/construir.js --referencia
```

## Los ficheros

```
modelo/
  geo.js              árbol de componentes y primitivas: cajas, cilindros,
                      prismas, placas, cortes, uniones y redondeos
  caja.js             la envolvente, en doce cuerpos (R34)
  chasis.js           bastidor, falso chasis, ejes y ruedas
  cabina.js           la cabina
  exterior.js         rampa, techo, bajos y accesorios
  puerta_lateral.js   la puerta de la caja y el paso libre delante de ella
  trampilla.js        las trampillas del garaje, una por costado (R116, R117)
  acabado.js          redondeos y el material de cada cuerpo
  materiales.js       el color de cada material, para el visor
  camion.js           el camión entero, en orden
  comprobaciones.js   verificar, huecos y choques
  inventario.js       el inventario y la comparación con la referencia
  construir.js        lo que corre npm run construir
  oc_node.js          arranca OpenCascade en Node
diseno/               reglas e interior del diseño (ver «El diseño»)
visor/
  index.html, visor.js   el visor: dibuja solo cuando algo cambia
  medir.js               medir entre aristas, con su prueba en medir.test.js
  trabajador.js          construye el modelo en un hilo aparte
vite.config.js        el visor, para npm run dev y npm run visor
```

## Marco de coordenadas

Todo en milímetros.

- Origen en el **centro del suelo interior de la caja**.
- **X** hacia la cabina, **Y** hacia el costado izquierdo, el de la cocina, y
  **Z** arriba. El costado derecho, el de la puerta de entrada, es Y negativa.
- El suelo firme está 1360 mm más abajo, en z -1360 (`ALTURA_PISO`, R108).
  Ahí va la rejilla del visor.
- Las paredes por dentro: trasera en x -2285, cabina en 2285, costado de la
  puerta en y -1185 y de la cocina en 1185 (`TRASERA`, `FRONTAL`,
  `COSTADO_PUERTA` y `COSTADO_COCINA` en las reglas).

Lo que dice una regla es lo que mide el visor al elegir una pieza.

## Árbol de componentes

Lo crea `modelo/geo.js` y lo respeta cada guion. Cada componente es una lista
de cuerpos con nombre, y cada guion rehace los suyos de cero con
`modelo.nuevo()`.

```
Caja
  paredes            panel sándwich y aislamiento agrupados por pared:
                     pared_suelo, pared_frontal, pared_costado_izq y der (R34)
  techo              tapa de arriba, 4 placas solares, aire acondicionado y,
                     claraboya del baño
  Interior
    Dormitorio       cama (base_colchon, colchon, colchoneta_perros,
                     almohadas), alto_pies, alto_almohadas, alto_cabina,
                     escalon_cama, ventana_perros, ventana_almohadas
    Garaje           garaje (fondo, frontal, trasera y costados), bajo la
                     base_colchon; mampara, electrico (los equipos de
                     Victron, su bastidor y el cuadro de 230) y cableado
                     (R119 a R125)
    Cocina           encimera, altos_cocina, fregadero, vitroceramica,
                     ventana_cocina
    Comedor          sofa (3 módulos), calefactor_agua, prefiltrado_agua,
                     bomba_agua, vaso_expansion_agua, mesa, aparador,
                     deposito_agua, altos_comedor, ventana_comedor
    Bano             tabiques_y_puerta, instalaciones_bano, ducha_cerrada,
                     ducha_abierta, toallero, alto_bano, ventana_bano
    suelo_elevado
  rampa              cerrada (oculta de serie), y su abierta de terraza;
                     cada una con la rueda de repuesto colgada (R113)
  puerta_lateral
  trampilla_garaje   hoja, brida, junta, bisagra y cerradura (R116)
  trampilla_garaje_izq  la misma, en el costado de la cocina (R117)
Camion
  chasis, ruedas, cabina, bajos
```

Para trabajar solo en la caja, se oculta `Camion`. Las ventanas van en su
estancia: el hueco es un corte en el cuerpo del panel, así que ocultar una
ventana no cierra el hueco.

## Las reglas del proyecto

El `diseno/reglas.js` guarda sus decisiones, numeradas, y los
guiones las leen. **No son documentación: son las cotas que se usan.** Si cambia una
regla, cambia una línea y el modelo se recalcula. Los números no van seguidos:
cada regla conserva el número con el que se decidió. Una regla puede tener una
nota con letra, cuando la completa sin sustituirla, como R103b.

Las cotas de catálogo van con la letra que usa el fabricante en su hoja de
medidas: las ventanas, las persianas y la puerta de Outbound (R90, R96, R99) y
el Separett Tiny (R104).

Las paredes de la caja salen en doce cuerpos, seis por capa (R34): `panel_*`
por fuera y `aisl_*` por dentro, cada uno con su cara (`costado_izq`,
`costado_der`, `frontal`, `trasera`, `suelo`, `techo`). Se ocultan de uno en
uno desde el árbol. Un hueco que cruza una pared de lado a lado la parte en
dos, y el segundo trozo se llama como el primero con `_1`: es lo que pasa con
la trasera, que la rampa deja en dintel y antepecho.

Las dos piezas de arriba no viven con las demás: van en el componente `techo`,
con las placas y el aire (R37), para que ocultar el techo oculte todo el techo.
Por eso los huecos de techo buscan a quién cortar en los dos componentes.

Al final está la lista de lo descartado (R21): trampilla elevadora, escalera
bajo la puerta, toldo, cofre de gas, ducha exterior, escalera al techo, boca de
agua, toma de 220, portezuela de servicio, baca, claraboyas, climatizador,
ventilador, cúpula de satélite, antena, focos y luces de gabarito.

## Trampas de la geometría

- **Un corte solo toca lo que se le pide.** Para abrir un hueco en la pared
  hay que decir a qué cuerpos llega: `geo.muros()` los busca por su caja
  envolvente.
- **Un corte puede partir un cuerpo.** `Componente.restar()` devuelve los
  trozos: el primero conserva el nombre y los demás llevan `_1`, `_2`... Quien
  necesite otro nombre, como el zócalo que parte la puerta, los renombra a
  mano.
- **Un redondeo que no cabe lanza.** OpenCascade no da un redondeo a medias:
  si el radio no cabe en la cara de al lado, falla la operación entera. Por eso
  las aristas se eligen con cuidado y, donde puede no caber, de una en una.
- Las aristas se eligen por geometría, con la función que recibe
  `redondear()`. La costura de un cilindro también es una arista: cuenta en
  `faces` y `edges` aunque no se vea.

## Estado y cabos sueltos

Al día, el modelo da 0 fuera de sitio: 651 cuerpos, 433 en el interior.

Contar los cuerpos no es una formalidad: `caja()` devuelve `null` cuando el
rango que le llega mide cero, sin quejarse, y la pieza desaparece sin aviso.

`caraTrasera()` decide contra qué pared va la trasera de un mueble por la
distancia, y cuando dos caras están a la misma el desempate lo da el orden de
la lista, que no tiene por qué ser el que interesa. Pasa con todo lo que toca
dos paredes, como los altos del fondo. Se fuerza con `trasera`, que llega hasta
`carcasa`, `estante` y `frentes`.

Ojo con los cuerpos que no encajan en ninguna regla de material: heredan el del
componente, y si el componente tampoco tiene, salen en magenta en el visor y en
`sin_color` en el informe. Y ojo con el caso contrario, que no avisa: las
reglas `POR_CONTIENE` de `acabado.js` buscan el trozo en cualquier parte del
nombre, así que un mueble nuevo puede caer en una regla que no era para él. Por
eso las almohadas se buscan por prefijo: `alto_almohadas` lleva "almohada"
dentro.

`caja()` solo sabe de rectángulos. Para una pieza en planta con una esquina
cortada, como el tablero de la mesa (R69), está `placa()`, que extruye un
contorno cualquiera y la apunta en el despiece por su rectángulo envolvente,
que es la plancha de la que sale.

Un mueble puede quedarse sin manera de abrirse y nada avisa: ninguna
comprobación mira si la cara abierta de una carcasa da a algo. Al añadir un
mueble, comprobar por dónde se entra a él.

Pendiente de decidir (lo propio del diseño, en `diseno/README.md`):

- **Acceso a la cama.** Del cajón-escalón al colchón quedan 720 (R101).
- **Peldaño de la puerta**: el umbral está a 1410 del suelo firme y ahora no
  hay nada (R15).
- **Acceso al techo**: no hay escalera y arriba están las placas y el aire
  (R21).
- **La ventana de las almohadas no va centrada en la cama**: su centro está en
  x 1546.1 y el de la cama en 1585 (R93).
- **El primer módulo de la encimera**, el de la trasera, toca dos paredes y
  lleva la trasera contra la de la rampa, no contra el costado. No se ve, que
  los frentes van aparte, pero la caja está girada.
- **El fregadero atraviesa el tablero y el techo del módulo de abajo.** El aro
  monta 8 mm sobre la encimera y la cuba pasa por el techo del módulo, que no
  lleva su hueco. Es el corte que le falta al mueble, no un choque de diseño.
- **Espesor de techo para el aire**: admite de 25 a 60 mm y el techo son 65
  (panel 50 + aislamiento 15). Hará falta rebajar el aislamiento en el
  perímetro del hueco o poner marco adaptador (R23).
- **Las cotas del camión salen de fotos** (R108), con unos 50 mm de margen.
  La batalla de la ficha técnica las afina: si no es 4010, se corrigen
  `eje_delantero` y `eje_trasero` en `ATEGO`, y con ellos se mueven ruedas,
  ballestas, guardabarros y paso de rueda.
