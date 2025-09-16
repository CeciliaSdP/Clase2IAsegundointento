/* ==========
   Mentoría · Refuerzo Académico (Vanilla JS + localStorage)
   ========== */

const store = {
  key: "mentoria_refuerzo_v1",
  load() {
    const raw = localStorage.getItem(this.key);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },
  save(data) { localStorage.setItem(this.key, JSON.stringify(data)); }
};

const state = (() => {
  const seed = {
    perfil: {
      alumnoNombre: "Alumno/a",
      alumnoCurso: "Curso de reforzamiento",
      mentorNombre: "Profesor/a",
      alumnoNivel: "",
      observaciones: ""
    },
    metas: [
      { id: crypto.randomUUID(), texto: "Identificar fracciones equivalentes", tipo:"corto", fecha:"", done:false },
      { id: crypto.randomUUID(), texto: "Resolver sumas y restas con fracciones", tipo:"medio", fecha:"", done:false }
    ],
    tareas: [
      { id: crypto.randomUUID(), texto:"Fichas pág. 12-13", nivel:"Fácil", fecha:"", done:false },
    ],
    sesiones: [],
    recursos: [],
    notas: []
  };
  return store.load() ?? seed;
})();

/* ---- helpers ---- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const fmtDate = (iso) => iso ? new Date(iso + "T00:00:00").toLocaleDateString() : "—";

/* ---- Perfil ---- */
const perfilForm = $("#perfilForm");
perfilForm.alumnoNombre.value = state.perfil.alumnoNombre;
perfilForm.alumnoCurso.value = state.perfil.alumnoCurso;
perfilForm.mentorNombre.value = state.perfil.mentorNombre;
perfilForm.alumnoNivel.value = state.perfil.alumnoNivel;
perfilForm.observaciones.value = state.perfil.observaciones;

perfilForm.addEventListener("submit", (e) => {
  e.preventDefault();
  state.perfil = {
    alumnoNombre: $("#alumnoNombre").value.trim() || "Alumno/a",
    alumnoCurso: $("#alumnoCurso").value.trim(),
    mentorNombre: $("#mentorNombre").value.trim(),
    alumnoNivel: $("#alumnoNivel").value.trim(),
    observaciones: $("#observaciones").value.trim()
  };
  store.save(state);
  toast("Perfil guardado.");
});

/* ---- Metas ---- */
const metaForm = $("#metaForm");
const listaMetas = $("#listaMetas");

function renderMetas(){
  listaMetas.innerHTML = "";
  if(!state.metas.length){
    listaMetas.innerHTML = `<li class="item"><span>No hay metas aún.</span></li>`;
    return;
  }
  state.metas.forEach(m=>{
    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = `
      <div>
        <strong>${m.texto}</strong>
        <div class="meta">
          <span class="badge">${m.tipo}</span>
          <span class="badge">${m.fecha ? "Objetivo: "+fmtDate(m.fecha) : "Sin fecha"}</span>
        </div>
      </div>
      <div class="actions">
        <button class="btn small" data-action="done">${m.done ? "✔ Hecha" : "Marcar"}</button>
        <button class="btn small ghost" data-action="del">Eliminar</button>
      </div>`;
    li.querySelector('[data-action="done"]').onclick = () => {
      m.done = !m.done; store.save(state); renderMetas(); updateProgress();
    };
    li.querySelector('[data-action="del"]').onclick = () => {
      state.metas = state.metas.filter(x=>x.id!==m.id); store.save(state); renderMetas();
    };
    listaMetas.append(li);
  });
}
metaForm.addEventListener("submit", (e)=>{
  e.preventDefault();
  const texto = $("#metaTexto").value.trim();
  if(!texto) return;
  state.metas.unshift({
    id: crypto.randomUUID(),
    texto,
    tipo: $("#metaTipo").value,
    fecha: $("#metaFecha").value,
    done:false
  });
  metaForm.reset(); store.save(state); renderMetas();
});

