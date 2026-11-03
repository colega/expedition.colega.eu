// El aspecto de cada material del modelo, para el visor.
//
// Los colores de la carpinteria, los metales y los vidrios son los de siempre;
// el verde militar y el negro del chasis son los de R29 de cada version.

// color en sRGB de 0 a 255, rugosidad de 0 a 1, metal si es metal, y opacidad
// para los vidrios
export const materiales = (R) => ({
  'Verde militar': { color: R.VERDE_MILITAR, rugosidad: 0.35 },
  'Negro chasis': { color: R.NEGRO_CHASIS, rugosidad: 0.35 },
  'Blanco lacado': { color: [246, 246, 243], rugosidad: 0.3 },
  'Blanco mate': { color: [246, 246, 243], rugosidad: 0.7 },
  'Negro mate': { color: [25, 25, 25], rugosidad: 0.7 },
  'Verde garrafa': { color: [68, 150, 72], rugosidad: 0.7 },
  'Metacrilato': { color: [246, 246, 243], rugosidad: 0.7, opacidad: 0.55 },
  'Esmalte blanco': { color: [246, 246, 243], rugosidad: 0.25 },
  'Gris lacado': { color: [179, 179, 179], rugosidad: 0.25 },
  'Esmalte negro': { color: [25, 25, 25], rugosidad: 0.25 },
  'Tela gris': { color: [120, 120, 118], rugosidad: 0.95 },
  'Tela clara': { color: [181, 150, 116], rugosidad: 0.95 },
  'Roble': { color: [190, 150, 105], rugosidad: 0.6 },
  'Goma': { color: [39, 39, 39], rugosidad: 0.85 },
  'Aluminio': { color: [245, 245, 246], rugosidad: 0.35, metal: true },
  'Aluminio anodizado': { color: [137, 137, 137], rugosidad: 0.55, metal: true },
  'Acero': { color: [160, 160, 160], rugosidad: 0.35, metal: true },
  'Inox': { color: [203, 203, 203], rugosidad: 0.3, metal: true },
  'Cromo': { color: [196, 197, 196], rugosidad: 0.05, metal: true },
  'Vidrio': { color: [108, 196, 218], rugosidad: 0.05, opacidad: 0.35 },
  'Vidrio oscuro': { color: [40, 40, 40], rugosidad: 0.05, opacidad: 0.6 },
  'Fotovoltaico': { color: [48, 59, 150], rugosidad: 0.1, opacidad: 0.9 },
  'Piloto rojo': { color: [196, 53, 39], rugosidad: 0.1, opacidad: 0.8 },
});

// lo que sale sin material, para que se vea que falta
export const SIN_MATERIAL = { color: [255, 0, 255], rugosidad: 0.5 };
