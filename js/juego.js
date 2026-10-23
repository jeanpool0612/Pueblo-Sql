/* =====================================================
   LÓGICA DEL JUEGO · usa: motor-sql.js, misiones.js, guia.js
   ===================================================== */
const $ = id => document.getElementById(id);
const CLAVE = "pueblosql_estrellas";   // dónde se guardan las estrellas en el navegador

let n = 0;                // misión actual
let pistas = 0;           // pistas usadas en esta misión
let M, db;                // misión actual y su base de datos (se crea de cero en cada intento)
const vistas = new Set(); // lecciones ya mostradas en esta sesión

/* ---------- Estrellas guardadas (localStorage) ---------- */
function leerEstrellas() { try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) { return {}; } }
function guardarEstrellas(i, s) {
  const d = leerEstrellas();
  if (s > (d[i] || 0)) { d[i] = s; try { localStorage.setItem(CLAVE, JSON.stringify(d)); } catch (e) {} }
  return d[i] || 0;
}
const estrellasIntento = () => 3 - Math.min(2, pistas);   // 3 sin pistas, 2 con una, 1 con dos o más

/* ---------- Base de datos de la misión ---------- */
function nuevaDB() {
  if (M.tabla) return bdDesdeTablas(TABLAS);               // mundo 1: tablas fijas
  const d = nuevaBD();
  if (M.preparar) ejecutar(M.preparar, d);                  // mundos 2 y 3: estado inicial en SQL
  return d;
}

/* ---------- Dibujo de la pantalla ---------- */
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function dibujarTabs() {
  const est = leerEstrellas();
  $("tabs").innerHTML = MISIONES.map((m, i) =>
    `<button class="btn tab ${i === n ? "on" : ""}" data-i="${i}" title="${esc(m.titulo)}">${i + 1}${est[i] ? " " + "⭐".repeat(est[i]) : ""}</button>`).join("");
  document.querySelectorAll(".tab").forEach(b => b.onclick = () => cargarMision(+b.dataset.i));
}
// Mundo 1: una ficha por cada fila de la tabla ("marcadas" = ids resaltados)
function dibujarFichas(filas, marcadas = []) {
  const T = TABLAS[M.tabla];
  $("campo").innerHTML = filas.map(f =>
    `<div class="ficha ${marcadas.includes(f.id) ? "marcada" : ""}"><span class="ico">${T.icono(f)}</span>${f[T.etiqueta]}</div>`).join("");
}
// Mundos 2 y 3: un cuadro por cada tabla creada, con sus columnas y claves
function dibujarEsquema() {
  const ts = Object.values(db.tablas);
  const tipo = c => c.tipo.toUpperCase() + (c.arg.length ? `(${c.arg.join(",")})` : "");
  $("campo").innerHTML = (ts.length ? ts.map(t => `<div class="esq"><b>📦 ${t.nombre}</b> <small>(${t.filas.length} filas)</small>` +
      t.columnas.map(c => `<div>${t.pk.includes(c.nombre) ? "🔑" : t.fks.some(f => f.cols.includes(c.nombre)) ? "🔗" : c.notnull ? "❗" : "▫️"} ${c.nombre} <small>${tipo(c)}</small></div>`).join("") + `</div>`).join("")
    : `<div class="vacio">🌱 Aún no hay tablas.<br>Escribe tu primer CREATE TABLE.</div>`) +
    `<div class="leyenda">🔑 clave primaria · 🔗 clave ajena · ❗ obligatorio</div>`;
}
const lechuza = msg => { $("lechuza").style.display = msg ? "flex" : "none"; $("lechuzaMsg").textContent = msg; };
const abrirLeccion = () => abrirVentana("📘 " + M.titulo, M.leccion, [{ texto: "¡A por ello!", principal: true }]);

function cargarMision(i) {
  n = i; M = MISIONES[i]; pistas = 0; db = nuevaDB();
  $("titulo").textContent = `${M.mundo} · Misión ${i + 1} · ${M.titulo}`;
  $("npc").textContent = M.npc;
  $("pregunta").textContent = M.pregunta;
  $("sql").value = M.inicio;
  $("pista").textContent = "Pista 0/3"; $("pista").disabled = false;
  $("btnLeccion").style.display = M.leccion ? "" : "none";
  lechuza(""); dibujarTabs();
  M.tabla ? dibujarFichas(TABLAS[M.tabla].filas) : dibujarEsquema();
  if (M.leccion && !vistas.has(i)) { vistas.add(i); abrirLeccion(); }   // la lección se abre sola la primera vez
}

