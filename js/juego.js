/* =====================================================
   LÓGICA DEL JUEGO  ·  usa: motor-sql.js, misiones.js, guia.js
   ===================================================== */
const $ = id => document.getElementById(id);
const CLAVE = "pueblosql_estrellas";   // dónde se guardan las estrellas en el navegador

let n = 0;       // número de la misión actual
let pistas = 0;  // pistas usadas en esta misión
let M;           // misión actual

/* ---------- Estrellas guardadas (localStorage) ---------- */
function leerEstrellas() { try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) { return {}; } }
function guardarEstrellas(i, s) {
  const d = leerEstrellas();
  if (s > (d[i] || 0)) { d[i] = s; try { localStorage.setItem(CLAVE, JSON.stringify(d)); } catch (e) {} }
  return d[i] || 0;
}
const estrellasIntento = () => 3 - Math.min(2, pistas);   // 3 sin pistas, 2 con una, 1 con dos o más

/* ---------- Dibujo de la pantalla ---------- */
function dibujarTabs() {
  const est = leerEstrellas();
  $("tabs").innerHTML = MISIONES.map((m, i) =>
    `<button class="btn tab ${i === n ? "on" : ""}" data-i="${i}">${i + 1} ${"⭐".repeat(est[i] || 0)}</button>`).join("");
  document.querySelectorAll(".tab").forEach(b => b.onclick = () => cargarMision(+b.dataset.i));
}
// Una "ficha" por cada fila de la tabla. "marcadas" = ids resaltados en blanco
function dibujarFichas(filas, marcadas = []) {
  const T = TABLAS[M.tabla];
  $("campo").innerHTML = filas.map(f =>
    `<div class="ficha ${marcadas.includes(f.id) ? "marcada" : ""}"><span class="ico">${T.icono(f)}</span>${f[T.etiqueta]}</div>`).join("");
}
function lechuza(msg) { const l = $("lechuza"); l.style.display = msg ? "flex" : "none"; $("lechuzaMsg").textContent = msg; }

function cargarMision(i) {
  n = i; M = MISIONES[i]; pistas = 0;
  $("titulo").textContent = `Misión ${i + 1} · ${M.titulo}`;
  $("npc").textContent = M.npc;
  $("pregunta").textContent = M.pregunta;
  $("sql").value = M.inicio;
  $("pista").textContent = "Pista 0/3"; $("pista").disabled = false;
  lechuza(""); dibujarTabs(); dibujarFichas(TABLAS[M.tabla].filas);
}

/* ---------- Corrección: compara con la consulta "solucion" ---------- */
function corregir(res) {
  if (!res.columnas.includes("id")) return { ok: false, msg: "Tu resultado no incluye la columna id, así que no sé qué filas has elegido. Prueba con SELECT *." };
  const esperado = runQuery(M.solucion, TABLAS).filas.map(f => f.id);
  const obtenido = res.filas.map(f => f.id);
  const sobran = obtenido.filter(x => !esperado.includes(x)), faltan = esperado.filter(x => !obtenido.includes(x));
  if (sobran.length && faltan.length) return { ok: false, msg: "Las filas no coinciden. Revisa el operador o la columna de tu condición." };
  if (sobran.length) return { ok: false, msg: "Te sobran filas: tu consulta deja pasar elementos que no se pedían." };
  if (faltan.length) return { ok: false, msg: "Te faltan filas: tu condición deja fuera a alguno que sí se pedía." };
  if (M.ordenado && obtenido.join() !== esperado.join()) return { ok: false, msg: "Tienes las filas correctas, pero en otro orden." };
  return { ok: true };
}
function tabla(res) {
  if (!res.filas.length) return "<p>La consulta no ha devuelto ninguna fila.</p>";
  return `<table><tr>${res.columnas.map(c => `<th>${c}</th>`).join("")}</tr>` +
    res.filas.map(f => `<tr>${res.columnas.map(c => `<td>${f[c]}</td>`).join("")}</tr>`).join("") + "</table>";
}

/* ---------- Botones ---------- */
$("ejecutar").onclick = () => {
  lechuza("");
  let res;
  try { res = runQuery($("sql").value, TABLAS); }
  catch (e) { if (!(e instanceof SqlError)) throw e; lechuza(e.message); return; }

  const r = corregir(res), cab = `<h4>Resultado: ${res.filas.length} filas</h4>`;
  if (r.ok) {
    const T = TABLAS[M.tabla];
    // Si la misión es de ordenar, las fichas se reordenan como el resultado
    dibujarFichas(M.ordenado ? res.filas.map(f => T.filas.find(x => x.id === f.id)) : T.filas, res.filas.map(f => f.id));
    const s = estrellasIntento(), mejor = guardarEstrellas(n, s); dibujarTabs();
    const hayMas = n < MISIONES.length - 1;
    abrirVentana("¡Misión completada!", `${cab}${tabla(res)}<p class="ok">Correcto. ¡Buen trabajo!</p>
      <p>Estrellas de este intento: ${"⭐".repeat(s)}${"☆".repeat(3 - s)} · Mejor: ${mejor}/3</p>
      ${hayMas ? "" : "<p>🎉 ¡Has terminado todas las misiones!</p>"}`,
      [{ texto: "Volver al pueblo" }, ...(hayMas ? [{ texto: "Siguiente misión ▶", principal: true, accion: () => cargarMision(n + 1) }] : [])]);
  } else {
    abrirVentana("Casi…", `${cab}${tabla(res)}<p class="ko">${r.msg}</p>`, [{ texto: "Volver a intentarlo", principal: true }]);
  }
};
$("previa").onclick = () => abrirVentana(`Vista previa · tabla ${M.tabla}`, tabla(runQuery(`SELECT * FROM ${M.tabla}`, TABLAS)), [{ texto: "Cerrar", principal: true }]);
$("pista").onclick = () => {
  if (pistas >= 3) return;
  lechuza(M.pistas[pistas]); pistas++;
  $("pista").textContent = pistas < 3 ? `Pista ${pistas}/3` : "No hay más pistas";
  if (pistas >= 3) $("pista").disabled = true;
};
$("btnGuia").onclick = abrirGuia;
$("sql").addEventListener("keydown", e => { if (e.ctrlKey && e.key === "Enter") $("ejecutar").click(); });  // Ctrl+Enter ejecuta

cargarMision(Math.min(+new URLSearchParams(location.search).get("m") || 0, MISIONES.length - 1));
