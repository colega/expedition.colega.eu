// Las reglas del diseño: cotas y decisiones, en un solo sitio.
//
// Todas las cotas van en mm, en el marco del modelo:
//   - x a lo largo de la caja, hacia la cabina
//   - y a lo ancho, hacia el costado izquierdo, el de la cocina; el derecho, el
//     de la puerta de entrada, es el de la acera
//   - z hacia arriba, desde el suelo interior de la caja
// El origen es el centro del suelo interior. El suelo firme queda 1360 mm mas
// abajo (R108).
//
// Las reglas se numeran para poder referirse a ellas al hablar del proyecto. No
// van seguidas: cada una conserva el numero con el que se decidio.

// --- caja y estructura ---------------------------------------------------
// R1  Caja exterior de 4700 x 2500 x 2230, de panel sandwich de 50 con 15 de
//     aislamiento en paredes, suelo y techo. Por dentro quedan 4570 x 2370 x
//     2100, que es la altura libre del camion de verdad.
export const MURO = { panel: 50.0, aislamiento: 15.0 };
export const ALTO_INTERIOR = 2100.0;
export const INTERIOR = { largo: 4570.0, ancho: 2370.0, alto: ALTO_INTERIOR };
// canto de la envolvente arriba y abajo: dos paneles y los dos aislamientos
export const CAJA_ALTO_EXT = ALTO_INTERIOR + 2 * MURO.panel + 2 * MURO.aislamiento;
// cara de fuera del techo, en el marco del modelo
export const TECHO_EXT = ALTO_INTERIOR + MURO.panel + MURO.aislamiento;
// las cuatro paredes por dentro
export const TRASERA = -INTERIOR.largo / 2.0;           // la de la rampa
export const FRONTAL = INTERIOR.largo / 2.0;            // la de la cabina
export const COSTADO_PUERTA = -INTERIOR.ancho / 2.0;    // el derecho
export const COSTADO_COCINA = INTERIOR.ancho / 2.0;     // el izquierdo

// R108 El camion es un Mercedes Atego de cabina L, 4x2. Las cotas del chasis
//      salen de sus fotos de perfil, escaladas con la caja de R1, asi que
//      valen con unos 50 mm de margen:
//        - el suelo interior de la caja queda a 1360 del suelo firme, y la cara
//          de abajo de la caja a 1295: el eje queda 795 por encima del suelo,
//          bajo el bastidor, y el resto lo pone el radio de la rueda
//        - el eje delantero va 970 por delante de la caja, en x 3320, y el
//          trasero en x -690, bajo la esquina del sofa: 4010 de batalla y
//          1660 de voladizo de la caja por detras
//        - ruedas sencillas de 1130, Continental HCS 365/85 R20, con 1900 de via
export const ALTURA_PISO = 1360.0;
export const ATEGO = { eje_delantero: 3320.0, eje_trasero: -690.0, rueda_diam: 1130.0,
  rueda_ancho: 365.0, llanta_diam: 560.0, via: 1900.0 };

// R34 La envolvente sale partida en piezas, una por capa y pared: los dos
//     costados, el frontal, el suelo y el techo, agrupadas en el visor por
//     pared, para poder ocultarla de una pieza y mirar dentro de la caja de
//     una vez. Sin pared trasera: su plano lo cubren la rampa y su tapa ciega
//     (R21, R54).
//     El redondeo de 120 de las esquinas verticales necesita 120 mm de material
//     en las dos caras que se juntan, y una pared suelta solo tiene los 50 del
//     panel. Por eso los costados corren de punta a punta y envuelven 200 mm
//     sobre la cara frontal y la trasera, y el suelo y el techo son la tapa
//     entera. El frontal va entre los retornos. El borde de
//     arriba se redondea a 40, que es lo que cabe en el canto del techo.
//     Los huecos de ventana y de puerta se cortan contra las piezas a las que
//     llegan: geo.muros() las busca.
// R37 El panel y el aislamiento de arriba van al componente 'techo', con el
//     equipo que se monta encima. Asi ocultar el techo oculta todo lo de arriba
//     y se ve dentro de la caja de una vez.

// R54 En la trasera va una rampa elevadora que hace de terraza: 1800 desde el
//     suelo, metalica por fuera y forrada por dentro de listones de madera
//     horizontales. De la rampa al techo, un panel ciego. No hay margen trasero:
//     los muebles llegan al paramento.
export const RAMPA = { alto: 1800.0, ancho: [-1105.0, 1105.0], hoja: 55.0,
  liston: 18.0, listones: 11, junta: 10.0, margen: 40.0 };

// R111 La rampa se puede ver abierta: la misma hoja, girada 90 grados sobre
//      su canto de abajo, el de dentro, y queda horizontal a la altura del
//      suelo de la caja, haciendo de terraza: los listones de la cara de
//      dentro quedan hacia arriba y hacen el suelo. La tapa ciega que hay
//      encima abre con ella: girada sobre su canto de arriba, el de fuera,
//      queda horizontal bajo ese nivel, de visera. El visor la enseña
//      abierta de serie, y da un boton para cambiar de una a otra.
export const RAMPA_ABIERTA = true;

// R113 En el centro de la rampa, por fuera, cuelga una rueda de repuesto del
//      mismo tamaño que las del camion (R108), con su eje perpendicular a la
//      hoja y el centro de la rueda en el de la hoja. Va a 40 de la hoja, en un
//      soporte de 90 de radio. Cerrada la rampa, queda detras de la hoja;
//      abierta (R111), la hoja la lleva colgada bajo la terraza.
export const REPUESTO = { separacion: 40.0, soporte: 90.0 };

// R114 Los marcos de las ventanas (R90) y de la puerta (R99) van pintados del
//      color de la caja por fuera: la brida, la hoja y el cuerpo. Alrededor de
//      la brida, sobre el panel, una junta de silicona negra de 5 de ancho y 2
//      de grueso. Por dentro siguen negros, igual que las persianas (R96).
export const JUNTA = { ancho: 5.0, grueso: 2.0 };