/* ---- Tareas ---- */
const tareaForm = $("#tareaForm");
const listaTareas = $("#listaTareas");
const progressBar = $("#progressBar");
const progressPct = $("#progressPct");

function renderTareas(){
  listaTareas.innerHTML = "";
  if(!state.tareas.length){
    listaTareas.innerHTML = `<li class="item"><span>No hay tareas asignadas.</span></li>`;
    updateProgress();
    return;
  }

  state.tareas.forEach(t=>{
    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = `
      <input type="checkbox" class="checkbox" ${t.done ? "checked":""} aria-label="Completar tarea">
      <div>
        <strong>${t.texto}</strong>
        <div class="meta">
          <span class="badge ${t.nivel==="Difícil"?"warn":"ok"}">${t.nivel}</span>
          <span class="badge">${t.fecha ? "Fecha límite: "+fmtDate(t.fecha) : "Sin fecha"}</span>
        </div>
      </div>
      <div class="actions">
        <button class="btn small ghost" data-action="del">Eliminar</button>
      </div>
    `;
    li.querySelector(".checkbox").onchange = (ev)=>{
      t.done = ev.target.checked; store.save(state); updateProgress();
    };
    li.querySelector('[data-action="del"]').onclick = ()=>{
      state.tareas = state.tareas.filter(x=>x.id!==t.id); store.save(state); renderTareas();
    };
    listaTareas.append(li);
  });
  updateProgress();
}
function updateProgress(){
  const total = state.tareas.length;
  const done = state.tareas.filter(t=>t.done).length;
  const pct = total ? Math.round((done/total)*100) : 0;
  progressBar.style.width = pct + "%";
  progressBar.parentElement.setAttribute("aria-valuenow", String(pct));
  progressPct.textContent = pct + "%";
}
tareaForm.addEventListener("submit",(e)=>{
  e.preventDefault();
  const texto = $("#tareaTexto").value.trim();
  if(!texto) return;
  state.tareas.unshift({
    id: crypto.randomUUID(),
    texto,
    nivel: $("#tareaNivel").value,
    fecha: $("#tareaFecha").value,
    done:false
  });
  tareaForm.reset(); store.save(state); renderTareas();
});

/* ---- Sesiones ---- */
const sesionForm = $("#sesionForm");
const listaSesiones = $("#listaSesiones");

function renderSesiones(){
  listaSesiones.innerHTML = "";
  if(!state.sesiones.length){
    listaSesiones.innerHTML = `<li class="item"><span>No hay sesiones programadas.</span></li>`;
    return;
  }
  // Ordenar por fecha ascendente
  state.sesiones.sort((a,b)=> (a.fecha+a.hora).localeCompare(b.fecha+b.hora));
  state.sesiones.forEach(s=>{
    const li = document.createElement("li");
    li.className = "item";
    const fecha = s.fecha ? fmtDate(s.fecha) : "Sin fecha";
    const hora = s.hora || "—";
    li.innerHTML = `
      <div>
        <strong>${fecha} · ${hora}</strong>
        <div class="meta">
          <span class="badge">${s.modalidad}</span>
          <span>${s.objetivo || "Sin objetivo"}</span>
        </div>
      </div>
      <div class="actions">
        <button class="btn small ghost" data-action="del">Eliminar</button>
      </div>
    `;
    li.querySelector('[data-action="del"]').onclick = ()=>{
      state.sesiones = state.sesiones.filter(x=>x.id!==s.id); store.save(state); renderSesiones();
    };
    listaSesiones.append(li);
  });
}
sesionForm.addEventListener("submit",(e)=>{
  e.preventDefault();
  state.sesiones.push({
    id: crypto.randomUUID(),
    fecha: $("#sesionFecha").value,
    hora: $("#sesionHora").value,
    modalidad: $("#sesionModalidad").value,
    objetivo: $("#sesionObjetivo").value.trim()
  });
  sesionForm.reset(); store.save(state); renderSesiones();
});

