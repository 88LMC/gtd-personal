import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAB7D1VRQrKctK89JWo3_PwbewdYqdcJGw",
  authDomain: "gtd-personal-ac5a9.firebaseapp.com",
  projectId: "gtd-personal-ac5a9",
  storageBucket: "gtd-personal-ac5a9.firebasestorage.app",
  messagingSenderId: "680306083832",
  appId: "1:680306083832:web:ecf08e75dec1a4b1d3f80d"
};

const firebaseApp = initializeApp(firebaseConfig);
const firestore = getFirestore(firebaseApp);
const COLL = "gtd_items";

const db = {
  put: async (doc_data) => {
    const id = doc_data._id || `${doc_data.type}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    const ref = doc(firestore, COLL, id);
    await setDoc(ref, { ...doc_data, _id: id, updatedAt: Date.now() }, { merge: true });
    return id;
  },
  del: async (id) => { await deleteDoc(doc(firestore, COLL, id)); },
  listen: (callback) => {
    return onSnapshot(collection(firestore, COLL), (snap) => {
      callback(snap.docs.map(d => d.data()));
    });
  },
};

const BUCKETS = [
  { id: "inbox",   label: "Capturar",    icon: "📥", color: "#818cf8", desc: "Todo lo que llega a tu mente" },
  { id: "next",    label: "Next Action", icon: "⚡", color: "#fbbf24", desc: "Acciones físicas concretas" },
  { id: "agenda",  label: "Agenda",      icon: "📅", color: "#34d399", desc: "Con fecha o persona específica" },
  { id: "waiting", label: "Waiting",     icon: "⏳", color: "#a78bfa", desc: "Delegado, esperando respuesta" },
  { id: "archive", label: "Archivar",    icon: "🗄️", color: "#94a3b8", desc: "Referencia o completado" },
  { id: "trash",   label: "Desechar",    icon: "🗑️", color: "#f87171", desc: "Ya no es relevante" },
];

const ENERGY = [
  { id: "high",  label: "⚡ Alta",  color: "#f87171" },
  { id: "med",   label: "🔆 Media", color: "#fbbf24" },
  { id: "low",   label: "🌙 Baja",  color: "#34d399" },
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

  /* TOPBAR */
  .topbar { position: sticky; top: 0; z-index: 100; background: rgba(8,8,16,0.95); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(255,255,255,0.05); height: 52px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; }
  .logo { font-size: 19px; font-weight: 800; letter-spacing: -1px; color: #fff; }
  .logo span { color: #818cf8; }
  .sync-dot { width: 7px; height: 7px; border-radius: 50%; background: #34d399; box-shadow: 0 0 6px #34d399; flex-shrink: 0; }
  .sync-dot.off { background: #f87171; box-shadow: 0 0 6px #f87171; }
  .topbar-btns { display: flex; gap: 6px; align-items: center; }
  .topbtn { background: transparent; border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; color: #666; padding: 5px 11px; font-size: 12px; cursor: pointer; font-family: inherit; transition: all 0.15s; }
  .topbtn.active { background: rgba(129,140,248,0.15); border-color: rgba(129,140,248,0.3); color: #818cf8; }

  /* NAV */
  .nav { display: flex; gap: 4px; overflow-x: auto; padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.04); scrollbar-width: none; }
  .nav::-webkit-scrollbar { display: none; }
  .navbtn { display: flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 8px; border: 1px solid transparent; background: transparent; color: #555; cursor: pointer; font-size: 12px; font-weight: 600; white-space: nowrap; transition: all 0.15s; font-family: inherit; }
  .navbtn.active { background: var(--bc); border-color: var(--bb); color: var(--bt); }
  .badge-count { background: var(--bt); color: #080810; border-radius: 10px; padding: 0 5px; font-size: 10px; font-weight: 800; }

  /* MAIN */
  .main { flex: 1; padding: 18px 14px 100px; max-width: 680px; margin: 0 auto; width: 100%; }
  .section-label { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #3a3a5c; margin-bottom: 12px; margin-top: 4px; }
  .bucket-header { margin-bottom: 14px; }
  .bucket-name { font-size: 20px; font-weight: 800; margin-bottom: 2px; letter-spacing: -0.5px; }
  .bucket-desc { font-size: 11px; color: #444; }

  /* CAPTURE BAR */
  .capture-bar { display: flex; gap: 8px; margin-bottom: 16px; }
  .capture-inp { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(129,140,248,0.25); border-radius: 12px; color: #eef0f8; font-family: inherit; font-size: 15px; padding: 12px 16px; outline: none; transition: border-color 0.15s; }
  .capture-inp:focus { border-color: rgba(129,140,248,0.6); background: rgba(129,140,248,0.06); }
  .capture-inp::placeholder { color: #2a2a44; }
  .capture-btn { background: linear-gradient(135deg, #6366f1, #818cf8); border: none; border-radius: 12px; color: #fff; font-size: 22px; width: 46px; height: 46px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: transform 0.15s; }
  .capture-btn:hover { transform: scale(1.08); }

  /* PROCESS BANNER */
  .process-banner { background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.2); border-radius: 10px; padding: 10px 14px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: background 0.15s; }
  .process-banner:hover { background: rgba(251,191,36,0.14); }
  .process-banner-text { font-size: 12px; color: #fbbf24; font-weight: 600; }
  .process-banner-count { background: #fbbf24; color: #080810; border-radius: 10px; padding: 1px 8px; font-size: 11px; font-weight: 800; }

  /* CARDS */
  .card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; padding: 14px; margin-bottom: 8px; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
  .card:hover { background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); }
  .card.unprocessed { border-color: rgba(129,140,248,0.2); background: rgba(129,140,248,0.04); }
  .card-title { font-size: 14px; font-weight: 600; color: #eef0f8; line-height: 1.4; margin-bottom: 6px; }
  .card-meta { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  .unprocessed-label { font-size: 10px; color: #818cf8; font-family: 'DM Mono', monospace; }
  .pill { border-radius: 5px; padding: 2px 7px; font-size: 10px; font-weight: 700; }
  .hashtag { display: inline-flex; align-items: center; background: rgba(129,140,248,0.1); border: 1px solid rgba(129,140,248,0.2); color: #818cf8; border-radius: 5px; padding: 1px 7px; font-size: 10px; font-family: 'DM Mono', monospace; cursor: pointer; transition: all 0.12s; user-select: none; }
  .hashtag:hover { background: rgba(129,140,248,0.22); }
  .hashtag.active-filter { background: rgba(129,140,248,0.28); border-color: #818cf8; font-weight: 600; }
  .quick-moves { display: flex; gap: 4px; margin-top: 10px; flex-wrap: wrap; }
  .qbtn { background: none; border: 1px solid rgba(255,255,255,0.05); border-radius: 5px; color: #444; font-size: 10px; padding: 2px 6px; cursor: pointer; font-family: inherit; transition: all 0.12s; }
  .qbtn:hover { border-color: rgba(255,255,255,0.15); color: #888; }

  /* FAB */
  .fab { position: fixed; bottom: 22px; right: 20px; width: 54px; height: 54px; border-radius: 50%; background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%); border: none; color: #fff; font-size: 24px; cursor: pointer; box-shadow: 0 0 0 1px rgba(99,102,241,0.4), 0 8px 32px rgba(99,102,241,0.4); display: flex; align-items: center; justify-content: center; z-index: 200; transition: transform 0.15s; }
  .fab:hover { transform: scale(1.08); }

  /* MODALS */
  .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); display: flex; align-items: flex-end; justify-content: center; z-index: 300; }
  .modal-box { background: #0e0e1e; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px 20px 0 0; padding: 22px 18px 40px; width: 100%; max-width: 680px; max-height: 92vh; overflow-y: auto; }
  .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
  .modal-title { font-size: 17px; font-weight: 800; color: #fff; }
  .modal-subtitle { font-size: 11px; color: #444; margin-bottom: 20px; }
  .close-btn { background: none; border: none; color: #555; font-size: 20px; cursor: pointer; }

  /* PROCESS STEPS */
  .process-step { margin-bottom: 18px; }
  .step-title { font-size: 11px; color: #fbbf24; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
  .step-num { background: rgba(251,191,36,0.15); border: 1px solid rgba(251,191,36,0.3); color: #fbbf24; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; flex-shrink: 0; }

  /* FORM ELEMENTS */
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
  .btn-process { background: linear-gradient(135deg, #d97706, #fbbf24); color: #080810; }
  .btn-ghost { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); color: #888; }
  .btn-danger { background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.25); color: #f87171; }

  /* MISC */
  .search-inp { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; color: #eef0f8; font-family: 'DM Mono', monospace; font-size: 13px; padding: 9px 13px; outline: none; margin-bottom: 8px; }
  .search-inp::placeholder { color: #2a2a44; }
  .filter-bar { display: flex; gap: 5px; flex-wrap: wrap; align-items: center; margin-bottom: 12px; }
  .clear-filter { font-size: 10px; color: #f87171; background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2); border-radius: 5px; padding: 2px 8px; cursor: pointer; font-family: inherit; }
  .tag-suggestions { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 10px; }
  .tag-sug { background: rgba(129,140,248,0.06); border: 1px solid rgba(129,140,248,0.14); border-radius: 5px; color: #555; font-size: 10px; font-family: 'DM Mono', monospace; padding: 3px 8px; cursor: pointer; transition: all 0.12s; }
  .tag-sug:hover { color: #818cf8; border-color: rgba(129,140,248,0.4); }
  .empty { text-align: center; padding: 52px 20px; color: #2a2a44; }
  .empty-icon { font-size: 44px; margin-bottom: 12px; }
  .empty-text { font-size: 13px; }
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
  .divider { border: none; border-top: 1px solid rgba(255,255,255,0.05); margin: 16px 0; }
  input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
  .loading { display: flex; align-items: center; justify-content: center; height: 100vh; background: #080810; color: #333; font-size: 14px; font-family: 'Bricolage Grotesque', sans-serif; }
`;

// ── CAPTURE MODAL (solo título) ───────────────────────────────────────────────
function CaptureModal({ onSave, onClose }) {
  const [title, setTitle] = useState("");
  const submit = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), bucket: "inbox", type: "item", processed: false });
    onClose();
  };
  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">📥 Capturar</span>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-subtitle">Captura el pensamiento. Procésalo después.</div>
        <input className="inp" style={{fontSize:16, padding:"14px 16px"}}
          placeholder="¿Qué tienes en mente?"
          value={title} onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          autoFocus />
        <div className="btn-row">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={submit}>Capturar →</button>
        </div>
      </div>
    </div>
  );
}