/* ---------- Mostrar resultados ---------- */
function tabla(res) {
  if (!res.filas.length) return "<p>La consulta no ha devuelto ninguna fila.</p>";
  return `<table><tr>${res.columnas.map(c => `<th>${c}</th>`).join("")}</tr>` +
    res.filas.map(f => `<tr>${res.columnas.map(c => `<td>${f[c] === null ? "NULL" : esc(f[c])}</td>`).join("")}</tr>`).join("") + "</table>";
}
function htmlSalidas(sal) {   // una línea por sentencia ejecutada: ✔, ✖ o tabla de resultados
  return sal.map(o => `<div class="salida"><code>${esc(o.sentencia.replace(/\s+/g, " ").slice(0, 100))}</code>` +
    (o.tipo === "error" ? `<p class="ko">✖ ${esc(o.msg)}</p>` : o.tipo === "ok" ? `<p class="ok">✔ ${esc(o.msg)}</p>` : tabla(o)) + "</div>").join("");
}
function exito(cuerpo) {
  const s = estrellasIntento(), mejor = guardarEstrellas(n, s); dibujarTabs();
  const hayMas = n < MISIONES.length - 1;
  abrirVentana("¡Misión completada!", `${cuerpo}<p class="ok">Correcto. ¡Buen trabajo!</p>
    <p>Estrellas de este intento: ${"⭐".repeat(s)}${"☆".repeat(3 - s)} · Mejor: ${mejor}/3</p>${hayMas ? "" : "<p>🎉 ¡Has terminado todas las misiones!</p>"}`,
    [{ texto: "Volver al pueblo" }, ...(hayMas ? [{ texto: "Siguiente misión ▶", principal: true, accion: () => cargarMision(n + 1) }] : [])]);
}

/* ---------- Corrección ---------- */
// Mundo 1: compara el resultado con el de la consulta "solucion"
function corregirConsulta(sal) {
  const err = sal.find(o => o.tipo === "error");
  if (err) { lechuza(err.msg); return; }
  const res = sal[sal.length - 1];
  if (res.tipo !== "tabla") { lechuza("Tu consulta debe ser un SELECT que devuelva filas."); return; }
  if (!res.columnas.includes("id")) { lechuza("Tu resultado no incluye la columna id, así que no sé qué filas has elegido. Prueba con SELECT *."); return; }
  const esperado = ejecutar(M.solucion, bdDesdeTablas(TABLAS)).pop().filas.map(f => f.id), obtenido = res.filas.map(f => f.id);
  const sobran = obtenido.filter(x => !esperado.includes(x)), faltan = esperado.filter(x => !obtenido.includes(x));
  const msg = sobran.length && faltan.length ? "Las filas no coinciden. Revisa el operador o la columna de tu condición."
    : sobran.length ? "Te sobran filas: tu consulta deja pasar elementos que no se pedían."
    : faltan.length ? "Te faltan filas: tu condición deja fuera a alguno que sí se pedía."
    : M.ordenado && obtenido.join() !== esperado.join() ? "Tienes las filas correctas, pero en otro orden." : null;
  const T = TABLAS[M.tabla], cab = `<h4>Resultado: ${res.filas.length} filas</h4>`;
  if (!msg) {
    dibujarFichas(M.ordenado ? res.filas.map(f => T.filas.find(x => x.id === f.id)) : T.filas, obtenido);   // si ordena, las fichas se reordenan
    exito(cab + tabla(res));
  } else abrirVentana("Casi…", `${cab}${tabla(res)}<p class="ko">${msg}</p>`, [{ texto: "Volver a intentarlo", principal: true }]);
}
// Mundos 2 y 3: se ejecuta el script y se comprueba el estado final de la base de datos
function corregirConstruccion(sal) {
  dibujarEsquema();
  const err = sal.find(o => o.tipo === "error");
  let msg = err && !M.seguir ? err.msg : null;
  if (!msg) { try { msg = M.comprobar(db, sal); } catch (e) { msg = "Revisa tu script: faltan tablas o columnas por crear."; } }
  if (!msg) exito(htmlSalidas(sal));
  else abrirVentana("Casi…", `${htmlSalidas(sal)}<p class="ko">${esc(msg)}</p>`, [{ texto: "Volver a intentarlo", principal: true }]);
}

/* ---------- Botones ---------- */
$("ejecutar").onclick = () => {
  lechuza(""); db = nuevaDB();   // cada intento parte del estado inicial de la misión
  const sal = ejecutar($("sql").value, db, { seguir: !!M.seguir });
  M.tabla ? corregirConsulta(sal) : corregirConstruccion(sal);
};
// "Ver tabla": datos de la tabla de la misión (o las tablas que ya existen), sin gastar pistas
$("previa").onclick = () => {
  const d = M.tabla ? bdDesdeTablas(TABLAS) : db, ts = Object.values(d.tablas).filter(t => !M.tabla || t.nombre === M.tabla);
  abrirVentana("📋 Ver tabla", ts.length ? ts.map(t => `<p>Tabla <b>${t.nombre}</b>: ${t.filas.length} filas · columnas: <b>${t.columnas.map(c => c.nombre).join(", ")}</b></p>` +
      tabla({ columnas: t.columnas.map(c => c.nombre), filas: t.filas })).join("") : "<p>Todavía no hay ninguna tabla. ¡Créala con CREATE TABLE!</p>", [{ texto: "Cerrar", principal: true }]);
};
$("pista").onclick = () => {
  if (pistas >= 3) return;
  lechuza(M.pistas[pistas]); pistas++;
  $("pista").textContent = pistas < 3 ? `Pista ${pistas}/3` : "No hay más pistas";
  if (pistas >= 3) $("pista").disabled = true;
};
$("btnGuia").onclick = abrirGuia;
$("btnLeccion").onclick = abrirLeccion;
$("sql").addEventListener("keydown", e => { if (e.ctrlKey && e.key === "Enter") $("ejecutar").click(); });   // Ctrl+Enter ejecuta

cargarMision(Math.min(+new URLSearchParams(location.search).get("m") || 0, MISIONES.length - 1));