/* ---- Recursos ---- */
const recursoForm = $("#recursoForm");
const listaRecursos = $("#listaRecursos");

function renderRecursos(){
  listaRecursos.innerHTML = "";
  if(!state.recursos.length){
    listaRecursos.innerHTML = `<li class="item"><span>No hay recursos aún.</span></li>`;
    return;
  }
  state.recursos.forEach(r=>{
    const li = document.createElement("li");
    li.className = "item";
    const urlSafe = r.url ? `<a href="${r.url}" target="_blank" rel="noopener">Abrir</a>` : "—";
    li.innerHTML = `
      <div>
        <strong>${r.titulo}</strong>
        <div class="meta"><span>${r.url || "Sin URL"}</span></div>
      </div>
      <div class="actions">
        ${urlSafe}
        <button class="btn small ghost" data-action="del">Eliminar</button>
      </div>`;
    li.querySelector('[data-action="del"]').onclick = ()=>{
      state.recursos = state.recursos.filter(x=>x.id!==r.id); store.save(state); renderRecursos();
    };
    listaRecursos.append(li);
  });
}
recursoForm.addEventListener("submit",(e)=>{
  e.preventDefault();
  const titulo = $("#recursoTitulo").value.trim();
  if(!titulo) return;
  state.recursos.unshift({
    id: crypto.randomUUID(),
    titulo,
    url: $("#recursoUrl").value.trim()
  });
  recursoForm.reset(); store.save(state); renderRecursos();
});

/* ---- Notas ---- */
const notaForm = $("#notaForm");
const listaNotas = $("#listaNotas");

function renderNotas(){
  listaNotas.innerHTML = "";
  if(!state.notas.length){
    listaNotas.innerHTML = `<li class="item"><span>No hay notas guardadas.</span></li>`;
    return;
  }
  state.notas.forEach(n=>{
    const li = document.createElement("li");
    li.className = "item";
    const fecha = new Date(n.ts).toLocaleString();
    li.innerHTML = `
      <div>
        <strong>${n.texto}</strong>
        <div class="meta"><span>${fecha}</span></div>
      </div>
      <div class="actions">
        <button class="btn small ghost" data-action="del">Eliminar</button>
      </div>`;
    li.querySelector('[data-action="del"]').onclick = ()=>{
      state.notas = state.notas.filter(x=>x.id!==n.id); store.save(state); renderNotas();
    };
    listaNotas.append(li);
  });
}
notaForm.addEventListener("submit",(e)=>{
  e.preventDefault();
  const texto = $("#notaTexto").value.trim();
  if(!texto) return;
  state.notas.unshift({ id: crypto.randomUUID(), texto, ts: Date.now() });
  notaForm.reset(); store.save(state); renderNotas();
});

/* ---- Reset ---- */
$("#resetBtn").addEventListener("click", ()=>{
  if(confirm("¿Seguro que deseas reiniciar todos los datos?")){
    localStorage.removeItem(store.key);
    location.reload();
  }
});

/* ---- Toast mínimo ---- */
function toast(msg){
  let t = document.createElement("div");
  t.textContent = msg;
  Object.assign(t.style,{
    position:"fixed", left:"50%", bottom:"24px", transform:"translateX(-50%)",
    background:"rgba(15,23,42,.95)", color:"#e5e7eb", padding:"10px 14px",
    borderRadius:"12px", border:"1px solid rgba(255,255,255,.08)", zIndex:9999
  });
  document.body.append(t);
  setTimeout(()=>t.remove(), 1600);
}

/* ---- Inicialización ---- */
function init(){
  renderMetas();
  renderTareas();
  renderSesiones();
  renderRecursos();
  renderNotas();
  store.save(state); // asegura persistencia inicial
}
document.addEventListener("DOMContentLoaded", init);
