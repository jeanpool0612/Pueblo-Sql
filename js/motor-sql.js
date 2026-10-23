/* =====================================================
   MOTOR SQL (mini) · simula un MySQL sencillo en el navegador
   Entiende: SELECT, INSERT, DELETE, CREATE DATABASE, USE, CREATE TABLE
   (tipos, NOT NULL, PRIMARY KEY, UNIQUE, AUTO_INCREMENT, DEFAULT, CHECK,
   FOREIGN KEY con ON DELETE/ON UPDATE), DROP TABLE, DESCRIBE, SHOW,
   START TRANSACTION / COMMIT / ROLLBACK.
   Función principal:  ejecutar(sql, db, {seguir})  → lista de salidas
   (Más adelante se puede cambiar por sql.js o PGlite.)
   ===================================================== */
class SqlError extends Error {}   // errores "explicables" al jugador

const ENTEROS = { tinyint: [-128, 127], smallint: [-32768, 32767], mediumint: [-8388608, 8388607],
                  int: [-2147483648, 2147483647], integer: [-2147483648, 2147483647], bigint: [-9.2e18, 9.2e18] };
const TIPOS = [...Object.keys(ENTEROS), "decimal", "dec", "char", "varchar", "text", "date", "datetime", "timestamp", "float", "double"];
const ok = msg => ({ tipo: "ok", msg });
const ahora = () => new Date().toISOString().slice(0, 19).replace("T", " ");
const lista = s => s.split(",").map(x => x.trim().toLowerCase()).filter(Boolean);

/* ---------- Estado de la base de datos ---------- */
function nuevaBD() { return { bases: {}, usando: null, tablas: {}, snap: null }; }
// Convierte las TABLAS simples de misiones.js (solo consultas) en una BD del motor
function bdDesdeTablas(T) {
  const db = nuevaBD();
  for (const [n, t] of Object.entries(T))
    db.tablas[n] = { nombre: n, columnas: t.columnas.map(c => ({ nombre: c, tipo: "int", arg: [], notnull: false, auto: false })),
                     pk: [], uniques: [], fks: [], checks: [], auto: 1, filas: t.filas.map(f => ({ ...f })) };
  return db;
}

/* ---------- Utilidades de análisis ---------- */
// Parte un texto por un separador, ignorando los que van entre comillas o paréntesis
function partir(s, sep) {
  const out = []; let d = 0, q = false, cur = "";
  for (const ch of s) {
    if (ch === "'") q = !q;
    if (!q) { if (ch === "(") d++; if (ch === ")") d--; if (ch === sep && d === 0) { out.push(cur); cur = ""; continue; } }
    cur += ch;
  }
  out.push(cur);
  return out.map(x => x.trim()).filter(Boolean);
}
function valor(s) {
  s = s.trim();
  let m;
  if (/^null$/i.test(s)) return null;
  if ((m = s.match(/^'([\s\S]*)'$/))) return m[1];
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  if (/^current_timestamp(\(\))?$/i.test(s)) return ahora();
  throw new SqlError(`No entiendo el valor «${s}». Los textos van entre comillas simples rectas: 'texto'.`);
}
function buscarTabla(db, n) {
  const t = db.tablas[n.toLowerCase()];
  if (!t) { const l = Object.keys(db.tablas);
    throw new SqlError(`No existe la tabla «${n}». ` + (l.length ? `Tablas disponibles: ${l.join(", ")}.` : "Todavía no hay ninguna: créala con CREATE TABLE.")); }
  return t;
}
// Condición (WHERE y CHECK): comparaciones unidas con AND / OR. Devuelve una función fila → true/false
function condicion(texto, t, permisivo = false) {
  const strs = [];
  texto = texto.trim().replace(/^\(([\s\S]*)\)$/, "$1").replace(/'[^']*'/g, m => { strs.push(m.slice(1, -1)); return "\0" + (strs.length - 1) + "\0"; });
  const col = c => { c = c.toLowerCase();
    if (!t.columnas.some(x => x.nombre === c)) throw new SqlError(`La columna «${c}» no existe. Columnas disponibles: ${t.columnas.map(x => x.nombre).join(", ")}.`);
    return c; };
  const val = s => { s = s.trim(); const k = s.match(/^\0(\d+)\0$/);
    if (k) return strs[+k[1]];
    if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
    throw new SqlError(`No entiendo el valor «${s}». Los textos van entre comillas simples, como 'Mayor'.`); };
  const cmp = s => { const k = s.trim().match(/^(\w+)\s*(>=|<=|<>|!=|=|>|<)\s*(.+)$/);
    if (!k) throw new SqlError("No entiendo la condición. Usa: columna operador valor, por ejemplo edad > 40.");
    return { c: col(k[1]), o: k[2], v: val(k[3]) }; };
  const g = texto.split(/\s+or\s+/i).map(x => x.split(/\s+and\s+/i).map(cmp));
  return f => g.some(a => a.every(({ c, o, v }) => { const x = f[c];
    if (x === null || x === undefined) return permisivo;     // NULL: en un CHECK se acepta
    return o === "=" ? x === v : (o === "<>" || o === "!=") ? x !== v : o === ">" ? x > v : o === "<" ? x < v : o === ">=" ? x >= v : x <= v; }));
}

