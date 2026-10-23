🏘️ Pueblo SQL

Juego web para aprender SQL ayudando a los vecinos de un pueblo.

Los datos son el pueblo: cada vecino, casa o parcela es una fila de una tabla. Los vecinos te piden cosas, tú escribes la consulta y el resultado se ve en el mapa.

👉 Jugar online: https://jeanpool0612.github.io/Pueblo-Sql/

¿Qué se aprende?
Misión	Tema	Comandos
1. Conoce a los vecinos	Ver los datos de una tabla	SELECT, FROM
2. Las parcelas con sed	Filtrar filas	WHERE, operadores (>, <, =…)
3. Casas de la calle Mayor	Combinar condiciones y textos	AND, OR, 'texto'
4. Del más joven al mayor	Ordenar resultados	ORDER BY, ASC, DESC

El juego incluye:

📖 Guía de comandos (mini ventana) con para qué sirve cada uno.
📋 Ver tabla para consultar los datos de la misión.
🦉 3 pistas por misión. Cuantas menos uses, más estrellas ganas (⭐⭐⭐).
Mensajes que explican en qué te has equivocado.
Cómo jugar en tu ordenador

No necesita instalar nada ni un servidor. Descarga o clona el repositorio y abre index.html en el navegador.

bash
git clone https://github.com/jeanpool0612/Pueblo-Sql.git
cd Pueblo-Sql
# abre index.html con doble clic
Estructura del proyecto
Pueblo-Sql/
├── index.html        # Pantalla de inicio (intro y guía)
├── juego.html        # Pantalla del juego
├── css/
│   └── estilo.css    # Todo el aspecto (colores en variables al inicio)
└── js/
    ├── misiones.js   # Tablas del pueblo y misiones  ← aquí se edita el contenido
    ├── motor-sql.js  # Mini intérprete de SQL
    ├── guia.js       # Ventanas emergentes y guía de comandos
    └── juego.js      # Lógica: corrección, pistas, estrellas
Cómo añadir una misión

Abre js/misiones.js y añade un bloque al final de MISIONES:

js
{ titulo: "Los vecinos agricultores", tabla: "vecinos", npc: "🧑‍🌾",
  pregunta: "Necesito hablar con todos los agricultores del pueblo.",
  inicio: "SELECT * FROM vecinos WHERE ",
  solucion: "SELECT * FROM vecinos WHERE oficio = 'agricultor'",
  pistas: ["Pista 1…", "Pista 2…", "Pista 3…"] }

El juego comprueba la respuesta comparando el resultado del jugador con el de solucion, así que no hace falta indicar a mano qué filas son las correctas. Si la misión depende del orden de las filas, añade ordenado: true.

Para añadir una tabla nueva, créala en TABLAS (columnas, filas, icono y etiqueta).

Limitaciones actuales
El motor SQL es propio y solo entiende SELECT … FROM … WHERE … ORDER BY. Está aislado en runQuery() para poder sustituirlo más adelante por sql.js o PGlite (PostgreSQL en el navegador).
Las estrellas se guardan en el navegador (localStorage); no hay cuentas ni servidor.
Hoja de ruta
 Más misiones y mundos (JOIN, GROUP BY, INSERT…).
 Gráficos en pixel art en lugar de emojis.
 Sustituir el mini motor por PostgreSQL real en el navegador.
 Tests automáticos para las misiones.
