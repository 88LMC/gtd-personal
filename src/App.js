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
  listen: (cb) => onSnapshot(collection(firestore, COLL), snap => cb(snap.docs.map(d => d.data()))),
};

const BUCKETS = [
  { id: "inbox",   label: "Capturar",    icon: "📥", color: "#6366f1", desc: "Todo lo que llega a tu mente" },
  { id: "next",    label: "Next Action", icon: "⚡", color: "#d97706", desc: "Acciones físicas concretas" },
  { id: "agenda",  label: "Agenda",      icon: "📅", color: "#059669", desc: "Con fecha o persona específica" },
  { id: "waiting", label: "Waiting",     icon: "⏳", color: "#7c3aed", desc: "Delegado, esperando respuesta" },
  { id: "archive", label: "Archivar",    icon: "🗄️", color: "#64748b", desc: "Referencia o completado" },
  { id: "trash",   label: "Desechar",    icon: "🗑️", color: "#dc2626", desc: "Ya no es relevante" },
];

const ENERGY = [
  { id: "high", label: "⚡ Alta",  color: "#dc2626" },
  { id: "med",  label: "🔆 Media", color: "#d97706" },
  { id: "low",  label: "🌙 Baja",  color: "#059669" },
];

const PRIORITIES = [
  { id: "high", label: "Alta",  color: "#dc2626" },
  { id: "med",  label: "Media", color: "#d97706" },
  { id: "low",  label: "Baja",  color: "#059669" },
];