// R115 Las Continental HCS llevan tacos grandes de todo terreno: dos filas de
//      tacos de lado a lado, que se cruzan un poco en el centro y van
//      alternadas medio paso. 20 pasos en la vuelta, tacos de 95 de ancho y 22
//      de alto sobre la goma. Las cotas salen de las fotos de la rueda.
export const TACOS = { pasos: 20, ancho: 95.0, alto: 22.0, cruce: 0.08 };

// R3  Toda la casa va sobre un suelo elevado de 50: tablero de 18 sobre un
//     cerco con travesaños cada 600, con 32 de luz por debajo para nivelar.
//     Llega de la trasera a los pies de la cama; la cama posa en el suelo de
//     la caja. PISO es la cota donde posan los muebles.
export const SUELO_ELEVADO = { alto: 50.0, travesanos: 600.0 };
export const PISO = SUELO_ELEVADO.alto;

// R26 Los tableros de la carpinteria son de 18. Puertas y cajones vuelan 18
//     sobre la cara del mueble, con 3 de junta, y van en gris lacado: cuatro
//     bahias en la encimera, con un cajon de 220 arriba, y cuatro en los altos.
export const ESPESOR = 18.0;
export const FRENTE = { grueso: 18.0, vuelo: 18.0, junta: 3.0, bahias_encimera: 4,
  alto_cajon: 220.0, bahias_altos: 4 };

// R27 Paramentos, tabiques y carpinteria en plastico blanco lacado. El suelo
//     es de madera.
// R29 Por fuera, caja y cabina en verde militar, y bastidor, bajos, defensa y
//     faldones en negro. La perfileria de aluminio se queda vista.
export const VERDE_MILITAR = [116, 130, 85];
export const NEGRO_CHASIS = [28, 28, 30];

// R80 Los altos cuelgan del techo y son cajas rectas, sin cortes:
//       - en el costado de la cocina arrancan a 1678: los de la cocina miden
//         422 por el horno (R86) y el de los pies de la cama coge esa misma
//         cota (R97)
//       - el del comedor mide 350 y arranca a 1750
//       - los dos de la cama que quedan, el de las almohadas y el de la cabina,
//         miden 250 y arrancan a 1850: sobre el colchon quedan 780
export const ALTOS_BAJO_COMEDOR = ALTO_INTERIOR - 350.0;                  // 1750
export const ALTOS_BAJO_CAMA = ALTO_INTERIOR - 250.0;                     // 1850
// R86 Los altos de la cocina se acotan por dentro, que ahi va un horno
//     encastrado: 382 de hueco libre en vertical, con tablero de 20 arriba y
//     abajo. Son 422 de fuera y arrancan en 1678. Van de una pieza por dentro,
//     sin verticales, asi que el horno cabe a lo largo donde se quiera; cuando
//     se elija, su hueco tendra que ser una puerta sola.
export const HORNO = { modelo: 'horno encastrable compacto (por elegir)', hueco_alto: 382.0 };
export const ALTO_COCINA = { espesor: 20.0, interior: HORNO.hueco_alto };
export const ALTO_COCINA_ALTO = ALTO_COCINA.interior + 2 * ALTO_COCINA.espesor;  // 422
export const ALTOS_BAJO_COCINA = ALTO_INTERIOR - ALTO_COCINA_ALTO;               // 1678

// --- dormitorio ----------------------------------------------------------
// R71 La cama va atravesada contra la pared de la cabina, de costado a
//     costado: 1400 a lo largo de la caja, asi que los pies quedan en x 885.
// R7  Debajo hay un garaje cerrado por los seis lados, que posa en el suelo de
//     la caja. El acceso son las trampillas de los dos costados (R116, R117).
// R4  El colchon tiene 200 de grueso: apoya en la base del colchon y su cara de
//     arriba queda a 1070.
// R6  La base del colchon, o sea el somier, queda a 870. Sobre el colchon quedan
//     1030 hasta el techo, mas de los 900 que pide R5.
// R118 La pared del garaje del lado de los pies, la frontal, sube hasta 952, 82
//      por encima de la base del colchon, y la base y el colchon no apoyan
//      encima de ella: empiezan en su cara de dentro, en x 903, y miden 1382 en
//      vez de 1400. La trasera y los dos costados del garaje llegan solo hasta
//      la base, que va de pared a pared de la caja. De la base hacia arriba todo
//      es dormitorio, y de la base hacia abajo, garaje.
export const CAMA = { ancho: 1400.0, somier: 870.0, colchon: 200.0, pies: 952.0 };
export const CAMA_PIES = FRONTAL - CAMA.ancho;                            // 885
export const CAMA_LECHO_X = [CAMA_PIES + ESPESOR, FRONTAL];               // R118: tapa y colchon
export const HOLGURA_CAMA_TECHO = 900.0;                                  // R5
// R53 En el costado de la cocina, la colchoneta de los perros: 553 de ancho,
//     del costado a y 632, a ras del colchon y distinta de color. El colchon se
//     queda con el resto.
export const CAMA_PERROS = [632.0, COSTADO_COCINA];
// R49 Dos almohadas en el extremo del costado de la puerta, que es lo que deja
//     claro por donde se duerme.
export const ALMOHADA = { fondo: 400.0, alto: 120.0, margen: 60.0, junta: 40.0 };

// R65 La cama lleva altos en U: uno en cada costado y otro en la pared de la
//     cabina. Los dos de los costados corren de los pies a la cabina, cierran
//     contra la pared del camion y abren por la cara larga, la que da al centro
//     de la caja (R67). El del fondo se queda con lo que hay entre las caras
//     de sus puertas.
//       - el de los pies, sobre la colchoneta de los perros, con su mismo ancho
//         y de 422, como los de la cocina (R97)
//       - el de las almohadas, con el fondo del alto del comedor, 341.5: con
//         mas, la cabeza se da con el al incorporarse (R68). De 250 (R80)
//       - el de la cabina, 303.2 de fondo desde la pared de la cabina, de 250.
//         En la esquina de las almohadas queda a ras del de las almohadas; en
//         la de los pies hay escalon
export const ALTO_FONDO_CAMA = 303.2;

