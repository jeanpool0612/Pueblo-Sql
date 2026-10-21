/* =====================================================
   DATOS DEL JUEGO  ·  Aquí se edita TODO el contenido:
   - TABLAS: los datos del pueblo
   - MISIONES: lo que piden los vecinos
   No hace falta tocar juego.js para añadir misiones.
   ===================================================== */

// Cada tabla: columnas, filas, cómo se dibuja cada fila (icono) y qué texto lleva debajo (etiqueta)
const TABLAS = {
  vecinos: {
    columnas: ["id", "nombre", "oficio", "edad"],
    filas: [
      { id: 1, nombre: "Marta",  oficio: "panadero",   edad: 34 },
      { id: 2, nombre: "Luis",   oficio: "agricultor", edad: 52 },
      { id: 3, nombre: "Ana",    oficio: "herrero",    edad: 29 },
      { id: 4, nombre: "Pedro",  oficio: "agricultor", edad: 61 },
      { id: 5, nombre: "Lucía",  oficio: "medico",     edad: 45 },
      { id: 6, nombre: "Sergio", oficio: "pescador",   edad: 38 },
      { id: 7, nombre: "Rosa",   oficio: "agricultor", edad: 41 },
      { id: 8, nombre: "Carmen", oficio: "maestro",    edad: 33 }
    ],
    icono: f => ({ panadero: "🧑‍🍳", agricultor: "🧑‍🌾", herrero: "🥷", medico: "🧑‍⚕️", pescador: "👳", maestro: "🧑‍🏫" }[f.oficio]),
    etiqueta: "nombre"
  },
  parcelas: {
    columnas: ["id", "zona", "cultivo", "dias_sin_regar"],
    filas: [
      { id: 101, zona: "norte", cultivo: "trigo",     dias_sin_regar: 6 },
      { id: 102, zona: "norte", cultivo: "maiz",      dias_sin_regar: 2 },
      { id: 103, zona: "norte", cultivo: "ninguno",   dias_sin_regar: 0 },
      { id: 104, zona: "norte", cultivo: "trigo",     dias_sin_regar: 9 },
      { id: 105, zona: "sur",   cultivo: "tomate",    dias_sin_regar: 1 },
      { id: 106, zona: "sur",   cultivo: "ninguno",   dias_sin_regar: 0 },
      { id: 107, zona: "sur",   cultivo: "zanahoria", dias_sin_regar: 5 },
      { id: 108, zona: "sur",   cultivo: "trigo",     dias_sin_regar: 7 }
    ],
    icono: f => ({ trigo: "🌾", maiz: "🌽", tomate: "🍅", zanahoria: "🥕", ninguno: "🟫" }[f.cultivo]),
    etiqueta: "id"
  },
  casas: {
    columnas: ["id", "calle", "habitantes", "color"],
    filas: [
      { id: 201, calle: "Mayor", habitantes: 4, color: "roja" },
      { id: 202, calle: "Mayor", habitantes: 1, color: "azul" },
      { id: 203, calle: "Mayor", habitantes: 3, color: "verde" },
      { id: 204, calle: "Sol",   habitantes: 5, color: "roja" },
      { id: 205, calle: "Sol",   habitantes: 2, color: "azul" },
      { id: 206, calle: "Mayor", habitantes: 2, color: "roja" },
      { id: 207, calle: "Luna",  habitantes: 3, color: "verde" },
      { id: 208, calle: "Luna",  habitantes: 6, color: "azul" }
    ],
    icono: f => "🏠",
    etiqueta: "id"
  }
};

// Cada misión: qué se pregunta, qué consulta es la correcta (solucion) y qué pistas se dan.
// "ordenado: true" significa que además importa el ORDEN de las filas.
const MISIONES = [
  { titulo: "Conoce a los vecinos", tabla: "vecinos", npc: "🧓",
    pregunta: "¡Hola! Soy el alcalde y quiero conocer a todos mis vecinos. ¡Muéstramelos!",
    inicio: "", solucion: "SELECT * FROM vecinos",
    pistas: ["Para ver datos se usa SELECT. El asterisco * significa «todas las columnas».",
             "Después de SELECT * hay que decir de qué tabla: FROM y el nombre de la tabla.",
             "Escríbelo así: SELECT * FROM vecinos"] },

  { titulo: "Las parcelas con sed", tabla: "parcelas", npc: "👩‍🌾",
    pregunta: "Mis plantas tienen sed. ¿Qué parcelas llevan más de 3 días sin regar?",
    inicio: "SELECT * FROM parcelas WHERE ", solucion: "SELECT * FROM parcelas WHERE dias_sin_regar > 3",
    pistas: ["Quieres filas de la tabla parcelas, así que necesitas SELECT * FROM parcelas.",
             "Para quedarte solo con algunas filas se añade WHERE y una condición sobre una columna.",
             "La condición compara dias_sin_regar con 3 usando el operador > (mayor que)."] },

  { titulo: "Casas de la calle Mayor", tabla: "casas", npc: "🧑‍🔧",
    pregunta: "Voy a repartir el correo. Necesito las casas de la calle Mayor donde vivan más de 2 personas.",
    inicio: "SELECT * FROM casas WHERE ", solucion: "SELECT * FROM casas WHERE calle = 'Mayor' AND habitantes > 2",
    pistas: ["Hay dos condiciones a la vez. Se unen con AND (las dos tienen que cumplirse).",
             "Los textos van entre comillas simples: calle = 'Mayor'.",
             "calle = 'Mayor' AND habitantes > 2"] },

  { titulo: "Del más joven al mayor", tabla: "vecinos", npc: "👩‍🏫", ordenado: true,
    pregunta: "Quiero hacer la foto del pueblo. Ordena a los vecinos de menor a mayor edad.",
    inicio: "SELECT * FROM vecinos ", solucion: "SELECT * FROM vecinos ORDER BY edad",
    pistas: ["Para ordenar se usa ORDER BY al final de la consulta.",
             "ORDER BY va seguido de la columna por la que ordenas: edad.",
             "ORDER BY edad ordena de menor a mayor. Con DESC iría al revés."] }
];
