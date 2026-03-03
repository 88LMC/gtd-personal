import { useState, useEffect, useCallback } from "react";

const DB_KEY = "gtd_v1";
const db = {
  load: () => { try { return JSON.parse(localStorage.getItem(DB_KEY) || "{}"); } catch { return {}; } },
  save: (s) => localStorage.setItem(DB_KEY, JSON.stringify(s)),
  all: () => Object.values(db.load()),
  put: (doc) => {
    const s = db.load();
    const id = doc._id || `${doc.type}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    s[id] = { ...s[id], ...doc, _id: id, updatedAt: Date.now() };
    db.save(s); return s[id];
  },
  del: (id) => { const s = db.load(); delete s[id]; db.save(s); },
  export: () => JSON.stringify(db.load(), null, 2),
  import: (raw) => { try { db.save(JSON.parse(raw)); return true; } catch { return false; } },
};

const BUCKETS = [
  { id: "inbox",   label: "Capturar",    icon: "📥", color: "#818cf8", desc: "Todo lo que llega a tu mente" },
  { id: "next",    label: "Next Action", icon: "⚡", color: "#fbbf24", desc: "Acciones físicas concretas" },
  { id: "agenda",  label: "Agenda",      icon: "📅", color: "#34d399", desc: "Con fecha o persona específica" },
  { id: "waiting", label: "Waiting",     icon: "⏳", color: "#a78bfa", desc: "Delegado, esperando respuesta" },
  { id: "archive", label: "Archivar",    icon: "🗄️", color: "#94a3b8", desc: "Referencia o completado" },
  { id: "trash",   label: "Desechar",    icon: "🗑️", color: "#f87171", desc: "Ya no es relevante" },
];

const PRIORITIES = [
  { id: "high", label: "Alta",  color: "#f87171" },
  { id: "med",  label: "Media", color: "#fbbf24" },
  { id: "low",  label: "Baja",  color: "#34d399" },
];

const parseHashtags = (str = "") =>
  (str.match(/#[\w-áéíóúñÁÉÍÓÚÑ]+/gi) || []).map(t => t.toLowerCase());

const getAllTags = (items) => {
  const set = new Set();
  items.forEach(i => parseHashtags(i.hashtags).forEach(t => set.add(t)));
  return [...set].sort();
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500;1,400&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #080810; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
  .gtd-root { min-height: 100vh; background: #080810; color: #dde1f0; font-family: 'Bricolage Grotesque', sans-serif; display: flex; flex-direction: column; }
  .topbar { position: sticky; top: 0; z-index: 100; background: rgba(8,8,16,0.9); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.05); height: 52px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; }
  .logo { font-size: 19px; font-weight: 800; letter-spacing: -1px; color: #fff; }
  .logo span { color: #818cf8; }
  .topbar-btns { display: flex; gap: 6px; }
  .topbtn { background: transparent; border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; color: #666; padding: 5px 11px; font-size: 12px; cursor: pointer; font-family: inherit; transition: all 0.15s; }
  .topbtn.active { background: rgba(129,140,248,0.15); border-color: rgba(129,140,248,0.3); color: #818cf8; }
  .nav { display: flex; gap: 4px; overflow-x: auto; padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.04); scrollbar-width: none; }
  .nav::-webkit-scrollbar { display: none; }
  .navbtn { display: flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 8px; border: 1px solid transparent; background: transparent; color: #555; cursor: pointer; font-size: 12px; font-weight: 600; white-space: nowrap; transition: all 0.15s; font-family: inherit; }
  .navbtn.active { background: var(--bc); border-color: var(--bb); color: var(--bt); }
  .badge-count { background: var(--bt); color: #080810; border-radius: 10px; padding: 0 5px; font-size: 10px; font-weight: 800; }
  .main { flex: 1; padding: 18px 14px 100px; max-width: 680px; margin: 0 auto; width: 100%; }
  .section-label { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #3a3a5c; margin-bottom: 12px; margin-top: 4px; }
  .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px; margin-bottom: 8px; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
  .card:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); }
  .card-title { font-size: 14px; font-weight: 600; color: #eef0f8; line-height: 1.4; margin-bottom: 6px; }
  .card-meta { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  .pill { border-radius: 5px; padding: 2px 7px; font-size: 10px; font-weight: 700; }
  .hashtag { display: inline-flex; align-items: center; background: rgba(129,140,248,0.1); border: 1px solid rgba(129,140,248,0.2); color: #818cf8; border-radius: 5px; padding: 1px 7px; font-size: 10px; font-family: 'DM Mono', monospace; cursor: pointer; transition: all 0.12s; user-select: none; }
  .hashtag:hover { background: rgba(129,140,248,0.22); border-color: rgba(129,140,248,0.4); }
  .hashtag.active-filter { background: rgba(129,140,248,0.28); border-color: #818cf8; font-weight: 600; }
  .quick-moves { display: flex; gap: 4px; margin-top: 10px; flex-wrap: wrap; }
  .qbtn { background: none; border: 1px solid rgba(255,255,255,0.05); border-radius: 5px; color: #444; font-size: 10px; padding: 2px 6px; cursor: pointer; font-family: inherit; transition: all 0.12s; }
  .qbtn:hover { border-color: rgba(255,255,255,0.15); color: #888; }
  .fab { position: fixed; bottom: 22px; right: 20px; width: 54px; height: 54px; border-radius: 50%; background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%); border: none; color: #fff; font-size: 24px; cursor: pointer; box-shadow: 0 0 0 1px rgba(99,102,241,0.4), 0 8px 32px rgba(99,102,241,0.4); display: flex; align-items: center; justify-content: center; z-index: 200; transition: transform 0.15s; }
  .fab:hover { transform: scale(1.08); }
  .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(10px); display: flex; align-items: flex-end; justify-content: center; z-index: 300; }
  .modal-box { background: #0e0e1e; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px 20px 0 0; padding: 22px 18px 40px; width: 100%; max-width: 680px; max-height: 92vh; overflow-y: auto; }
  .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .modal-title { font-size: 17px; font-weight: 800; color: #fff; }
  .close-btn { background: none; border: none; color: #555; font-size: 20px; cursor: pointer; }
  .field-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #555; margin-bottom: 6px; display: block; }
  .inp { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; color: #eef0f8; font-family: inherit; font-size: 14px; padding: 10px 13px; outline: none; margin-bottom: 8px; transition: border-color 0.15s; }
  .inp:focus { border-color: rgba(129,140,248,0.5); }
  .inp::placeholder { color: #333; }
  textarea.inp { resize: vertical; min-height: 72px; }
  select.inp { cursor: pointer; }
  select.inp option { background: #0e0e1e; }
  .chip-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
  .chip { padding: 5px 11px; border-radius: 7px; font-size: 11px; font-weight: 700; cursor: pointer; border: 1px solid rgba(255,255,255,0.06); background: transparent; color: #555; font-family: inherit; transition: all 0.12s; }
  .chip.on { background: var(--cc); border-color: var(--cb); color: var(--ct); }
  .btn-row { display: flex; gap: 8px; margin-top: 6px; }
  .btn { flex: 1; padding: 11px; border-radius: 10px; border: none; cursor: pointer; font-family: inherit; font-weight: 700; font-size: 13px; transition: all 0.15s; }
  .btn-primary { background: linear-gradient(135deg, #6366f1, #818cf8); color: #fff; }
  .btn-ghost { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: #888; }
  .btn-danger { background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.25); color: #f87171; }
  .empty { text-align: center; padding: 52px 20px; color: #2a2a44; }
  .empty-icon { font-size: 44px; margin-bottom: 12px; }
  .empty-text { font-size: 13px; }
  .search-inp { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; color: #eef0f8; font-family: 'DM Mono', monospace; font-size: 13px; padding: 9px 13px; outline: none; margin-bottom: 8px; }
  .search-inp::placeholder { color: #2a2a44; }
  .filter-bar { display: flex; gap: 5px; flex-wrap: wrap; align-items: center; margin-bottom: 12px; }
  .clear-filter { font-size: 10px; color: #f87171; background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2); border-radius: 5px; padding: 2px 8px; cursor: pointer; font-family: inherit; }
  .tag-suggestions { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 10px; }
  .tag-sug { background: rgba(129,140,248,0.06); border: 1px solid rgba(129,140,248,0.14); border-radius: 5px; color: #555; font-size: 10px; font-family: 'DM Mono', monospace; padding: 3px 8px; cursor: pointer; transition: all 0.12s; }
  .tag-sug:hover { color: #818cf8; border-color: rgba(129,140,248,0.4); background: rgba(129,140,248,0.12); }
  .bucket-header { margin-bottom: 14px; }
  .bucket-name { font-size: 20px; font-weight: 800; margin-bottom: 2px; letter-spacing: -0.5px; }
  .bucket-desc { font-size: 11px; color: #444; }
  .proj-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px; margin-bottom: 8px; border-left: 3px solid var(--pc); }
  .proj-title { font-size: 15px; font-weight: 700; color: #f0f0ff; margin-bottom: 4px; }
  .proj-desc { font-size: 12px; color: #444; margin-bottom: 10px; line-height: 1.5; }
  .proj-actions { display: flex; gap: 6px; }
  .small-btn { background: none; border: 1px solid rgba(255,255,255,0.07); border-radius: 6px; color: #555; font-size: 11px; padding: 4px 9px; cursor: pointer; font-family: inherit; transition: all 0.12s; }
  .small-btn:hover { border-color: rgba(255,255,255,0.15); color: #999; }
  .color-dot { width: 26px; height: 26px; border-radius: 50%; cursor: pointer; transition: transform 0.12s; }
  .color-dot:hover { transform: scale(1.15); }
  .color-row { display: flex; gap: 7px; margin-bottom: 12px; }
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 20px; }
  .stat-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 12px 10px; text-align: center; }
  .stat-num { font-size: 24px; font-weight: 800; }
  .stat-lbl { font-size: 10px; color: #444; margin-top: 2px; }
  .info-block { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 14px; margin-bottom: 12px; font-size: 12px; color: #555; line-height: 1.9; }
  .info-block strong { color: #aaa; }
  input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
`;

function ItemForm({ item, projects, allItems, defaultBucket, onSave, onDelete, onClose }) {
  const [f, setF] = useState({
    title: item?.title || "",
    notes: item?.notes || "",
    bucket: item?.bucket || defaultBucket || "inbox",
    projectId: item?.projectId || "",
    priority: item?.priority || "med",
    dueDate: item?.dueDate || "",
    waitingFor: item?.waitingFor || "",
    context: item?.context || "",
    hashtags: item?.hashtags || "",
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const existingTags = getAllTags(allItems).filter(t => !parseHashtags(f.hashtags).includes(t));
  const addTag = (tag) => {
    const cur = f.hashtags.trim();
    set("hashtags", cur ? `${cur} ${tag}` : tag);
  };

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">{item ? "Editar entrada" : "Nueva entrada"}</span>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <label className="field-label">Título *</label>
        <input className="inp" placeholder="¿Qué tienes en mente?" value={f.title}
          onChange={e => set("title", e.target.value)} autoFocus />

        <label className="field-label">Bandeja</label>
        <div className="chip-row">
          {BUCKETS.map(b => (
            <button key={b.id} className={`chip${f.bucket === b.id ? " on" : ""}`}
              style={{"--cc":`${b.color}20`,"--cb":`${b.color}50`,"--ct":b.color}}
              onClick={() => set("bucket", b.id)}>{b.icon} {b.label}</button>
          ))}
        </div>

        <label className="field-label">Prioridad</label>
        <div className="chip-row">
          {PRIORITIES.map(p => (
            <button key={p.id} className={`chip${f.priority === p.id ? " on" : ""}`}
              style={{"--cc":`${p.color}20`,"--cb":`${p.color}50`,"--ct":p.color}}
              onClick={() => set("priority", p.id)}>{p.label}</button>
          ))}
        </div>

        {projects.length > 0 && <>
          <label className="field-label">Proyecto (opcional)</label>
          <select className="inp" value={f.projectId} onChange={e => set("projectId", e.target.value)}>
            <option value="">— Sin proyecto —</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
          </select>
        </>}

        {f.bucket === "agenda" && <>
          <label className="field-label">Fecha</label>
          <input className="inp" type="date" value={f.dueDate} onChange={e => set("dueDate", e.target.value)} />
        </>}

        {f.bucket === "waiting" && <>
          <label className="field-label">Esperando a</label>
          <input className="inp" placeholder="Nombre o empresa..." value={f.waitingFor}
            onChange={e => set("waitingFor", e.target.value)} />
        </>}

        <label className="field-label">Contexto</label>
        <input className="inp" placeholder="@casa  @oficina  @llamadas..." value={f.context}
          onChange={e => set("context", e.target.value)} />

        <label className="field-label">Hashtags</label>
        <input className="inp" placeholder="#deep-work  #energia-alta  #15min  #revisión..."
          value={f.hashtags} onChange={e => set("hashtags", e.target.value)}
          style={{fontFamily:"'DM Mono', monospace", fontSize: 13}} />
        {existingTags.length > 0 && (
          <div className="tag-suggestions">
            <span style={{fontSize:10,color:"#333",marginRight:2}}>usar:</span>
            {existingTags.map(t => (
              <button key={t} className="tag-sug" onClick={() => addTag(t)}>{t}</button>
            ))}
          </div>
        )}

        <label className="field-label">Notas</label>
        <textarea className="inp" placeholder="Detalles, links, contexto adicional..."
          value={f.notes} onChange={e => set("notes", e.target.value)} />

        <div className="btn-row">
          {item && <button className="btn btn-danger" onClick={() => { onDelete(item._id); onClose(); }}>Eliminar</button>}
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => {
            if (!f.title.trim()) return;
            onSave({ ...item, ...f, type: "item" });
            onClose();
          }}>{item ? "Guardar" : "Capturar +"}</button>
        </div>
      </div>
    </div>
  );
}

function ProjectForm({ project, onSave, onDelete, onClose }) {
  const COLORS = ["#818cf8","#fbbf24","#34d399","#f87171","#a78bfa","#22d3ee","#fb923c","#f472b6"];
  const [f, setF] = useState({
    title: project?.title || "",
    description: project?.description || "",
    status: project?.status || "active",
    color: project?.color || "#818cf8",
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">{project ? "Editar proyecto" : "Nuevo proyecto"}</span>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <label className="field-label">Nombre *</label>
        <input className="inp" placeholder="Ej: Lanzar campaña Q2" value={f.title}
          onChange={e => set("title", e.target.value)} autoFocus />
        <label className="field-label">Resultado esperado</label>
        <textarea className="inp" placeholder="¿Cómo sabrás que está terminado?"
          value={f.description} onChange={e => set("description", e.target.value)} />
        <label className="field-label">Color</label>
        <div className="color-row">
          {COLORS.map(c => (
            <div key={c} className="color-dot" onClick={() => set("color", c)}
              style={{background:c, border: f.color===c ? "2px solid #fff" : "2px solid transparent"}} />
          ))}
        </div>
        <label className="field-label">Estado</label>
        <div className="chip-row">
          {[["active","Activo","#34d399"],["paused","Pausado","#fbbf24"],["done","Completado","#94a3b8"]].map(([id,lbl,col]) => (
            <button key={id} className={`chip${f.status===id?" on":""}`}
              style={{"--cc":`${col}20`,"--cb":`${col}50`,"--ct":col}}
              onClick={() => set("status", id)}>{lbl}</button>
          ))}
        </div>
        <div className="btn-row">
          {project && <button className="btn btn-danger" onClick={() => { onDelete(project._id); onClose(); }}>Eliminar</button>}
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => {
            if (!f.title.trim()) return;
            onSave({ ...project, ...f, type: "project" });
            onClose();
          }}>{project ? "Guardar" : "Crear proyecto"}</button>
        </div>
      </div>
    </div>
  );
}

function ItemCard({ item, projects, onEdit, onMoveTo, onTagClick, activeTag }) {
  const bucket = BUCKETS.find(b => b.id === item.bucket);
  const project = projects.find(p => p._id === item.projectId);
  const priority = PRIORITIES.find(p => p.id === item.priority);
  const tags = parseHashtags(item.hashtags);

  return (
    <div className="card" style={{borderLeft:`3px solid ${bucket?.color||"#333"}`}} onClick={() => onEdit(item)}>
      <div className="card-title">{item.title}</div>
      <div className="card-meta">
        {priority && <span className="pill" style={{background:`${priority.color}18`,color:priority.color,border:`1px solid ${priority.color}40`}}>{priority.label}</span>}
        {project && <span className="pill" style={{background:`${project.color||"#818cf8"}18`,color:project.color||"#818cf8",border:`1px solid ${project.color||"#818cf8"}40`}}>📁 {project.title}</span>}
        {item.context && <span style={{fontSize:10,color:"#818cf8",fontFamily:"'DM Mono',monospace"}}>{item.context}</span>}
        {item.dueDate && <span style={{fontSize:10,color:"#34d399"}}>📅 {item.dueDate}</span>}
        {item.waitingFor && <span style={{fontSize:10,color:"#a78bfa"}}>⏳ {item.waitingFor}</span>}
        {tags.map(t => (
          <span key={t} className={`hashtag${activeTag===t?" active-filter":""}`}
            onClick={e => { e.stopPropagation(); onTagClick(t); }}>{t}</span>
        ))}
        {item.notes && <span style={{fontSize:10,color:"#2a2a44"}}>· notas</span>}
      </div>
      <div className="quick-moves" onClick={e => e.stopPropagation()}>
        {BUCKETS.filter(b => b.id !== item.bucket).map(b => (
          <button key={b.id} className="qbtn" onClick={() => onMoveTo(item._id, b.id)}>→ {b.icon} {b.label}</button>
        ))}
      </div>
    </div>
  );
}

function ProjectsView({ projects, items, onEdit, onNew, onNewItem }) {
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div className="section-label" style={{marginBottom:0}}>Proyectos</div>
        <button className="btn btn-primary" style={{flex:"none",padding:"7px 14px",fontSize:12}} onClick={onNew}>+ Nuevo</button>
      </div>
      {projects.length === 0 && (
        <div className="empty">
          <div className="empty-icon">📁</div>
          <div className="empty-text">Sin proyectos todavía<br/><span style={{fontSize:11,color:"#222"}}>Un proyecto = algo que requiere más de una acción</span></div>
        </div>
      )}
      {projects.map(p => {
        const pItems = items.filter(i => i.projectId === p._id && i.bucket !== "archive" && i.bucket !== "trash");
        const sc = p.status==="active"?"#34d399":p.status==="paused"?"#fbbf24":"#94a3b8";
        const sl = p.status==="active"?"Activo":p.status==="paused"?"Pausado":"Completado";
        return (
          <div key={p._id} className="proj-card" style={{"--pc":p.color||"#818cf8"}}>
            <div className="proj-title">{p.title}</div>
            {p.description && <div className="proj-desc">{p.description}</div>}
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
              <span className="pill" style={{background:`${sc}18`,color:sc,border:`1px solid ${sc}40`}}>{sl}</span>
              <span style={{fontSize:10,color:"#444"}}>{pItems.length} acciones pendientes</span>
            </div>
            <div className="proj-actions">
              <button className="small-btn" onClick={() => onNewItem(p._id)}>+ Acción</button>
              <button className="small-btn" onClick={() => onEdit(p)}>✎ Editar</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SettingsView({ items, projects }) {
  const [msg, setMsg] = useState("");
  const allTags = getAllTags(items);

  const doExport = () => {
    const blob = new Blob([db.export()], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `gtd_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    setMsg("✅ Backup exportado"); setTimeout(() => setMsg(""), 3000);
  };

  const doImport = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = ".json";
    input.onchange = e => {
      const reader = new FileReader();
      reader.onload = ev => {
        if (db.import(ev.target.result)) { setMsg("✅ Importado. Recargando..."); setTimeout(() => window.location.reload(), 1500); }
        else setMsg("❌ Error al importar");
      };
      reader.readAsText(e.target.files[0]);
    };
    input.click();
  };

  return (
    <div>
      <div className="section-label">Resumen</div>
      <div className="stats-grid">
        {BUCKETS.map(b => (
          <div key={b.id} className="stat-card">
            <div style={{fontSize:20}}>{b.icon}</div>
            <div className="stat-num" style={{color:b.color}}>{items.filter(i=>i.bucket===b.id).length}</div>
            <div className="stat-lbl">{b.label}</div>
          </div>
        ))}
        <div className="stat-card">
          <div style={{fontSize:20}}>📁</div>
          <div className="stat-num" style={{color:"#818cf8"}}>{projects.length}</div>
          <div className="stat-lbl">Proyectos</div>
        </div>
        <div className="stat-card">
          <div style={{fontSize:18,fontFamily:"'DM Mono',monospace",color:"#818cf8"}}>#</div>
          <div className="stat-num" style={{color:"#818cf8"}}>{allTags.length}</div>
          <div className="stat-lbl">Hashtags</div>
        </div>
      </div>

      {allTags.length > 0 && <>
        <div className="section-label">Todos los hashtags</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>
          {allTags.map(t => (
            <span key={t} className="hashtag" style={{cursor:"default"}}>
              {t}<span style={{marginLeft:5,opacity:0.5,fontFamily:"'DM Mono',monospace"}}>
                {items.filter(i=>parseHashtags(i.hashtags).includes(t)).length}
              </span>
            </span>
          ))}
        </div>
      </>}

      <div className="section-label">Backup</div>
      <div className="info-block" style={{marginBottom:10}}>
        Datos guardados localmente en este dispositivo. Exporta un backup regularmente.
      </div>
      <div className="btn-row" style={{marginBottom:20}}>
        <button className="btn btn-ghost" onClick={doExport}>⬇ Exportar JSON</button>
        <button className="btn btn-ghost" onClick={doImport}>⬆ Importar JSON</button>
      </div>
      {msg && <div style={{fontSize:13,color:"#34d399",marginBottom:12}}>{msg}</div>}

      <div className="section-label">Metodología GTD</div>
      <div className="info-block">
        <strong>Getting Things Done</strong> — David Allen<br/>
        📥 <strong>Capturar</strong> — Todo lo que llega a tu mente, sin filtrar<br/>
        ⚡ <strong>Next Action</strong> — La próxima acción física y concreta<br/>
        📅 <strong>Agenda</strong> — Vinculado a fecha o persona específica<br/>
        ⏳ <strong>Waiting</strong> — Delegado, esperando respuesta de alguien<br/>
        🗄️ <strong>Archivar</strong> — Referencia o tarea completada<br/>
        🗑️ <strong>Desechar</strong> — Ya no es relevante, fuera del sistema
      </div>
    </div>
  );
}

export default function App() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [view, setView] = useState("bucket");
  const [bucket, setBucket] = useState("inbox");
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [showItem, setShowItem] = useState(false);
  const [showProj, setShowProj] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editProj, setEditProj] = useState(null);
  const [newItemProjId, setNewItemProjId] = useState("");

  const reload = useCallback(() => {
    const all = db.all();
    setItems(all.filter(d=>d.type==="item").sort((a,b)=>b.updatedAt-a.updatedAt));
    setProjects(all.filter(d=>d.type==="project").sort((a,b)=>b.updatedAt-a.updatedAt));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const saveItem = doc => { db.put(doc); reload(); };
  const saveProj = doc => { db.put(doc); reload(); };
  const delItem = id => { db.del(id); reload(); };
  const delProj = id => {
    db.all().filter(d=>d.type==="item"&&d.projectId===id).forEach(i=>db.put({...i,projectId:""}));
    db.del(id); reload();
  };
  const moveTo = (id, nb) => {
    const item = db.all().find(d=>d._id===id);
    if (item) { db.put({...item,bucket:nb}); reload(); }
  };
  const handleTagClick = tag => { setActiveTag(p => p===tag?"":tag); setSearch(""); };

  const bkt = BUCKETS.find(b=>b.id===bucket);
  const visible = items.filter(i => {
    if (view !== "bucket") return false;
    if (i.bucket !== bucket) return false;
    if (activeTag && !parseHashtags(i.hashtags).includes(activeTag)) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!i.title.toLowerCase().includes(q) && !i.notes?.toLowerCase().includes(q) &&
          !i.hashtags?.toLowerCase().includes(q) && !i.context?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const bucketTags = [...new Set(items.filter(i=>i.bucket===bucket).flatMap(i=>parseHashtags(i.hashtags)))].sort();

  return (
    <>
      <style>{css}</style>
      <div className="gtd-root">
        <div className="topbar">
          <div className="logo">GTD<span>.</span></div>
          <div className="topbar-btns">
            <button className={`topbtn${view==="projects"?" active":""}`} onClick={() => setView("projects")}>📁 Proyectos</button>
            <button className={`topbtn${view==="settings"?" active":""}`} onClick={() => setView("settings")}>⚙️</button>
          </div>
        </div>

        {view === "bucket" && (
          <div className="nav">
            {BUCKETS.map(b => {
              const count = items.filter(i=>i.bucket===b.id).length;
              return (
                <button key={b.id} className={`navbtn${bucket===b.id?" active":""}`}
                  style={{"--bc":`${b.color}18`,"--bb":`${b.color}44`,"--bt":b.color}}
                  onClick={() => { setBucket(b.id); setView("bucket"); setSearch(""); setActiveTag(""); }}>
                  {b.icon} {b.label}
                  {count > 0 && <span className="badge-count" style={{"--bt":b.color}}>{count}</span>}
                </button>
              );
            })}
          </div>
        )}

        <div className="main">
          {view === "bucket" && (
            <>
              <div className="bucket-header">
                <div className="bucket-name">{bkt?.icon} {bkt?.label}</div>
                <div className="bucket-desc">{bkt?.desc}</div>
              </div>
              <input className="search-inp" placeholder="/ buscar título, notas, #tags..."
                value={search} onChange={e => { setSearch(e.target.value); setActiveTag(""); }} />
              {bucketTags.length > 0 && (
                <div className="filter-bar">
                  {bucketTags.map(t => (
                    <span key={t} className={`hashtag${activeTag===t?" active-filter":""}`}
                      onClick={() => handleTagClick(t)}>{t}</span>
                  ))}
                  {activeTag && <button className="clear-filter" onClick={() => setActiveTag("")}>✕ quitar filtro</button>}
                </div>
              )}
              {visible.length === 0 && (
                <div className="empty">
                  <div className="empty-icon">{bkt?.icon}</div>
                  <div className="empty-text">{(search||activeTag) ? "Sin resultados para ese filtro" : "Esta bandeja está vacía"}</div>
                </div>
              )}
              {visible.map(item => (
                <ItemCard key={item._id} item={item} projects={projects}
                  onEdit={i => { setEditItem(i); setShowItem(true); }}
                  onMoveTo={moveTo} onTagClick={handleTagClick} activeTag={activeTag} />
              ))}
            </>
          )}
          {view === "projects" && (
            <ProjectsView projects={projects} items={items}
              onEdit={p => { setEditProj(p); setShowProj(true); }}
              onNew={() => { setEditProj(null); setShowProj(true); }}
              onNewItem={pid => { setEditItem(null); setNewItemProjId(pid); setShowItem(true); }} />
          )}
          {view === "settings" && <SettingsView items={items} projects={projects} />}
        </div>

        {view !== "settings" && (
          <button className="fab" onClick={() => { setEditItem(null); setNewItemProjId(""); setShowItem(true); }}>+</button>
        )}

        {showItem && (
          <ItemForm item={editItem} projects={projects} allItems={items}
            defaultBucket={view==="bucket"?bucket:"inbox"}
            onSave={doc => { if (newItemProjId && !doc.projectId) doc.projectId = newItemProjId; saveItem(doc); }}
            onDelete={delItem}
            onClose={() => { setShowItem(false); setEditItem(null); setNewItemProjId(""); }} />
        )}
        {showProj && (
          <ProjectForm project={editProj} onSave={saveProj} onDelete={delProj}
            onClose={() => { setShowProj(false); setEditProj(null); }} />
        )}
      </div>
    </>
  );
}