// R101 En la esquina de los pies de la cama con la pared del baño, un
//      cajon-escalon en cubo de 300: contra la cama y contra el tabique,
//      cerrado por delante con una tapa igual que la trasera. La puerta sera
//      empotrada y se decide despues; por dentro quedan 264 de fondo. Del
//      escalon al colchon quedan 720.
export const ESCALON_CAMA = { ancho: 300.0, alto: 300.0, fondo: 300.0 };

// R116 La trampilla es la puerta del garaje (R7), en el costado de la puerta, el
//      derecho. El hueco libre mide 810 de ancho y 850 de alto, arranca a 300 de
//      la pared frontal y baja hasta el tablero del fondo del garaje, sin escalon
//      al sacar las cosas: de x 1175 a 1985 y de z 18 a 868. Atraviesa el muro de
//      la caja y el costado del garaje. La hoja llena el hueco de fuera a dentro
//      del muro y lleva alrededor una brida de 30 y la junta de silicona de R114,
//      del color de la caja. Las bisagras van en el canto de la cabina, como las
//      de la puerta (R99), y la cerradura en el otro.
// R117 En el costado de la cocina, el izquierdo, otra trampilla al garaje, mas
//      pequena: 600 x 600, tambien a 300 de la pared frontal y a ras del tablero
//      del fondo, de x 1385 a 1985 y de z 18 a 618. Es como la de R116: hoja,
//      brida, junta, bisagras en el canto de la cabina y cerradura en el otro.

// Cotas de una trampilla del garaje: de la pared frontal hacia atras, y del
// tablero del fondo hacia arriba.
const trampillaGaraje = (desde_frontal, ancho, alto) => ({ desde_frontal, ancho, alto,
  brida: 30.0, x: [FRONTAL - desde_frontal - ancho, FRONTAL - desde_frontal],
  z: [ESPESOR, ESPESOR + alto] });
export const TRAMPILLA_GARAJE = trampillaGaraje(300.0, 810.0, 850.0);      // R116, la derecha
export const TRAMPILLA_GARAJE_IZQ = trampillaGaraje(300.0, 600.0, 600.0);  // R117, la izquierda

// --- garaje: electricidad -------------------------------------------------
// R119 A 270 de la pared frontal, la de la cabina, una mampara de metacrilato
//      de 6 cierra el hueco de los equipos electricos, de costado a costado del
//      garaje y del fondo a la base del colchon. Va metida en dos carriles de
//      aluminio, abajo y arriba, y se saca tirando de sus dos tiradores. Del
//      tablero del garaje a la mampara quedan 252 de fondo.
export const MAMPARA = { desde_frontal: 270.0, grueso: 6.0, carril: 20.0 };

// R120 Los equipos son de Victron, con las cotas de sus hojas de datos y de sus
//      planos (victronenergy.com), en mm: alto, ancho y fondo tal como van
//      montados. La bateria lleva sus dos bornes M8 arriba, a 75.8 de cada
//      extremo y a 28.6 del canto largo. El BatteryProtect se cuelga con los
//      bornes M6 hacia fuera, 47 entre ellos.
export const VICTRON = {
  bateria: { modelo: 'Lithium NG 25,6 V / 300 Ah', alto: 206.0, ancho: 841.0, fondo: 205.0,
    peso: 52.0, borne_extremo: 75.8, borne_canto: 28.6 },
  multiplus: { modelo: 'MultiPlus-II 24/5000/120-50', alto: 607.0, ancho: 330.0, fondo: 149.0, peso: 30.0 },
  mppt: { modelo: 'SmartSolar MPPT 150/35', alto: 130.0, ancho: 186.0, fondo: 70.0 },
  orion_xs: { modelo: 'Orion XS 1400', alto: 138.1, ancho: 124.4, fondo: 53.0 },
  orion_tr: { modelo: 'Orion-Tr 24/12-30A', alto: 131.0, ancho: 187.0, fondo: 86.0 },
  // Victron da 279 x 169 x 97 con el lado largo primero, como en todos los
  // Lynx; montado, ese lado va a lo ancho. Lleva dos fusibles Class-T (R123)
  lynx_entrada: { modelo: 'Lynx Class-T Power In M10', alto: 169.0, ancho: 279.0, fondo: 97.0 },
  lynx_bms: { modelo: 'Lynx Smart BMS NG 500 A M10', alto: 166.5, ancho: 152.4, fondo: 80.9 },
  lynx_distribuidor: { modelo: 'Lynx Distributor M10', alto: 168.9, ancho: 252.3, fondo: 80.0 },
  cerbo: { modelo: 'Cerbo GX MK2', alto: 78.0, ancho: 154.0, fondo: 48.0 },
  protector: { modelo: 'Smart BatteryProtect 12/24V-65A', alto: 55.0, ancho: 106.0, fondo: 40.0,
    bornes: 47.0, borne_alto: 8.0 },
};

// R121 Las dos baterias van en torre, centradas en el ancho de la caja, que es
//      donde mejor reparte su peso el chasis: la de abajo en el suelo y la de
//      arriba en una balda de aluminio de 8, en el bastidor de R124. Entre una
//      bateria y lo de encima quedan 100 para los bornes y los cables. Alrededor,
//      los 20 libres que pide Victron a los lados y 23.5 delante y detras.
//      Encima de la torre, la cadena Lynx: Class-T Power In, BMS y los dos
//      distribuidores, montada derecha, con las baterias entrando por el
//      costado de la cocina. Lo demas se cuelga del tablero del garaje, fuera
//      de la vertical de las baterias, como pide Victron:
//        - del lado de la puerta, el MultiPlus junto a la torre, colgado 100
//          sobre el suelo para que los cables le entren por abajo, y el cuadro
//          de 230 a continuacion: se llega a los dos por la trampilla grande
//          (R116). Los bornes de continua del MultiPlus van abajo a la derecha,
//          en el extremo lejos de la torre, y la salida AC-OUT 1 en el cercano
//        - del lado de la cocina, el BatteryProtect junto a la torre, a menos
//          de los 50 que pide de la bateria; la columna de los dos MPPT y el
//          Orion XS, con 100 libres alrededor; y la del Orion-Tr y el Cerbo
//      Entre la torre y lo de los lados queda un paso de 40 para los cables que
//      suben.
export const ELECTRICO = { lado_multiplus: 'puerta', holgura_bateria: 20.0, hueco_bornes: 100.0, balda: 8.0,
  paso_cables: 40.0, bajo_multiplus: 100.0, holgura_cargador: 100.0, columna_cargadores_y: -790.0,
  orion_tr_z: 400.0, cerbo_z: 650.0, cuadro_z: 450.0 };