/* ---------- SELECT ---------- */
function select(s, db) {
  if (!/\bfrom\b/i.test(s)) throw new SqlError("Falta FROM: ¿de qué tabla quieres los datos?");
  if (/\bwhere\s*$/i.test(s)) throw new SqlError("Después de WHERE falta la condición.");
  if (/\border\s+by\s*$/i.test(s)) throw new SqlError("Después de ORDER BY falta la columna.");
  const m = s.match(/^select\s+([\s\S]+?)\s+from\s+(\w+)(?:\s+where\s+([\s\S]+?))?(?:\s+order\s+by\s+(\w+)(?:\s+(asc|desc))?)?$/i);
  if (!m) throw new SqlError("No he podido entender la consulta. Revisa el orden: SELECT … FROM … WHERE … ORDER BY …");
  const t = buscarTabla(db, m[2]);
  const cn = c => { c = c.trim().toLowerCase();
    if (!t.columnas.some(x => x.nombre === c)) throw new SqlError(`La columna «${c}» no existe. Columnas disponibles: ${t.columnas.map(x => x.nombre).join(", ")}.`);
    return c; };
  const cols = m[1].trim() === "*" ? t.columnas.map(c => c.nombre) : m[1].split(",").map(cn);
  let filas = t.filas;
  if (m[3]) filas = filas.filter(condicion(m[3], t));
  if (m[4]) { const c = cn(m[4]), d = (m[5] || "asc").toLowerCase() === "desc" ? -1 : 1;
    filas = [...filas].sort((a, b) => (a[c] > b[c] ? 1 : a[c] < b[c] ? -1 : 0) * d); }
  return { tipo: "tabla", columnas: cols, filas: filas.map(f => Object.fromEntries(cols.map(c => [c, f[c]]))) };
}

/* ---------- CREATE DATABASE / USE ---------- */
function crearBD(s, db) {
  const m = s.match(/^create\s+(?:database|schema)\s+(if\s+not\s+exists\s+)?(\w+)(?:\s+(?:default\s+)?character\s+set\s+(\w+))?(?:\s+(?:default\s+)?collate\s+(\w+))?$/i);
  if (!m) throw new SqlError("Sintaxis: CREATE DATABASE nombre [CHARACTER SET utf8] [COLLATE utf8_general_ci];");
  const n = m[2].toLowerCase();
  if (db.bases[n]) { if (m[1]) return ok(`La base de datos «${n}» ya existía; no se hace nada.`);
    throw new SqlError(`La base de datos «${n}» ya existe. Usa IF NOT EXISTS para evitar este error.`); }
  db.bases[n] = { charset: (m[3] || "latin1").toLowerCase(), collate: m[4] || "" };
  return ok(`Base de datos «${n}» creada (juego de caracteres: ${db.bases[n].charset}).`);
}

