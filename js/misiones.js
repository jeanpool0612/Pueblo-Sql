/* =====================================================
   DATOS DEL JUEGO · aquí se edita TODO el contenido
   - TABLAS:   datos fijos para las misiones de consultas (mundo 1)
   - MISIONES: lo que piden los vecinos, las lecciones y cómo se corrige
   No hace falta tocar juego.js para añadir misiones.
   ===================================================== */

/* ---------- Mundo 1: tablas del pueblo (con icono y etiqueta para dibujar fichas) ---------- */
const TABLAS = {
  vecinos: {
    columnas: ["id", "nombre", "oficio", "edad"],
    filas: [
      { id: 1, nombre: "Marta",  oficio: "panadero",   edad: 34 }, { id: 2, nombre: "Luis",   oficio: "agricultor", edad: 52 },
      { id: 3, nombre: "Ana",    oficio: "herrero",    edad: 29 }, { id: 4, nombre: "Pedro",  oficio: "agricultor", edad: 61 },
      { id: 5, nombre: "Lucía",  oficio: "medico",     edad: 45 }, { id: 6, nombre: "Sergio", oficio: "pescador",   edad: 38 },
      { id: 7, nombre: "Rosa",   oficio: "agricultor", edad: 41 }, { id: 8, nombre: "Carmen", oficio: "maestro",    edad: 33 }
    ],
    icono: f => ({ panadero: "🥖", agricultor: "🧑‍🌾", herrero: "⚒️", medico: "🩺", pescador: "🎣", maestro: "📚" }[f.oficio]),
    etiqueta: "nombre"
  },
  parcelas: {
    columnas: ["id", "zona", "cultivo", "dias_sin_regar"],
    filas: [
      { id: 101, zona: "norte", cultivo: "trigo", dias_sin_regar: 6 }, { id: 102, zona: "norte", cultivo: "maiz", dias_sin_regar: 2 },
      { id: 103, zona: "norte", cultivo: "ninguno", dias_sin_regar: 0 }, { id: 104, zona: "norte", cultivo: "trigo", dias_sin_regar: 9 },
      { id: 105, zona: "sur", cultivo: "tomate", dias_sin_regar: 1 }, { id: 106, zona: "sur", cultivo: "ninguno", dias_sin_regar: 0 },
      { id: 107, zona: "sur", cultivo: "zanahoria", dias_sin_regar: 5 }, { id: 108, zona: "sur", cultivo: "trigo", dias_sin_regar: 7 }
    ],
    icono: f => ({ trigo: "🌾", maiz: "🌽", tomate: "🍅", zanahoria: "🥕", ninguno: "🟫" }[f.cultivo]),
    etiqueta: "id"
  },
  casas: {
    columnas: ["id", "calle", "habitantes", "color"],
    filas: [
      { id: 201, calle: "Mayor", habitantes: 4, color: "roja" }, { id: 202, calle: "Mayor", habitantes: 1, color: "azul" },
      { id: 203, calle: "Mayor", habitantes: 3, color: "verde" }, { id: 204, calle: "Sol", habitantes: 5, color: "roja" },
      { id: 205, calle: "Sol", habitantes: 2, color: "azul" }, { id: 206, calle: "Mayor", habitantes: 2, color: "roja" },
      { id: 207, calle: "Luna", habitantes: 3, color: "verde" }, { id: 208, calle: "Luna", habitantes: 6, color: "azul" }
    ],
    icono: f => "🏠", etiqueta: "id"
  }
};

/* ---------- Ayudas para corregir las misiones de construcción ---------- */
const col = (t, n) => t.columnas.find(c => c.nombre === n);
const esTipo = (t, n, tipo, ...arg) => { const c = col(t, n); return !!c && c.tipo === tipo && arg.every((a, i) => c.arg[i] === a); };
const hayError = (sal, re) => sal.some(o => o.tipo === "error" && re.test(o.msg));
const mismo = (a, b) => a.length === b.length && a.every(x => b.includes(x));

// Estados iniciales (se ejecutan como SQL antes de empezar la misión)
const BASE_CLIENTES = `CREATE TABLE clientes (codcliente INT AUTO_INCREMENT PRIMARY KEY, dni VARCHAR(9) UNIQUE NOT NULL, nombre VARCHAR(25));
INSERT INTO clientes (dni, nombre) VALUES ('12345678A', 'Pepe');
CREATE TABLE articulos (cod INT PRIMARY KEY, nombre VARCHAR(20), precio DECIMAL(11,2));
INSERT INTO articulos VALUES (100, 'Tornillo', 3.5);`;
const BASE_COMPRA = `CREATE TABLE compra (cod_cli INT NOT NULL, cod_art INT NOT NULL, cantidad INT NOT NULL, fecha_compra DATE NOT NULL,
  CONSTRAINT compra_pk PRIMARY KEY (cod_cli, cod_art),
  CONSTRAINT cli_fk FOREIGN KEY (cod_cli) REFERENCES clientes(codcliente),
  CONSTRAINT art_fk FOREIGN KEY (cod_art) REFERENCES articulos(cod));
INSERT INTO compra VALUES (1, 100, 245, '2013-03-28');`;

