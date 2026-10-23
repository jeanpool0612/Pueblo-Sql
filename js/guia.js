/* =====================================================
   VENTANAS Y GUÍA DE COMANDOS (se usa en index.html y juego.html)
   - abrirVentana(): mini ventana emergente reutilizable
   - abrirGuia():    ventana con "para qué sirve cada comando"
   Para añadir un comando a la guía, añade un objeto a GUIA.
   ===================================================== */
const GUIA = [
  { t: "🗂️ Tablas, filas y columnas", d: "Una tabla es una lista. Cada fila es un elemento (un vecino, una casa) y cada columna es un dato suyo (nombre, edad…).", e: "vecinos → id | nombre | oficio | edad" },
  { t: "🧩 Sublenguajes SQL", d: "DDL define la estructura (CREATE, ALTER, DROP). DML maneja los datos (SELECT, INSERT, UPDATE, DELETE). DCL da permisos (GRANT, REVOKE). TCL controla transacciones (COMMIT, ROLLBACK).", e: "DDL · DML · DCL · TCL" },
  { t: "SELECT … FROM", d: "SELECT elige QUÉ columnas ver (* = todas) y FROM DE QUÉ tabla.", e: "SELECT nombre, edad FROM vecinos" },
  { t: "WHERE y operadores", d: "Filtra filas. Operadores: = · > · < · >= · <= · <> (distinto). Los textos van entre comillas simples rectas.", e: "SELECT * FROM casas WHERE calle = 'Mayor'" },
  { t: "AND / OR", d: "AND: se cumplen las dos condiciones. OR: basta con una.", e: "calle = 'Mayor' AND habitantes > 2" },
  { t: "ORDER BY", d: "Ordena el resultado. ASC (por defecto) de menor a mayor; DESC al revés.", e: "SELECT * FROM vecinos ORDER BY edad DESC" },
  { t: "CREATE DATABASE / USE", d: "Crea una base de datos (DATABASE y SCHEMA son sinónimos). IF NOT EXISTS evita el error si ya existe; CHARACTER SET y COLLATE definen caracteres y ordenación. USE la activa.", e: "CREATE DATABASE bd CHARACTER SET utf8;\nUSE bd;" },
  { t: "CREATE TABLE", d: "Crea la estructura de una tabla. Nombre: empieza por letra, máx. 64 caracteres, solo letras, números y _. Convención: tablas en MAYÚSCULAS y plural, campos en minúscula y singular.", e: "CREATE TABLE CLIENTES (\n  dni VARCHAR(9),\n  nombre VARCHAR(20)\n);" },
  { t: "Tipos de datos", d: "Texto: CHAR, VARCHAR(N), TEXT, BLOB, ENUM, SET. Números: TINYINT, SMALLINT, INT, BIGINT, DECIMAL(N,D); TINYINT(1) = booleano. Fecha: DATE, TIME, DATETIME, TIMESTAMP, YEAR.", e: "precio DECIMAL(6,2)  ·  activo TINYINT(1)  ·  alta DATE" },
  { t: "NOT NULL · PRIMARY KEY · UNIQUE", d: "NOT NULL: obligatoria. PRIMARY KEY: no nula y sin repetidos, solo una por tabla. UNIQUE: no admite valores repetidos.", e: "cod INT PRIMARY KEY,\ndni VARCHAR(9) UNIQUE,\nnombre VARCHAR(20) NOT NULL" },
  { t: "AUTO_INCREMENT · DEFAULT", d: "AUTO_INCREMENT: entero que sube solo (1, 2, 3…). DEFAULT: valor por defecto si no indicas otro; también CURRENT_TIMESTAMP.", e: "id INT AUTO_INCREMENT PRIMARY KEY,\npoblacion VARCHAR(25) DEFAULT 'Santander'" },
  { t: "CHECK", d: "El valor debe cumplir una condición; si no, el INSERT da error.", e: "precio DEC(11,2) CHECK (precio > 1)" },
  { t: "Restricciones de tipo 2", d: "Van tras todas las columnas, pueden afectar a varias y son obligatorias para claves compuestas. Se les puede dar nombre con CONSTRAINT.", e: "CONSTRAINT compra_pk PRIMARY KEY (cod_cli, cod_art)" },
  { t: "FOREIGN KEY (clave ajena)", d: "Apunta a la clave primaria (o UNIQUE) de otra tabla. Crea antes las tablas sin claves ajenas y al final las que las tienen.", e: "CONSTRAINT cli_fk FOREIGN KEY (cod_cli)\n  REFERENCES CLIENTES(codcliente)" },
  { t: "Integridad referencial", d: "Una clave ajena es NULL o existe en la tabla padre. Da error insertar una que no existe, o borrar/modificar una fila padre con hijas relacionadas.", e: "ON DELETE / ON UPDATE:\nRESTRICT · NO ACTION · CASCADE · SET NULL · SET DEFAULT" },
  { t: "INSERT · DELETE · DROP TABLE", d: "INSERT añade filas. DELETE borra filas (respeta las claves ajenas). DROP TABLE borra una tabla entera.", e: "INSERT INTO t (a, b) VALUES (1, 'x');\nDELETE FROM t WHERE a = 1;\nDROP TABLE t;" },
  { t: "DESCRIBE · SHOW", d: "DESCRIBE muestra la estructura de una tabla. SHOW TABLES / SHOW DATABASES listan objetos.", e: "DESCRIBE CLIENTES;\nSHOW TABLES;" },
  { t: "Transacciones (TCL)", d: "START TRANSACTION abre una transacción; COMMIT confirma los cambios y ROLLBACK los deshace.", e: "START TRANSACTION;\nDELETE FROM compra;\nROLLBACK;" }
];

let _velo = null;

// Abre una ventana con título, contenido HTML y botones [{texto, accion, principal}]
function abrirVentana(titulo, html, botones = []) {
  cerrarVentana();
  _velo = document.createElement("div");
  _velo.className = "velo";
  _velo.innerHTML = `<div class="ventana pixel">
      <div class="ventana-top"><span>${titulo}</span><button class="x" aria-label="Cerrar">✖</button></div>
      <div class="ventana-cuerpo">${html}</div><div class="ventana-pie"></div></div>`;
  _velo.querySelector(".x").onclick = cerrarVentana;
  _velo.addEventListener("click", e => { if (e.target === _velo) cerrarVentana(); });
  const pie = _velo.querySelector(".ventana-pie");
  botones.forEach(b => {
    const el = document.createElement("button");
    el.className = "btn" + (b.principal ? " principal" : "");
    el.textContent = b.texto;
    el.onclick = () => { cerrarVentana(); if (b.accion) b.accion(); };
    pie.appendChild(el);
  });
  document.body.appendChild(_velo);
}
function cerrarVentana() { if (_velo) { _velo.remove(); _velo = null; } }

function abrirGuia() {
  const html = GUIA.map(g => `<div class="tip"><h4>${g.t}</h4><p>${g.d}</p><code>${g.e.replace(/\n/g,'<br>')}</code></div>`).join("");
  abrirVentana("📖 Guía de comandos", html, [{ texto: "¡Entendido!", principal: true }]);
}