/* ---------- CREATE TABLE ---------- */
const acciones = r => ({
  onDelete: ((r.match(/on\s+delete\s+(restrict|cascade|set\s+null|no\s+action|set\s+default)/i) || [])[1] || "NO ACTION").toUpperCase().replace(/\s+/g, " "),
  onUpdate: ((r.match(/on\s+update\s+(restrict|cascade|set\s+null|no\s+action|set\s+default)/i) || [])[1] || "NO ACTION").toUpperCase().replace(/\s+/g, " ")
});
function columna(t, it) {   // una definición de columna (restricciones de tipo 1)
  const m = it.match(/^(\w+)\s+(\w+)\s*(\([^)]*\))?\s*([\s\S]*)$/);
  if (!m) throw new SqlError(`No entiendo «${it}». Una columna se define así: nombre tipo restricciones.`);
  const c = { nombre: m[1].toLowerCase(), tipo: m[2].toLowerCase(), arg: m[3] ? m[3].slice(1, -1).split(",").map(x => +x.trim()) : [], notnull: false, auto: false };
  if (!TIPOS.includes(c.tipo)) throw new SqlError(`Tipo de dato desconocido: «${m[2]}». Ejemplos: INT, VARCHAR(20), DECIMAL(6,2), DATE, TINYINT(1).`);
  if (t.columnas.some(x => x.nombre === c.nombre)) throw new SqlError(`La columna «${c.nombre}» está repetida.`);
  let r = m[4];
  const quita = (re, fn) => { r = r.replace(re, (...a) => { fn(a); return " "; }); };
  quita(/(?:constraint\s+\w+\s+)?check\s*\(([^()]*)\)/i, a => t.checks.push(a[1]));
  quita(/references\s+(\w+)\s*\(([^)]*)\)([\s\S]*)$/i, a => t.fks.push({ cols: [c.nombre], ref: a[1].toLowerCase(), refCols: lista(a[2]), ...acciones(a[3]) }));
  quita(/\bnot\s+null\b/i, () => { c.notnull = true; });
  quita(/\bprimary\s+key\b/i, () => { if (t.pk.length) throw new SqlError("Solo puede haber una clave primaria por tabla (si es compuesta, va en un único PRIMARY KEY (a, b))."); t.pk = [c.nombre]; });
  quita(/\bunique\b/i, () => t.uniques.push([c.nombre]));
  quita(/\bauto_increment\b/i, () => { if (!ENTEROS[c.tipo]) throw new SqlError("AUTO_INCREMENT solo se puede usar con números enteros."); c.auto = true; });
  quita(/\bdefault\s+('[^']*'|current_timestamp|-?[\d.]+|null)/i, a => { c.def = /^current/i.test(a[1]) ? "__ts" : valor(a[1]); });
  if (r.trim()) throw new SqlError(`No entiendo «${r.trim()}» en la columna «${c.nombre}».`);
  t.columnas.push(c);
}
function crearTabla(s, db) {
  const m = s.match(/^create\s+table\s+(if\s+not\s+exists\s+)?(\w+)\s*\(([\s\S]*)\)$/i);
  if (!m) throw new SqlError("Sintaxis: CREATE TABLE nombre ( columna tipo restricciones, … );");
  const n = m[2].toLowerCase();
  if (!/^[a-z]\w{0,63}$/.test(n)) throw new SqlError("Nombre de tabla no válido: empieza por una letra, máximo 64 caracteres y solo letras, números y _.");
  if (db.tablas[n]) { if (m[1]) return ok(`La tabla «${n}» ya existía; no se hace nada.`);
    throw new SqlError(`La tabla «${n}» ya existe en este esquema. Bórrala antes con DROP TABLE o usa otro nombre.`); }
  const t = { nombre: n, columnas: [], pk: [], uniques: [], fks: [], checks: [], auto: 1, filas: [] };
  for (const it of partir(m[3], ",")) {   // restricciones de tipo 2 (tras las columnas) o columnas
    let r;
    if ((r = it.match(/^(?:constraint\s+\w+\s+)?primary\s+key\s*\(([^)]*)\)$/i))) {
      if (t.pk.length) throw new SqlError("Solo puede haber una clave primaria por tabla (si es compuesta, va en un único PRIMARY KEY (a, b)).");
      t.pk = lista(r[1]);
    } else if ((r = it.match(/^(?:constraint\s+\w+\s+)?unique\s*\(([^)]*)\)$/i))) t.uniques.push(lista(r[1]));
    else if ((r = it.match(/^(?:constraint\s+\w+\s+)?foreign\s+key\s*(?:\w+\s*)?\(([^)]*)\)\s*references\s+(\w+)\s*\(([^)]*)\)([\s\S]*)$/i)))
      t.fks.push({ cols: lista(r[1]), ref: r[2].toLowerCase(), refCols: lista(r[3]), ...acciones(r[4]) });
    else if ((r = it.match(/^(?:constraint\s+\w+\s+)?check\s*\(([\s\S]*)\)$/i))) t.checks.push(r[1]);
    else columna(t, it);
  }
  const nombres = t.columnas.map(c => c.nombre);
  const existe = (cs, que) => cs.forEach(c => { if (!nombres.includes(c)) throw new SqlError(`${que}: la columna «${c}» no existe en ${n}.`); });
  existe(t.pk, "PRIMARY KEY"); t.uniques.forEach(u => existe(u, "UNIQUE")); t.fks.forEach(f => existe(f.cols, "FOREIGN KEY"));
  t.checks.forEach(ch => condicion(ch, t));
  t.fks.forEach(f => {
    const p = db.tablas[f.ref];
    if (!p) throw new SqlError(`La tabla «${f.ref}» todavía no existe. Crea primero las tablas sin claves ajenas y, al final, las que las tienen.`);
    if (f.cols.length !== f.refCols.length) throw new SqlError("La clave ajena y la columna referenciada deben tener el mismo número de columnas.");
    if (!f.refCols.every(c => p.columnas.some(x => x.nombre === c)) || ![p.pk, ...p.uniques].some(k => k.length === f.refCols.length && k.every(c => f.refCols.includes(c))))
      throw new SqlError(`«${f.ref}(${f.refCols.join(", ")})» no es clave primaria ni UNIQUE: una clave ajena debe apuntar a una de ellas.`);
  });
  db.tablas[n] = t;
  return ok(`Tabla «${n}» creada (${t.columnas.length} columnas).`);
}