// R124 La torre de baterias va en un bastidor de perfil de aluminio ranurado
//      4040 de Aluxprofile (ranura de 8, 1.395 kg/m, Ix = Iy = 7.56 cm4), que
//      lleva el peso al suelo de la caja y no a la pared:
//        - cuatro montantes en las esquinas, en los costados de la torre y fuera
//          de los 20 libres de las baterias: el fondo del hueco no deja meterlos
//          delante y detras. Los de delante, 8 detras de la mampara para no
//          tocar su carril, y los de detras contra el tablero del garaje
//        - dos largueros a lo ancho, delante y detras, bajo los cantos de la
//          bateria de arriba, con la balda encima
//        - en cada costado, tres travesaños a lo largo: en el suelo, bajo la
//          balda y arriba, cerrando el marco
//      Se ancla al suelo de la caja por los travesaños de abajo, y cada bateria
//      va sujeta con las escuadras que trae.
export const BASTIDOR = { modelo: 'Aluxprofile perfil ranurado 4040', perfil: 40.0, kg_m: 1.395,
  holgura_mampara: 8.0, alto_sobre_torre: 40.0 };

// R125 Cada bateria tiene su desconectador manual en el positivo, entre ella y
//      el Class-T Power In, para aislarla al guardar el camion o al trabajar en
//      la instalacion. Es un Blue Sea 9003e: 350 A continuos (la bateria da 300),
//      600 A durante 5 minutos, hasta 48 V, esparragos M10. Mide 97.8 x 97.8 de
//      brida y 78.7 de fondo con el mando. Van colgados uno encima de otro,
//      encima del BatteryProtect, a 300 y a 460, con el mando rojo hacia la
//      mampara. No cortan con carga: antes se apagan el MultiPlus y los
//      cargadores, y el dia a dia se apaga con el remote on/off del BMS.
export const DESCONECTADOR = { modelo: 'Blue Sea 9003e', lado: 97.8, fondo: 78.7, mando: 20.0,
  radio_mando: 30.0, continuo: 350.0, z: [300.0, 460.0] };

// R122 El cuadro de 230 es un Schneider Resi9 MP MIP11108T de superficie, de una
//      fila de 8 modulos: un diferencial de 2 modulos y 5 automaticos. Le llega
//      la salida AC-OUT 1 del MultiPlus por abajo.
export const CUADRO_230 = { modelo: 'Schneider Resi9 MP MIP11108T', alto: 198.0, ancho: 196.0,
  fondo: 101.5, modulo: 18.0, automaticos: 5, diferencial: 2, maneta: 45.0 };

// R123 El cableado principal, con lo que piden los manuales de Victron:
//        - de cada bateria al Lynx Class-T Power In, 95 mm2 por polo (300 A),
//          con un fusible Class-T de 350 A en el positivo de cada una, como en
//          el esquema de Victron para dos Lithium NG con el Smart BMS NG
//        - del distribuidor al MultiPlus, 2 x 50 mm2 por polo y fusible de 400 A
//        - a los MPPT (fusible de 40 A) y al Orion XS (60 A), 16 mm2
//        - al Orion-Tr, 10 mm2 y 30 A, y al BatteryProtect, 16 mm2
//        - del MultiPlus al cuadro, manguera de 3 x 6 mm2
//      Se dibujan con el diametro de fuera y van por el plano de la pared o por
//      delante de los equipos, sin pisar ninguno.
export const CABLES = { bateria: 19.0, multiplus: 14.0, cargador: 9.0, orion_tr: 7.5, alterna: 13.0 };

// --- cocina --------------------------------------------------------------
// R79 La cocina va en el costado izquierdo y corre de la trasera al baño en
//     dos modulos iguales, sin columna de despensa.
// R95 La encimera tiene 620 de fondo, medidos en el tablero, del costado al
//     canto. El tablero vuela 22 sobre la carcasa: tapa los frentes de 18 y
//     deja 4 de goteron.
// R84 Bajo el tablero quedan 900 libres, lo que pide una nevera de compresor
//     para meterla debajo. Con el tablero de 38 la encimera queda a 988.
export const ENCIMERA = { fondo: 620.0, vuelo: 22.0, hueco: 900.0, tablero: 38.0 };
// R28 Mirando de frente a la encimera, el fregadero va a la izquierda, junto
//     al baño, y la vitro de dos fuegos a la derecha, junto a la trasera, con
//     la encimera libre en medio. La vitro va atravesada: su lado largo cruza
//     la encimera y los fuegos quedan uno detras del otro vista desde el
//     pasillo. Las dos son medidas genericas; los modelos estan por elegir.
//     La placa sera de induccion.
// R73 El fregadero es de 400 x 450, 80 separado de la pared.
export const FREGADERO = { ancho: 400.0, fondo: 450.0, cuba: 150.0, margen: 30.0,
  pared: 80.0 };
export const VITRO = { largo: 520.0, ancho: 300.0, grueso: 8.0, holgura_hueco: 30.0,
  fuegos: 2, margen: 40.0, retranqueo: 40.0 };
// Los altos de la cocina corren de la trasera al baño con 472.4 de fondo.
export const ALTO_COCINA_FONDO = 472.4;

