(function () {
  "use strict";

  var CFG = window.PN_CONFIG || {};
  var SERVICIOS = CFG.servicios || ["Identidad visual", "Logo", "Instagram Pro", "Otro"];
  var WORDS = ["", "Mejorable", "Correcto", "Bien", "Muy bien", "Me enamoró"];
  var TONES = ["t-paper", "t-cocoa", "t-caramel"];
  var STAR = "M12 1.8l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 17.9l-6.4 3.5 1.4-7.1-5.3-5 7.2-.9z";

  var $ = function (id) { return document.getElementById(id); };
  var sb = null;
  var demo = !(CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase);
  if (!demo) {
    try { sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey); }
    catch (e) { demo = true; }
  }

  var state = { reviews: [], filter: "Todas", sort: "recent", freshId: null };

  /* ---------- Apertura ---------- */
  var intro = $("intro");
  function goLive() { document.body.classList.add("is-live"); }
  function endIntro() { intro.classList.add("is-done"); }
  var seen = false;
  try { seen = sessionStorage.getItem("pn-intro") === "1"; } catch (e) {}
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (seen || reduce) { endIntro(); goLive(); }
  else {
    try { sessionStorage.setItem("pn-intro", "1"); } catch (e) {}
    var tLive = setTimeout(goLive, 2250);
    var tEnd = setTimeout(endIntro, 3150);
    $("skip").addEventListener("click", function () {
      clearTimeout(tLive); clearTimeout(tEnd);
      intro.classList.add("is-skipping"); goLive();
      setTimeout(endIntro, 650);
    });
  }

  /* ---------- Utilidades ---------- */
  function starsSVG(n) {
    var out = "";
    for (var i = 1; i <= 5; i++) {
      out += '<svg viewBox="0 0 24 24"><path class="' + (i <= n ? "on" : "off") + '" d="' + STAR + '"/></svg>';
    }
    return out;
  }
  function hash(s) { var h = 0; s = String(s); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
  var rtf = window.Intl && Intl.RelativeTimeFormat ? new Intl.RelativeTimeFormat("es", { numeric: "auto" }) : null;
  function when(iso) {
    var d = new Date(iso), diff = (d - new Date()) / 1000;
    var units = [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]];
    if (!rtf) return d.toLocaleDateString("es-ES");
    for (var i = 0; i < units.length; i++) {
      if (Math.abs(diff) >= units[i][1]) return rtf.format(Math.round(diff / units[i][1]), units[i][0]);
    }
    return "ahora mismo";
  }
  function isNew(iso) { return (Date.now() - new Date(iso)) < 14 * 86400000; }

  function buildCard(r, idx) {
    var node = $("cardTpl").content.firstElementChild.cloneNode(true);
    var h = hash(r.id || r.nombre);
    node.classList.add(TONES[h % 3]);
    node.style.setProperty("--r", (((h >> 3) % 7) - 3) * 0.7 + "deg");
    node.style.setProperty("--i", idx || 0);
    node.querySelector(".stars").innerHTML = starsSVG(r.puntuacion);
    node.querySelector(".stars").setAttribute("aria-label", r.puntuacion + " de 5 estrellas");
    node.querySelector(".stars").removeAttribute("aria-hidden");
    var badge = node.querySelector(".badge");
    if (r._demo) { badge.hidden = false; badge.textContent = "Ejemplo"; badge.classList.add("is-example"); }
    else if (r.created_at && isNew(r.created_at)) badge.hidden = false;
    node.querySelector(".card-text").textContent = r.texto;
    node.querySelector(".avatar").textContent = (r.nombre || "?").trim().charAt(0).toUpperCase();
    node.querySelector(".who-name").textContent = r.nombre;
    var meta = [r.negocio, r.servicio].filter(Boolean).join(" · ");
    if (r.created_at) meta += (meta ? " · " : "") + when(r.created_at);
    node.querySelector(".who-meta").textContent = meta;
    return node;
  }

  /* ---------- Resumen ---------- */
  function renderScore() {
    var list = state.reviews, n = list.length;
    var sum = 0, counts = [0, 0, 0, 0, 0, 0];
    list.forEach(function (r) { sum += r.puntuacion; counts[r.puntuacion]++; });
    var avg = n ? sum / n : 0;
    $("avg").textContent = n ? avg.toFixed(1).replace(".", ",") : "–";
    $("avgStars").innerHTML = starsSVG(Math.round(avg));
    $("count").textContent = n ? "de 5 · " + n + (n === 1 ? " reseña" : " reseñas") : "Aún no hay reseñas";
    var dist = $("dist"); dist.innerHTML = "";
    for (var s = 5; s >= 1; s--) {
      var li = document.createElement("li");
      var pct = n ? (counts[s] / n) * 100 : 0;
      li.innerHTML = "<span>" + s + "★</span><span class='track'><span class='fill'></span></span><span class='n'>" + counts[s] + "</span>";
      dist.appendChild(li);
      (function (fill, p) { requestAnimationFrame(function () { requestAnimationFrame(function () { fill.style.width = p + "%"; }); }); })(li.querySelector(".fill"), pct);
    }
  }

  /* ---------- Filtros ---------- */
  function renderChips() {
    var box = $("chips"); box.innerHTML = "";
    var used = {};
    state.reviews.forEach(function (r) { used[r.servicio] = (used[r.servicio] || 0) + 1; });
    var opts = ["Todas"].concat(SERVICIOS.filter(function (s) { return used[s]; }));
    if (opts.indexOf(state.filter) < 0) state.filter = "Todas";
    opts.forEach(function (s) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip";
      b.setAttribute("aria-pressed", String(s === state.filter));
      b.innerHTML = "";
      b.appendChild(document.createTextNode(s));
      var k = document.createElement("span"); k.className = "k";
      k.textContent = s === "Todas" ? state.reviews.length : used[s];
      b.appendChild(k);
      b.addEventListener("click", function () { state.filter = s; renderChips(); renderWall(); });
      box.appendChild(b);
    });
  }

  function renderWall() {
    var wall = $("wall"); wall.innerHTML = "";
    var list = state.reviews.filter(function (r) { return state.filter === "Todas" || r.servicio === state.filter; });
    list.sort(function (a, b) {
      if (state.sort === "best" && b.puntuacion !== a.puntuacion) return b.puntuacion - a.puntuacion;
      return new Date(b.created_at) - new Date(a.created_at);
    });
    list.forEach(function (r, i) {
      var c = buildCard(r, i);
      if (r.id === state.freshId) c.classList.add("is-fresh");
      wall.appendChild(c);
    });
    $("empty").hidden = state.reviews.length > 0;
  }

  function renderAll() { renderScore(); renderChips(); renderWall(); }

  $("sort").addEventListener("change", function (e) { state.sort = e.target.value; renderWall(); });

  /* ---------- Carga ---------- */
  function demoData() {
    var day = 86400000, now = Date.now();
    return [
      { id: "d1", nombre: "Lucía M.", negocio: "Estudio Alba", servicio: "Identidad visual", puntuacion: 5, texto: "Transformó por completo nuestra imagen. Cada detalle tiene sentido y el resultado superó todo lo que imaginábamos. Proceso claro y muy profesional.", created_at: new Date(now - 3 * day).toISOString() },
      { id: "d2", nombre: "Martín R.", negocio: "Bar La Esquina", servicio: "Letrero de local", puntuacion: 5, texto: "Lo que más valoro es que me escuchó de verdad. No impuso un estilo: construyó el nuestro. El letrero ya es parte del barrio.", created_at: new Date(now - 20 * day).toISOString() },
      { id: "d3", nombre: "Carolina F.", negocio: "Café Aurora", servicio: "Carta o menú", puntuacion: 5, texto: "Trabajamos juntas en la carta nueva y fue una experiencia increíble. Llegó con ideas que no habíamos pensado y la gente ahora fotografía la carta.", created_at: new Date(now - 41 * day).toISOString() },
      { id: "d4", nombre: "Nerea V.", negocio: "Lune Nails", servicio: "Instagram Pro", puntuacion: 4, texto: "Mi perfil por fin parece una marca. Plantillas preciosas y fáciles de usar. Le pondría un poco más de tiempo a la entrega, pero el resultado lo vale.", created_at: new Date(now - 9 * day).toISOString() },
      { id: "d5", nombre: "Àlex P.", negocio: "Mar de Fondo", servicio: "Identidad + Redes", puntuacion: 5, texto: "Logo, colores, tipografías y feed alineados. Ahora todo lo que publicamos se reconoce al instante.", created_at: new Date(now - 70 * day).toISOString() },
      { id: "d6", nombre: "Sofía G.", negocio: "Sal Joyas", servicio: "Logo", puntuacion: 5, texto: "Delicado, elegante y con alma. Exactamente lo que buscaba para mis joyas.", created_at: new Date(now - 120 * day).toISOString() }
    ].map(function (r) { r._demo = true; return r; });
  }

  function load() {
    if (demo) {
      $("demoBanner").hidden = false;
      state.reviews = demoData(); renderAll(); return;
    }
    sb.from("resenas")
      .select("id, created_at, nombre, negocio, servicio, puntuacion, texto")
      .order("created_at", { ascending: false })
      .limit(500)
      .then(function (res) {
        if (res.error) { console.error(res.error); state.reviews = []; renderAll(); $("empty").querySelector("p:last-child").textContent = "No se han podido cargar las reseñas. Recarga la página en un momento."; return; }
        state.reviews = res.data || []; renderAll();
      });
  }

  /* ---------- Formulario ---------- */
  var sel = $("servicio");
  var ph = document.createElement("option"); ph.value = ""; ph.textContent = "Elige un servicio"; sel.appendChild(ph);
  SERVICIOS.forEach(function (s) { var o = document.createElement("option"); o.value = s; o.textContent = s; sel.appendChild(o); });

  var rating = 0, hover = 0;
  var labels = Array.prototype.slice.call(document.querySelectorAll("#rateStars label"));
  function paintStars() {
    var v = hover || rating;
    labels.forEach(function (l, i) { l.classList.toggle("lit", i < v); l.classList.toggle("hot", v === 5 && i < v); });
    $("rateWord").textContent = v ? WORDS[v] : "Elige de 1 a 5";
  }
  labels.forEach(function (l, i) {
    l.addEventListener("mouseenter", function () { hover = i + 1; paintStars(); });
    l.addEventListener("mouseleave", function () { hover = 0; paintStars(); });
  });
  document.querySelectorAll("#rateStars input").forEach(function (inp, i) {
    inp.addEventListener("change", function () {
      rating = i + 1; paintStars(); updatePreview(); $("errRate").hidden = true;
      var l = labels[i]; l.classList.remove("pop"); void l.offsetWidth; l.classList.add("pop");
    });
  });

  var f = { nombre: $("nombre"), negocio: $("negocio"), servicio: sel, texto: $("texto") };
  function current() {
    return {
      id: "preview",
      nombre: f.nombre.value.trim(),
      negocio: f.negocio.value.trim(),
      servicio: f.servicio.value,
      texto: f.texto.value.trim(),
      puntuacion: rating
    };
  }
  function updatePreview() {
    var r = current();
    var shown = {
      id: "preview", nombre: r.nombre || "Tu nombre", negocio: r.negocio, servicio: r.servicio || "Servicio",
      texto: r.texto || "Aquí aparecerá lo que escribas…", puntuacion: rating, created_at: new Date().toISOString()
    };
    var card = buildCard(shown, 0);
    card.classList.remove("t-paper", "t-cocoa", "t-caramel");
    card.classList.add(rating >= 5 ? "t-cocoa" : rating >= 3 ? "t-caramel" : "t-paper");
    if (!r.texto) card.querySelector(".card-text").classList.add("placeholder");
    var box = $("previewCard"); box.innerHTML = ""; box.appendChild(card);
    $("counter").textContent = f.texto.value.length + " / 600";
  }
  ["input", "change"].forEach(function (ev) {
    Object.keys(f).forEach(function (k) { f[k].addEventListener(ev, updatePreview); });
  });
  f.nombre.addEventListener("input", function () { f.nombre.classList.remove("invalid"); $("errNombre").hidden = true; });
  f.texto.addEventListener("input", function () { f.texto.classList.remove("invalid"); $("errTexto").hidden = true; });
  f.servicio.addEventListener("change", function () { f.servicio.classList.remove("invalid"); });
  updatePreview(); paintStars();

  function msg(text, kind) { var m = $("formMsg"); m.textContent = text; m.className = "form-msg" + (kind ? " " + kind : ""); }

  $("form").addEventListener("submit", function (e) {
    e.preventDefault();
    var r = current(), ok = true;
    if (!rating) { $("errRate").hidden = false; ok = false; }
    if (r.nombre.length < 2) { $("errNombre").hidden = false; f.nombre.classList.add("invalid"); ok = false; }
    if (!r.servicio) { f.servicio.classList.add("invalid"); ok = false; }
    if (r.texto.length < 10) { $("errTexto").hidden = false; f.texto.classList.add("invalid"); ok = false; }
    if (!ok) { msg(!r.servicio && r.nombre.length >= 2 && r.texto.length >= 10 && rating ? "Elige qué servicio hicimos juntos." : "Revisa los campos marcados.", "bad"); return; }
    if ($("web").value) { msg("Gracias.", "ok"); return; } // bot

    var last = 0;
    try { last = +localStorage.getItem("pn-last") || 0; } catch (err) {}
    if (Date.now() - last < 60000) { msg("Acabas de publicar una reseña. Espera un minuto para enviar otra.", "bad"); return; }

    var row = { nombre: r.nombre, negocio: r.negocio || null, servicio: r.servicio, puntuacion: rating, texto: r.texto };
    var btn = $("send"); btn.disabled = true; msg("Publicando…");

    var done = function (saved) {
      btn.disabled = false;
      try { localStorage.setItem("pn-last", String(Date.now())); } catch (err) {}
      saved.created_at = saved.created_at || new Date().toISOString();
      state.reviews.unshift(saved); state.freshId = saved.id;
      state.filter = "Todas"; state.sort = "recent"; $("sort").value = "recent";
      renderAll();
      msg(demo ? "Así quedaría publicada (modo vista previa: no se ha guardado)." : "Gracias, " + r.nombre.split(" ")[0] + ". Tu reseña ya está en el muro.", "ok");
      $("form").reset(); rating = 0; paintStars(); updatePreview();
      setTimeout(function () { $("muro").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); }, 500);
    };

    if (demo) { row.id = "local-" + Date.now(); row._demo = true; setTimeout(function () { done(row); }, 400); return; }

    var id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : null;
    if (id) row.id = id;
    sb.from("resenas").insert(row).then(function (res) {
      if (res.error) {
        console.error(res.error); btn.disabled = false;
        msg("No se ha podido publicar. Comprueba tu conexión y vuelve a intentarlo.", "bad"); return;
      }
      row.id = row.id || "new-" + Date.now();
      done(row);
    });
  });

  /* enlaces del pie */
  if (CFG.instagram) { $("igLink").href = "https://instagram.com/" + CFG.instagram; $("igLink").textContent = "Instagram @" + CFG.instagram + " ↗"; }
  if (CFG.portafolio) $("pfLink").href = CFG.portafolio;

  load();
})();