/* ---------- INSERT ---------- */
function tipoOk(c, v) {   // ¿el valor cabe en el tipo de la columna?
  const n = c.nombre, t = c.tipo;
  if (ENTEROS[t]) {
    if (typeof v !== "number" || !Number.isInteger(v)) throw new SqlError(`«${n}» es ${t.toUpperCase()}: solo admite números enteros.`);
    const [a, b] = ENTEROS[t]; if (v < a || v > b) throw new SqlError(`El valor ${v} se sale del rango de ${t.toUpperCase()} (${a} a ${b}).`);
  } else if (t === "decimal" || t === "dec") {
    if (typeof v !== "number") throw new SqlError(`«${n}» es numérica: no lleva comillas.`);
    const [p = 10, d = 0] = c.arg; if (Math.abs(v) >= Math.pow(10, p - d)) throw new SqlError(`${v} no cabe en DECIMAL(${p},${d}): como máximo ${p - d} dígitos enteros.`);
  } else if (t === "varchar" || t === "char") {
    if (typeof v !== "string") throw new SqlError(`«${n}» es de texto: el valor va entre comillas simples.`);
    if (v.length > (c.arg[0] || 1)) throw new SqlError(`El texto es demasiado largo para ${t.toUpperCase()}(${c.arg[0]}): máximo ${c.arg[0]} caracteres.`);
  } else if (t === "date") {
    if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new SqlError(`«${n}» es DATE: usa el formato 'AAAA-MM-DD'.`);
  } else if (t === "datetime" || t === "timestamp") {
    if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/.test(v)) throw new SqlError(`«${n}» es ${t.toUpperCase()}: usa 'AAAA-MM-DD HH:MM:SS'.`);
  }
}
function insertar(s, db) {
  const m = s.match(/^insert\s+into\s+(\w+)\s*(?:\(([^)]*)\))?\s*values\s*([\s\S]+)$/i);
  if (!m) throw new SqlError("Sintaxis: INSERT INTO tabla (col1, col2) VALUES (valor1, valor2);");
  const t = buscarTabla(db, m[1]);
  const cols = m[2] ? lista(m[2]) : t.columnas.map(c => c.nombre);
  cols.forEach(c => { if (!t.columnas.some(x => x.nombre === c)) throw new SqlError(`La columna «${c}» no existe. Columnas disponibles: ${t.columnas.map(x => x.nombre).join(", ")}.`); });
  let n = 0;
  for (const tupla of partir(m[3], ",")) {
    const vals = partir(tupla.replace(/^\(([\s\S]*)\)$/, "$1"), ",").map(valor);
    if (vals.length !== cols.length) throw new SqlError(`Has indicado ${cols.length} columnas pero ${vals.length} valores.`);
    const fila = {}; let auto = t.auto;
    for (const c of t.columnas) {
      let v = cols.includes(c.nombre) ? vals[cols.indexOf(c.nombre)] : undefined;
      if (v === undefined || (v === null && c.auto)) v = c.auto ? auto : c.def === undefined ? null : c.def === "__ts" ? ahora() : c.def;
      if (c.auto && typeof v === "number") auto = Math.max(auto, v + 1);
      if (v === null && (c.notnull || t.pk.includes(c.nombre))) throw new SqlError(`La columna «${c.nombre}» no admite NULL (es NOT NULL o clave primaria).`);
      if (v !== null) tipoOk(c, v);
      fila[c.nombre] = v;
    }
    for (const k of [t.pk, ...t.uniques]) {   // PRIMARY KEY y UNIQUE: sin repetidos
      if (!k.length || k.some(c => fila[c] === null)) continue;
      if (t.filas.some(f => k.every(c => f[c] === fila[c])))
        throw new SqlError(k === t.pk ? `Clave primaria duplicada: ya existe una fila con ${k.map(c => c + " = " + fila[c]).join(", ")}.` : `Valor duplicado en «${k.join(", ")}» (restricción UNIQUE).`);
    }
    for (const ch of t.checks) if (!condicion(ch, t, true)(fila)) throw new SqlError(`No se cumple la restricción CHECK (${ch.trim()}).`);
    for (const fk of t.fks) {   // integridad referencial: la clave ajena debe existir en la tabla padre
      const v = fk.cols.map(c => fila[c]); if (v.some(x => x === null)) continue;
      const p = db.tablas[fk.ref];
      if (!p.filas.some(pf => fk.refCols.every((rc, i) => pf[rc] === v[i])))
        throw new SqlError(`Integridad referencial: no existe en «${fk.ref}» ninguna fila con ${fk.refCols.join(", ")} = ${v.join(", ")}. No puedes referenciar algo que no existe.`);
    }
    t.filas.push(fila); t.auto = auto; n++;
  }
  return ok(`${n} fila(s) insertada(s) en «${t.nombre}».`);
}