// --- comedor -------------------------------------------------------------
// R20 El sofa es una L de tres modulos contra el costado de la puerta: el
//     tramo largo, la esquina y el retorno, cada uno un arcon con su tapa. La
//     esquina va al extremo del lado de la puerta, contra el aparador (R77),
//     asi que la mesa queda junto a la trasera y la rampa se puede abrir.
// R74 Los dos tramos tienen el mismo fondo, 591.4, y la esquina sale cuadrada.
// R82 El retorno mide 500 desde la esquina.
export const SOFA = { fin_x: -422.3, fondo: 591.4, retorno: 500.0 };
// R12 El asiento queda a 490 sobre el piso: arcon con la tapa a 440 y cojin
//     de 50. El respaldo acaba en 880 (R94).
// R19 El cojin de asiento ocupa toda la tapa y se mete por debajo del
//     respaldo. El respaldo es trapezoidal, de 150 abajo y 90 arriba, con la
//     cara de la pared vertical.
export const ASIENTO = 490.0;
export const COJIN_ASIENTO = 50.0;
export const RESPALDO = { abajo: 150.0, arriba: 90.0, alto: 880.0 };
// R13 La mesa es de altura ajustable, con tablero de 20 y la cara de arriba a
//     770 sobre el piso: 260 de rodillas sobre el cojin (R94).
// R69 Lleva cortada a 45 grados la esquina que da al paso de la cocina, 100
//     por lado: es la que se lleva los golpes de cadera.
export const MESA = { x: [-1945.4, -1043.6], y: [-547.5, 53.8], alto: 770.0,
  tablero: 20.0, chaflan: 100.0 };
// R36 Entre el sofa y la puerta de la caja va un aparador, del final del sofa
//     a x 200 (R58). Crece hacia el centro hasta cubrir el respaldo del
//     retorno, esquina incluida (R76), y acaba a la altura de la encimera. Abre
//     por la cara del centro, con dos puertas y un estante a media altura.
export const APARADOR = { bahias: 2, estantes: [0.5] };
export const FIN_COMEDOR = 200.0;      // hasta aqui llegan el aparador y su alto
// R100 Los dos costados del aparador, los que van de la pared al centro, suben
//      50 por encima del tablero: hacen de reborde para que no se caiga lo que
//      se deja encima. En la punta del paso el canto de arriba se redondea con
//      radio 50, asi que la curva muere en el tablero y esa esquina no es un
//      pico.
export const APARADOR_REBORDE = { alto: 50.0, radio: 50.0 };
// R66 El alto del comedor corre de la trasera a x 200, por encima del
//     aparador, con 341.5 de fondo.
export const ALTO_COMEDOR_FONDO = 341.5;

// --- puerta de la caja ---------------------------------------------------
// R99 La puerta de la caja es la Outbound DE-20, la grande de su serie, de
//     poliester con fibra de vidrio y nucleo de espuma. Las cotas son las de su
//     hoja de medidas (outbound.eu, "Doors dimensions and weights"), en mm y
//     con la letra del fabricante. A es el alto y B el ancho:
//       marco      A x B    la brida de fuera, de 4 (G), sobre el panel
//       hoja       D x E    la hoja, casi a ras de la pared
//       cuerpo     K x M    el escalon de fuera, 42 de fondo (H), que entra en
//                           el rebaje del hueco
//       interior   J x L    el escalon de dentro, que llega al paramento
//     El hueco es escalonado, como el de las ventanas (R90): un rebaje de
//     1937 x 691 y 42 de fondo desde fuera, y de ahi a dentro un paso de
//     1877 x 631, de la tabla de corte del fabricante. El paso libre no sale en
//     la hoja: con una pared de 4, como la brida, queda en 1853 x 607, que es
//     tambien lo que deja libre su mosquitera HO-PL-20.
//     El muro de 65 entra en lo que pide el fabricante, de 60 a 85.
//     El umbral va a ras del piso, y a lo largo va centrada en el hueco que
//     dejan los altos de ese costado, el del comedor, que acaba en x 200, y el
//     de las almohadas, que empieza en los pies de la cama: el paso va de
//     x 227 a 858, a 27 del aparador y a 27 del frente de la cama. La brida baja 17.5 por
//     debajo del suelo de la caja, sobre el canto del panel del suelo, y el
//     zocalo se corta en su ancho. Las bisagras van hacia la cabina, como pide
//     el manual, y la cerradura en el otro canto. Es la de serie, ciega: la
//     ventana con persiana y la mosquitera son opciones.
export const PUERTA_DE = {
  // modelo: marco (A, B), hoja (D, E), interior (J, L), cuerpo (K, M),
  //         rebaje (B, A) y paso (C, D) de la tabla de corte, peso en kg
  'DE-10': [[1822, 669], [1735, 582], [1695, 542], [1757, 604], [1771, 618], [1711, 558], 20.1],
  'DE-15': [[1822, 742], [1735, 655], [1695, 615], [1757, 677], [1771, 691], [1711, 631], 22.1],
  'DE-20': [[1988, 742], [1901, 655], [1861, 615], [1923, 677], [1937, 691], [1877, 631], 23.3],
};
export const PUERTA_DE_COMUN = { brida: 4.0, fondo_cuerpo: 42.0, fondo_rebaje: 42.0,
  pared: 4.0 };
export const PUERTA_OUTBOUND = 'DE-20';

// Las cotas de una puerta de Outbound, con nombre, como [alto, ancho].
export function puertaDe(modelo) {
  const [marco, hoja, interior, cuerpo, rebaje, paso, peso] = PUERTA_DE[modelo];
  const pared = PUERTA_DE_COMUN.pared;
  return { ...PUERTA_DE_COMUN, modelo, marco, hoja, interior, cuerpo, rebaje, paso,
    libre: [interior[0] - 2 * pared, interior[1] - 2 * pared], peso };
}