// ── PROCESS MODAL (contexto completo) ────────────────────────────────────────
function ProcessModal({ item, projects, allItems, onSave, onDelete, onClose }) {
  const [f, setF] = useState({
    title: item?.title || "",
    notes: item?.notes || "",
    bucket: item?.bucket || "next",
    projectId: item?.projectId || "",
    priority: item?.priority || "med",
    energy: item?.energy || "med",
    dueDate: item?.dueDate || "",
    waitingFor: item?.waitingFor || "",
    context: item?.context || "",
    hashtags: item?.hashtags || "",
    processed: true,
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const existingTags = getAllTags(allItems).filter(t => !parseHashtags(f.hashtags).includes(t));
  const addTag = (tag) => { const cur = f.hashtags.trim(); set("hashtags", cur ? `${cur} ${tag}` : tag); };

  const isNew = !item?.processed;

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">{isNew ? "⚡ Procesar" : "✎ Editar"}</span>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-subtitle">{isNew ? "Define qué es esto y qué acción requiere" : item?.title}</div>

        {/* PASO 1 — QUÉ ES */}
        <div className="process-step">
          <div className="step-title"><span className="step-num">1</span> ¿Qué es?</div>
          <input className="inp" placeholder="Título / acción concreta" value={f.title}
            onChange={e => set("title", e.target.value)} autoFocus />
          <textarea className="inp" placeholder="Notas, links, contexto adicional..."
            value={f.notes} onChange={e => set("notes", e.target.value)} />
        </div>

        <hr className="divider" />

        {/* PASO 2 — A DÓNDE VA */}
        <div className="process-step">
          <div className="step-title"><span className="step-num">2</span> ¿A dónde va?</div>
          <div className="chip-row">
            {BUCKETS.filter(b => b.id !== "inbox").map(b => (
              <button key={b.id} className={`chip${f.bucket===b.id?" on":""}`}
                style={{"--cc":`${b.color}20`,"--cb":`${b.color}50`,"--ct":b.color}}
                onClick={() => set("bucket", b.id)}>{b.icon} {b.label}</button>
            ))}
          </div>
          {f.bucket === "agenda" && <>
            <label className="field-label">Fecha</label>
            <input className="inp" type="date" value={f.dueDate} onChange={e => set("dueDate", e.target.value)} />
          </>}
          {f.bucket === "waiting" && <>
            <label className="field-label">Esperando a</label>
            <input className="inp" placeholder="Nombre o empresa..." value={f.waitingFor}
              onChange={e => set("waitingFor", e.target.value)} />
          </>}
        </div>

        <hr className="divider" />

        {/* PASO 3 — CONTEXTO */}
        <div className="process-step">
          <div className="step-title"><span className="step-num">3</span> Contexto</div>

          <label className="field-label">Prioridad</label>
          <div className="chip-row">
            {PRIORITIES.map(p => (
              <button key={p.id} className={`chip${f.priority===p.id?" on":""}`}
                style={{"--cc":`${p.color}20`,"--cb":`${p.color}50`,"--ct":p.color}}
                onClick={() => set("priority", p.id)}>{p.label}</button>
            ))}
          </div>

          <label className="field-label">Energía requerida</label>
          <div className="chip-row">
            {ENERGY.map(e => (
              <button key={e.id} className={`chip${f.energy===e.id?" on":""}`}
                style={{"--cc":`${e.color}20`,"--cb":`${e.color}50`,"--ct":e.color}}
                onClick={() => set("energy", e.id)}>{e.label}</button>
            ))}
          </div>

          {projects.length > 0 && <>
            <label className="field-label">Proyecto</label>
            <select className="inp" value={f.projectId} onChange={e => set("projectId", e.target.value)}>
              <option value="">— Sin proyecto —</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
            </select>
          </>}

          <label className="field-label">Contexto</label>
          <input className="inp" placeholder="@casa  @oficina  @llamadas  @viaje..."
            value={f.context} onChange={e => set("context", e.target.value)} />

          <label className="field-label">Hashtags</label>
          <input className="inp" placeholder="#deep-work  #15min  #revisión..."
            value={f.hashtags} onChange={e => set("hashtags", e.target.value)}
            style={{fontFamily:"'DM Mono',monospace",fontSize:13}} />
          {existingTags.length > 0 && (
            <div className="tag-suggestions">
              <span style={{fontSize:10,color:"#333",marginRight:2}}>usar:</span>
              {existingTags.map(t => <button key={t} className="tag-sug" onClick={() => addTag(t)}>{t}</button>)}
            </div>
          )}
        </div>

        <div className="btn-row">
          {item && <button className="btn btn-danger" onClick={() => { onDelete(item._id); onClose(); }}>Eliminar</button>}
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className={`btn ${isNew ? "btn-process" : "btn-primary"}`} onClick={() => {
            if (!f.title.trim()) return;
            onSave({ ...item, ...f, type: "item" });
            onClose();
          }}>{isNew ? "✓ Procesar" : "Guardar"}</button>
        </div>
      </div>
    </div>
  );
}

// ── PROJECT FORM ──────────────────────────────────────────────────────────────
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
              style={{background:c,border:f.color===c?"2px solid #fff":"2px solid transparent"}} />
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

// ── ITEM CARD ─────────────────────────────────────────────────────────────────
function ItemCard({ item, projects, onEdit, onMoveTo, onTagClick, activeTag }) {
  const bucket = BUCKETS.find(b => b.id === item.bucket);
  const project = projects.find(p => p._id === item.projectId);
  const priority = PRIORITIES.find(p => p.id === item.priority);
  const energy = ENERGY.find(e => e.id === item.energy);
  const tags = parseHashtags(item.hashtags);
  return (
    <div className={`card${!item.processed?" unprocessed":""}`}
      style={{borderLeft:`3px solid ${bucket?.color||"#333"}`}} onClick={() => onEdit(item)}>
      <div className="card-title">{item.title}</div>
      <div className="card-meta">
        {!item.processed && <span className="unprocessed-label">· sin procesar</span>}
        {priority && item.processed && <span className="pill" style={{background:`${priority.color}18`,color:priority.color,border:`1px solid ${priority.color}40`}}>{priority.label}</span>}
        {energy && item.processed && <span className="pill" style={{background:`${energy.color}18`,color:energy.color,border:`1px solid ${energy.color}40`}}>{energy.label}</span>}
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
      {item.processed && (
        <div className="quick-moves" onClick={e => e.stopPropagation()}>
          {BUCKETS.filter(b => b.id !== item.bucket).map(b => (
            <button key={b.id} className="qbtn" onClick={() => onMoveTo(item._id, b.id)}>→ {b.icon} {b.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── PROJECTS VIEW ─────────────────────────────────────────────────────────────
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
        const pItems = items.filter(i => i.projectId===p._id && i.bucket!=="archive" && i.bucket!=="trash");
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

// ── SETTINGS VIEW ─────────────────────────────────────────────────────────────
function SettingsView({ items, projects, online }) {
  const allTags = getAllTags(items);
  return (
    <div>
      <div className="section-label">Sincronización</div>
      <div className="info-block" style={{marginBottom:16}}>
        <span style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{width:8,height:8,borderRadius:"50%",background:online?"#34d399":"#f87171",boxShadow:`0 0 6px ${online?"#34d399":"#f87171"}`,display:"inline-block"}}></span>
          {online ? "✅ Conectado — sincroniza en tiempo real entre todos tus dispositivos." : "❌ Sin conexión — los cambios se guardarán al reconectarte."}
        </span>
      </div>
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
              {t}<span style={{marginLeft:5,opacity:0.5}}>{items.filter(i=>parseHashtags(i.hashtags).includes(t)).length}</span>
            </span>
          ))}
        </div>
      </>}
      <div className="section-label">Flujo GTD</div>
      <div className="info-block">
        <strong>1. Capturar</strong> — Solo el título. Sin pensar. Todo afuera.<br/>
        <strong>2. Procesar</strong> — ¿Qué es? ¿Requiere acción? ¿Cuál es la siguiente acción?<br/>
        <strong>3. Organizar</strong> — Next Action, Agenda, Waiting, Archivar o Desechar.<br/>
        <strong>4. Revisar</strong> — Revisión semanal de todas las bandejas.<br/>
        <strong>5. Ejecutar</strong> — Elige qué hacer según contexto y energía.
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [allDocs, setAllDocs] = useState(null);
  const [view, setView] = useState("bucket");
  const [bucket, setBucket] = useState("inbox");
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [showCapture, setShowCapture] = useState(false);
  const [showProcess, setShowProcess] = useState(false);
  const [showProj, setShowProj] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editProj, setEditProj] = useState(null);
  const [newItemProjId, setNewItemProjId] = useState("");
  const [captureText, setCaptureText] = useState("");
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const unsub = db.listen(docs => setAllDocs(docs));
    const onOn = () => setOnline(true);
    const onOff = () => setOnline(false);
    window.addEventListener("online", onOn);
    window.addEventListener("offline", onOff);
    return () => { unsub(); window.removeEventListener("online", onOn); window.removeEventListener("offline", onOff); };
  }, []);

  if (allDocs === null) return <div className="loading">Cargando GTD...</div>;

  const items = allDocs.filter(d => d.type === "item").sort((a,b) => b.updatedAt - a.updatedAt);
  const projects = allDocs.filter(d => d.type === "project").sort((a,b) => b.updatedAt - a.updatedAt);
  const unprocessed = items.filter(i => i.bucket === "inbox" && !i.processed);

  const saveItem = async (doc_data) => { await db.put(doc_data); };
  const saveProj = async (doc_data) => { await db.put(doc_data); };
  const delItem = async (id) => { await db.del(id); };
  const delProj = async (id) => {
    for (const i of allDocs.filter(d => d.type==="item" && d.projectId===id)) await db.put({...i, projectId:""});
    await db.del(id);
  };
  const moveTo = async (id, nb) => {
    const item = allDocs.find(d => d._id === id);
    if (item) await db.put({...item, bucket: nb});
  };
  const handleTagClick = tag => { setActiveTag(p => p===tag?"":tag); setSearch(""); };

  // Quick capture from inline bar
  const quickCapture = async () => {
    if (!captureText.trim()) return;
    await db.put({ title: captureText.trim(), bucket: "inbox", type: "item", processed: false });
    setCaptureText("");
  };

  const bkt = BUCKETS.find(b => b.id === bucket);
  const visible = items.filter(i => {
    if (view !== "bucket") return false;
    if (i.bucket !== bucket) return false;
    if (activeTag && !parseHashtags(i.hashtags).includes(activeTag)) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!i.title?.toLowerCase().includes(q) && !i.notes?.toLowerCase().includes(q) &&
          !i.hashtags?.toLowerCase().includes(q) && !i.context?.toLowerCase().includes(q)) return false;
    }
    return true;
  });
  const bucketTags = [...new Set(items.filter(i=>i.bucket===bucket).flatMap(i=>parseHashtags(i.hashtags)))].sort();

  return (
    <>
      <style>{css}</style>
      <div className="gtd-root">

        {/* TOPBAR */}
        <div className="topbar">
          <div className="logo">GTD<span>.</span></div>
          <div className="topbar-btns">
            <div className={`sync-dot${online?"":" off"}`} title={online?"Sincronizado":"Sin conexión"} />
            <button className={`topbtn${view==="projects"?" active":""}`} onClick={() => setView("projects")}>📁 Proyectos</button>
            <button className={`topbtn${view==="settings"?" active":""}`} onClick={() => setView("settings")}>⚙️</button>
          </div>
        </div>

        {/* BUCKET NAV */}
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

        {/* MAIN */}
        <div className="main">
          {view === "bucket" && (
            <>
              <div className="bucket-header">
                <div className="bucket-name">{bkt?.icon} {bkt?.label}</div>
                <div className="bucket-desc">{bkt?.desc}</div>
              </div>

              {/* CAPTURE BAR — solo en inbox */}
              {bucket === "inbox" && (
                <div className="capture-bar">
                  <input className="capture-inp" placeholder="Capturar pensamiento..."
                    value={captureText} onChange={e => setCaptureText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && quickCapture()} />
                  <button className="capture-btn" onClick={quickCapture}>+</button>
                </div>
              )}

              {/* PROCESS BANNER */}
              {bucket === "inbox" && unprocessed.length > 0 && (
                <div className="process-banner" onClick={() => { setEditItem(unprocessed[0]); setShowProcess(true); }}>
                  <span className="process-banner-text">⚡ Procesar bandeja de entrada</span>
                  <span className="process-banner-count">{unprocessed.length} pendientes</span>
                </div>
              )}

              <input className="search-inp" placeholder="/ buscar..."
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
                  <div className="empty-text">{(search||activeTag)?"Sin resultados":"Esta bandeja está vacía"}</div>
                </div>
              )}
              {visible.map(item => (
                <ItemCard key={item._id} item={item} projects={projects}
                  onEdit={i => { setEditItem(i); setShowProcess(true); }}
                  onMoveTo={moveTo} onTagClick={handleTagClick} activeTag={activeTag} />
              ))}
            </>
          )}

          {view === "projects" && (
            <ProjectsView projects={projects} items={items}
              onEdit={p => { setEditProj(p); setShowProj(true); }}
              onNew={() => { setEditProj(null); setShowProj(true); }}
              onNewItem={pid => { setEditItem(null); setNewItemProjId(pid); setShowProcess(true); }} />
          )}

          {view === "settings" && <SettingsView items={items} projects={projects} online={online} />}
        </div>

        {/* FAB — captura rápida desde cualquier vista */}
        <button className="fab" onClick={() => setShowCapture(true)}>+</button>

        {/* MODALS */}
        {showCapture && (
          <CaptureModal
            onSave={async doc_data => { await saveItem(doc_data); }}
            onClose={() => setShowCapture(false)} />
        )}
        {showProcess && (
          <ProcessModal item={editItem} projects={projects} allItems={items}
            onSave={async doc_data => {
              if (newItemProjId && !doc_data.projectId) doc_data.projectId = newItemProjId;
              await saveItem(doc_data);
            }}
            onDelete={delItem}
            onClose={() => { setShowProcess(false); setEditItem(null); setNewItemProjId(""); }} />
        )}
        {showProj && (
          <ProjectForm project={editProj} onSave={saveProj} onDelete={delProj}
            onClose={() => { setShowProj(false); setEditProj(null); }} />
        )}
      </div>
    </>
  );
}