/* ---------- DELETE / DROP / DESCRIBE / SHOW ---------- */
function borrarFilas(db, t, filas) {   // respeta ON DELETE de las claves ajenas que apuntan a t
  if (!filas.length) return;
  for (const h of Object.values(db.tablas)) for (const fk of h.fks) {
    if (fk.ref !== t.nombre) continue;
    const hijos = h.filas.filter(hf => filas.some(pf => fk.cols.every((c, i) => hf[c] === pf[fk.refCols[i]])));
    if (!hijos.length) continue;
    if (fk.onDelete === "CASCADE") borrarFilas(db, h, hijos);
    else if (fk.onDelete === "SET NULL") {
      if (fk.cols.some(c => h.pk.includes(c) || h.columnas.find(x => x.nombre === c).notnull))
        throw new SqlError(`ON DELETE SET NULL no es posible: «${fk.cols.join(", ")}» no admite NULL (es NOT NULL o forma parte de la clave primaria).`);
      hijos.forEach(hf => fk.cols.forEach(c => { hf[c] = null; }));
    } else throw new SqlError(`Integridad referencial: no se puede borrar porque ${hijos.length} fila(s) de «${h.nombre}» dependen de ella (ON DELETE ${fk.onDelete}). Borra antes esas filas o usa ON DELETE CASCADE.`);
  }
  t.filas = t.filas.filter(f => !filas.includes(f));
}
function describir(t) {
  const tipo = c => c.tipo.toUpperCase() + (c.arg.length ? `(${c.arg.join(",")})` : "");
  return { tipo: "tabla", columnas: ["Field", "Type", "Null", "Key", "Default", "Extra"], filas: t.columnas.map(c => ({
    Field: c.nombre, Type: tipo(c), Null: c.notnull || t.pk.includes(c.nombre) ? "NO" : "YES",
    Key: t.pk.includes(c.nombre) ? "PRI" : t.uniques.some(u => u.length === 1 && u[0] === c.nombre) ? "UNI" : t.fks.some(f => f.cols.includes(c.nombre)) ? "MUL" : "",
    Default: c.def === undefined ? null : c.def === "__ts" ? "CURRENT_TIMESTAMP" : c.def, Extra: c.auto ? "auto_increment" : "" })) };
}

