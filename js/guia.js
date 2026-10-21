/* =====================================================
   VENTANAS Y GUÍA DE COMANDOS (se usa en index.html y juego.html)
   - abrirVentana(): mini ventana emergente reutilizable
   - abrirGuia():    ventana con "para qué sirve cada comando"
   Para añadir un comando a la guía, añade un objeto a GUIA.
   ===================================================== */
const GUIA = [
  { t: "🗂️ Tablas, filas y columnas", d: "Una tabla es una lista. Cada fila es un elemento (un vecino, una casa) y cada columna es un dato suyo (nombre, edad…).", e: "vecinos → id | nombre | oficio | edad" },
  { t: "SELECT", d: "Elige QUÉ columnas quieres ver. El asterisco * significa «todas».", e: "SELECT nombre, edad …   o   SELECT * …" },
  { t: "FROM", d: "Dice DE QUÉ tabla salen los datos.", e: "SELECT * FROM vecinos" },
  { t: "WHERE", d: "Filtra: solo se quedan las filas que cumplen una condición.", e: "SELECT * FROM parcelas WHERE dias_sin_regar > 3" },
  { t: "Operadores", d: "Sirven para comparar: =  igual · >  mayor · <  menor · >=  mayor o igual · <=  menor o igual · <>  distinto.", e: "edad >= 40" },
  { t: "Textos", d: "Los textos se escriben entre comillas simples. Los números, sin comillas.", e: "calle = 'Mayor'" },
  { t: "AND / OR", d: "AND: se cumplen las dos condiciones. OR: basta con que se cumpla una.", e: "calle = 'Mayor' AND habitantes > 2" },
  { t: "ORDER BY", d: "Ordena el resultado. ASC (por defecto) de menor a mayor; DESC de mayor a menor.", e: "SELECT * FROM vecinos ORDER BY edad DESC" }
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
  const html = GUIA.map(g => `<div class="tip"><h4>${g.t}</h4><p>${g.d}</p><code>${g.e}</code></div>`).join("");
  abrirVentana("📖 Guía de comandos", html, [{ texto: "¡Entendido!", principal: true }]);
}