// el paso del muro, de lo que la puerta pide, centrado entre los altos
const PASO_PUERTA = puertaDe(PUERTA_OUTBOUND).paso[1];
const CENTRO_PUERTA = (FIN_COMEDOR + CAMA_PIES) / 2.0;
export const PUERTA_CAJA_X = [CENTRO_PUERTA - PASO_PUERTA / 2.0,
  CENTRO_PUERTA + PASO_PUERTA / 2.0];

// --- baño ----------------------------------------------------------------
// R32 El baño va en el costado de la cocina, entre la encimera y la cama: de
//     x -600 a 885 de fuera a fuera, con tabiques de 34. Por dentro mide 1417
//     de largo y 750 de ancho, del costado a la cara de dentro del tabique de
//     la puerta (R92), que va de y 401 a 435.
// R70 La esquina de fuera del lado de la cocina se corta a 45 grados en los
//     ultimos 100: es la que se lleva los golpes al pasar a la cocina. El corte
//     entra 71 en un tabique de 34, asi que se lleva tambien la esquina de
//     dentro, y los dos tabiques de esa esquina son una pieza sola con sus
//     dos ingletes.
// R10 La puerta de paso es una hoja de metacrilato traslucido con marco de 40,
//     que llega hasta 80 del techo. Las bisagras van en el canto de la cocina
//     y abre hacia el pasillo, que hacia dentro barreria la ducha (R62).
// R105 El hueco mide 470 y arranca a 100 del marco de la esquina, que es lo que
//      necesita el chaflan: de x -426 a 44. Asi el marco acaba justo donde se
//      queda la puerta de la ducha abierta (R103), que apoya en el tabique y
//      en el canto del marco en vez de en la hoja.
// El marco vuela 12 por dentro del baño: lo que llega al tabique de la puerta
// se queda 16 antes (R71).
export const BANO = {
  x: [-600.0, 885.0],
  y_muro: 435.0,            // cara de dentro del tabique de la puerta
  y_fondo: COSTADO_COCINA,  // el muro de la caja
  espesor: 34.0,
  chaflan: 100.0,
  puerta_x: [-426.0, 44.0],
  puerta_alto: ALTO_INTERIOR - PISO - 80.0,
  retranqueo: 16.0,
};
export const MARCO_PUERTA_BANO = 40.0;
// R102 La ventilacion del baño sigue saliendo por su ventana, que abre; la luz
//      de arriba llega por la claraboya del techo (R110).

// R103 Dentro del baño, una puerta giratoria hace de ducha:
//      - Una puerta de 50 de grueso, paralela a la pared de la caja y a 150 de
//        ella, entre dos columnas. Por la cara del baño lleva el lavabo, con su
//        grifo y un espejo encima, y por la de la pared la alcachofa. Asi es la
//        ducha cerrada.
//      - Gira 90 grados sobre una bisagra, un cilindro de 50 de suelo a techo,
//        hasta quedar perpendicular a la pared. Asi es la ducha abierta: la
//        alcachofa mira al plato y el lavabo a la zona del inodoro.
//      - Su largo lo pone el ancho del baño: abierta llega hasta el tabique de
//        la puerta con 5 de holgura, asi que son 750 - 150 - 50 - 5 = 545. Va
//        de 5 por encima del plato a 5 del techo.
//      - El plato va de la columna de la cocina a la bisagra y de la pared al
//        retranqueo del marco: 700 x 734, plano y sin reborde, que la puerta
//        lo barre por encima. Abierta se queda de canto contra la plataforma.
//      - Al otro lado, una plataforma de 200 sobre el suelo, de la bisagra al
//        tabique de la cama y de la puerta al retranqueo del marco, con el
//        inodoro encima, de espaldas a la cama.
//      - Entre la bisagra y el tabique de la cama, contra la pared, un armario
//        que con sus puertas tiene el fondo de la linea de la puerta, 200, y
//        que remata con la tapa del inodoro: 50 + 200 + 470 = 720. Sus puertas
//        arrancan en la plataforma, que tapa lo de abajo.
//      - Sin alto: de la plataforma al techo quedan 1850.
//      La ducha cerrada y la abierta van en dos componentes, ducha_cerrada y
//      ducha_abierta, para enseñar una u otra.
// R103b Las dos columnas son de baldas, de la pared de la caja a la cara de la
//       puerta, cerradas por un lado con un tablero:
//       - La de la cocina, de 100 de ancho, se cierra por delante, la cara que
//         da al baño, a ras de la puerta. Sus baldas abren hacia el hueco de
//         detras de la puerta, que con la ducha abierta es ducha: son para los
//         botes.
//       - La de la derecha arranca en el armario, a 720, y llega al techo.
//         Tiene 68 de ancho y se cierra del lado de la ducha, con el tablero
//         pegado a la bisagra; sus baldas abren hacia el inodoro.
//       - El armario se mete por debajo de ella hasta ese mismo tablero, asi
//         que de la bisagra al tabique de la cama hay una sola pared: con la
//         ducha abierta es la pared del hueco de detras de la puerta.
//       Las baldas van cada 300.
// R103c El inodoro va centrado entre las puertas del armario y el tabique del
//       pasillo: quedan 76 a cada lado.
export const DUCHA_GIRATORIA = {
  hueco_pared: 150.0,      // de la pared de la caja a la puerta
  grueso: 50.0,            // puerta, columnas y bisagra
  holgura: 5.0,            // de la puerta al plato, al techo y al tabique
  columna_izq: 100.0,      // la del tabique de la cocina, a lo largo
  columna_der: 68.0,       // la de encima del armario, con su cierre
  balda_paso: 300.0,
  plato: 40.0,
  plataforma: 200.0,
  // en la puerta, contado desde el eje de la bisagra
  lavabo: { centro: 320.0, ancho: 400.0, vuelo: 150.0, alto: 100.0, borde: 860.0 },
  espejo: { ancho: 400.0, z: [1150.0, 1750.0], grueso: 5.0 },
  alcachofa: { centro: 340.0, vuelo: 95.0, diametro: 100.0, z: 1925.0 },
};