/* ---------- Una sentencia ---------- */
function una(s, db) {
  const k = (s.match(/^\w+/) || [""])[0].toLowerCase(); let m;
  switch (k) {
    case "select": return select(s, db);
    case "create":
      if (/^create\s+(database|schema)\b/i.test(s)) return crearBD(s, db);
      if (/^create\s+table\b/i.test(s)) return crearTabla(s, db);
      throw new SqlError("Después de CREATE va DATABASE o TABLE.");
    case "use": m = s.match(/^use\s+(\w+)$/i);
      if (!m) throw new SqlError("Sintaxis: USE nombreBaseDeDatos;");
      if (!db.bases[m[1].toLowerCase()]) throw new SqlError(`La base de datos «${m[1]}» no existe. Créala antes con CREATE DATABASE.`);
      db.usando = m[1].toLowerCase(); return ok(`Ahora trabajas con la base de datos «${db.usando}».`);
    case "insert": return insertar(s, db);
    case "delete": m = s.match(/^delete\s+from\s+(\w+)(?:\s+where\s+([\s\S]+))?$/i);
      if (!m) throw new SqlError("Sintaxis: DELETE FROM tabla WHERE condición;");
      { const t = buscarTabla(db, m[1]), f = m[2] ? condicion(m[2], t) : () => true, ant = t.filas.length;
        borrarFilas(db, t, t.filas.filter(f)); return ok(`${ant - t.filas.length} fila(s) borrada(s) de «${t.nombre}».`); }
    case "drop": m = s.match(/^drop\s+table\s+(if\s+exists\s+)?(\w+)$/i);
      if (!m) throw new SqlError("Sintaxis: DROP TABLE nombreTabla;");
      { const n = m[2].toLowerCase();
        if (!db.tablas[n]) { if (m[1]) return ok(`La tabla «${n}» no existía.`); buscarTabla(db, n); }
        const dep = Object.values(db.tablas).find(h => h.nombre !== n && h.fks.some(f => f.ref === n));
        if (dep) throw new SqlError(`No se puede borrar «${n}»: la tabla «${dep.nombre}» tiene una clave ajena que la referencia. Borra antes la tabla hija.`);
        delete db.tablas[n]; return ok(`Tabla «${n}» borrada.`); }
    case "describe": case "desc": m = s.match(/^desc(?:ribe)?\s+(\w+)$/i);
      if (!m) throw new SqlError("Sintaxis: DESCRIBE nombreTabla;"); return describir(buscarTabla(db, m[1]));
    case "show":
      if (/^show\s+tables$/i.test(s)) return { tipo: "tabla", columnas: ["Tablas"], filas: Object.keys(db.tablas).map(x => ({ Tablas: x })) };
      if (/^show\s+databases$/i.test(s)) return { tipo: "tabla", columnas: ["Database"], filas: Object.keys(db.bases).map(x => ({ Database: x })) };
      throw new SqlError("Prueba con SHOW TABLES; o SHOW DATABASES;");
    case "start": case "begin": db.snap = JSON.stringify(db.tablas); return ok("Transacción iniciada: puedes deshacerla con ROLLBACK o confirmarla con COMMIT.");
    case "commit": db.snap = null; return ok("COMMIT: cambios confirmados.");
    case "rollback":
      if (!db.snap) throw new SqlError("No hay ninguna transacción abierta (empieza con START TRANSACTION).");
      db.tablas = JSON.parse(db.snap); db.snap = null; return ok("ROLLBACK: cambios deshechos.");
    case "grant": case "revoke": return ok("DCL (simulado): GRANT y REVOKE dan o quitan permisos a los usuarios.");
    default: throw new SqlError(`No conozco el comando «${k.toUpperCase() || s}». Puedes usar: SELECT, INSERT, DELETE, CREATE, DROP, DESCRIBE, SHOW, USE, COMMIT, ROLLBACK.`);
  }
}

/* ---------- Varias sentencias separadas por ; ---------- */
// Devuelve [{sentencia, tipo:"ok"|"error"|"tabla", ...}]. Si seguir=false, se detiene en el primer error.
function ejecutar(sql, db, opc = {}) {
  if (/[‘’“”]/.test(sql)) return [{ sentencia: sql.trim(), tipo: "error", msg: "Has usado comillas tipográficas (‘ ’ “ ”). En SQL hay que usar comillas simples rectas: '…'" }];
  const sentencias = partir(sql.replace(/--.*$/gm, ""), ";");
  if (!sentencias.length) return [{ sentencia: "", tipo: "error", msg: "Escribe una consulta primero." }];
  const salidas = [];
  for (const s of sentencias) {
    const copia = JSON.stringify(db.tablas);   // si falla, se deshace esa sentencia entera
    try { salidas.push({ sentencia: s, ...una(s, db) }); }
    catch (e) {
      if (!(e instanceof SqlError)) throw e;
      db.tablas = JSON.parse(copia); salidas.push({ sentencia: s, tipo: "error", msg: e.message });
      if (!opc.seguir) break;
    }
  }
  return salidas;
}
