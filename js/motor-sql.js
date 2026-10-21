/* =====================================================
   MOTOR SQL (mini)  ·  Entiende:
   SELECT columnas FROM tabla [WHERE cond] [ORDER BY col [ASC|DESC]]
   Más adelante se puede cambiar por sql.js o PGlite:
   solo hay que mantener la función runQuery(sql, db).
   ===================================================== */
class SqlError extends Error {}   // errores "explicables" al jugador

function runQuery(sql, db) {
  sql = sql.trim().replace(/;+\s*$/, "");
  if (!sql) throw new SqlError("Escribe una consulta primero.");

  // Guardamos los textos 'entre comillas' aparte para no romperlos al analizar
  const textos = [];
  sql = sql.replace(/'[^']*'/g, m => { textos.push(m.slice(1, -1)); return "\0" + (textos.length - 1) + "\0"; });

  // Comprobaciones sencillas con mensajes claros
  if (!/^select\b/i.test(sql)) throw new SqlError("Las consultas empiezan por SELECT.");
  if (!/\bfrom\b/i.test(sql)) throw new SqlError("Falta FROM: ¿de qué tabla quieres los datos?");
  if (/\bwhere\s*$/i.test(sql)) throw new SqlError("Después de WHERE falta la condición.");
  if (/\border\s+by\s*$/i.test(sql)) throw new SqlError("Después de ORDER BY falta la columna.");

  // Dividimos la consulta en sus partes
  const m = sql.match(/^select\s+(.+?)\s+from\s+(\w+)(?:\s+where\s+(.+?))?(?:\s+order\s+by\s+(\w+)(?:\s+(asc|desc))?)?$/i);
  if (!m) throw new SqlError("No he podido entender la consulta. Revisa el orden: SELECT … FROM … WHERE … ORDER BY …");

  const tabla = db[m[2].toLowerCase()];
  if (!tabla) throw new SqlError(`No existe la tabla «${m[2]}». En este mundo hay: ${Object.keys(db).join(", ")}.`);

  const comprobarColumna = c => {
    if (!tabla.columnas.includes(c)) throw new SqlError(`La columna «${c}» no existe. Columnas disponibles: ${tabla.columnas.join(", ")}.`);
    return c;
  };
  const columnas = m[1].trim() === "*" ? tabla.columnas : m[1].split(",").map(c => comprobarColumna(c.trim()));

  // Valor de una condición: número o texto entre comillas simples
  const valor = s => {
    s = s.trim();
    const t = s.match(/^\0(\d+)\0$/);
    if (t) return textos[+t[1]];
    if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
    throw new SqlError(`No entiendo el valor «${s}». Los textos van entre comillas simples, como 'Mayor'.`);
  };
  // Una comparación:  columna operador valor
  const comparacion = s => {
    const k = s.trim().match(/^(\w+)\s*(>=|<=|<>|!=|=|>|<)\s*(.+)$/);
    if (!k) throw new SqlError("No entiendo la condición. Usa: columna operador valor, por ejemplo edad > 40.");
    return { c: comprobarColumna(k[1]), o: k[2], v: valor(k[3]) };
  };
  const cumple = (fila, { c, o, v }) => {
    const a = fila[c];
    return o === "=" ? a === v : (o === "<>" || o === "!=") ? a !== v :
           o === ">" ? a > v : o === "<" ? a < v : o === ">=" ? a >= v : a <= v;
  };

  let filas = tabla.filas;
  if (m[3]) {   // WHERE: grupos separados por OR; dentro de cada grupo, condiciones con AND
    const grupos = m[3].split(/\s+or\s+/i).map(g => g.split(/\s+and\s+/i).map(comparacion));
    filas = filas.filter(f => grupos.some(g => g.every(c => cumple(f, c))));
  }
  if (m[4]) {   // ORDER BY
    const c = comprobarColumna(m[4]), dir = (m[5] || "asc").toLowerCase() === "desc" ? -1 : 1;
    filas = [...filas].sort((a, b) => (a[c] > b[c] ? 1 : a[c] < b[c] ? -1 : 0) * dir);
  }
  return { columnas, filas: filas.map(f => Object.fromEntries(columnas.map(c => [c, f[c]]))) };
}
