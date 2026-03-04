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

  /* GLOBAL SEARCH */
  .gsearch-wrap { flex: 1; max-width: 340px; position: relative; }
  .gsearch-inp { width: 100%; background: #f1f5f9; border: 1px solid #e4e7ef; border-radius: 9px; color: #1e293b; font-family: 'DM Mono', monospace; font-size: 12px; padding: 7px 12px 7px 32px; outline: none; transition: all 0.15s; }
  .gsearch-inp:focus { background: #fff; border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
  .gsearch-inp::placeholder { color: #cbd5e1; }
  .gsearch-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 13px; pointer-events: none; }
  .gsearch-clear { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: #e4e7ef; border: none; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 10px; color: #64748b; }
  .gsearch-clear:hover { background: #cbd5e1; }

  /* DONE BUTTON */
  .done-btn { width: 22px; height: 22px; border-radius: 50%; border: 2px solid #cbd5e1; background: transparent; color: #cbd5e1; font-size: 10px; cursor: pointer; flex-shrink: 0; margin-top: 2px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; padding: 0; }
  .done-btn:hover { border-color: #059669; color: #059669; background: #f0fdf4; transform: scale(1.15); }

  /* SEARCH RESULTS VIEW */
  .search-results { }
  .search-results-header { font-size: 12px; color: #94a3b8; margin-bottom: 14px; font-family: 'DM Mono', monospace; }
  .search-bucket-group { margin-bottom: 16px; }
  .search-bucket-label { display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #94a3b8; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #f1f5f9; }
  .search-highlight { background: #fef9c3; border-radius: 2px; padding: 0 1px; }
`;


// ── HIGHLIGHT HELPER ──────────────────────────────────────────────────────────
function Highlight({ text = "", query = "" }) {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi"));
  return <>{parts.map((p, i) => p.toLowerCase() === query.toLowerCase()
    ? <mark key={i} className="search-highlight">{p}</mark> : p)}</>;
}

// ── GLOBAL SEARCH RESULTS ─────────────────────────────────────────────────────
function GlobalSearchResults({ query, items, projects, onEdit }) {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  const matched = items.filter(i => {
    return (
      i.title?.toLowerCase().includes(q) ||
      i.notes?.toLowerCase().includes(q) ||
      i.hashtags?.toLowerCase().includes(q) ||
      i.context?.toLowerCase().includes(q) ||
      i.waitingFor?.toLowerCase().includes(q)
    );
  });

  const grouped = BUCKETS.map(b => ({
    bucket: b,
    items: matched.filter(i => i.bucket === b.id),
  })).filter(g => g.items.length > 0);

  if (matched.length === 0) return (
    <div className="search-results">
      <div className="search-results-header">0 resultados para "{query}"</div>
      <div className="empty"><div className="empty-icon">🔍</div><div className="empty-text">Sin resultados</div></div>
    </div>
  );

  return (
    <div className="search-results">
      <div className="search-results-header">{matched.length} resultado{matched.length !== 1 ? "s" : ""} para "{query}"</div>
      {grouped.map(({ bucket: b, items: gItems }) => (
        <div key={b.id} className="search-bucket-group">
          <div className="search-bucket-label" style={{color: b.color}}>
            {b.icon} {b.label} <span style={{background:`${b.color}15`,border:`1px solid ${b.color}30`,borderRadius:8,padding:"0 6px",fontFamily:"inherit"}}>{gItems.length}</span>
          </div>
          {gItems.map(item => {
            const project = projects.find(p => p._id === item.projectId);
            const priority = PRIORITIES.find(p => p.id === item.priority);
            return (
              <div key={item._id} className="card" style={{borderLeft:`3px solid ${b.color}`}} onClick={() => onEdit(item)}>
                <div className="card-title"><Highlight text={item.title} query={q} /></div>
                <div className="card-meta">
                  {item.dueDate && <DaysTag dueDate={item.dueDate} />}
                  {priority && <span className="pill" style={{background:`${priority.color}15`,color:priority.color,border:`1px solid ${priority.color}40`}}>{priority.label}</span>}
                  {project && <span className="pill" style={{background:`${project.color||"#6366f1"}15`,color:project.color||"#6366f1",border:`1px solid ${project.color||"#6366f1"}40`}}>📁 {project.title}</span>}
                  {item.context && <span style={{fontSize:10,color:"#6366f1",fontFamily:"'DM Mono',monospace"}}><Highlight text={item.context} query={q} /></span>}
                  {item.waitingFor && <span style={{fontSize:10,color:"#7c3aed",fontWeight:600}}>⏳ <Highlight text={item.waitingFor} query={q} /></span>}
                  {parseHashtags(item.hashtags).map(t => (
                    <span key={t} className="hashtag" style={{cursor:"default"}}><Highlight text={t} query={q} /></span>
                  ))}
                  {item.notes && item.notes.toLowerCase().includes(q) && (
                    <span style={{fontSize:10,color:"#94a3b8",fontStyle:"italic"}}>· en notas</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

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
            <div className="chip-row" style={{flexWrap:"wrap"}}>
              <button className={`chip${!f.projectId?" on":""}`}
                style={{"--cc":"#f1f5f9","--cb":"#e4e7ef","--ct":"#64748b"}}
                onClick={() => set("projectId", "")}>Sin proyecto</button>
              {projects.filter(p => p.status !== "done").map(p => (
                <button key={p._id} className={`chip${f.projectId===p._id?" on":""}`}
                  style={{"--cc":`${p.color||"#6366f1"}18`,"--cb":`${p.color||"#6366f1"}50`,"--ct":p.color||"#6366f1"}}
                  onClick={() => set("projectId", p._id)}>
                  <span style={{display:"inline-block",width:7,height:7,borderRadius:"50%",background:p.color||"#6366f1",marginRight:5}} />
                  {p.title}
                </button>
              ))}
            </div>
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
function DashItem({ item, projects, onEdit, onDone }) {
  const project = projects.find(p => p._id === item.projectId);
  const priority = PRIORITIES.find(p => p.id === item.priority);
  const diff = getDaysInfo(item.dueDate);
  const isOverdue = diff !== null && diff > 0;
  const isToday = diff === 0;

  return (
    <div className={`dash-item${isOverdue?" dash-item-overdue":isToday?" dash-item-today":""}`}
      onClick={() => onEdit(item)}>
      {/* CHECK BUTTON */}
      <button className="done-btn" title="Marcar como hecha"
        onClick={e => { e.stopPropagation(); onDone(item._id); }}>
        ○
      </button>
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
function Dashboard({ items, projects, onEdit, onDone, onNewItem, onCapture }) {
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
              : agenda.map(i => <DashItem key={i._id} item={i} projects={projects} onEdit={onEdit} onDone={onDone} />)
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
              : next.map(i => <DashItem key={i._id} item={i} projects={projects} onEdit={onEdit} onDone={onDone} />)
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
              : waiting.map(i => <DashItem key={i._id} item={i} projects={projects} onEdit={onEdit} onDone={onDone} />)
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ── BUCKET VIEW ───────────────────────────────────────────────────────────────
function BucketView({ bucket, items, projects, allItems, onEdit, onMoveTo, onDone, onTagClick, activeTag, search, setSearch, setActiveTag, unprocessed }) {
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
                <button className="qbtn" style={{color:"#059669",borderColor:"#86efac",background:"#f0fdf4"}}
                  onClick={() => onDone(item._id)}>✅ Hecha</button>
                {BUCKETS.filter(b => b.id !== item.bucket && b.id !== "archive").map(b => (
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

// ── PROJECT MINI DASHBOARD ────────────────────────────────────────────────────
function ProjectDashboard({ project, items, onEdit, onDone, onNewItem, onBack }) {
  const pItems = items.filter(i => i.projectId === project._id);
  const agenda = pItems.filter(i => i.bucket === "agenda" && i.processed)
    .sort((a,b) => (getDaysInfo(b.dueDate)??-9999) - (getDaysInfo(a.dueDate)??-9999));
  const next = pItems.filter(i => i.bucket === "next" && i.processed)
    .sort((a,b) => ({high:0,med:1,low:2}[a.priority]||1) - ({high:0,med:1,low:2}[b.priority]||1));
  const waiting = pItems.filter(i => i.bucket === "waiting" && i.processed);
  const done = pItems.filter(i => i.bucket === "archive").length;
  const overdue = agenda.filter(i => getDaysInfo(i.dueDate) > 0).length;
  const color = project.color || "#6366f1";
  const sc = project.status==="active"?"#059669":project.status==="paused"?"#d97706":"#64748b";
  const sl = project.status==="active"?"Activo":project.status==="paused"?"Pausado":"Completado";
  const total = pItems.filter(i => i.bucket !== "trash").length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div>
      {/* BACK + HEADER */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <button className="small-btn" onClick={onBack} style={{padding:"6px 12px"}}>← Proyectos</button>
      </div>

      {/* PROJECT HEADER CARD */}
      <div style={{background:"#fff",border:`1px solid #e4e7ef`,borderLeft:`4px solid ${color}`,borderRadius:14,padding:"16px 18px",marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div>
            <div style={{fontSize:20,fontWeight:800,color:"#1e293b",letterSpacing:-0.5,marginBottom:4}}>{project.title}</div>
            {project.description && <div style={{fontSize:12,color:"#64748b",lineHeight:1.6}}>{project.description}</div>}
          </div>
          <span className="pill" style={{background:`${sc}15`,color:sc,border:`1px solid ${sc}40`,flexShrink:0,marginLeft:12}}>{sl}</span>
        </div>
        {/* PROGRESS BAR */}
        <div style={{marginTop:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <span style={{fontSize:10,color:"#94a3b8",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase"}}>Progreso</span>
            <span style={{fontSize:11,fontWeight:700,color:color}}>{pct}% · {done}/{total} tareas</span>
          </div>
          <div style={{height:6,background:"#f1f5f9",borderRadius:4,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:4,transition:"width 0.4s ease"}} />
          </div>
        </div>
        {/* MINI STATS */}
        <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
          {[["📅",agenda.length,"Agenda","#059669"],["⚡",next.length,"Next","#d97706"],["⏳",waiting.length,"Waiting","#7c3aed"],["✅",done,"Hechas","#64748b"]].map(([icon,n,lbl,c]) => (
            <div key={lbl} style={{background:`${c}0d`,border:`1px solid ${c}25`,borderRadius:8,padding:"6px 12px",textAlign:"center",flex:1,minWidth:60}}>
              <div style={{fontSize:14}}>{icon}</div>
              <div style={{fontSize:16,fontWeight:800,color:c}}>{n}</div>
              <div style={{fontSize:9,color:"#94a3b8",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* OVERDUE ALERT */}
      {overdue > 0 && (
        <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:16}}>🚨</span>
          <span style={{fontSize:12,color:"#991b1b",fontWeight:700}}>{overdue} tarea{overdue>1?"s":""} vencida{overdue>1?"s":""}</span>
        </div>
      )}

      {/* GRID */}
      <div className="dashboard-grid">
        {/* AGENDA */}
        <div className="dash-section dash-col-full">
          <div className="dash-header">
            <div className="dash-title" style={{color:"#059669"}}>📅 Agenda</div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span className="dash-count">{agenda.length}</span>
              <button className="small-btn" onClick={() => onNewItem(project._id, "agenda")}>+ Agregar</button>
            </div>
          </div>
          <div className="dash-items">
            {agenda.length === 0
              ? <div className="dash-empty">Sin items en agenda</div>
              : agenda.map(i => <DashItem key={i._id} item={i} projects={[project]} onEdit={onEdit} onDone={onDone} />)}
          </div>
        </div>

        {/* NEXT */}
        <div className="dash-section">
          <div className="dash-header">
            <div className="dash-title" style={{color:"#d97706"}}>⚡ Next Actions</div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span className="dash-count">{next.length}</span>
              <button className="small-btn" onClick={() => onNewItem(project._id, "next")}>+ Agregar</button>
            </div>
          </div>
          <div className="dash-items">
            {next.length === 0
              ? <div className="dash-empty">Sin next actions</div>
              : next.map(i => <DashItem key={i._id} item={i} projects={[project]} onEdit={onEdit} onDone={onDone} />)}
          </div>
        </div>

        {/* WAITING */}
        <div className="dash-section">
          <div className="dash-header">
            <div className="dash-title" style={{color:"#7c3aed"}}>⏳ Waiting</div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span className="dash-count">{waiting.length}</span>
              <button className="small-btn" onClick={() => onNewItem(project._id, "waiting")}>+ Agregar</button>
            </div>
          </div>
          <div className="dash-items">
            {waiting.length === 0
              ? <div className="dash-empty">Nada esperando</div>
              : waiting.map(i => <DashItem key={i._id} item={i} projects={[project]} onEdit={onEdit} onDone={onDone} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PROJECTS VIEW ─────────────────────────────────────────────────────────────
function ProjectsView({ projects, items, onEdit, onDone, onNew, onEditProj, onNewItem }) {
  const [selectedProject, setSelectedProject] = useState(null);

  if (selectedProject) {
    const proj = projects.find(p => p._id === selectedProject);
    if (proj) return (
      <ProjectDashboard
        project={proj}
        items={items}
        onEdit={onEdit}
        onDone={onDone}
        onNewItem={onNewItem}
        onBack={() => setSelectedProject(null)}
      />
    );
  }

  const active = projects.filter(p => p.status === "active");
  const paused = projects.filter(p => p.status === "paused");
  const done = projects.filter(p => p.status === "done");

  const ProjectCard = ({ p }) => {
    const pItems = items.filter(i => i.projectId === p._id && i.bucket !== "trash");
    const doneCount = pItems.filter(i => i.bucket === "archive").length;
    const total = pItems.length;
    const pct = total > 0 ? Math.round((doneCount/total)*100) : 0;
    const overdue = pItems.filter(i => i.bucket==="agenda" && getDaysInfo(i.dueDate) > 0).length;
    const color = p.color || "#6366f1";
    return (
      <div className="proj-card" style={{"--pc":color,cursor:"pointer"}} onClick={() => setSelectedProject(p._id)}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
          <div className="proj-title" style={{marginBottom:0}}>{p.title}</div>
          <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0,marginLeft:10}}>
            {overdue > 0 && <span style={{fontSize:10,background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:4,padding:"1px 6px",fontWeight:700}}>🚨 {overdue}</span>}
            <button className="small-btn" onClick={e => { e.stopPropagation(); onEditProj(p); }}>✎</button>
          </div>
        </div>
        {p.description && <div className="proj-desc">{p.description}</div>}
        {/* PROGRESS */}
        <div style={{marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
            <span style={{fontSize:10,color:"#94a3b8"}}>{pct}% completado</span>
            <span style={{fontSize:10,color:"#94a3b8"}}>{doneCount}/{total}</span>
          </div>
          <div style={{height:4,background:"#f1f5f9",borderRadius:4,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:4}} />
          </div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {[["📅",pItems.filter(i=>i.bucket==="agenda").length,"Agenda"],
            ["⚡",pItems.filter(i=>i.bucket==="next").length,"Next"],
            ["⏳",pItems.filter(i=>i.bucket==="waiting").length,"Waiting"]].map(([icon,n,lbl]) => n > 0 && (
            <span key={lbl} style={{fontSize:10,color:"#64748b",background:"#f8f9fc",border:"1px solid #e4e7ef",borderRadius:5,padding:"2px 7px"}}>{icon} {n} {lbl}</span>
          ))}
          <span style={{fontSize:10,color:"#94a3b8",marginLeft:"auto",alignSelf:"center"}}>Ver dashboard →</span>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div className="section-label" style={{marginBottom:0}}>Proyectos</div>
        <button className="btn btn-primary" style={{flex:"none",padding:"7px 14px",fontSize:12}} onClick={onNew}>+ Nuevo</button>
      </div>
      {projects.length === 0 && (
        <div className="empty">
          <div className="empty-icon">📁</div>
          <div className="empty-text">Sin proyectos todavía<br/><span style={{fontSize:11,color:"#cbd5e1"}}>Un proyecto = algo que requiere más de una acción</span></div>
        </div>
      )}
      {active.length > 0 && <>
        <div className="section-label">Activos</div>
        {active.map(p => <ProjectCard key={p._id} p={p} />)}
      </>}
      {paused.length > 0 && <>
        <div className="section-label" style={{marginTop:12}}>Pausados</div>
        {paused.map(p => <ProjectCard key={p._id} p={p} />)}
      </>}
      {done.length > 0 && <>
        <div className="section-label" style={{marginTop:12}}>Completados</div>
        {done.map(p => <ProjectCard key={p._id} p={p} />)}
      </>}
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
  const [globalSearch, setGlobalSearch] = useState("");
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
  const markDone = async (id) => {
    const item = allDocs.find(d => d._id === id);
    if (item) await db.put({ ...item, bucket: "archive", processed: true });
  };
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
          <div className="gsearch-wrap">
            <span className="gsearch-icon">🔍</span>
            <input className="gsearch-inp"
              placeholder="Buscar título, #hashtag, @contexto, responsable..."
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={e => e.key === "Escape" && setGlobalSearch("")}
            />
            {globalSearch && <button className="gsearch-clear" onClick={() => setGlobalSearch("")}>✕</button>}
          </div>
          <div className="topbar-right">
            <div className={`sync-dot${online?"":" off"}`} title={online?"Sincronizado":"Sin conexión"} />
            <button className={`topbtn${view==="dashboard"?" active":""}`} onClick={() => { setView("dashboard"); setGlobalSearch(""); }}>🏠</button>
            <button className={`topbtn${view==="projects"?" active":""}`} onClick={() => { setView("projects"); setGlobalSearch(""); }}>📁</button>
            <button className={`topbtn${view==="settings"?" active":""}`} onClick={() => { setView("settings"); setGlobalSearch(""); }}>⚙️</button>
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
          {globalSearch.trim() ? (
            <GlobalSearchResults query={globalSearch} items={items} projects={projects} onEdit={openEdit} />
          ) : view === "dashboard" ? (
            <Dashboard items={items} projects={projects} onEdit={openEdit} onDone={markDone}
              onNewItem={() => { setEditItem(null); setShowProcess(true); }}
              onCapture={() => setShowCapture(true)} />
          ) : view === "bucket" ? (
            <BucketView bucket={bucket} items={items} projects={projects} allItems={items}
              onEdit={openEdit} onMoveTo={moveTo} onDone={markDone} onTagClick={handleTagClick}
              activeTag={activeTag} search={search} setSearch={setSearch} setActiveTag={setActiveTag}
              unprocessed={unprocessed} />
          ) : view === "projects" ? (
            <ProjectsView projects={projects} items={items}
              onEdit={openEdit} onDone={markDone}
              onNew={() => { setEditProj(null); setShowProj(true); }}
              onEditProj={p => { setEditProj(p); setShowProj(true); }}
              onNewItem={(pid, defaultBucket) => {
                setEditItem({ projectId: pid, bucket: defaultBucket || "next", processed: false });
                setNewItemProjId(pid);
                setShowProcess(true);
              }} />
          ) : view === "settings" ? (
            <SettingsView items={items} projects={projects} online={online} />
          ) : null}
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