// R88 El inodoro es un Separett Tiny 1270-03, separador de orina con bidon y
//     tapa de intimidad: polipropileno blanco, 8,5 kg, aguanta 150 kg. Bidon de
//     orina de 7,5 l y cubo de solidos de 14,5 l. Ventilador de 12 V y 1,6 W,
//     con tubo de 50 que hay que sacar afuera.
// R104 Se dibuja con su forma, con las cotas del catalogo: 398 de ancho y 497
//      de fondo, de la pared al frente, con 470 de alto con la tapa cerrada y
//      el asiento a 443. En planta es una D: la espalda recta contra la pared,
//      con las esquinas redondeadas, y el frente en semicirculo del ancho
//      entero. De abajo arriba, como en las fotos del manual de instalacion:
//        - un zocalo de 40, metido 20, que por detras deja un hueco de 100 para
//          la salida del ventilador
//        - el cuerpo, hasta el aro del asiento
//        - el aro, de 23, que vuela 4
//        - la tapa, de 27, con la bisagra en una regleta de 30 a lo ancho de la
//          espalda
//        - el tubo de ventilacion, de 50, que sale por debajo de la espalda y
//          baja por la plataforma hasta el suelo de la casa
export const INODORO = { modelo: 'Separett Tiny 1270-03',
  ancho: 398.0, fondo: 497.0, alto: 470.0,
  asiento_alto: 443.0, tapa: 27.0, ventilacion: 50.0,
  radio_espalda: 40.0, zocalo: 40.0, zocalo_dentro: 20.0,
  hueco_ventilador: 100.0, aro: 23.0, aro_vuelo: 4.0,
  regleta: 30.0, salida_ventilacion: 50.0,
  orina_litros: 7.5, solidos_litros: 14.5 };

// --- ventanas ------------------------------------------------------------
// R90 Las ventanas son de Outbound, serie RA: abatibles, con el marco pintado
//     (R114) y doble acristalamiento de acrilico. Las cotas son las de su hoja de
//     medidas (outbound.eu, "Window dimensions and weights"), en mm y con la
//     letra que usa el fabricante. A es el alto y B el ancho.
//       marco      A x B    la brida de fuera, de 4 (G), que monta sobre el panel
//       hoja       D x E    la hoja abatible, con 20 de canto (F) alrededor del
//                           cristal
//       cuerpo     K x M    el escalon de fuera del cuerpo, 40 de fondo (H), que
//                           entra en el rebaje del hueco
//       interior   J x L    el escalon de dentro, el que se ve desde la casa
//     El hueco en la pared es escalonado: un rebaje de A x B y 42 de fondo desde
//     fuera, y de ahi a dentro un paso de 30 menos por lado. Estan en la tabla
//     de corte del fabricante como 'rebaje' y 'paso'.
export const OUTBOUND = {
  // modelo: (marco A, B), (hoja D, E), (interior J, L), (cuerpo K, M),
  //         (rebaje A, B), (paso D, C), peso en kg
  'RA-03': [[453, 583], [368, 498], [325, 455], [385, 515], [395, 525], [335, 465], 6.1],
  'RA-03V': [[583, 453], [498, 368], [455, 325], [515, 385], [525, 395], [465, 335], 6.1],
  'RA-05': [[375, 780], [287, 697], [256, 659], [316, 719], [326, 729], [266, 669], 6.8],
  'RA-05V': [[780, 375], [697, 287], [659, 256], [719, 316], [729, 326], [669, 266], 6.8],
  'RA-10': [[452, 780], [367, 697], [336, 659], [396, 719], [406, 729], [346, 669], 7.9],
  'RA-20': [[525, 771], [437, 687], [400, 649], [460, 709], [470, 719], [410, 659], 9.0],
  'RA-30': [[622, 722], [537, 637], [500, 603], [560, 663], [570, 673], [510, 613], 9.7],
  'RA-35': [[525, 1113], [437, 1027], [395, 985], [455, 1045], [465, 1055], [405, 995], 12.8],
  'RA-40': [[722, 1113], [637, 1027], [600, 993], [660, 1053], [670, 1063], [610, 1003], 17.5],
  'RA-42': [[620, 1310], [533, 1227], [495, 1185], [555, 1245], [565, 1255], [505, 1195], 17.7],
  'RA-50': [[671, 1825], [587, 1737], [551, 1705], [611, 1765], [621, 1775], [561, 1715], 26.9],
};
export const OUTBOUND_COMUN = { brida: 4.0, canto_hoja: 20.0, fondo_cuerpo: 40.0,
  fondo_rebaje: 42.0 };

// Las cotas de un modelo de Outbound, con nombre, como [alto, ancho].
export function ventanaRa(modelo) {
  const [marco, hoja, interior, cuerpo, rebaje, paso, peso] = OUTBOUND[modelo];
  return { ...OUTBOUND_COMUN, modelo, marco, hoja, interior, cuerpo, rebaje, paso, peso };
}

// R96 Todas las ventanas llevan persiana de Outbound, serie CH. Es combinada:
//     oscurecedor que baja de arriba y mosquitera que sube de abajo, cada uno
//     en su cajon. Va por dentro, atornillada al paramento y centrada sobre el
//     escalon de dentro de la ventana, y cada RA lleva la CH de su numero. Las
//     cotas son las de su hoja de medidas (outbound.eu, "Roller blind
//     dimensions and weights"), en mm y con la letra del fabricante:
//       A x B   alto y ancho de fuera
//       C       fondo, lo que vuela desde el paramento
//       D       alto del cajon de arriba. El de abajo se toma igual, como sale
//               en el dibujo
//       E       ancho de las guias de los lados
//     El manual pide un muro de 55 a 70 con persiana, y el nuestro es de 65.
//     Sobre el hueco de paso la persiana sobra 73.5 por arriba y por abajo en
//     la RA-42 y la RA-35, y 76.5 en la RA-03.
export const PERSIANA_CH = {
  // modelo: alto A, ancho B, peso en kg
  'CH-03': [488, 509, 3.2], 'CH-05': [408, 711, 3.4],
  'CH-10': [488, 707, 3.5], 'CH-20': [552, 697, 3.6],
  'CH-30': [652, 651, 3.4], 'CH-35': [552, 1041, 4.8],
  'CH-40': [752, 1041, 5.2], 'CH-42': [652, 1238, 5.7],
  'CH-48': [1120, 1220, 6.0], 'CH-50': [703, 1753, 7.8],
};
export const PERSIANA_COMUN = { fondo: 48.0, cajon: 95.0, guia: 47.0 };
export const HOLGURA_PERSIANA = 5.0;

