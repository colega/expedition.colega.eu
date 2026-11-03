# Camión de expedición sobre Mercedes Atego

Diseño de la caja habitable de un camión de expedición. El modelo **se
construye ejecutando código**, no dibujando a mano: las cotas viven en el
`reglas.js` de cada versión, los sólidos los hace OpenCascade a través de
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
(`.github/workflows/pages.yml`): construye todas las versiones, y si alguna
deja algo fuera de sitio no publica nada.

El visor construye el modelo él mismo, en un hilo aparte, con el mismo código
que `npm run construir`: lo que se ve es lo que se comprueba. Enseña una
versión cada vez, la que dice la URL (`?v=v17`), y sin ella la última. El
desplegable de arriba cambia de versión; para comparar dos, una en cada
pestaña. Tarda un par de
segundos. Al guardar un cambio en `modelo/` la página se recarga sola y el
camión se vuelve a levantar.

En el visor:

- A la izquierda, el árbol de componentes. Cada casilla muestra u oculta un
  componente con todo lo que lleva dentro, o un cuerpo suelto. Lo oculto se
  recuerda entre recargas; **Mostrar todo** lo enciende todo y **Solo
  interior** deja el interior y la puerta lateral.
- Botones de **vistas** fijas, los mismos encuadres de siempre, para comparar
  de una pasada a otra.
- Con el ratón se gira (botón izquierdo), se desplaza (derecho) y se acerca
  (rueda).
- Un clic sobre una pieza la elige: sale su nombre, su material, su ruta en el
  árbol y sus cotas en el marco del modelo. Desde ahí se puede ocultar.
- **Medir entre aristas**: con el botón encendido, la arista bajo el ratón se
  resalta; un clic elige la primera y otro la segunda. La medida es la
  distancia mínima entre las dos, con su Δx, Δy y Δz, y se queda dibujada con
  una etiqueta hasta que se borra con su ×. Caben las que se quiera, salen
  también en la lista del panel y se recuerdan por versión. Solo se elige una
  arista que se vea: la que tapa otra pieza, no. Esc suelta la primera arista
  y, si no hay, apaga el modo.
- La ducha sale cerrada: `ducha_abierta` viene oculta de serie.
- En el móvil, el modelo va arriba y el panel debajo, con el árbol dentro;
  **Panel** lo pliega para ver el modelo a pantalla completa. Las vistas fijas
  no salen: con el dedo se gira mejor.

## Las versiones

Cada diseño es una carpeta de `versiones/`, no una rama: así se ven todos a la
vez en el visor. Una versión lleva lo que es suyo:

```
versiones/v17/
  README.md         su diseño y lo que tiene pendiente
  version.js        su descripción en una línea, y sus reglas e interior
  reglas.js         sus reglas, R1 en adelante
  interior.js       sus muebles, su baño y sus ventanas
  referencia.jsonl  su inventario, para comparar (ver más abajo)
  despiece.csv      sus tableros, que escribe npm run construir
  ventanas.json     sus ventanas, ídem
```

El resto, la caja, el camión, la puerta lateral, el acabado, las
comprobaciones y el visor, está en `modelo/` y `visor/` y vale para todas:
lee las reglas de la versión que se construye. Un cambio ahí cambia todas las
versiones, y `npm run construir` lo dice versión a versión.

Para una versión nueva se copia la carpeta de la que se parte, se le cambia el
nombre y la descripción de `version.js`, y se toca lo que cambie. Las
versiones viejas no se tocan: son lo que fueron.

| Versión | Qué es |
|---|---|
| [v16](versiones/v16/README.md) | Ducha giratoria contra la pared, inodoro en el suelo y corredera |
| [v17](versiones/v17/README.md) | Inodoro en plataforma de espaldas a la cama, armario y puerta abatible |

## Construir y comprobar

```bash
npm run construir
```

Levanta todas las versiones, cada una en menos de un segundo, y
`node modelo/construir.js v17` solo una. Cada camión sale en este orden: caja,
interior, chasis, cabina, exterior, puerta lateral y acabado
(`modelo/camion.js`). El orden importa: el interior corta las ventanas en las
paredes de la caja, la puerta lateral recorta los muebles y el zócalo, y el
acabado va el último porque redondea y pinta cuerpos que ya existen.

Escribe en la carpeta de cada versión `despiece.csv`, con los tableros de la
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
- **contra_referencia**: lo que cambia respecto a su `referencia.jsonl`.

### La referencia

El `referencia.jsonl` de cada versión es el inventario de todos sus cuerpos: ruta, nombre,
caja envolvente, volumen, área, material y caras. Sirve para los cambios que no
deben mover geometría: el informe empareja por nombre y, lo que no case, por
geometría, porque dos trozos de un mismo corte pueden salir con los nombres
cruzados.

Contra la que hay, el informe no debe sacar nada. Cuando un cambio de diseño
mueve geometría a propósito, se mira que lo que cambia es lo que tenía que
cambiar y se guarda la nueva con:

```bash
node modelo/construir.js v17 --referencia
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
  acabado.js          redondeos y el material de cada cuerpo
  materiales.js       el color de cada material, para el visor
  camion.js           una versión entera, en orden
  comprobaciones.js   verificar, huecos y choques
  inventario.js       el inventario y la comparación con la referencia
  construir.js        lo que corre npm run construir
  oc_node.js          arranca OpenCascade en Node
versiones/            un diseño por carpeta (ver «Las versiones»)
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
- El suelo firme está 1260 mm más abajo, en z -1260 (`ALTURA_PISO`, R108).
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
  paredes            panel sándwich y aislamiento, en doce cuerpos (R34)
  techo              tapa de arriba, 4 placas solares y aire acondicionado
  Interior
    Dormitorio       cama (garaje), alto_pies, alto_almohadas, alto_cabina,
                     escalon_cama, ventana_perros, ventana_almohadas
    Cocina           encimera, altos_cocina, fregadero, vitroceramica,
                     ventana_cocina
    Comedor          sofa (3 módulos), mesa, aparador, altos_comedor,
                     ventana_comedor
    Bano             tabiques_y_puerta, instalaciones_bano, ducha_cerrada,
                     ducha_abierta, toallero, alto_bano, ventana_bano
    suelo_elevado
  remates            zócalos, remates de techo, faldones, garrafas
  rampa
  puerta_lateral
Camion
  chasis, ruedas, cabina, bajos
```

Para trabajar solo en la caja, se oculta `Camion`. Las ventanas van en su
estancia: el hueco es un corte en el cuerpo del panel, así que ocultar una
ventana no cierra el hueco.

## Las reglas del proyecto

El `reglas.js` de cada versión guarda sus decisiones, numeradas, y los
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

Al día, las dos versiones dan 0 fuera de sitio: la v16 tiene 459 cuerpos, 301
en el interior, y la v17 466, 308 en el interior.

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

Pendiente de decidir, en todas las versiones (lo de cada una, en su README):

- **Acceso a la cama.** Del cajón-escalón al colchón quedan 720 (R101).
- **Acceso al garaje** bajo la cama, por los costados del camión (R7).
- **Peldaño de la puerta**: el umbral está a 1310 del suelo firme y ahora no
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