/* ---------- Misiones ----------
   Mundo 1 (consultas): tabla + solucion → se compara el resultado con el de la solución.
   Mundos 2 y 3 (construir): preparar (SQL inicial) + comprobar(db, salidas) → devuelve null si está bien, o un texto con el fallo.
   Campos: titulo, mundo, npc, pregunta, inicio, pistas[3], leccion (HTML), seguir (continuar tras un error), ordenado. */
const MISIONES = [
  /* ===== MUNDO 1 · CONSULTAS ===== */
  { mundo: "Mundo 1 · Consultas", titulo: "Conoce a los vecinos", tabla: "vecinos", npc: "🧓",
    pregunta: "¡Hola! Soy el alcalde y quiero conocer a todos mis vecinos. ¡Muéstramelos!",
    inicio: "", solucion: "SELECT * FROM vecinos",
    leccion: `<p><b>SQL</b> (Structured Query Language) es el lenguaje estándar de las bases de datos relacionales (MySQL, PostgreSQL, SQL Server…). No sirve solo para consultar: también <b>define, controla y gestiona</b> la base de datos. Se divide en sublenguajes:</p>
      <table><tr><th>Sigla</th><th>Sirve para</th><th>Comandos</th></tr>
      <tr><td>DDL</td><td>Definir tablas y relaciones</td><td>CREATE, ALTER, DROP</td></tr>
      <tr><td>DML</td><td>Consultar y manipular datos</td><td>SELECT, INSERT, UPDATE, DELETE</td></tr>
      <tr><td>DCL</td><td>Permisos y seguridad</td><td>GRANT, REVOKE</td></tr>
      <tr><td>TCL</td><td>Transacciones</td><td>COMMIT, ROLLBACK</td></tr></table>
      <p>Ahora empiezas con DML: <b>SELECT</b> elige columnas (* = todas) y <b>FROM</b> dice de qué tabla.</p>`,
    pistas: ["Para ver datos se usa SELECT. El asterisco * significa «todas las columnas».",
             "Después de SELECT * hay que decir de qué tabla: FROM y el nombre de la tabla.", "Escríbelo así: SELECT * FROM vecinos"] },

  { mundo: "Mundo 1 · Consultas", titulo: "Las parcelas con sed", tabla: "parcelas", npc: "👩‍🌾",
    pregunta: "Mis plantas tienen sed. ¿Qué parcelas llevan más de 3 días sin regar?",
    inicio: "SELECT * FROM parcelas WHERE ", solucion: "SELECT * FROM parcelas WHERE dias_sin_regar > 3",
    leccion: `<p><b>WHERE</b> filtra: solo se quedan las filas que cumplen una condición. Operadores: <code>=  &gt;  &lt;  &gt;=  &lt;=  &lt;&gt;</code> (distinto).</p>`,
    pistas: ["Quieres filas de la tabla parcelas, así que necesitas SELECT * FROM parcelas.",
             "Para quedarte solo con algunas filas se añade WHERE y una condición sobre una columna.",
             "La condición compara dias_sin_regar con 3 usando el operador > (mayor que)."] },

  { mundo: "Mundo 1 · Consultas", titulo: "Casas de la calle Mayor", tabla: "casas", npc: "🧑‍🔧",
    pregunta: "Voy a repartir el correo. Necesito las casas de la calle Mayor donde vivan más de 2 personas.",
    inicio: "SELECT * FROM casas WHERE ", solucion: "SELECT * FROM casas WHERE calle = 'Mayor' AND habitantes > 2",
    leccion: `<p><b>AND</b>: se cumplen las dos condiciones. <b>OR</b>: basta una. Los <b>textos</b> van entre comillas simples rectas ('Mayor') y los números sin comillas.</p>`,
    pistas: ["Hay dos condiciones a la vez. Se unen con AND (las dos tienen que cumplirse).",
             "Los textos van entre comillas simples: calle = 'Mayor'.", "calle = 'Mayor' AND habitantes > 2"] },

  { mundo: "Mundo 1 · Consultas", titulo: "Del más joven al mayor", tabla: "vecinos", npc: "👩‍🏫", ordenado: true,
    pregunta: "Quiero hacer la foto del pueblo. Ordena a los vecinos de menor a mayor edad.",
    inicio: "SELECT * FROM vecinos ", solucion: "SELECT * FROM vecinos ORDER BY edad",
    leccion: `<p><b>ORDER BY</b> ordena el resultado: <code>ASC</code> (por defecto) de menor a mayor, <code>DESC</code> de mayor a menor.</p>`,
    pistas: ["Para ordenar se usa ORDER BY al final de la consulta.", "ORDER BY va seguido de la columna por la que ordenas: edad.",
             "ORDER BY edad ordena de menor a mayor. Con DESC iría al revés."] },

  /* ===== MUNDO 2 · CONSTRUIR TABLAS (DDL) ===== */
  { mundo: "Mundo 2 · Construir tablas", titulo: "Funda el pueblo", npc: "🧓",
    pregunta: "El pueblo aún no existe. Crea la base de datos «pueblo» con juego de caracteres utf8 y empieza a usarla.",
    inicio: "-- 1) crea la base de datos\n\n-- 2) empieza a usarla\n",
    solucion: "CREATE DATABASE pueblo CHARACTER SET utf8;\nUSE pueblo;",
    leccion: `<p>Ahora pasas a <b>DDL</b>: construir la estructura.</p>
      <code>CREATE DATABASE [IF NOT EXISTS] nombre<br>[CHARACTER SET utf8] [COLLATE utf8_general_ci];</code>
      <p><b>DATABASE</b> y <b>SCHEMA</b> son sinónimos. <b>IF NOT EXISTS</b> la crea solo si no existe. <b>CHARACTER SET</b> es el juego de caracteres (utf8, latin1…) y <b>COLLATE</b> cómo se ordenan y comparan (¿Á = á?). Con <b>USE nombre</b> la haces la base activa.</p>`,
    pistas: ["La sentencia empieza por CREATE DATABASE seguida del nombre: pueblo.", "El juego de caracteres se añade con CHARACTER SET utf8.", "Termina cada sentencia con ; y escribe después USE pueblo;"],
    comprobar: (db) => !db.bases.pueblo ? "Falta crear la base de datos «pueblo»." : db.bases.pueblo.charset !== "utf8" ? "La base existe, pero su juego de caracteres debe ser utf8 (CHARACTER SET utf8)." : db.usando !== "pueblo" ? "Falta activarla con USE pueblo;" : null },

  { mundo: "Mundo 2 · Construir tablas", titulo: "Registro de vecinos", npc: "👩‍💼",
    pregunta: "Necesito una tabla VECINOS con: dni (texto de 9), nombre (texto de 20) y apellido1 (texto de 15). Después enséñame su estructura.",
    inicio: "", solucion: "CREATE TABLE vecinos (dni VARCHAR(9), nombre VARCHAR(20), apellido1 VARCHAR(15));\nDESCRIBE vecinos;",
    leccion: `<code>CREATE TABLE NombreTabla (<br>&nbsp; columna1 tipo1 restricciones,<br>&nbsp; columna2 tipo2 restricciones<br>);</code>
      <p>Crea la <b>estructura</b> (no los datos). Reglas del nombre: empieza por <b>letra</b>, máx. <b>64</b> caracteres, solo letras, números y <b>_</b>, sin espacios ni palabras reservadas. Convención: tablas en MAYÚSCULAS y plural; campos en minúscula y singular.</p>
      <p><b>DESCRIBE tabla</b> muestra su estructura. Para meter datos: <code>INSERT INTO t (c1, c2) VALUES ('a', 'b');</code></p>`,
    pistas: ["Empieza con CREATE TABLE vecinos ( … ); y dentro, cada columna con su tipo separada por comas.", "VARCHAR(N) es texto de hasta N caracteres: dni VARCHAR(9).", "Para ver la estructura escribe DESCRIBE vecinos; después de crearla."],
    comprobar: (db, sal) => { const t = db.tablas.vecinos; if (!t) return "Falta la tabla VECINOS.";
      return !esTipo(t, "dni", "varchar", 9) || !esTipo(t, "nombre", "varchar", 20) || !esTipo(t, "apellido1", "varchar", 15) ? "Revisa las columnas: dni VARCHAR(9), nombre VARCHAR(20), apellido1 VARCHAR(15)."
        : !sal.some(o => o.tipo === "tabla" && o.columnas[0] === "Field") ? "Falta DESCRIBE vecinos; para ver la estructura." : null; } },

  { mundo: "Mundo 2 · Construir tablas", titulo: "Claves y restricciones", npc: "👩‍💼",
    preparar: "CREATE TABLE vecinos (dni VARCHAR(9), nombre VARCHAR(20));",
    pregunta: "La tabla VECINOS está mal hecha. Bórrala y créala de nuevo: cod (entero, clave primaria), dni (texto 9, sin repetidos), nombre (texto 20, obligatorio) y apellido1 (texto 15, obligatorio). Inserta a Sara Villanueva (cod 1, dni '12345678Q').",
    inicio: "", seguir: false,
    solucion: "DROP TABLE vecinos;\nCREATE TABLE vecinos (cod INT PRIMARY KEY, dni VARCHAR(9) UNIQUE, nombre VARCHAR(20) NOT NULL, apellido1 VARCHAR(15) NOT NULL);\nINSERT INTO vecinos VALUES (1, '12345678Q', 'Sara', 'Villanueva');",
    leccion: `<p>Una <b>restricción</b> es una regla extra sobre una columna. Las de <b>tipo 1</b> se escriben justo después del tipo:</p>
      <table><tr><td><code>NOT NULL</code></td><td>obligatoria, no admite nulos</td></tr>
      <tr><td><code>PRIMARY KEY</code></td><td>no nula y sin duplicados; solo una por tabla</td></tr>
      <tr><td><code>UNIQUE</code></td><td>no permite valores repetidos (clave candidata)</td></tr></table>
      <p><b>DROP TABLE nombre</b> borra una tabla. Puedes darles nombre a las restricciones con <code>CONSTRAINT nombre TIPO (campo)</code>.</p>`,
    pistas: ["Empieza con DROP TABLE vecinos; para borrar la tabla vieja.", "cod INT PRIMARY KEY, dni VARCHAR(9) UNIQUE, y NOT NULL en nombre y apellido1.", "Al final: INSERT INTO vecinos VALUES (1, '12345678Q', 'Sara', 'Villanueva');"],
    comprobar: (db) => { const t = db.tablas.vecinos; if (!t) return "Falta la tabla VECINOS.";
      return !mismo(t.pk, ["cod"]) ? "cod debe ser la clave primaria (PRIMARY KEY)." : !t.uniques.some(u => mismo(u, ["dni"])) ? "dni debe ser UNIQUE."
        : !(col(t, "nombre") || {}).notnull || !(col(t, "apellido1") || {}).notnull ? "nombre y apellido1 deben ser NOT NULL." : !t.filas.length ? "Falta insertar a Sara Villanueva." : null; } },

  { mundo: "Mundo 2 · Construir tablas", titulo: "Casas con contador", npc: "🧑‍🔧",
    pregunta: "Las casas llevarán un número automático. Crea CASAS: id (entero, automático, clave primaria), calle (texto 30) y poblacion (texto 25, por defecto 'Santander'). Inserta la casa de la calle 'Mayor 6' indicando SOLO la calle.",
    inicio: "", solucion: "CREATE TABLE casas (id INT AUTO_INCREMENT PRIMARY KEY, calle VARCHAR(30), poblacion VARCHAR(25) DEFAULT 'Santander');\nINSERT INTO casas (calle) VALUES ('Mayor 6');",
    leccion: `<p><b>AUTO_INCREMENT</b>: entero que se incrementa solo (empieza en 1, +1 por fila); solo para enteros. Sirve de identificador artificial.</p>
      <p><b>DEFAULT valor</b>: valor que se usa si no indicas otro al insertar. También existe <code>DEFAULT CURRENT_TIMESTAMP</code> para la fecha y hora actuales.</p>`,
    pistas: ["id INT AUTO_INCREMENT PRIMARY KEY.", "poblacion VARCHAR(25) DEFAULT 'Santander'.", "INSERT INTO casas (calle) VALUES ('Mayor 6'); — las demás columnas se rellenan solas."],
    comprobar: (db) => { const t = db.tablas.casas; if (!t) return "Falta la tabla CASAS.";
      return !(col(t, "id") || {}).auto || !mismo(t.pk, ["id"]) ? "id debe ser AUTO_INCREMENT y PRIMARY KEY." : (col(t, "poblacion") || {}).def !== "Santander" ? "poblacion debe tener DEFAULT 'Santander'."
        : !t.filas.length ? "Falta insertar la casa 'Mayor 6'." : t.filas[0].id !== 1 || t.filas[0].poblacion !== "Santander" ? "Inserta indicando solo la calle: id y poblacion se rellenan solos." : null; } },

  { mundo: "Mundo 2 · Construir tablas", titulo: "Precios con sentido", npc: "🧑‍🌾", seguir: true,
    pregunta: "En la tienda no se admiten precios de 1 € o menos. Crea ARTICULOS: cod (entero, clave primaria), nombre (texto 20, obligatorio), precio (DECIMAL(11,2), CHECK precio > 1) y fecha_alta (DATETIME obligatoria, por defecto la fecha actual). Inserta un artículo con precio 12 y comprueba que uno con precio 0.12 es rechazado.",
    inicio: "", solucion: "CREATE TABLE articulos (cod INT PRIMARY KEY, nombre VARCHAR(20) NOT NULL, precio DECIMAL(11,2) CONSTRAINT chkprecio CHECK (precio > 1), fecha_alta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP);\nINSERT INTO articulos (cod, nombre, precio) VALUES (100, 'Tornillo', 12);\nINSERT INTO articulos (cod, nombre, precio) VALUES (101, 'Tuerca', 0.12);",
    leccion: `<p><b>CHECK (condición)</b>: el valor debe cumplir una condición, p. ej. <code>precio DEC(11,2) CHECK (precio &gt; 1)</code>. Si no se cumple, el INSERT da error. <code>DEC</code> es sinónimo de <code>DECIMAL</code>.</p>
      <p>Un error no rompe nada: la sentencia se rechaza y el resto sigue. Aquí verás cómo se ve ese rechazo.</p>`,
    pistas: ["precio DECIMAL(11,2) CHECK (precio > 1).", "fecha_alta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP.", "Haz dos INSERT: uno con precio 12 (válido) y otro con 0.12 (será rechazado)."],
    comprobar: (db, sal) => { const t = db.tablas.articulos; if (!t) return "Falta la tabla ARTICULOS.";
      return !t.checks.length ? "Falta el CHECK sobre precio." : (col(t, "fecha_alta") || {}).def !== "__ts" || !(col(t, "fecha_alta") || {}).notnull ? "fecha_alta debe ser NOT NULL con DEFAULT CURRENT_TIMESTAMP."
        : t.filas.length !== 1 ? "Debe haber exactamente un artículo insertado (el de precio 12)." : !hayError(sal, /CHECK/) ? "Falta intentar insertar el artículo con precio 0.12 para ver el rechazo del CHECK." : null; } },

  { mundo: "Mundo 2 · Construir tablas", titulo: "Respeta las reglas", npc: "👩‍💼", seguir: true,
    preparar: "CREATE TABLE clientes (cod_cliente INT PRIMARY KEY, dni VARCHAR(9) UNIQUE, nombre VARCHAR(20) NOT NULL, apellido1 VARCHAR(15) NOT NULL, apellido2 VARCHAR(15) NOT NULL);\nINSERT INTO clientes VALUES (1, '12345678Q', 'Sara', 'Villanueva', 'Rosa');",
    pregunta: "La tabla CLIENTES ya existe y tiene a Sara. Intenta insertar a María con el MISMO dni que Sara (cod 2) para ver el error, y luego inserta correctamente a dos clientes más (cod 2 y cod 3, con dni distintos).",
    inicio: "", solucion: "INSERT INTO clientes VALUES (2, '12345678Q', 'María', 'Camacho', 'Ortega');\nINSERT INTO clientes VALUES (2, '22222222B', 'María', 'Camacho', 'Ortega');\nINSERT INTO clientes VALUES (3, '33333333C', 'Jesús', 'Rodríguez', 'López');",
    leccion: `<p>El INSERT falla cuando rompe una regla:</p><ul><li><b>UNIQUE</b>: valor repetido (dni).</li><li><b>PRIMARY KEY</b>: clave repetida o nula.</li><li><b>NOT NULL</b>: falta un dato obligatorio.</li><li><b>CHECK</b>: no cumple la condición.</li></ul>
      <p>Usa siempre comillas simples <b>rectas</b> <code>'...'</code>; las tipográficas (‘ ’) dan error.</p>`,
    pistas: ["INSERT INTO clientes VALUES (2, '12345678Q', 'María', 'Camacho', 'Ortega'); repite el dni de Sara.", "Después repite el INSERT con otro dni: '22222222B'.", "Añade un tercero con cod 3 y otro dni distinto."],
    comprobar: (db, sal) => db.tablas.clientes.filas.length < 3 ? "Deben quedar al menos 3 clientes en la tabla." : !hayError(sal, /duplicad/i) ? "Falta provocar el error de dni repetido (UNIQUE)." : null },

  /* ===== MUNDO 3 · RELACIONES E INTEGRIDAD ===== */
  { mundo: "Mundo 3 · Relaciones", titulo: "La tabla de compras", npc: "🧑‍🌾",
    preparar: BASE_CLIENTES,
    pregunta: "Ya hay CLIENTES (codcliente) y ARTICULOS (cod). Crea COMPRA: cod_cli, cod_art, cantidad (enteros), fecha_compra (DATE), todo obligatorio. La clave primaria es la pareja (cod_cli, cod_art) y cada una es clave ajena de su tabla. Inserta la compra (1, 100, 245, '2013-03-28').",
    inicio: "", solucion: "CREATE TABLE compra (cod_cli INT NOT NULL, cod_art INT NOT NULL, cantidad INT NOT NULL, fecha_compra DATE NOT NULL, CONSTRAINT compra_pk PRIMARY KEY (cod_cli, cod_art), CONSTRAINT cli_fk FOREIGN KEY (cod_cli) REFERENCES clientes(codcliente), CONSTRAINT art_fk FOREIGN KEY (cod_art) REFERENCES articulos(cod));\nINSERT INTO compra VALUES (1, 100, 245, '2013-03-28');",
    leccion: `<p>Las restricciones de <b>tipo 2</b> se escriben <b>después de todas las columnas</b> y pueden afectar a varias. Son obligatorias para claves compuestas:</p>
      <code>CONSTRAINT nombre PRIMARY KEY (col1, col2)<br>CONSTRAINT nombre UNIQUE (col1, col2)<br>CONSTRAINT nombre FOREIGN KEY (col) REFERENCES tabla(col_ref)</code>
      <p>Una <b>clave ajena</b> apunta por defecto a la clave primaria de otra tabla (o a una columna UNIQUE). Así se hacen las tablas de relación N:M.</p>
      <p><b>Orden de creación:</b> primero las tablas SIN claves ajenas y al final las que las tienen; si no, no se puede crear la restricción.</p>`,
    pistas: ["Las claves compuestas van al final: CONSTRAINT compra_pk PRIMARY KEY (cod_cli, cod_art).", "FOREIGN KEY (cod_cli) REFERENCES clientes(codcliente), y lo mismo con cod_art → articulos(cod).", "Termina con INSERT INTO compra VALUES (1, 100, 245, '2013-03-28');"],
    comprobar: (db) => { const t = db.tablas.compra; if (!t) return "Falta la tabla COMPRA.";
      return !mismo(t.pk, ["cod_cli", "cod_art"]) ? "La clave primaria debe ser compuesta: PRIMARY KEY (cod_cli, cod_art)."
        : !(t.fks.some(f => f.ref === "clientes" && mismo(f.cols, ["cod_cli"])) && t.fks.some(f => f.ref === "articulos" && mismo(f.cols, ["cod_art"]))) ? "Faltan las claves ajenas: cod_cli → clientes y cod_art → articulos."
        : !t.filas.length ? "Falta insertar la compra (1, 100, 245, '2013-03-28')." : null; } },

  { mundo: "Mundo 3 · Relaciones", titulo: "Integridad referencial", npc: "👩‍💼", seguir: true,
    preparar: BASE_CLIENTES + "\n" + BASE_COMPRA,
    pregunta: "El artículo 100 ya no se vende. Intenta borrarlo y verás por qué MySQL no te deja. Después bórralo de la forma correcta.",
    inicio: "", solucion: "DELETE FROM articulos WHERE cod = 100;\nDELETE FROM compra WHERE cod_art = 100;\nDELETE FROM articulos WHERE cod = 100;",
    leccion: `<p>La <b>integridad referencial</b> garantiza que una clave ajena sea <b>NULL</b> o un valor que <b>exista</b> en la tabla padre. Da error al:</p>
      <ul><li>insertar en la hija una clave que no existe en la padre,</li><li>modificar la clave primaria de una fila referenciada,</li><li>cambiar una clave ajena a un valor inexistente,</li><li><b>borrar de la padre una fila con filas relacionadas en la hija</b>.</li></ul>
      <p>Por defecto (<code>NO ACTION</code> / <code>RESTRICT</code>) se impide. Solución manual: borra primero las filas hijas.</p>`,
    pistas: ["Prueba primero DELETE FROM articulos WHERE cod = 100; y lee el error.", "La compra depende del artículo: bórrala antes (DELETE FROM compra …).", "Después repite el DELETE sobre articulos."],
    comprobar: (db, sal) => db.tablas.articulos.filas.some(f => f.cod === 100) ? "El artículo 100 sigue existiendo." : db.tablas.compra.filas.length ? "Queda la compra del artículo borrado."
      : !hayError(sal, /dependen/) ? "Falta el primer intento de borrado para ver el error de integridad." : null },

  { mundo: "Mundo 3 · Relaciones", titulo: "Borrado en cascada", npc: "🧑‍🔧",
    preparar: BASE_CLIENTES + "\n" + BASE_COMPRA,
    pregunta: "Quiero que al borrar un artículo desaparezcan solas sus compras. Recrea COMPRA con ON DELETE CASCADE en las dos claves ajenas, inserta una compra y borra el artículo 100.",
    inicio: "", solucion: "DROP TABLE compra;\nCREATE TABLE compra (cod_cli INT NOT NULL, cod_art INT NOT NULL, cantidad INT NOT NULL, fecha_compra DATE NOT NULL, CONSTRAINT compra_pk PRIMARY KEY (cod_cli, cod_art), CONSTRAINT cli_fk FOREIGN KEY (cod_cli) REFERENCES clientes(codcliente) ON DELETE CASCADE, CONSTRAINT art_fk FOREIGN KEY (cod_art) REFERENCES articulos(cod) ON DELETE CASCADE);\nINSERT INTO compra VALUES (1, 100, 245, '2013-04-20');\nDELETE FROM articulos WHERE cod = 100;",
    leccion: `<p><code>ON DELETE</code> y <code>ON UPDATE</code> admiten: <b>RESTRICT</b> / <b>NO ACTION</b> (impide, es lo normal por defecto), <b>CASCADE</b> (borra o modifica también las filas hijas), <b>SET NULL</b> y <b>SET DEFAULT</b>.</p>
      <code>FOREIGN KEY (cod_art) REFERENCES articulos(cod) ON DELETE CASCADE</code>
      <p>Para cambiarla hay que borrar y volver a crear la tabla con <b>DROP TABLE</b>.</p>`,
    pistas: ["Empieza con DROP TABLE compra; y créala de nuevo.", "Añade ON DELETE CASCADE al final de cada FOREIGN KEY … REFERENCES ….", "Inserta una compra, borra el artículo 100 y mira cómo desaparece la compra."],
    comprobar: (db, sal) => { const t = db.tablas.compra; if (!t) return "Falta la tabla COMPRA.";
      return !t.fks.length || !t.fks.every(f => f.onDelete === "CASCADE") ? "Las dos claves ajenas deben llevar ON DELETE CASCADE." : !sal.some(o => /^insert/i.test(o.sentencia) && o.tipo === "ok") ? "Falta insertar una compra."
        : db.tablas.articulos.filas.some(f => f.cod === 100) ? "Falta borrar el artículo 100." : t.filas.length ? "La compra debería haber desaparecido en cascada." : null; } },

  { mundo: "Mundo 3 · Relaciones", titulo: "Empleados sin tienda", npc: "👩‍🏫",
    preparar: "CREATE TABLE tiendas (id INT PRIMARY KEY, nombre VARCHAR(20));\nINSERT INTO tiendas VALUES (1, 'Centro');\nINSERT INTO tiendas VALUES (2, 'Norte');",
    pregunta: "Si cierra una tienda, sus empleados no deben desaparecer: se quedan sin tienda. Crea EMPLEADOS: id (clave primaria), nombre (texto 20) y tienda_id que referencia a tiendas(id) con ON DELETE SET NULL. Inserta a Ana en la tienda 1 y cierra la tienda 1.",
    inicio: "", solucion: "CREATE TABLE empleados (id INT PRIMARY KEY, nombre VARCHAR(20), tienda_id INT REFERENCES tiendas(id) ON DELETE SET NULL ON UPDATE CASCADE);\nINSERT INTO empleados VALUES (1, 'Ana', 1);\nDELETE FROM tiendas WHERE id = 1;",
    leccion: `<p><b>SET NULL</b> pone NULL en la clave ajena de las filas hijas. La columna debe admitir nulos: por eso <b>no</b> funciona si es NOT NULL o forma parte de la clave primaria (una PK nunca admite NULL).</p>
      <p>Una clave ajena también puede escribirse dentro de la columna: <code>tienda_id INT REFERENCES tiendas(id) ON DELETE SET NULL</code>.</p>`,
    pistas: ["tienda_id INT REFERENCES tiendas(id) …", "Añade ON DELETE SET NULL a esa referencia.", "INSERT INTO empleados VALUES (1, 'Ana', 1); y DELETE FROM tiendas WHERE id = 1;"],
    comprobar: (db) => { const t = db.tablas.empleados; if (!t) return "Falta la tabla EMPLEADOS.";
      return !t.fks.some(f => f.ref === "tiendas" && f.onDelete === "SET NULL") ? "Falta la clave ajena a tiendas con ON DELETE SET NULL." : !t.filas.length ? "Falta insertar a Ana."
        : db.tablas.tiendas.filas.some(f => f.id === 1) ? "Falta cerrar (borrar) la tienda 1." : t.filas[0].tienda_id !== null ? "Ana debería quedarse con tienda_id NULL." : null; } },

  { mundo: "Mundo 3 · Relaciones", titulo: "El taller (reto final)", npc: "🧑‍🔧",
    pregunta: "¡Reto final! Crea la base TALLER y úsala. Tablas: REPARACIONES (idreparacion entero autoincremental, matricula texto 8 obligatoria, fechaentrada DATE, averia texto 50, fechasalida DATE, horasempleadas DECIMAL(4,2), reparado TINYINT(1), observaciones texto 100; PK idreparacion), COMPONENTES (idcomponente texto 5 PK, descripcion texto 50, unidadbase texto 25, stock TINYINT, precioreferencia DECIMAL(6,2)) e INCLUYEN (idcomponente, idreparacion, unidades TINYINT; PK compuesta y dos claves ajenas con ON UPDATE CASCADE). ¡Cuidado con el orden!",
    inicio: "", solucion: "CREATE DATABASE taller;\nUSE taller;\nCREATE TABLE reparaciones (idreparacion INTEGER NOT NULL AUTO_INCREMENT, matricula VARCHAR(8) NOT NULL, fechaentrada DATE, averia VARCHAR(50), fechasalida DATE, horasempleadas DECIMAL(4,2), reparado TINYINT(1), observaciones VARCHAR(100), PRIMARY KEY (idreparacion));\nCREATE TABLE componentes (idcomponente VARCHAR(5) NOT NULL PRIMARY KEY, descripcion VARCHAR(50), unidadbase VARCHAR(25), stock TINYINT, precioreferencia DECIMAL(6,2));\nCREATE TABLE incluyen (idcomponente VARCHAR(5) NOT NULL, idreparacion INTEGER NOT NULL, unidades TINYINT, PRIMARY KEY (idcomponente, idreparacion), FOREIGN KEY fk_1 (idcomponente) REFERENCES componentes(idcomponente) ON UPDATE CASCADE, FOREIGN KEY fk_2 (idreparacion) REFERENCES reparaciones(idreparacion) ON UPDATE CASCADE);",
    leccion: `<p>Elige bien el tipo: qué valores, cuánto ocupa, longitud fija o variable, si admite NULL.</p>
      <table><tr><th>Texto</th><th></th></tr><tr><td>CHAR(N)</td><td>longitud fija, 0–255</td></tr><tr><td>VARCHAR(N)</td><td>longitud variable, 0–65535 (más rápido que TINYTEXT)</td></tr><tr><td>TEXT / BLOB</td><td>texto largo / binario (imágenes, sonido…)</td></tr><tr><td>ENUM / SET</td><td>un valor / varios valores de un conjunto</td></tr></table>
      <table><tr><th>Números</th><th>Rango con signo</th></tr><tr><td>TINYINT (1 byte)</td><td>-128 a 127 · <code>TINYINT(1)</code> = booleano</td></tr><tr><td>SMALLINT (2)</td><td>-32.768 a 32.767</td></tr><tr><td>MEDIUMINT (3)</td><td>-8.388.608 a 8.388.607</td></tr><tr><td>INT (4)</td><td>-2.147.483.648 a 2.147.483.647</td></tr><tr><td>BIGINT (8)</td><td>±9,22 × 10¹⁸</td></tr><tr><td>DECIMAL(N,D)</td><td>N dígitos en total, D decimales: DECIMAL(5,2) → -999,99 a 999,99</td></tr></table>
      <table><tr><th>Fecha</th><th>Formato</th></tr><tr><td>DATE</td><td>AAAA-MM-DD</td></tr><tr><td>TIME</td><td>HH:MM:SS (tiempo transcurrido)</td></tr><tr><td>DATETIME</td><td>AAAA-MM-DD HH:MM:SS</td></tr><tr><td>TIMESTAMP</td><td>1970–2037, cuándo se crea/modifica un registro</td></tr><tr><td>YEAR</td><td>AAAA</td></tr></table>
      <p>Extra: prueba <code>START TRANSACTION;</code> … <code>ROLLBACK;</code> (TCL) para deshacer cambios, o <code>COMMIT;</code> para confirmarlos.</p>`,
    pistas: ["Orden: base de datos, USE, y luego las tablas SIN claves ajenas (reparaciones y componentes).", "INCLUYEN va la última: PRIMARY KEY (idcomponente, idreparacion) y dos FOREIGN KEY … ON UPDATE CASCADE.", "reparado TINYINT(1), horasempleadas DECIMAL(4,2), stock TINYINT, precioreferencia DECIMAL(6,2)."],
    comprobar: (db) => { if (!db.bases.taller || db.usando !== "taller") return "Falta CREATE DATABASE taller; y USE taller;";
      const r = db.tablas.reparaciones, c = db.tablas.componentes, i = db.tablas.incluyen; if (!r || !c || !i) return "Faltan tablas: reparaciones, componentes e incluyen.";
      if (!mismo(r.pk, ["idreparacion"]) || !(col(r, "idreparacion") || {}).auto) return "idreparacion debe ser PRIMARY KEY y AUTO_INCREMENT.";
      if (!esTipo(r, "reparado", "tinyint", 1) || !esTipo(r, "horasempleadas", "decimal", 4, 2) || !esTipo(r, "matricula", "varchar", 8)) return "Revisa los tipos de REPARACIONES (reparado TINYINT(1), horasempleadas DECIMAL(4,2), matricula VARCHAR(8)).";
      if (!mismo(c.pk, ["idcomponente"]) || !esTipo(c, "stock", "tinyint") || !esTipo(c, "precioreferencia", "decimal", 6, 2)) return "Revisa COMPONENTES (idcomponente PK, stock TINYINT, precioreferencia DECIMAL(6,2)).";
      if (!mismo(i.pk, ["idcomponente", "idreparacion"])) return "La clave primaria de INCLUYEN debe ser (idcomponente, idreparacion).";
      return i.fks.length === 2 && i.fks.every(f => f.onUpdate === "CASCADE") ? null : "INCLUYEN necesita 2 claves ajenas, ambas con ON UPDATE CASCADE."; } }
];