const parseHashtags = (str = "") =>
  (str.match(/#[\w-áéíóúñÁÉÍÓÚÑ]+/gi) || []).map(t => t.toLowerCase());

const getAllTags = (items) => {
  const set = new Set();
  items.forEach(i => parseHashtags(i.hashtags).forEach(t => set.add(t)));
  return [...set].sort();
};

// Calcular días de retraso (negativo = días restantes, positivo = días retrasado)
const getDaysInfo = (dueDate) => {
  if (!dueDate) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(dueDate + "T00:00:00");
  const diff = Math.round((today - due) / (1000 * 60 * 60 * 24));
  return diff;
};

const DaysTag = ({ dueDate }) => {
  if (!dueDate) return null;
  const diff = getDaysInfo(dueDate);
  if (diff === 0) return <span style={{fontSize:10,fontWeight:700,background:"#fef3c7",color:"#92400e",border:"1px solid #fcd34d",borderRadius:4,padding:"1px 6px"}}>Hoy</span>;
  if (diff > 0) return <span style={{fontSize:10,fontWeight:700,background:"#fee2e2",color:"#991b1b",border:"1px solid #fca5a5",borderRadius:4,padding:"1px 6px"}}>+{diff}d retraso</span>;
  return <span style={{fontSize:10,fontWeight:700,background:"#dcfce7",color:"#166534",border:"1px solid #86efac",borderRadius:4,padding:"1px 6px"}}>{Math.abs(diff)}d restantes</span>;
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,700;12..96,800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f8f9fc; }
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: #dde1ea; border-radius: 2px; }

  .gtd-root { min-height: 100vh; background: #f8f9fc; color: #1e1e2e; font-family: 'Bricolage Grotesque', sans-serif; display: flex; flex-direction: column; }

  /* TOPBAR */
  .topbar { position: sticky; top: 0; z-index: 100; background: rgba(248,249,252,0.95); backdrop-filter: blur(16px); border-bottom: 1px solid #e4e7ef; height: 52px; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; }
  .logo { font-size: 19px; font-weight: 800; letter-spacing: -1px; color: #1e1e2e; }
  .logo span { color: #6366f1; }
  .sync-dot { width: 7px; height: 7px; border-radius: 50%; background: #059669; box-shadow: 0 0 5px #059669; flex-shrink: 0; }
  .sync-dot.off { background: #dc2626; box-shadow: 0 0 5px #dc2626; }
  .topbar-right { display: flex; gap: 8px; align-items: center; }
  .topbtn { background: transparent; border: 1px solid #dde1ea; border-radius: 8px; color: #94a3b8; padding: 5px 12px; font-size: 12px; cursor: pointer; font-family: inherit; font-weight: 600; transition: all 0.15s; }
  .topbtn:hover { border-color: #6366f1; color: #6366f1; }
  .topbtn.active { background: #eef0fd; border-color: #c7d2fe; color: #6366f1; }

  /* NAV */
  .nav { display: flex; gap: 4px; overflow-x: auto; padding: 10px 20px; border-bottom: 1px solid #e4e7ef; background: #fff; scrollbar-width: none; }
  .nav::-webkit-scrollbar { display: none; }
  .navbtn { display: flex; align-items: center; gap: 5px; padding: 6px 13px; border-radius: 8px; border: 1px solid transparent; background: transparent; color: #94a3b8; cursor: pointer; font-size: 12px; font-weight: 600; white-space: nowrap; transition: all 0.15s; font-family: inherit; }
  .navbtn:hover { background: #f1f5f9; color: #475569; }
  .navbtn.active { background: var(--bc); border-color: var(--bb); color: var(--bt); }
  .badge-count { background: var(--bt); color: #fff; border-radius: 10px; padding: 0 6px; font-size: 10px; font-weight: 800; }

  /* MAIN */
  .main { flex: 1; padding: 20px 20px 100px; max-width: 900px; margin: 0 auto; width: 100%; }

  /* DASHBOARD */
  .dashboard-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
  @media (min-width: 640px) { .dashboard-grid { grid-template-columns: 1fr 1fr; } }
  .dash-col { display: flex; flex-direction: column; gap: 8px; }
  .dash-col-full { grid-column: 1 / -1; }
  .dash-section { background: #fff; border: 1px solid #e4e7ef; border-radius: 14px; overflow: hidden; }
  .dash-header { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
  .dash-title { font-size: 12px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; display: flex; align-items: center; gap: 6px; }
  .dash-count { background: #f1f5f9; color: #64748b; border-radius: 10px; padding: 1px 8px; font-size: 11px; font-weight: 700; }
  .dash-items { padding: 8px; }
  .dash-empty { padding: 20px; text-align: center; color: #cbd5e1; font-size: 12px; }

  /* DASH ITEM */
  .dash-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 10px; border-radius: 10px; cursor: pointer; transition: background 0.12s; border: 1px solid transparent; margin-bottom: 4px; }
  .dash-item:hover { background: #f8f9fc; border-color: #e4e7ef; }
  .dash-item:last-child { margin-bottom: 0; }
  .dash-item-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
  .dash-item-body { flex: 1; min-width: 0; }
  .dash-item-title { font-size: 13px; font-weight: 600; color: #1e293b; line-height: 1.4; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .dash-item-meta { display: flex; gap: 5px; flex-wrap: wrap; align-items: center; }
  .dash-item-overdue { background: #fef2f2; border-color: #fecaca !important; }
  .dash-item-today { background: #fffbeb; border-color: #fde68a !important; }

  /* STATS ROW */
  .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
  @media (min-width: 480px) { .stats-row { grid-template-columns: repeat(6, 1fr); } }
  .stat-box { background: #fff; border: 1px solid #e4e7ef; border-radius: 12px; padding: 12px 10px; text-align: center; cursor: pointer; transition: all 0.15s; }
  .stat-box:hover { border-color: var(--sc); background: var(--sbg); }
  .stat-num { font-size: 22px; font-weight: 800; color: var(--sc); }
  .stat-lbl { font-size: 10px; color: #94a3b8; margin-top: 2px; font-weight: 600; }
  .stat-icon { font-size: 16px; margin-bottom: 2px; }

  /* CAPTURE BAR */
  .capture-wrap { background: #fff; border: 1px solid #e4e7ef; border-radius: 14px; padding: 12px 14px; margin-bottom: 16px; }
  .capture-label { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #94a3b8; margin-bottom: 8px; }
  .capture-bar { display: flex; gap: 8px; }
  .capture-inp { flex: 1; background: #f8f9fc; border: 1px solid #e4e7ef; border-radius: 10px; color: #1e293b; font-family: inherit; font-size: 14px; padding: 10px 14px; outline: none; transition: border-color 0.15s; }
  .capture-inp:focus { border-color: #6366f1; background: #fff; }
  .capture-inp::placeholder { color: #cbd5e1; }
  .capture-btn { background: #6366f1; border: none; border-radius: 10px; color: #fff; font-size: 20px; width: 42px; height: 42px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.15s; }
  .capture-btn:hover { background: #4f46e5; }

  /* PROCESS BANNER */
  .process-banner { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 10px 14px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: background 0.15s; }
  .process-banner:hover { background: #fef3c7; }
  .process-banner-text { font-size: 12px; color: #92400e; font-weight: 700; }
  .process-banner-count { background: #f59e0b; color: #fff; border-radius: 10px; padding: 1px 8px; font-size: 11px; font-weight: 800; }

  /* BUCKET VIEW CARDS */
  .card { background: #fff; border: 1px solid #e4e7ef; border-radius: 12px; padding: 14px; margin-bottom: 8px; cursor: pointer; transition: all 0.15s; }
  .card:hover { border-color: #c7d2fe; box-shadow: 0 2px 8px rgba(99,102,241,0.08); }
  .card.unprocessed { border-color: #c7d2fe; background: #fafafe; }
  .card-title { font-size: 14px; font-weight: 600; color: #1e293b; line-height: 1.4; margin-bottom: 6px; }
  .card-meta { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  .unprocessed-label { font-size: 10px; color: #6366f1; font-family: 'DM Mono', monospace; }
  .pill { border-radius: 5px; padding: 2px 7px; font-size: 10px; font-weight: 700; }
  .hashtag { display: inline-flex; align-items: center; background: #eef0fd; border: 1px solid #c7d2fe; color: #6366f1; border-radius: 5px; padding: 1px 7px; font-size: 10px; font-family: 'DM Mono', monospace; cursor: pointer; transition: all 0.12s; }
  .hashtag:hover, .hashtag.active-filter { background: #e0e7ff; border-color: #6366f1; }
  .quick-moves { display: flex; gap: 4px; margin-top: 10px; flex-wrap: wrap; }
  .qbtn { background: #f8f9fc; border: 1px solid #e4e7ef; border-radius: 5px; color: #94a3b8; font-size: 10px; padding: 2px 7px; cursor: pointer; font-family: inherit; transition: all 0.12s; }
  .qbtn:hover { border-color: #6366f1; color: #6366f1; }

  /* FAB */
  .fab { position: fixed; bottom: 22px; right: 20px; width: 54px; height: 54px; border-radius: 50%; background: #6366f1; border: none; color: #fff; font-size: 24px; cursor: pointer; box-shadow: 0 4px 20px rgba(99,102,241,0.4); display: flex; align-items: center; justify-content: center; z-index: 200; transition: all 0.15s; }
  .fab:hover { background: #4f46e5; transform: scale(1.05); }

  /* MODALS */
  .modal-bg { position: fixed; inset: 0; background: rgba(15,23,42,0.5); backdrop-filter: blur(6px); display: flex; align-items: flex-end; justify-content: center; z-index: 300; }
  .modal-box { background: #fff; border: 1px solid #e4e7ef; border-radius: 20px 20px 0 0; padding: 22px 20px 40px; width: 100%; max-width: 680px; max-height: 92vh; overflow-y: auto; box-shadow: 0 -8px 40px rgba(15,23,42,0.12); }
  .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
  .modal-title { font-size: 17px; font-weight: 800; color: #1e293b; }
  .modal-subtitle { font-size: 11px; color: #94a3b8; margin-bottom: 20px; }
  .close-btn { background: #f1f5f9; border: none; border-radius: 8px; color: #64748b; font-size: 16px; width: 30px; height: 30px; cursor: pointer; display: flex; align-items: center; justify-content: center; }

  /* PROCESS STEPS */
  .process-step { margin-bottom: 18px; }
  .step-title { font-size: 11px; color: #d97706; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
  .step-num { background: #fef3c7; border: 1px solid #fcd34d; color: #92400e; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; flex-shrink: 0; }

  /* FORM */
  .field-label { font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #94a3b8; margin-bottom: 6px; display: block; }
  .inp { width: 100%; background: #f8f9fc; border: 1px solid #e4e7ef; border-radius: 10px; color: #1e293b; font-family: inherit; font-size: 14px; padding: 10px 13px; outline: none; margin-bottom: 8px; transition: border-color 0.15s; }
  .inp:focus { border-color: #6366f1; background: #fff; }
  .inp::placeholder { color: #cbd5e1; }
  textarea.inp { resize: vertical; min-height: 72px; }
  select.inp { cursor: pointer; }
  select.inp option { background: #fff; color: #1e293b; }
  .chip-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
  .chip { padding: 5px 12px; border-radius: 7px; font-size: 11px; font-weight: 700; cursor: pointer; border: 1px solid #e4e7ef; background: #f8f9fc; color: #94a3b8; font-family: inherit; transition: all 0.12s; }
  .chip.on { background: var(--cc); border-color: var(--cb); color: var(--ct); }
  .btn-row { display: flex; gap: 8px; margin-top: 8px; }
  .btn { flex: 1; padding: 11px; border-radius: 10px; border: none; cursor: pointer; font-family: inherit; font-weight: 700; font-size: 13px; transition: all 0.15s; }
  .btn-primary { background: #6366f1; color: #fff; }
  .btn-primary:hover { background: #4f46e5; }
  .btn-process { background: #f59e0b; color: #fff; }
  .btn-process:hover { background: #d97706; }
  .btn-ghost { background: #f1f5f9; border: 1px solid #e4e7ef; color: #64748b; }
  .btn-danger { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }

  /* MISC */
  .search-inp { width: 100%; background: #fff; border: 1px solid #e4e7ef; border-radius: 10px; color: #1e293b; font-family: 'DM Mono', monospace; font-size: 13px; padding: 9px 13px; outline: none; margin-bottom: 8px; }
  .search-inp:focus { border-color: #6366f1; }
  .search-inp::placeholder { color: #cbd5e1; }
  .filter-bar { display: flex; gap: 5px; flex-wrap: wrap; align-items: center; margin-bottom: 12px; }
  .clear-filter { font-size: 10px; color: #dc2626; background: #fef2f2; border: 1px solid #fecaca; border-radius: 5px; padding: 2px 8px; cursor: pointer; font-family: inherit; }
  .tag-suggestions { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 10px; }
  .tag-sug { background: #eef0fd; border: 1px solid #c7d2fe; border-radius: 5px; color: #6366f1; font-size: 10px; font-family: 'DM Mono', monospace; padding: 3px 8px; cursor: pointer; transition: all 0.12s; }
  .tag-sug:hover { background: #e0e7ff; }
  .bucket-header { margin-bottom: 14px; }
  .bucket-name { font-size: 20px; font-weight: 800; margin-bottom: 2px; letter-spacing: -0.5px; color: #1e293b; }
  .bucket-desc { font-size: 11px; color: #94a3b8; }
  .section-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #94a3b8; margin-bottom: 10px; margin-top: 4px; }
  .empty { text-align: center; padding: 52px 20px; color: #cbd5e1; }
  .empty-icon { font-size: 40px; margin-bottom: 10px; }
  .empty-text { font-size: 13px; }
  .proj-card { background: #fff; border: 1px solid #e4e7ef; border-left: 3px solid var(--pc); border-radius: 12px; padding: 14px; margin-bottom: 8px; }
  .proj-title { font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
  .proj-desc { font-size: 12px; color: #64748b; margin-bottom: 10px; line-height: 1.5; }
  .proj-actions { display: flex; gap: 6px; }
  .small-btn { background: #f8f9fc; border: 1px solid #e4e7ef; border-radius: 6px; color: #64748b; font-size: 11px; padding: 4px 10px; cursor: pointer; font-family: inherit; font-weight: 600; transition: all 0.12s; }
  .small-btn:hover { border-color: #6366f1; color: #6366f1; }
  .color-dot { width: 26px; height: 26px; border-radius: 50%; cursor: pointer; transition: transform 0.12s; }
  .color-dot:hover { transform: scale(1.15); }
  .color-row { display: flex; gap: 7px; margin-bottom: 12px; }
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 20px; }
  .stat-card { background: #f8f9fc; border: 1px solid #e4e7ef; border-radius: 10px; padding: 12px 10px; text-align: center; }
  .stat-card-num { font-size: 22px; font-weight: 800; }
  .stat-card-lbl { font-size: 10px; color: #94a3b8; margin-top: 2px; }
  .info-block { background: #f8f9fc; border: 1px solid #e4e7ef; border-radius: 10px; padding: 14px; margin-bottom: 12px; font-size: 12px; color: #64748b; line-height: 1.9; }
  .info-block strong { color: #1e293b; }
  .divider { border: none; border-top: 1px solid #f1f5f9; margin: 14px 0; }
  input[type=date]::-webkit-calendar-picker-indicator { cursor: pointer; }
  .loading { display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8f9fc; color: #94a3b8; font-size: 14px; font-family: 'Bricolage Grotesque', sans-serif; gap: 10px; }
`;

// ── CAPTURE MODAL ─────────────────────────────────────────────────────────────
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
        <input className="inp" style={{fontSize:16,padding:"14px 16px"}}
          placeholder="¿Qué tienes en mente?"
          value={title} onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()} autoFocus />
        <div className="btn-row">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={submit}>Capturar →</button>
        </div>
      </div>
    </div>
  );
}

// ── PROCESS MODAL ─────────────────────────────────────────────────────────────
function ProcessModal({ item, projects, allItems, onSave, onDelete, onClose }) {
  const [f, setF] = useState({
    title: item?.title || "",
    notes: item?.notes || "",
    bucket: item?.bucket === "inbox" ? "next" : (item?.bucket || "next"),
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

        <div className="process-step">
          <div className="step-title"><span className="step-num">1</span> ¿Qué es?</div>
          <input className="inp" placeholder="Título / acción concreta" value={f.title}
            onChange={e => set("title", e.target.value)} autoFocus />
          <textarea className="inp" placeholder="Notas, links, contexto adicional..."
            value={f.notes} onChange={e => set("notes", e.target.value)} />
        </div>
        <hr className="divider" />

        <div className="process-step">
          <div className="step-title"><span className="step-num">2</span> ¿A dónde va?</div>
          <div className="chip-row">
            {BUCKETS.filter(b => b.id !== "inbox").map(b => (
              <button key={b.id} className={`chip${f.bucket===b.id?" on":""}`}
                style={{"--cc":`${b.color}18`,"--cb":`${b.color}50`,"--ct":b.color}}
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

        <div className="process-step">
          <div className="step-title"><span className="step-num">3</span> Contexto</div>
          <label className="field-label">Prioridad</label>
          <div className="chip-row">
            {PRIORITIES.map(p => (
              <button key={p.id} className={`chip${f.priority===p.id?" on":""}`}
                style={{"--cc":`${p.color}18`,"--cb":`${p.color}50`,"--ct":p.color}}
                onClick={() => set("priority", p.id)}>{p.label}</button>
            ))}
          </div>
          <label className="field-label">Energía requerida</label>
          <div className="chip-row">
            {ENERGY.map(e => (
              <button key={e.id} className={`chip${f.energy===e.id?" on":""}`}
                style={{"--cc":`${e.color}18`,"--cb":`${e.color}50`,"--ct":e.color}}
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
          <input className="inp" placeholder="@casa  @oficina  @llamadas..."
            value={f.context} onChange={e => set("context", e.target.value)} />
          <label className="field-label">Hashtags</label>
          <input className="inp" placeholder="#deep-work  #15min  #revisión..."
            value={f.hashtags} onChange={e => set("hashtags", e.target.value)}
            style={{fontFamily:"'DM Mono',monospace",fontSize:13}} />
          {existingTags.length > 0 && (
            <div className="tag-suggestions">
              <span style={{fontSize:10,color:"#94a3b8",marginRight:4}}>usar:</span>
              {existingTags.map(t => <button key={t} className="tag-sug" onClick={() => addTag(t)}>{t}</button>)}
            </div>
          )}
        </div>

        <div className="btn-row">
          {item && <button className="btn btn-danger" onClick={() => { onDelete(item._id); onClose(); }}>Eliminar</button>}
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className={`btn ${isNew?"btn-process":"btn-primary"}`} onClick={() => {
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
  const COLORS = ["#6366f1","#d97706","#059669","#dc2626","#7c3aed","#0891b2","#ea580c","#db2777"];
  const [f, setF] = useState({
    title: project?.title || "",
    description: project?.description || "",
    status: project?.status || "active",
    color: project?.color || "#6366f1",
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">{project ? "Editar proyecto" : "Nuevo proyecto"}</span>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div style={{marginBottom:16}} />
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
              style={{background:c,border:f.color===c?"3px solid #1e293b":"3px solid transparent"}} />
          ))}
        </div>
        <label className="field-label">Estado</label>
        <div className="chip-row">
          {[["active","Activo","#059669"],["paused","Pausado","#d97706"],["done","Completado","#64748b"]].map(([id,lbl,col]) => (
            <button key={id} className={`chip${f.status===id?" on":""}`}
              style={{"--cc":`${col}18`,"--cb":`${col}50`,"--ct":col}}
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

// ── DASH ITEM ─────────────────────────────────────────────────────────────────
function DashItem({ item, projects, onEdit }) {
  const project = projects.find(p => p._id === item.projectId);
  const priority = PRIORITIES.find(p => p.id === item.priority);
  const diff = getDaysInfo(item.dueDate);
  const isOverdue = diff !== null && diff > 0;
  const isToday = diff === 0;

  return (
    <div className={`dash-item${isOverdue?" dash-item-overdue":isToday?" dash-item-today":""}`}
      onClick={() => onEdit(item)}>
      <div className="dash-item-dot" style={{background: priority?.color || "#94a3b8"}} />
      <div className="dash-item-body">
        <div className="dash-item-title">{item.title}</div>
        <div className="dash-item-meta">
          {item.dueDate && <DaysTag dueDate={item.dueDate} />}
          {item.waitingFor && <span style={{fontSize:10,color:"#7c3aed",fontWeight:600}}>⏳ {item.waitingFor}</span>}
          {project && <span style={{fontSize:10,color:project.color||"#6366f1",fontWeight:600}}>📁 {project.title}</span>}
          {item.context && <span style={{fontSize:10,color:"#94a3b8",fontFamily:"'DM Mono',monospace"}}>{item.context}</span>}
          {parseHashtags(item.hashtags).map(t => (
            <span key={t} className="hashtag" style={{cursor:"default"}}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard({ items, projects, onEdit, onNewItem, onCapture }) {
  const agenda = items.filter(i => i.bucket === "agenda" && i.processed)
    .sort((a,b) => {
      const da = getDaysInfo(a.dueDate) ?? -9999;
      const db_ = getDaysInfo(b.dueDate) ?? -9999;
      return db_ - da; // más retrasados primero
    });
  const next = items.filter(i => i.bucket === "next" && i.processed)
    .sort((a,b) => {
      const pOrder = {high:0,med:1,low:2};
      return (pOrder[a.priority]||1) - (pOrder[b.priority]||1);
    });
  const waiting = items.filter(i => i.bucket === "waiting" && i.processed);
  const unprocessed = items.filter(i => i.bucket === "inbox" && !i.processed);
  const overdue = agenda.filter(i => getDaysInfo(i.dueDate) > 0).length;

  return (
    <div>
      {/* STATS ROW */}
      <div className="stats-row">
        {BUCKETS.map(b => {
          const count = items.filter(i => i.bucket === b.id).length;
          return (
            <div key={b.id} className="stat-box" style={{"--sc":b.color,"--sbg":`${b.color}0d`}}>
              <div className="stat-icon">{b.icon}</div>
              <div className="stat-num">{count}</div>
              <div className="stat-lbl">{b.label}</div>
            </div>
          );
        })}
      </div>

      {/* PROCESS BANNER */}
      {unprocessed.length > 0 && (
        <div className="process-banner" onClick={() => onEdit(unprocessed[0])}>
          <span className="process-banner-text">⚡ Procesar bandeja de entrada</span>
          <span className="process-banner-count">{unprocessed.length} pendientes</span>
        </div>
      )}

      {/* OVERDUE ALERT */}
      {overdue > 0 && (
        <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:16}}>🚨</span>
          <span style={{fontSize:12,color:"#991b1b",fontWeight:700}}>{overdue} tarea{overdue>1?"s":""} de agenda vencida{overdue>1?"s":""}</span>
        </div>
      )}

      {/* DASHBOARD GRID */}
      <div className="dashboard-grid">
        {/* AGENDA */}
        <div className="dash-section dash-col-full">
          <div className="dash-header">
            <div className="dash-title" style={{color:"#059669"}}>📅 Agenda</div>
            <span className="dash-count">{agenda.length}</span>
          </div>
          <div className="dash-items">
            {agenda.length === 0
              ? <div className="dash-empty">Sin items en agenda</div>
              : agenda.map(i => <DashItem key={i._id} item={i} projects={projects} onEdit={onEdit} />)
            }
          </div>
        </div>

        {/* NEXT ACTIONS */}
        <div className="dash-section">
          <div className="dash-header">
            <div className="dash-title" style={{color:"#d97706"}}>⚡ Next Actions</div>
            <span className="dash-count">{next.length}</span>
          </div>
          <div className="dash-items">
            {next.length === 0
              ? <div className="dash-empty">Sin next actions</div>
              : next.map(i => <DashItem key={i._id} item={i} projects={projects} onEdit={onEdit} />)
            }
          </div>
        </div>

        {/* WAITING */}
        <div className="dash-section">
          <div className="dash-header">
            <div className="dash-title" style={{color:"#7c3aed"}}>⏳ Waiting</div>
            <span className="dash-count">{waiting.length}</span>
          </div>
          <div className="dash-items">
            {waiting.length === 0
              ? <div className="dash-empty">Nada esperando</div>
              : waiting.map(i => <DashItem key={i._id} item={i} projects={projects} onEdit={onEdit} />)
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ── BUCKET VIEW ───────────────────────────────────────────────────────────────
function BucketView({ bucket, items, projects, allItems, onEdit, onMoveTo, onTagClick, activeTag, search, setSearch, setActiveTag, unprocessed }) {
  const bkt = BUCKETS.find(b => b.id === bucket);
  const bucketTags = [...new Set(items.filter(i=>i.bucket===bucket).flatMap(i=>parseHashtags(i.hashtags)))].sort();
  const visible = items.filter(i => {
    if (i.bucket !== bucket) return false;
    if (activeTag && !parseHashtags(i.hashtags).includes(activeTag)) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!i.title?.toLowerCase().includes(q) && !i.notes?.toLowerCase().includes(q) &&
          !i.hashtags?.toLowerCase().includes(q) && !i.context?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <>
      <div className="bucket-header">
        <div className="bucket-name">{bkt?.icon} {bkt?.label}</div>
        <div className="bucket-desc">{bkt?.desc}</div>
      </div>

      {bucket === "inbox" && (
        <div className="capture-wrap">
          <div className="capture-label">Captura rápida</div>
          <InlineCaptureBar onSave={async (title) => {
            await db.put({ title, bucket: "inbox", type: "item", processed: false, updatedAt: Date.now() });
          }} />
        </div>
      )}

      {bucket === "inbox" && unprocessed.length > 0 && (
        <div className="process-banner" onClick={() => onEdit(unprocessed[0])}>
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
              onClick={() => onTagClick(t)}>{t}</span>
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
      {visible.map(item => {
        const project = projects.find(p => p._id === item.projectId);
        const priority = PRIORITIES.find(p => p.id === item.priority);
        const tags = parseHashtags(item.hashtags);
        return (
          <div key={item._id} className={`card${!item.processed?" unprocessed":""}`}
            style={{borderLeft:`3px solid ${bkt?.color||"#e4e7ef"}`}} onClick={() => onEdit(item)}>
            <div className="card-title">{item.title}</div>
            <div className="card-meta">
              {!item.processed && <span className="unprocessed-label">· sin procesar</span>}
              {item.dueDate && <DaysTag dueDate={item.dueDate} />}
              {priority && item.processed && <span className="pill" style={{background:`${priority.color}15`,color:priority.color,border:`1px solid ${priority.color}40`}}>{priority.label}</span>}
              {project && <span className="pill" style={{background:`${project.color||"#6366f1"}15`,color:project.color||"#6366f1",border:`1px solid ${project.color||"#6366f1"}40`}}>📁 {project.title}</span>}
              {item.context && <span style={{fontSize:10,color:"#6366f1",fontFamily:"'DM Mono',monospace"}}>{item.context}</span>}
              {item.waitingFor && <span style={{fontSize:10,color:"#7c3aed",fontWeight:600}}>⏳ {item.waitingFor}</span>}
              {tags.map(t => (
                <span key={t} className={`hashtag${activeTag===t?" active-filter":""}`}
                  onClick={e => { e.stopPropagation(); onTagClick(t); }}>{t}</span>
              ))}
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
      })}
    </>
  );
}

function InlineCaptureBar({ onSave }) {
  const [text, setText] = useState("");
  const submit = async () => {
    if (!text.trim()) return;
    await onSave(text.trim());
    setText("");
  };
  return (
    <div className="capture-bar">
      <input className="capture-inp" placeholder="Capturar pensamiento... (Enter)"
        value={text} onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === "Enter" && submit()} />
      <button className="capture-btn" onClick={submit}>+</button>
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
          <span style={{width:8,height:8,borderRadius:"50%",background:online?"#059669":"#dc2626",display:"inline-block"}}></span>
          {online ? "✅ Conectado — sincroniza en tiempo real entre todos tus dispositivos." : "❌ Sin conexión."}
        </span>
      </div>
      <div className="section-label">Resumen</div>
      <div className="stats-grid">
        {BUCKETS.map(b => (
          <div key={b.id} className="stat-card">
            <div style={{fontSize:18}}>{b.icon}</div>
            <div className="stat-card-num" style={{color:b.color}}>{items.filter(i=>i.bucket===b.id).length}</div>
            <div className="stat-card-lbl">{b.label}</div>
          </div>
        ))}
      </div>
      {allTags.length > 0 && <>
        <div className="section-label">Hashtags</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>
          {allTags.map(t => (
            <span key={t} className="hashtag" style={{cursor:"default"}}>
              {t}<span style={{marginLeft:5,color:"#94a3b8"}}>{items.filter(i=>parseHashtags(i.hashtags).includes(t)).length}</span>
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
        <strong>5. Ejecutar</strong> — Elige según contexto y energía.
      </div>
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
          <div className="empty-text">Sin proyectos todavía</div>
        </div>
      )}
      {projects.map(p => {
        const pItems = items.filter(i => i.projectId===p._id && i.bucket!=="archive" && i.bucket!=="trash");
        const sc = p.status==="active"?"#059669":p.status==="paused"?"#d97706":"#64748b";
        const sl = p.status==="active"?"Activo":p.status==="paused"?"Pausado":"Completado";
        return (
          <div key={p._id} className="proj-card" style={{"--pc":p.color||"#6366f1"}}>
            <div className="proj-title">{p.title}</div>
            {p.description && <div className="proj-desc">{p.description}</div>}
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
              <span className="pill" style={{background:`${sc}15`,color:sc,border:`1px solid ${sc}40`}}>{sl}</span>
              <span style={{fontSize:10,color:"#94a3b8"}}>{pItems.length} acciones pendientes</span>
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

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [allDocs, setAllDocs] = useState(null);
  const [view, setView] = useState("dashboard");
  const [bucket, setBucket] = useState("inbox");
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [showCapture, setShowCapture] = useState(false);
  const [showProcess, setShowProcess] = useState(false);
  const [showProj, setShowProj] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editProj, setEditProj] = useState(null);
  const [newItemProjId, setNewItemProjId] = useState("");
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const unsub = db.listen(docs => setAllDocs(docs));
    const on_ = () => setOnline(true);
    const off_ = () => setOnline(false);
    window.addEventListener("online", on_);
    window.addEventListener("offline", off_);
    return () => { unsub(); window.removeEventListener("online", on_); window.removeEventListener("offline", off_); };
  }, []);

  if (allDocs === null) return <div className="loading"><span>⏳</span> Cargando GTD...</div>;

  const items = allDocs.filter(d => d.type === "item").sort((a,b) => b.updatedAt - a.updatedAt);
  const projects = allDocs.filter(d => d.type === "project").sort((a,b) => b.updatedAt - a.updatedAt);
  const unprocessed = items.filter(i => i.bucket === "inbox" && !i.processed);

  const saveItem = async (d) => { await db.put(d); };
  const saveProj = async (d) => { await db.put(d); };
  const delItem = async (id) => { await db.del(id); };
  const delProj = async (id) => {
    for (const i of allDocs.filter(d => d.type==="item" && d.projectId===id)) await db.put({...i,projectId:""});
    await db.del(id);
  };
  const moveTo = async (id, nb) => {
    const item = allDocs.find(d => d._id===id);
    if (item) await db.put({...item,bucket:nb});
  };
  const handleTagClick = tag => { setActiveTag(p => p===tag?"":tag); setSearch(""); };
  const openEdit = (item) => { setEditItem(item); setShowProcess(true); };

  return (
    <>
      <style>{css}</style>
      <div className="gtd-root">

        {/* TOPBAR */}
        <div className="topbar">
          <div className="logo">GTD<span>.</span></div>
          <div className="topbar-right">
            <div className={`sync-dot${online?"":" off"}`} title={online?"Sincronizado":"Sin conexión"} />
            <button className={`topbtn${view==="dashboard"?" active":""}`} onClick={() => setView("dashboard")}>🏠 Dashboard</button>
            <button className={`topbtn${view==="projects"?" active":""}`} onClick={() => setView("projects")}>📁</button>
            <button className={`topbtn${view==="settings"?" active":""}`} onClick={() => setView("settings")}>⚙️</button>
          </div>
        </div>

        {/* BUCKET NAV */}
        <div className="nav">
          {BUCKETS.map(b => {
            const count = items.filter(i=>i.bucket===b.id).length;
            const active = view==="bucket" && bucket===b.id;
            return (
              <button key={b.id} className={`navbtn${active?" active":""}`}
                style={{"--bc":`${b.color}15`,"--bb":`${b.color}50`,"--bt":b.color}}
                onClick={() => { setBucket(b.id); setView("bucket"); setSearch(""); setActiveTag(""); }}>
                {b.icon} {b.label}
                {count > 0 && <span className="badge-count" style={{"--bt":b.color}}>{count}</span>}
              </button>
            );
          })}
        </div>

        {/* MAIN */}
        <div className="main">
          {view === "dashboard" && (
            <Dashboard items={items} projects={projects} onEdit={openEdit}
              onNewItem={() => { setEditItem(null); setShowProcess(true); }}
              onCapture={() => setShowCapture(true)} />
          )}
          {view === "bucket" && (
            <BucketView bucket={bucket} items={items} projects={projects} allItems={items}
              onEdit={openEdit} onMoveTo={moveTo} onTagClick={handleTagClick}
              activeTag={activeTag} search={search} setSearch={setSearch} setActiveTag={setActiveTag}
              unprocessed={unprocessed} />
          )}
          {view === "projects" && (
            <ProjectsView projects={projects} items={items}
              onEdit={p => { setEditProj(p); setShowProj(true); }}
              onNew={() => { setEditProj(null); setShowProj(true); }}
              onNewItem={pid => { setEditItem(null); setNewItemProjId(pid); setShowProcess(true); }} />
          )}
          {view === "settings" && <SettingsView items={items} projects={projects} online={online} />}
        </div>

        {/* FAB */}
        <button className="fab" onClick={() => setShowCapture(true)} title="Capturar">+</button>

        {/* MODALS */}
        {showCapture && (
          <CaptureModal onSave={async d => await saveItem(d)} onClose={() => setShowCapture(false)} />
        )}
        {showProcess && (
          <ProcessModal item={editItem} projects={projects} allItems={items}
            onSave={async d => { if (newItemProjId && !d.projectId) d.projectId = newItemProjId; await saveItem(d); }}
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