// La persiana CH que va con una ventana RA, con nombre (R96).
export function persianaCh(modeloVentana) {
  const modelo = modeloVentana.replace('RA-', 'CH-');
  const [alto, ancho, peso] = PERSIANA_CH[modelo];
  return { ...PERSIANA_COMUN, modelo, fuera: [alto, ancho], peso };
}

// Lo que la persiana sobresale por encima y por debajo del paso (R96).
export function sobraPersiana(modeloVentana) {
  return (persianaCh(modeloVentana).fuera[0] - ventanaRa(modeloVentana).paso[0]) / 2.0;
}

// R93 Cada ventana coge el modelo que le va por tamaño y por sitio, y todas
//     las de un costado rematan a la misma cota: la persiana de las grandes
//     queda 4.5 por debajo de donde arrancan los altos de la cocina en un
//     costado y el del comedor en el otro (R80). Asi el paso acaba en 1600 en
//     el de la cocina y en 1672 en el de la puerta. Lo que manda es el hueco
//     de paso, y a lo ancho cada ventana va
//     centrada en lo suyo:
//       cocina      RA-35, entre la trasera y el baño (R9). Su persiana queda
//                   125.5 sobre la vitro (R96b)
//       baño        RA-03, contra el tabique de la cama, con su persiana a 5
//                   de el (R96). Remata con las de su pared (R98)
//       perros      RA-35, en el largo de la cama, sobre la colchoneta
//       comedor     RA-42, en el largo del sofa (R60)
//       almohadas   RA-35, centrada en x 1546.1, con el alfeizar 197 sobre el
//                   colchon y la persiana por encima de las almohadas
//     La rampa no lleva ventana (R54).
export const HOLGURA_PERSIANA_ALTO = 4.5;
export const VENTANAS = [
  // nombre, componente, pared, modelo
  ['ventana de la cocina', 'ventana_cocina', 'ancho+', 'RA-35'],
  ['ventana del baño', 'ventana_bano', 'ancho+', 'RA-03'],
  ['ventana de los perros', 'ventana_perros', 'ancho+', 'RA-35'],
  ['ventana del comedor', 'ventana_comedor', 'ancho-', 'RA-42'],
  ['ventana de las almohadas', 'ventana_almohadas', 'ancho-', 'RA-35'],
];
export const VENTANA_ALMOHADAS_X = 1546.1;

// El dintel de las ventanas de un costado, de donde arrancan sus altos.
export function dintelVentanas(arranqueAltos) {
  return arranqueAltos - HOLGURA_PERSIANA_ALTO - sobraPersiana('RA-35');
}

// --- techo ---------------------------------------------------------------
// R22 Cuatro placas solares Trina Vertex S+ 455 W de 1762 x 1134 x 30 mm,
//     montadas en horizontal sobre el techo, dos delante y dos detras, con el
//     lado largo en el sentido de la marcha.
export const PLACA = { modelo: 'Trina Vertex S+ 455 W', largo: 1762.0, ancho: 1134.0,
  grueso: 30.0, potencia_w: 455.0, unidades: 4 };
// R23 En la banda central del techo, entre las placas, un aire acondicionado
//     Dometic FreshJet FJZ7 2600, centrado en la caja.
export const AIRE = { modelo: 'Dometic FreshJet FJZ7 2600', largo: 752.0, ancho: 702.0,
  alto: 225.0, hueco: 400.0, techo_admitido: [25.0, 60.0] };
export const AIRE_X = 0.0;

// R110 Al otro lado, sobre el baño, una claraboya Carbest Panorama 70x50:
//      doble cristal de seguridad tintado, con oscurecedor y mosquitera, LED y
//      apertura a 60 grados con muelles de gas. El corte en el techo es de
//      700 x 500 y la unidad, casi todo ella vidrio, mide 702 x 502 de fuera
//      con 98 de altura. Va centrada en el ancho del plato de la ducha
//      (R103), corrida 100 hacia el centro para que el hueco no llegue al
//      marco de la puerta; la ventilacion del baño sigue siendo la de su
//      ventana (R102).
export const CLARABOYA = { modelo: 'Carbest Panorama 70x50', corte: [700.0, 500.0],
  fuera: [702.0, 502.0], alto: 98.0,
  y_centro: (BANO.y_muro + BANO.retranqueo + COSTADO_COCINA) / 2.0 - 100.0 };

// --- fuera del proyecto --------------------------------------------------
// R21 Descartados, o para mas adelante.
export const FUERA = {
  trampilla_elevadora: 'descartada',
  escalera_puerta_lateral: 'descartada',
  toldo_lateral: 'descartado',
  cofre_de_gas: 'descartado',
  ducha_exterior: 'descartada',
  escalera_al_techo: 'descartada',
  boca_de_agua: 'descartada',
  toma_220: 'descartada',
  portezuela_de_servicio: 'descartada',
  baca: 'descartada',
  remates: 'descartados',
  pared_trasera: 'sin pared: el plano lo cubren la rampa y su tapa ciega',
  climatizador: 'descartado',
  ventilador_de_techo: 'descartado',
  presurizador: 'para mas adelante',
  deposito_de_agua_limpia: 'descartado',
  deposito_de_aguas_grises: 'descartado',
  cupula_de_satelite: 'descartada',
  antena: 'descartada',
  focos_de_baca: 'descartados',
  escalerilla_de_arena: 'descartada',
  luces_de_gabarito: 'descartadas',
  asidero_de_la_puerta: 'descartado',
};
