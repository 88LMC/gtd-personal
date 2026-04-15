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
  { id: "inbox",     label: "Capturar",    icon: "📥", color: "#6366f1", desc: "Todo lo que llega a tu mente" },
  { id: "next",      label: "Next Action", icon: "⚡", color: "#d97706", desc: "Acciones físicas concretas" },
  { id: "agenda",    label: "Agenda",      icon: "📅", color: "#059669", desc: "Con fecha o persona específica" },
  { id: "waiting",   label: "Waiting",     icon: "⏳", color: "#7c3aed", desc: "Delegado, esperando respuesta" },
  { id: "reference", label: "Referencia",  icon: "📚", color: "#0891b2", desc: "Información para consultar después" },
  { id: "archive",   label: "Archivar",    icon: "🗄️", color: "#64748b", desc: "Tarea completada" },
  { id: "trash",     label: "Desechar",    icon: "🗑️", color: "#dc2626", desc: "Ya no es relevante" },
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

// Calcular siguiente fecha de recurrencia
const calcNextDate = (fromDate, recurrence, customDays) => {
  const d = new Date(fromDate + "T00:00:00");
  if (recurrence === "daily")   d.setDate(d.getDate() + 1);
  if (recurrence === "weekly")  d.setDate(d.getDate() + 7);
  if (recurrence === "monthly") d.setMonth(d.getMonth() + 1);
  if (recurrence === "custom")  d.setDate(d.getDate() + (parseInt(customDays) || 1));
  return d.toISOString().slice(0,10);
};

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
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #ffffff; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

  .gtd-root { min-height: 100vh; background: #ffffff; color: #1a1a2e; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; font-size: 14px; line-height: 1.5; }

  /* TOPBAR */
  .topbar { position: sticky; top: 0; z-index: 100; background: rgba(255,255,255,0.97); backdrop-filter: blur(12px); border-bottom: 1px solid #f0f0f0; height: 56px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; }
  .logo { font-size: 16px; font-weight: 700; letter-spacing: -0.5px; color: #1a1a2e; display: flex; align-items: center; gap: 8px; }
  .logo-dot { width: 8px; height: 8px; border-radius: 50%; background: #4f46e5; }
  .sync-dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; flex-shrink: 0; }
  .sync-dot.off { background: #ef4444; }
  .topbar-right { display: none; gap: 4px; align-items: center; }
  @media (min-width: 768px) { .topbar-right { display: flex; } .topbar { padding: 0 24px; } }
  .topbtn { background: transparent; border: none; border-radius: 6px; color: #9ca3af; padding: 6px 10px; font-size: 13px; cursor: pointer; font-family: inherit; font-weight: 500; transition: all 0.12s; }
  .topbtn:hover { background: #f9fafb; color: #374151; }
  .topbtn.active { background: #f5f3ff; color: #4f46e5; font-weight: 600; }

  /* MOBILE BOTTOM NAV */
  .bottom-nav { display: flex; position: fixed; bottom: 0; left: 0; right: 0; background: #fff; border-top: 1px solid #f0f0f0; z-index: 200; padding: 6px 0 8px; justify-content: space-around; align-items: center; }
  @media (min-width: 768px) { .bottom-nav { display: none; } }
  .bottom-nav-btn { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 4px 12px; border: none; background: transparent; cursor: pointer; font-family: inherit; flex: 1; transition: all 0.12s; }
  .bottom-nav-btn .bn-icon { font-size: 20px; line-height: 1; }
  .bottom-nav-btn .bn-label { font-size: 9px; font-weight: 600; color: #9ca3af; letter-spacing: 0.02em; }
  .bottom-nav-btn.active .bn-label { color: #4f46e5; }
  .bottom-nav-btn.active .bn-icon { filter: none; }
  .bottom-nav-more { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 4px 12px; border: none; background: transparent; cursor: pointer; font-family: inherit; flex: 1; }
  .bottom-nav-more .bn-icon { font-size: 20px; color: #9ca3af; }
  .bottom-nav-more .bn-label { font-size: 9px; font-weight: 600; color: #9ca3af; }

  /* HAMBURGER */
  .hamburger { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border: none; background: transparent; cursor: pointer; border-radius: 8px; color: #374151; font-size: 20px; }
  .hamburger:hover { background: #f9fafb; }
  @media (min-width: 768px) { .hamburger { display: none; } }

  /* MOBILE DRAWER */
  .drawer-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 400; }
  .drawer-overlay.open { display: block; }
  .drawer { position: fixed; top: 0; left: 0; bottom: 0; width: 260px; background: #fff; z-index: 500; transform: translateX(-100%); transition: transform 0.25s ease; border-right: 1px solid #f0f0f0; display: flex; flex-direction: column; padding: 16px 10px; overflow-y: auto; }
  .drawer.open { transform: translateX(0); }
  .drawer-header { display: flex; align-items: center; justify-content: space-between; padding: 4px 8px 16px; }
  .drawer-logo { font-size: 15px; font-weight: 700; color: #1a1a2e; display: flex; align-items: center; gap: 6px; }
  .drawer-close { background: #f3f4f6; border: none; border-radius: 6px; width: 28px; height: 28px; cursor: pointer; font-size: 14px; color: #6b7280; display: flex; align-items: center; justify-content: center; }
  .drawer-section { font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #9ca3af; padding: 6px 8px 4px; margin-top: 10px; }
  .drawer-btn { display: flex; align-items: center; gap: 8px; padding: 9px 10px; border-radius: 6px; border: none; background: transparent; color: #6b7280; cursor: pointer; font-size: 13px; font-weight: 500; width: 100%; text-align: left; font-family: inherit; transition: all 0.1s; }
  .drawer-btn:hover { background: #f0f0f0; color: #111827; }
  .drawer-btn.active { background: #ede9fe; color: #4f46e5; font-weight: 600; }
  .drawer-badge { margin-left: auto; background: #e5e7eb; color: #6b7280; border-radius: 8px; padding: 1px 6px; font-size: 10px; font-weight: 600; }
  .drawer-btn.active .drawer-badge { background: #c4b5fd; color: #4f46e5; }
  .drawer-divider { border: none; border-top: 1px solid #f0f0f0; margin: 8px 0; }
  .drawer-capture { display: flex; align-items: center; gap: 6px; padding: 9px 10px; border-radius: 6px; border: 1px dashed #d1d5db; background: transparent; color: #9ca3af; cursor: pointer; font-size: 12px; font-weight: 500; width: 100%; text-align: left; font-family: inherit; margin-bottom: 8px; transition: all 0.1s; }
  .drawer-capture:hover { border-color: #4f46e5; color: #4f46e5; background: #f5f3ff; }

  /* NAV */
  .nav { display: flex; gap: 2px; overflow-x: auto; padding: 8px 24px; border-bottom: 1px solid #f0f0f0; background: #fff; scrollbar-width: none; }
  .nav::-webkit-scrollbar { display: none; }
  .navbtn { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 6px; border: none; background: transparent; color: #9ca3af; cursor: pointer; font-size: 13px; font-weight: 500; white-space: nowrap; transition: all 0.12s; font-family: inherit; }
  .navbtn:hover { background: #f9fafb; color: #374151; }
  .navbtn.active { background: var(--bc); color: var(--bt); font-weight: 600; }
  .badge-count { background: var(--bt); color: #fff; border-radius: 10px; padding: 1px 6px; font-size: 10px; font-weight: 700; opacity: 0.9; }

  /* MAIN */
  .main { flex: 1; padding: 16px 16px 130px; max-width: 860px; margin: 0 auto; width: 100%; }
  @media (min-width: 768px) { .main { padding: 24px 32px 100px; } }

  /* TRANSURFING BANNER */
  .tf-banner { background: linear-gradient(135deg, #fafaf9 0%, #f5f3ff 100%); border: 1px solid #e9e9f0; border-left: 3px solid #4f46e5; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; cursor: pointer; transition: all 0.2s; }
  .tf-banner:hover { border-color: #c4b5fd; background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); }
  .tf-banner-label { font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #7c3aed; margin-bottom: 6px; }
  .tf-banner-quote { font-size: 13px; color: #374151; line-height: 1.6; font-style: italic; }
  .tf-banner-footer { margin-top: 8px; font-size: 10px; color: #9ca3af; }

  /* OBJETIVOS BANNER */
  .obj-banner { background: #fafafa; border: 1px solid #f0f0f0; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; }
  .obj-banner-label { font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #6b7280; margin-bottom: 10px; }
  .obj-item { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px; font-size: 12px; color: #374151; line-height: 1.5; }
  .obj-item:last-child { margin-bottom: 0; }
  .obj-dot { width: 5px; height: 5px; border-radius: 50%; background: #4f46e5; flex-shrink: 0; margin-top: 5px; }

  /* DASHBOARD */
  .dashboard-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
  @media (min-width: 640px) { .dashboard-grid { grid-template-columns: 1fr 1fr; } }
  .dash-col-full { grid-column: 1 / -1; }
  .dash-section { background: #fff; border: 1px solid #f0f0f0; border-radius: 10px; overflow: hidden; }
  .dash-header { padding: 12px 16px; border-bottom: 1px solid #f9fafb; display: flex; align-items: center; justify-content: space-between; }
  .dash-title { font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: #6b7280; display: flex; align-items: center; gap: 6px; }
  .dash-count { background: #f3f4f6; color: #6b7280; border-radius: 8px; padding: 1px 7px; font-size: 11px; font-weight: 600; }
  .dash-items { padding: 6px; }
  .dash-empty { padding: 20px; text-align: center; color: #d1d5db; font-size: 12px; }

  /* DASH ITEM */
  .dash-item { display: flex; align-items: flex-start; gap: 10px; padding: 9px 10px; border-radius: 8px; cursor: pointer; transition: background 0.1s; border: 1px solid transparent; margin-bottom: 3px; }
  .dash-item:hover { background: #f9fafb; }
  .dash-item:last-child { margin-bottom: 0; }
  .dash-item-body { flex: 1; min-width: 0; }
  .dash-item-title { font-size: 13px; font-weight: 500; color: #111827; line-height: 1.4; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .dash-item-meta { display: flex; gap: 4px; flex-wrap: wrap; align-items: center; }
  .dash-item-overdue { background: #fff5f5; }
  .dash-item-today { background: #fffbeb; }

  /* ALERT CARDS */
  .alert-card { display: flex; align-items: flex-start; gap: 12px; padding: 12px 14px; border-radius: 8px; border: 1px solid; cursor: pointer; transition: opacity 0.12s; }
  .alert-card:hover { opacity: 0.85; }
  .alert-red    { background: #fff5f5; border-color: #fee2e2; }
  .alert-orange { background: #fffbeb; border-color: #fef3c7; }
  .alert-yellow { background: #fefce8; border-color: #fef9c3; }
  .alert-blue   { background: #f0f9ff; border-color: #e0f2fe; }

  /* STATS ROW */
  .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; }
  @media (min-width: 480px) { .stats-row { grid-template-columns: repeat(6, 1fr); } }
  .stat-box { background: #fff; border: 1px solid #f0f0f0; border-radius: 10px; padding: 12px 8px; text-align: center; cursor: pointer; transition: all 0.12s; }
  .stat-box:hover { border-color: #c4b5fd; background: #fafafe; }
  .stat-num { font-size: 20px; font-weight: 700; color: var(--sc); }
  .stat-lbl { font-size: 9px; color: #9ca3af; margin-top: 2px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
  .stat-icon { font-size: 15px; margin-bottom: 2px; }

  /* CAPTURE BAR */
  .capture-wrap { background: #fff; border: 1px solid #f0f0f0; border-radius: 10px; padding: 12px 14px; margin-bottom: 16px; }
  .capture-label { font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #9ca3af; margin-bottom: 8px; }
  .capture-bar { display: flex; gap: 8px; }
  .capture-inp { flex: 1; background: #f9fafb; border: 1px solid #f0f0f0; border-radius: 8px; color: #111827; font-family: inherit; font-size: 14px; padding: 10px 14px; outline: none; transition: border-color 0.12s; }
  .capture-inp:focus { border-color: #4f46e5; background: #fff; }
  .capture-inp::placeholder { color: #d1d5db; }
  .capture-btn { background: #4f46e5; border: none; border-radius: 8px; color: #fff; font-size: 20px; width: 42px; height: 42px; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.12s; }
  .capture-btn:hover { background: #4338ca; }

  /* PROCESS BANNER */
  .process-banner { background: #fefce8; border: 1px solid #fef9c3; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: background 0.12s; }
  .process-banner:hover { background: #fef3c7; }
  .process-banner-text { font-size: 12px; color: #92400e; font-weight: 600; }
  .process-banner-count { background: #f59e0b; color: #fff; border-radius: 8px; padding: 1px 8px; font-size: 11px; font-weight: 700; }

  /* CARDS */
  .card { background: #fff; border: 1px solid #f0f0f0; border-radius: 10px; padding: 14px; margin-bottom: 8px; cursor: pointer; transition: all 0.12s; }
  .card:hover { border-color: #c4b5fd; box-shadow: 0 1px 6px rgba(79,70,229,0.06); }
  .card.unprocessed { border-color: #e0e7ff; background: #fafafe; }
  .card-title { font-size: 14px; font-weight: 500; color: #111827; line-height: 1.4; margin-bottom: 6px; }
  .card-meta { display: flex; gap: 5px; flex-wrap: wrap; align-items: center; }
  .unprocessed-label { font-size: 10px; color: #6366f1; font-family: 'DM Mono', monospace; }
  .pill { border-radius: 4px; padding: 2px 7px; font-size: 10px; font-weight: 600; }
  .hashtag { display: inline-flex; align-items: center; background: #f5f3ff; border: 1px solid #ede9fe; color: #6d28d9; border-radius: 4px; padding: 1px 6px; font-size: 10px; font-family: 'DM Mono', monospace; cursor: pointer; transition: all 0.1s; }
  .hashtag:hover, .hashtag.active-filter { background: #ede9fe; border-color: #c4b5fd; }
  .quick-moves { display: flex; gap: 4px; margin-top: 10px; flex-wrap: wrap; }
  .qbtn { background: #f9fafb; border: 1px solid #f0f0f0; border-radius: 4px; color: #9ca3af; font-size: 10px; padding: 2px 7px; cursor: pointer; font-family: inherit; transition: all 0.1s; }
  .qbtn:hover { border-color: #c4b5fd; color: #4f46e5; }

  /* FAB */
  .fab { display: none; position: fixed; bottom: 24px; right: 24px; width: 52px; height: 52px; border-radius: 50%; background: #4f46e5; border: none; color: #fff; font-size: 22px; cursor: pointer; box-shadow: 0 4px 16px rgba(79,70,229,0.35); align-items: center; justify-content: center; z-index: 200; transition: all 0.15s; }
  @media (min-width: 768px) { .fab { display: flex; } }
  .fab:hover { background: #4338ca; transform: scale(1.05); }

  /* MODALS */
  .modal-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.3); backdrop-filter: blur(4px); display: flex; align-items: flex-end; justify-content: center; z-index: 300; }
  .modal-box { background: #fff; border: 1px solid #f0f0f0; border-radius: 16px 16px 0 0; padding: 24px 20px 40px; width: 100%; max-width: 680px; max-height: 92vh; overflow-y: auto; box-shadow: 0 -4px 24px rgba(0,0,0,0.08); }
  .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
  .modal-title { font-size: 16px; font-weight: 700; color: #111827; }
  .modal-subtitle { font-size: 12px; color: #9ca3af; margin-bottom: 20px; }
  .close-btn { background: #f3f4f6; border: none; border-radius: 6px; color: #6b7280; font-size: 14px; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
  .close-btn:hover { background: #e5e7eb; }

  /* PROCESS STEPS */
  .process-step { margin-bottom: 16px; }
  .step-title { font-size: 10px; color: #f59e0b; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
  .step-num { background: #fef3c7; border: 1px solid #fcd34d; color: #92400e; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; flex-shrink: 0; }

  /* FORM */
  .field-label { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af; margin-bottom: 6px; display: block; }
  .inp { width: 100%; background: #f9fafb; border: 1px solid #f0f0f0; border-radius: 8px; color: #111827; font-family: inherit; font-size: 14px; padding: 10px 13px; outline: none; margin-bottom: 8px; transition: border-color 0.12s; }
  .inp:focus { border-color: #4f46e5; background: #fff; }
  .inp::placeholder { color: #d1d5db; }
  textarea.inp { resize: vertical; min-height: 72px; }
  select.inp { cursor: pointer; }
  select.inp option { background: #fff; color: #111827; }
  .chip-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
  .chip { padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; border: 1px solid #f0f0f0; background: #f9fafb; color: #9ca3af; font-family: inherit; transition: all 0.1s; }
  .chip.on { background: var(--cc); border-color: var(--cb); color: var(--ct); font-weight: 600; }
  .btn-row { display: flex; gap: 8px; margin-top: 8px; }
  .btn { flex: 1; padding: 11px; border-radius: 8px; border: none; cursor: pointer; font-family: inherit; font-weight: 600; font-size: 13px; transition: all 0.12s; }
  .btn-primary { background: #4f46e5; color: #fff; }
  .btn-primary:hover { background: #4338ca; }
  .btn-process { background: #f59e0b; color: #fff; }
  .btn-process:hover { background: #d97706; }
  .btn-ghost { background: #f3f4f6; border: 1px solid #f0f0f0; color: #6b7280; }
  .btn-danger { background: #fff5f5; border: 1px solid #fee2e2; color: #ef4444; }

  /* MISC */
  .search-inp { width: 100%; background: #fff; border: 1px solid #f0f0f0; border-radius: 8px; color: #111827; font-family: 'DM Mono', monospace; font-size: 13px; padding: 9px 13px; outline: none; margin-bottom: 8px; }
  .search-inp:focus { border-color: #4f46e5; }
  .search-inp::placeholder { color: #d1d5db; }
  .filter-bar { display: flex; gap: 5px; flex-wrap: wrap; align-items: center; margin-bottom: 12px; }
  .clear-filter { font-size: 10px; color: #ef4444; background: #fff5f5; border: 1px solid #fee2e2; border-radius: 4px; padding: 2px 8px; cursor: pointer; font-family: inherit; }
  .tag-suggestions { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 10px; }
  .tag-sug { background: #f5f3ff; border: 1px solid #ede9fe; border-radius: 4px; color: #6d28d9; font-size: 10px; font-family: 'DM Mono', monospace; padding: 3px 8px; cursor: pointer; transition: all 0.1s; }
  .tag-sug:hover { background: #ede9fe; }
  .bucket-header { margin-bottom: 16px; }
  .bucket-name { font-size: 20px; font-weight: 700; margin-bottom: 2px; letter-spacing: -0.5px; color: #111827; }
  .bucket-desc { font-size: 12px; color: #9ca3af; }
  .section-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #9ca3af; margin-bottom: 10px; margin-top: 4px; }
  .empty { text-align: center; padding: 48px 20px; color: #d1d5db; }
  .empty-icon { font-size: 36px; margin-bottom: 10px; }
  .empty-text { font-size: 13px; }
  .proj-card { background: #fff; border: 1px solid #f0f0f0; border-left: 3px solid var(--pc); border-radius: 10px; padding: 14px; margin-bottom: 8px; }
  .proj-title { font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 4px; }
  .proj-desc { font-size: 12px; color: #6b7280; margin-bottom: 10px; line-height: 1.5; }
  .proj-actions { display: flex; gap: 6px; }
  .small-btn { background: #f9fafb; border: 1px solid #f0f0f0; border-radius: 6px; color: #6b7280; font-size: 11px; padding: 4px 10px; cursor: pointer; font-family: inherit; font-weight: 600; transition: all 0.1s; }
  .small-btn:hover { border-color: #c4b5fd; color: #4f46e5; }
  .color-dot { width: 24px; height: 24px; border-radius: 50%; cursor: pointer; transition: transform 0.1s; }
  .color-dot:hover { transform: scale(1.15); }
  .color-row { display: flex; gap: 8px; margin-bottom: 12px; }
  .stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 20px; }
  .stat-card { background: #f9fafb; border: 1px solid #f0f0f0; border-radius: 8px; padding: 12px 10px; text-align: center; }
  .stat-card-num { font-size: 20px; font-weight: 700; }
  .stat-card-lbl { font-size: 10px; color: #9ca3af; margin-top: 2px; }
  .info-block { background: #f9fafb; border: 1px solid #f0f0f0; border-radius: 8px; padding: 14px; margin-bottom: 12px; font-size: 12px; color: #6b7280; line-height: 1.9; }
  .info-block strong { color: #111827; }
  .divider { border: none; border-top: 1px solid #f3f4f6; margin: 16px 0; }
  input[type=date]::-webkit-calendar-picker-indicator { cursor: pointer; }

  /* CALENDAR */
  .cal-switcher { display: flex; align-items: center; gap: 6px; margin-bottom: 16px; }
  .cal-switch-btn { background: #f9fafb; border: 1px solid #f0f0f0; border-radius: 6px; color: #6b7280; font-size: 12px; font-weight: 600; padding: 6px 14px; cursor: pointer; font-family: inherit; transition: all 0.12s; }
  .cal-switch-btn.active { background: #4f46e5; border-color: #4f46e5; color: #fff; }
  .cal-nav { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
  .cal-nav-btn { background: #f9fafb; border: 1px solid #f0f0f0; border-radius: 6px; color: #6b7280; font-size: 18px; width: 32px; height: 32px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.1s; }
  .cal-nav-btn:hover { background: #f3f4f6; }
  .cal-nav-label { font-size: 14px; font-weight: 600; color: #111827; flex: 1; text-align: center; }
  .cal-today-btn { background: #f5f3ff; border: 1px solid #ede9fe; border-radius: 6px; color: #4f46e5; font-size: 11px; font-weight: 600; padding: 5px 12px; cursor: pointer; font-family: inherit; }
  .cal-week-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
  .cal-day-col { background: #fff; border: 1px solid #f0f0f0; border-radius: 8px; min-height: 130px; overflow: hidden; }
  .cal-day-col.cal-today { border-color: #4f46e5; box-shadow: 0 0 0 2px rgba(79,70,229,0.1); }
  .cal-day-header { display: flex; flex-direction: column; align-items: center; padding: 8px 4px 6px; border-bottom: 1px solid #f9fafb; }
  .cal-day-name { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #9ca3af; margin-bottom: 2px; }
  .cal-day-num { font-size: 14px; font-weight: 600; color: #374151; }
  .cal-day-num-today { background: #4f46e5; color: #fff; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px; }
  .cal-day-items { padding: 4px; display: flex; flex-direction: column; gap: 3px; }
  .cal-empty-day { height: 20px; }
  .cal-item { border-radius: 4px; padding: 3px 6px; cursor: pointer; transition: opacity 0.1s; }
  .cal-item:hover { opacity: 0.75; }
  .cal-item-title { font-size: 10px; font-weight: 500; color: #111827; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cal-month-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
  .cal-month-dayname { text-align: center; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #9ca3af; padding: 6px 0; }
  .cal-month-cell { background: #fff; border: 1px solid #f3f4f6; border-radius: 6px; min-height: 88px; padding: 6px; cursor: pointer; transition: border-color 0.1s; }
  .cal-month-cell:hover { border-color: #c4b5fd; }
  .cal-today-cell { border-color: #4f46e5 !important; background: #fafafe; }
  .cal-out-month { background: #fafafa; opacity: 0.5; }
  .cal-month-num { font-size: 11px; font-weight: 600; color: #374151; margin-bottom: 4px; }
  .cal-month-items { display: flex; flex-direction: column; gap: 2px; }
  .cal-month-pill { font-size: 10px; font-weight: 500; color: #111827; padding: 2px 5px; border-radius: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
  .cal-month-more { font-size: 9px; color: #9ca3af; font-weight: 600; padding: 1px 4px; }
  /* LOADING */
  .loading { display: flex; align-items: center; justify-content: center; height: 100vh; background: #fff; color: #9ca3af; font-size: 14px; font-family: 'Inter', sans-serif; gap: 10px; }

  /* SEARCH RESULTS */
  .gsearch-wrap { flex: 1; max-width: 320px; position: relative; }
  .gsearch-inp { width: 100%; background: #f9fafb; border: 1px solid #f0f0f0; border-radius: 7px; color: #111827; font-family: 'DM Mono', monospace; font-size: 12px; padding: 7px 12px 7px 32px; outline: none; transition: all 0.12s; }
  .gsearch-inp:focus { background: #fff; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.08); }
  .gsearch-inp::placeholder { color: #d1d5db; }
  .gsearch-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #9ca3af; font-size: 12px; pointer-events: none; }
  .gsearch-clear { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: #e5e7eb; border: none; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 10px; color: #6b7280; }

  /* RECURRING */
  .recur-toggle { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: #f9fafb; border: 1px solid #f0f0f0; border-radius: 8px; margin-bottom: 8px; cursor: pointer; transition: all 0.12s; }
  .recur-toggle.on { background: #f5f3ff; border-color: #ede9fe; }
  .recur-toggle-label { font-size: 13px; font-weight: 500; color: #374151; flex: 1; }
  .recur-toggle.on .recur-toggle-label { color: #4f46e5; }
  .toggle-switch { width: 34px; height: 18px; background: #d1d5db; border-radius: 9px; position: relative; transition: background 0.2s; flex-shrink: 0; }
  .toggle-switch.on { background: #4f46e5; }
  .toggle-switch::after { content: ''; position: absolute; width: 14px; height: 14px; background: #fff; border-radius: 50%; top: 2px; left: 2px; transition: left 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.15); }
  .toggle-switch.on::after { left: 18px; }
  .recur-badge { display: inline-flex; align-items: center; gap: 3px; background: #f5f3ff; border: 1px solid #ede9fe; color: #6d28d9; border-radius: 4px; padding: 1px 6px; font-size: 10px; font-weight: 600; }

  /* DONE BUTTON */
  .done-btn { width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid #d1d5db; background: transparent; color: transparent; font-size: 10px; cursor: pointer; flex-shrink: 0; margin-top: 2px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; padding: 0; }
  .done-btn:hover { border-color: #10b981; color: #10b981; background: #f0fdf4; }

  /* CONVERT TO PROJECT */
  .convert-option { padding: 12px 14px; border: 1.5px solid #f0f0f0; border-radius: 10px; cursor: pointer; transition: all 0.12s; background: #fafafa; }
  .convert-option:hover { border-color: #c4b5fd; background: #fafafe; }
  .convert-option.selected { border-color: #4f46e5; background: #f5f3ff; }

  /* SIDEBAR */
  .app-layout { display: flex; flex: 1; min-height: 0; }
  .sidebar { display: none; }
  @media (min-width: 768px) {
    .sidebar { display: flex; flex-direction: column; width: 220px; flex-shrink: 0; border-right: 1px solid #f0f0f0; background: #fafafa; padding: 16px 10px; position: sticky; top: 56px; height: calc(100vh - 56px); overflow-y: auto; }
    .nav { display: none; }
    .main { max-width: 100%; padding: 24px 32px 100px; }
  }
  .sidebar-section { font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #9ca3af; padding: 6px 8px 4px; margin-top: 12px; }
  .sidebar-section:first-child { margin-top: 0; }
  .sidebar-btn { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 6px; border: none; background: transparent; color: #6b7280; cursor: pointer; font-size: 13px; font-weight: 500; width: 100%; text-align: left; transition: all 0.1s; font-family: inherit; position: relative; }
  .sidebar-btn:hover { background: #f0f0f0; color: #111827; }
  .sidebar-btn.active { background: #ede9fe; color: #4f46e5; font-weight: 600; }
  .sidebar-badge { margin-left: auto; background: #e5e7eb; color: #6b7280; border-radius: 8px; padding: 1px 6px; font-size: 10px; font-weight: 600; }
  .sidebar-btn.active .sidebar-badge { background: #c4b5fd; color: #4f46e5; }
  .sidebar-icon { font-size: 14px; width: 18px; text-align: center; flex-shrink: 0; }
  .sidebar-divider { border: none; border-top: 1px solid #f0f0f0; margin: 10px 0; }
  .sidebar-capture { display: flex; align-items: center; gap: 6px; padding: 8px 10px; border-radius: 6px; border: 1px dashed #d1d5db; background: transparent; color: #9ca3af; cursor: pointer; font-size: 12px; font-weight: 500; width: 100%; text-align: left; transition: all 0.1s; font-family: inherit; margin-top: 4px; }
  .sidebar-capture:hover { border-color: #4f46e5; color: #4f46e5; background: #f5f3ff; }

  /* LOADING */
  .search-results { }
  .search-results-header { font-size: 12px; color: #9ca3af; margin-bottom: 14px; font-family: 'DM Mono', monospace; }
  .search-bucket-group { margin-bottom: 16px; }
  .search-bucket-label { display: flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #9ca3af; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #f3f4f6; }
  .search-highlight { background: #fef9c3; border-radius: 2px; padding: 0 1px; }
`;


// ── TRANSURFING QUOTES ────────────────────────────────────────────────────────
const TF_QUOTES = [
  "The soul doesn't think and doesn't speak, but it feels and knows.",
  "Everything is a lot easier than it seems. Give in to this simplicity.",
  "Having refused importance, you will get the freedom to choose your destiny.",
  "Freedom of choice allows you to stop asking, stop demanding, and stop struggling.",
  "Move the center of gravity from control to observation.",
  "Having relinquished control, you will get real control over a situation.",
  "If you move along the flow of variations, the world will come out to greet you.",
  "If you have to talk yourself into something, it means the soul is saying no.",
  "Train yourself to pay attention to inner comfort.",
  "It is not the omen that works, but your attitude to it.",
  "Streams in the flow of variations already have in themselves the solutions to all problems.",
  "Internal and external importance throws the mind out of the optimal stream.",
  "The condition of inner discomfort is a clear sign.",
  "Life tracks differ qualitatively from one another.",
  "It's necessary to loosen the grip and accept unforeseen events in your script.",
  "The mind strives to control, not its own movement along the flow, but the flow itself.",
  "Entirely new discoveries come from unrealized sectors.",
  "If you have the possibility to refuse an uncomfortable decision — refuse it.",
  "The soul accepts unrealized information as knowledge without interpretations.",
  "Guiding signs point at possible turns in the flow of variations.",
];

const OBJECTIVES = [
  "Todo lo que hago siempre sale a mi favor. Si me ocurre, qué bueno; si no me ocurre, qué bueno, porque viene algo mejor. No fuerzo las cosas, permito que sucedan y fluyo con ellas. Confío plenamente en Dios. It is done.",
  "Siempre tengo más dinero del que puedo gastar. Estoy siempre en la frecuencia de abundancia. El dinero fluye naturalmente hacia mí y desde mí.",
  "Tengo varias fuentes de ingresos pasivos que me dan libertad de tiempo y financiera. Gracias Dios por esta bendición.",
  "El tiempo es maleable. Estoy y vivo siempre en coherencia.",
  "No sé cómo fue, pero pasó. Cuando recibí ese dinero extra 3-4 veces de lo que siempre recibo. Gracias por esa sorpresa que me catapultó a estabilizarme y generar mucho más.",
  "El libro 'A Nadie Le Importa Tu Propuesta' ya es Best Seller en Latinoamérica. 🙌",
];

function TransurfingBanner() {
  const [quoteIdx] = useState(() => Math.floor(Math.random() * TF_QUOTES.length));
  const [showObj, setShowObj] = useState(false);

  return (
    <div style={{marginBottom:20}}>
      <div className="tf-banner" onClick={() => setShowObj(p => !p)}>
        <div className="tf-banner-label">Reality Transurfing · V. Zeland</div>
        <div className="tf-banner-quote">"{TF_QUOTES[quoteIdx]}"</div>
        <div className="tf-banner-footer">{showObj ? "▲ Ocultar objetivos" : "▼ Ver mis objetivos"}</div>
      </div>
      {showObj && (
        <div className="obj-banner">
          <div className="obj-banner-label">Mis afirmaciones · It is done</div>
          {OBJECTIVES.map((o, i) => (
            <div key={i} className="obj-item">
              <div className="obj-dot" />
              <span>{o}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
function ProcessModal({ item, projects, allItems, onSave, onDelete, onClose, onNext, unprocessedCount, onConvertToProject }) {
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
    recurrence: item?.recurrence || "",       // daily | weekly | monthly | custom | ""
    customDays: item?.customDays || "7",
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const existingTags = getAllTags(allItems).filter(t => !parseHashtags(f.hashtags).includes(t));
  const addTag = (tag) => { const cur = f.hashtags.trim(); set("hashtags", cur ? `${cur} ${tag}` : tag); };
  const isNew = !item?.processed;

  // Sugerencias de personas en waiting
  const waitingSuggestions = [...new Set(allItems.filter(i => i.waitingFor?.trim()).map(i => i.waitingFor.trim()))];
  const filteredSuggestions = waitingSuggestions.filter(w =>
    f.waitingFor && w.toLowerCase().includes(f.waitingFor.toLowerCase()) && w !== f.waitingFor
  );

  const handleSave = async () => {
    if (!f.title.trim()) return;
    await onSave({ ...item, ...f, type: "item" });
    if (isNew && onNext) {
      onNext(); // pasa al siguiente sin cerrar
    } else {
      onClose();
    }
  };

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">{isNew ? "⚡ Procesar" : "✎ Editar"}</span>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            {isNew && unprocessedCount > 1 && (
              <span style={{fontSize:11,color:"#f59e0b",fontWeight:700,background:"#fffbeb",border:"1px solid #fde68a",borderRadius:6,padding:"2px 8px"}}>
                {unprocessedCount} pendientes
              </span>
            )}
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
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
            {filteredSuggestions.length > 0 && (
              <div className="tag-suggestions">
                <span style={{fontSize:10,color:"#94a3b8",marginRight:4}}>@</span>
                {filteredSuggestions.map(w => (
                  <button key={w} className="tag-sug" style={{color:"#7c3aed",borderColor:"rgba(124,58,237,0.3)",background:"rgba(124,58,237,0.06)"}}
                    onClick={() => set("waitingFor", w)}>@{w}</button>
                ))}
              </div>
            )}
            {f.waitingFor === "" && waitingSuggestions.length > 0 && (
              <div className="tag-suggestions">
                <span style={{fontSize:10,color:"#94a3b8",marginRight:4}}>recientes:</span>
                {waitingSuggestions.slice(0,5).map(w => (
                  <button key={w} className="tag-sug" style={{color:"#7c3aed",borderColor:"rgba(124,58,237,0.3)",background:"rgba(124,58,237,0.06)"}}
                    onClick={() => set("waitingFor", w)}>@{w}</button>
                ))}
              </div>
            )}
            <label className="field-label">Seguimiento — ¿cuándo contactar?</label>
            <input className="inp" type="date" value={f.dueDate} onChange={e => set("dueDate", e.target.value)} />
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

        <hr className="divider" />

        {/* PASO 4 — RECURRENCIA */}
        <div className="process-step">
          <div className="step-title"><span className="step-num">4</span> ¿Es recurrente?</div>
          <div className={`recur-toggle${f.recurrence?" on":""}`}
            onClick={() => set("recurrence", f.recurrence ? "" : "weekly")}>
            <span className="recur-toggle-label">🔄 {f.recurrence ? "Sí, se repite" : "No, es única"}</span>
            <div className={`toggle-switch${f.recurrence?" on":""}`} />
          </div>
          {f.recurrence && <>
            <div className="chip-row">
              {[["daily","Diario"],["weekly","Semanal"],["monthly","Mensual"],["custom","Cada X días"]].map(([id,lbl]) => (
                <button key={id} className={`chip${f.recurrence===id?" on":""}`}
                  style={{"--cc":"rgba(99,102,241,0.1)","--cb":"rgba(99,102,241,0.4)","--ct":"#6366f1"}}
                  onClick={() => set("recurrence", id)}>{lbl}</button>
              ))}
            </div>
            {f.recurrence === "custom" && (
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{fontSize:13,color:"#64748b"}}>Cada</span>
                <input className="inp" type="number" min="1" max="365"
                  value={f.customDays} onChange={e => set("customDays", e.target.value)}
                  style={{width:70,marginBottom:0,textAlign:"center"}} />
                <span style={{fontSize:13,color:"#64748b"}}>días</span>
              </div>
            )}
            <div style={{fontSize:11,color:"#94a3b8",fontStyle:"italic"}}>
              Al marcar como ✅ hecha se generará automáticamente la siguiente instancia en Agenda.
            </div>
          </>}
        </div>

        <div className="btn-row">
          {item && <button className="btn btn-danger" onClick={() => { onDelete(item._id); onClose(); }}>Eliminar</button>}
          <button className="btn btn-ghost" onClick={onClose}>Cerrar</button>
          <button className={`btn ${isNew?"btn-process":"btn-primary"}`} onClick={handleSave}>
            {isNew && onNext && unprocessedCount > 1 ? "✓ Procesar → siguiente" : isNew ? "✓ Procesar" : "Guardar"}
          </button>
        </div>

        {/* CONVERTIR A PROYECTO */}
        {item && !item.projectId && onConvertToProject && (
          <div style={{marginTop:12,borderTop:"1px solid #f3f4f6",paddingTop:12}}>
            <button onClick={() => onConvertToProject(item, f)}
              style={{width:"100%",padding:"9px",borderRadius:8,border:"1px dashed #c4b5fd",background:"#fafafe",color:"#6d28d9",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit",transition:"all 0.12s"}}>
              📁 Convertir en proyecto
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── CONVERT TO PROJECT MODAL ──────────────────────────────────────────────────
function ConvertToProjectModal({ item, onConfirm, onClose }) {
  const COLORS = ["#4f46e5","#d97706","#059669","#dc2626","#7c3aed","#0891b2","#ea580c","#db2777"];
  const [role, setRole] = useState(""); // "first-action" | "description"
  const [projColor, setProjColor] = useState("#4f46e5");

  return (
    <div className="modal-bg" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">📁 Convertir en proyecto</span>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-subtitle">"{item.title}"</div>

        <div style={{marginBottom:16}}>
          <label className="field-label">¿Qué rol tendrá esta acción en el proyecto?</label>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <div className={`convert-option${role==="first-action"?" selected":""}`}
              onClick={() => setRole("first-action")}>
              <div style={{fontSize:16,marginBottom:4}}>⚡ Primera acción</div>
              <div style={{fontSize:12,color:"#6b7280",lineHeight:1.5}}>
                Esta tarea se convierte en la primera next action del nuevo proyecto. El proyecto empieza aquí.
              </div>
            </div>
            <div className={`convert-option${role==="description"?" selected":""}`}
              onClick={() => setRole("description")}>
              <div style={{fontSize:16,marginBottom:4}}>🎯 Resultado esperado</div>
              <div style={{fontSize:12,color:"#6b7280",lineHeight:1.5}}>
                Esta tarea describe el resultado final del proyecto. Empezarás a agregar acciones desde cero.
              </div>
            </div>
          </div>
        </div>

        <label className="field-label">Color del proyecto</label>
        <div className="color-row" style={{marginBottom:16}}>
          {COLORS.map(c => (
            <div key={c} className="color-dot" onClick={() => setProjColor(c)}
              style={{background:c,border:projColor===c?"3px solid #111827":"3px solid transparent"}} />
          ))}
        </div>

        <div className="btn-row">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={!role}
            style={{opacity:role?1:0.4}}
            onClick={() => { if (role) { onConfirm(role, projColor); onClose(); } }}>
            Crear proyecto →
          </button>
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
          {item.recurrence && <span className="recur-badge">🔄 {item.recurrence==="daily"?"Diario":item.recurrence==="weekly"?"Semanal":item.recurrence==="monthly"?"Mensual":`c/${item.customDays}d`}</span>}
          {item.waitingFor && <span style={{fontSize:10,color:"#7c3aed",fontWeight:600}}>⏳ @{item.waitingFor}</span>}
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
function Dashboard({ items, projects, onEdit, onDone, onNewItem, onCapture, onNavigate }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const todayStr = today.toISOString().slice(0,10);
  const in7 = new Date(today); in7.setDate(in7.getDate()+7);
  const in7Str = in7.toISOString().slice(0,10);

  // Clasificaciones
  const active = items.filter(i => i.processed && i.bucket !== "archive" && i.bucket !== "trash" && i.bucket !== "reference");
  const unprocessed = items.filter(i => i.bucket === "inbox" && !i.processed);
  const overdue = active.filter(i => i.dueDate && getDaysInfo(i.dueDate) > 0);
  const dueToday = active.filter(i => i.dueDate === todayStr);
  const dueNext7 = active.filter(i => i.dueDate && i.dueDate > todayStr && i.dueDate <= in7Str);
  const doneToday = items.filter(i => i.bucket === "archive" && i.updatedAt >= today.getTime());
  const doneWeek = items.filter(i => {
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate()-7);
    return i.bucket === "archive" && i.updatedAt >= weekAgo.getTime();
  });

  // Energía
  const byEnergy = (level) => active.filter(i =>
    (i.bucket === "next" || i.bucket === "agenda") && i.energy === level
  ).sort((a,b) => {
    // más urgentes primero dentro de cada nivel
    const da = getDaysInfo(a.dueDate) ?? -999;
    const db_ = getDaysInfo(b.dueDate) ?? -999;
    return db_ - da;
  }).slice(0,4);

  const highE = byEnergy("high");
  const medE  = byEnergy("med");
  const lowE  = byEnergy("low");

  // Racha — días con al menos 1 tarea archivada
  const calcStreak = () => {
    let streak = 0;
    const d = new Date(today);
    while (true) {
      const dStr = d.toISOString().slice(0,10);
      const dStart = new Date(dStr+"T00:00:00").getTime();
      const dEnd = dStart + 86400000;
      const hadActivity = items.some(i => i.bucket === "archive" && i.updatedAt >= dStart && i.updatedAt < dEnd);
      if (!hadActivity) break;
      streak++;
      d.setDate(d.getDate()-1);
      if (streak > 365) break;
    }
    return streak;
  };
  const streak = calcStreak();

  // Proyectos activos con progreso
  const activeProjects = projects.filter(p => p.status === "active").map(p => {
    const pItems = items.filter(i => i.projectId === p._id && i.bucket !== "trash");
    const done = pItems.filter(i => i.bucket === "archive").length;
    const total = pItems.length;
    const pct = total > 0 ? Math.round((done/total)*100) : 0;
    return { ...p, done, total, pct };
  }).sort((a,b) => b.pct - a.pct);

  const EnergyCard = ({ level, icon, label, color, taskList }) => (
    <div className="dash-section" style={{flex:1,minWidth:0}}>
      <div className="dash-header">
        <div className="dash-title" style={{color}}>{icon} {label}</div>
        <span className="dash-count">{taskList.length}</span>
      </div>
      <div className="dash-items">
        {taskList.length === 0
          ? <div className="dash-empty">Sin tareas {label.toLowerCase()}</div>
          : taskList.map(i => <DashItem key={i._id} item={i} projects={projects} onEdit={onEdit} onDone={onDone} />)
        }
      </div>
    </div>
  );

  return (
    <div>
      {/* ── TRANSURFING BANNER ── */}
      <TransurfingBanner />

      {/* ── SALUDO ── */}
      <div style={{marginBottom:20}}>
        <div style={{fontSize:22,fontWeight:800,color:"#1e293b",letterSpacing:-0.5,marginBottom:2}}>
          {new Date().getHours() < 12 ? "Buenos días" : new Date().getHours() < 19 ? "Buenas tardes" : "Buenas noches"} 👋
        </div>
        <div style={{fontSize:12,color:"#94a3b8"}}>
          {todayStr} · {doneToday.length > 0 ? `${doneToday.length} tarea${doneToday.length>1?"s":""} completada${doneToday.length>1?"s":""} hoy` : "Sin tareas completadas hoy todavía"}
        </div>
      </div>

      {/* ── SECCIÓN 1: ALERTAS ── */}
      {(overdue.length > 0 || dueToday.length > 0 || unprocessed.length > 0) && (
        <div style={{marginBottom:20}}>
          <div className="section-label">⚡ Atención inmediata</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>

            {unprocessed.length > 0 && (
              <div className="alert-card alert-yellow" onClick={() => onEdit(unprocessed[0])}>
                <span style={{fontSize:18}}>📥</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#92400e"}}>{unprocessed.length} item{unprocessed.length>1?"s":""} sin procesar en inbox</div>
                  <div style={{fontSize:11,color:"#b45309"}}>Procesar ahora →</div>
                </div>
              </div>
            )}

            {overdue.length > 0 && (
              <div className="alert-card alert-red" onClick={() => onNavigate("agenda","overdue")}>
                <span style={{fontSize:18}}>🚨</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#991b1b"}}>{overdue.length} tarea{overdue.length>1?"s":""} vencida{overdue.length>1?"s":""}</div>
                  <div style={{fontSize:11,color:"#b91c1c"}}>
                    {overdue.slice(0,2).map(i => i.title).join(" · ")}{overdue.length>2?` +${overdue.length-2} más`:""} · <span style={{textDecoration:"underline"}}>Ver todas →</span>
                  </div>
                </div>
              </div>
            )}

            {dueToday.length > 0 && (
              <div className="alert-card alert-orange" onClick={() => onNavigate("agenda","today")}>
                <span style={{fontSize:18}}>📅</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#92400e"}}>{dueToday.length} tarea{dueToday.length>1?"s":""} para hoy</div>
                  <div style={{fontSize:11,color:"#b45309"}}>
                    {dueToday.slice(0,2).map(i => i.title).join(" · ")}{dueToday.length>2?` +${dueToday.length-2} más`:""} · <span style={{textDecoration:"underline"}}>Ver todas →</span>
                  </div>
                </div>
              </div>
            )}

            {dueNext7.length > 0 && (
              <div className="alert-card alert-blue" onClick={() => onNavigate("agenda","next7")}>
                <span style={{fontSize:18}}>🔜</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#1e40af"}}>{dueNext7.length} tarea{dueNext7.length>1?"s":""} próximos 7 días</div>
                  <div style={{fontSize:11,color:"#3b82f6"}}>
                    {dueNext7.slice(0,2).map(i => `${i.title} (${i.dueDate})`).join(" · ")} · <span style={{textDecoration:"underline"}}>Ver todas →</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SECCIÓN 2: MOMENTUM POR ENERGÍA ── */}
      <div style={{marginBottom:20}}>
        <div className="section-label">🔋 Genera momentum — elige según tu energía</div>
        <div style={{display:"flex",gap:8,flexDirection:"column"}}>
          {highE.length > 0 && <EnergyCard level="high" icon="⚡" label="Alta energía" color="#dc2626" taskList={highE} />}
          {medE.length > 0  && <EnergyCard level="med"  icon="🔆" label="Media energía" color="#d97706" taskList={medE} />}
          {lowE.length > 0  && <EnergyCard level="low"  icon="🌙" label="Baja energía" color="#059669" taskList={lowE} />}
          {highE.length === 0 && medE.length === 0 && lowE.length === 0 && (
            <div className="empty"><div className="empty-icon">🎯</div><div className="empty-text">No hay tareas pendientes — ¡bien hecho!</div></div>
          )}
        </div>
      </div>

      {/* ── SECCIÓN 3: TRACCIÓN ── */}
      <div style={{marginBottom:20}}>
        <div className="section-label">📈 Tu tracción</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          {/* RACHA */}
          <div style={{background:"#fff",border:"1px solid #e4e7ef",borderRadius:12,padding:"14px 16px",textAlign:"center"}}>
            <div style={{fontSize:28}}>🔥</div>
            <div style={{fontSize:26,fontWeight:800,color:streak>0?"#f59e0b":"#cbd5e1",letterSpacing:-1}}>{streak}</div>
            <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.06em"}}>días seguidos</div>
            {streak === 0 && <div style={{fontSize:10,color:"#cbd5e1",marginTop:4}}>Completa una tarea hoy</div>}
          </div>
          {/* SEMANA */}
          <div style={{background:"#fff",border:"1px solid #e4e7ef",borderRadius:12,padding:"14px 16px",textAlign:"center"}}>
            <div style={{fontSize:28}}>✅</div>
            <div style={{fontSize:26,fontWeight:800,color:"#059669",letterSpacing:-1}}>{doneWeek.length}</div>
            <div style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.06em"}}>completadas esta semana</div>
            <div style={{fontSize:10,color:"#94a3b8",marginTop:4}}>{doneToday.length} hoy</div>
          </div>
        </div>

        {/* PROYECTOS */}
        {activeProjects.length > 0 && (
          <div style={{background:"#fff",border:"1px solid #e4e7ef",borderRadius:12,padding:"14px 16px"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>Proyectos activos</div>
            {activeProjects.map(p => (
              <div key={p._id} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#1e293b",display:"flex",alignItems:"center",gap:6}}>
                    <span style={{width:8,height:8,borderRadius:"50%",background:p.color||"#6366f1",display:"inline-block"}} />
                    {p.title}
                  </div>
                  <span style={{fontSize:11,fontWeight:700,color:p.color||"#6366f1"}}>{p.pct}%</span>
                </div>
                <div style={{height:6,background:"#f1f5f9",borderRadius:4,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${p.pct}%`,background:p.color||"#6366f1",borderRadius:4,transition:"width 0.4s ease"}} />
                </div>
                <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{p.done} de {p.total} tareas completadas</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── BUCKET VIEW ───────────────────────────────────────────────────────────────
function BucketView({ bucket, items, projects, allItems, onEdit, onMoveTo, onDone, onTagClick, activeTag, search, setSearch, setActiveTag, dateFilter, setDateFilter, unprocessed }) {
  const bkt = BUCKETS.find(b => b.id === bucket);
  const todayStr = new Date().toISOString().slice(0,10);
  const in7Str = (() => { const d = new Date(); d.setDate(d.getDate()+7); return d.toISOString().slice(0,10); })();

  const bucketTags = [...new Set(items.filter(i=>i.bucket===bucket).flatMap(i=>parseHashtags(i.hashtags)))].sort();
  const visible = items.filter(i => {
    if (i.bucket !== bucket) return false;
    // Date filter from dashboard
    if (dateFilter === "overdue" && !(i.dueDate && getDaysInfo(i.dueDate) > 0)) return false;
    if (dateFilter === "today" && i.dueDate !== todayStr) return false;
    if (dateFilter === "next7" && !(i.dueDate && i.dueDate > todayStr && i.dueDate <= in7Str)) return false;
    if (activeTag && !parseHashtags(i.hashtags).includes(activeTag)) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!i.title?.toLowerCase().includes(q) && !i.notes?.toLowerCase().includes(q) &&
          !i.hashtags?.toLowerCase().includes(q) && !i.context?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const filterLabel = dateFilter === "overdue" ? "🚨 Vencidas" : dateFilter === "today" ? "📅 Para hoy" : dateFilter === "next7" ? "🔜 Próximos 7 días" : "";

  return (
    <>
      <div className="bucket-header">
        <div className="bucket-name">{bkt?.icon} {bkt?.label}</div>
        <div className="bucket-desc">{bkt?.desc}</div>
      </div>

      {dateFilter && (
        <div style={{display:"flex",alignItems:"center",gap:8,background:"#f5f3ff",border:"1px solid #ede9fe",borderRadius:8,padding:"8px 12px",marginBottom:12}}>
          <span style={{fontSize:12,fontWeight:600,color:"#4f46e5"}}>Filtro activo: {filterLabel}</span>
          <button onClick={() => setDateFilter("")} style={{marginLeft:"auto",fontSize:10,color:"#7c3aed",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>✕ Quitar filtro</button>
        </div>
      )}

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
              {item.recurrence && <span className="recur-badge">🔄 {item.recurrence==="daily"?"Diario":item.recurrence==="weekly"?"Semanal":item.recurrence==="monthly"?"Mensual":`c/${item.customDays}d`}</span>}
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

// ── CALENDAR VIEW ─────────────────────────────────────────────────────────────
const DAYS_ES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function CalendarView({ items, projects, onEdit }) {
  const [calView, setCalView] = useState("week"); // week | day | month
  const [refDate, setRefDate] = useState(new Date());

  const agendaItems = items.filter(i => i.bucket === "agenda" && i.dueDate);

  // ── helpers ──
  const startOfWeek = (d) => {
    const s = new Date(d); s.setHours(0,0,0,0);
    s.setDate(s.getDate() - s.getDay()); return s;
  };
  const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate()+n); return r; };
  const toYMD = (d) => d.toISOString().slice(0,10);
  const today = toYMD(new Date());

  const itemsForDate = (ymd) =>
    agendaItems.filter(i => i.dueDate === ymd)
      .sort((a,b) => ({high:0,med:1,low:2}[a.priority]||1) - ({high:0,med:1,low:2}[b.priority]||1));

  // navigate
  const nav = (dir) => {
    const d = new Date(refDate);
    if (calView === "day")   d.setDate(d.getDate() + dir);
    if (calView === "week")  d.setDate(d.getDate() + dir*7);
    if (calView === "month") d.setMonth(d.getMonth() + dir);
    setRefDate(d);
  };

  // ── WEEK ──
  const WeekView = () => {
    const start = startOfWeek(refDate);
    const days = Array.from({length:7}, (_,i) => addDays(start,i));
    const label = `${days[0].getDate()} ${MONTHS_ES[days[0].getMonth()]} – ${days[6].getDate()} ${MONTHS_ES[days[6].getMonth()]} ${days[6].getFullYear()}`;
    return (
      <>
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={() => nav(-1)}>‹</button>
          <span className="cal-nav-label">{label}</span>
          <button className="cal-nav-btn" onClick={() => nav(1)}>›</button>
          <button className="cal-today-btn" onClick={() => setRefDate(new Date())}>Hoy</button>
        </div>
        <div className="cal-week-grid">
          {days.map(d => {
            const ymd = toYMD(d);
            const isToday = ymd === today;
            const dayItems = itemsForDate(ymd);
            return (
              <div key={ymd} className={`cal-day-col${isToday?" cal-today":""}`}>
                <div className="cal-day-header">
                  <span className="cal-day-name">{DAYS_ES[d.getDay()]}</span>
                  <span className={`cal-day-num${isToday?" cal-day-num-today":""}`}>{d.getDate()}</span>
                </div>
                <div className="cal-day-items">
                  {dayItems.length === 0
                    ? <div className="cal-empty-day" />
                    : dayItems.map(i => <CalItem key={i._id} item={i} projects={projects} onEdit={onEdit} />)
                  }
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  // ── DAY ──
  const DayView = () => {
    const ymd = toYMD(refDate);
    const dayItems = itemsForDate(ymd);
    const label = `${DAYS_ES[refDate.getDay()]} ${refDate.getDate()} de ${MONTHS_ES[refDate.getMonth()]} ${refDate.getFullYear()}`;
    return (
      <>
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={() => nav(-1)}>‹</button>
          <span className="cal-nav-label">{label}</span>
          <button className="cal-nav-btn" onClick={() => nav(1)}>›</button>
          <button className="cal-today-btn" onClick={() => setRefDate(new Date())}>Hoy</button>
        </div>
        <div style={{background:"#fff",border:"1px solid #e4e7ef",borderRadius:14,padding:16,minHeight:200}}>
          {dayItems.length === 0
            ? <div className="empty"><div className="empty-icon">📅</div><div className="empty-text">Sin actividades este día</div></div>
            : dayItems.map(i => <CalItemFull key={i._id} item={i} projects={projects} onEdit={onEdit} />)
          }
        </div>
      </>
    );
  };

  // ── MONTH ──
  const MonthView = () => {
    const year = refDate.getFullYear();
    const month = refDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month+1, 0);
    const startPad = firstDay.getDay();
    const totalCells = Math.ceil((startPad + lastDay.getDate()) / 7) * 7;
    const cells = Array.from({length: totalCells}, (_,i) => {
      const d = new Date(year, month, 1 - startPad + i);
      return d;
    });
    return (
      <>
        <div className="cal-nav">
          <button className="cal-nav-btn" onClick={() => nav(-1)}>‹</button>
          <span className="cal-nav-label">{MONTHS_ES[month]} {year}</span>
          <button className="cal-nav-btn" onClick={() => nav(1)}>›</button>
          <button className="cal-today-btn" onClick={() => setRefDate(new Date())}>Hoy</button>
        </div>
        <div className="cal-month-grid">
          {DAYS_ES.map(d => <div key={d} className="cal-month-dayname">{d}</div>)}
          {cells.map((d,i) => {
            const ymd = toYMD(d);
            const inMonth = d.getMonth() === month;
            const isToday = ymd === today;
            const dayItems = itemsForDate(ymd);
            return (
              <div key={i} className={`cal-month-cell${!inMonth?" cal-out-month":""}${isToday?" cal-today-cell":""}`}
                onClick={() => { setRefDate(new Date(d)); setCalView("day"); }}>
                <div className={`cal-month-num${isToday?" cal-day-num-today":""}`}>{d.getDate()}</div>
                <div className="cal-month-items">
                  {dayItems.slice(0,3).map(i => {
                    const pr = PRIORITIES.find(p => p.id === i.priority);
                    return (
                      <div key={i._id} className="cal-month-pill"
                        style={{background:`${pr?.color||"#6366f1"}15`,borderLeft:`2px solid ${pr?.color||"#6366f1"}`}}
                        onClick={e => { e.stopPropagation(); onEdit(i); }}>
                        {i.title}
                      </div>
                    );
                  })}
                  {dayItems.length > 3 && <div className="cal-month-more">+{dayItems.length-3} más</div>}
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <div>
      {/* VIEW SWITCHER */}
      <div className="cal-switcher">
        {[["day","Día"],["week","Semana"],["month","Mes"]].map(([id,lbl]) => (
          <button key={id} className={`cal-switch-btn${calView===id?" active":""}`}
            onClick={() => setCalView(id)}>{lbl}</button>
        ))}
        <span style={{marginLeft:"auto",fontSize:11,color:"#94a3b8"}}>
          {agendaItems.length} actividades en agenda
        </span>
      </div>

      {calView === "week"  && <WeekView />}
      {calView === "day"   && <DayView />}
      {calView === "month" && <MonthView />}
    </div>
  );
}

// small inline pill for week/month
function CalItem({ item, projects, onEdit }) {
  const pr = PRIORITIES.find(p => p.id === item.priority);
  const diff = getDaysInfo(item.dueDate);
  const color = diff > 0 ? "#dc2626" : diff === 0 ? "#d97706" : pr?.color || "#6366f1";
  return (
    <div className="cal-item" style={{borderLeft:`3px solid ${color}`,background:`${color}0d`}} onClick={() => onEdit(item)}>
      <div className="cal-item-title">{item.title}</div>
      {item.waitingFor && <div style={{fontSize:9,color:"#7c3aed"}}>⏳ {item.waitingFor}</div>}
    </div>
  );
}

// full row for day view
function CalItemFull({ item, projects, onEdit }) {
  const project = projects.find(p => p._id === item.projectId);
  const pr = PRIORITIES.find(p => p.id === item.priority);
  const diff = getDaysInfo(item.dueDate);
  const color = diff > 0 ? "#dc2626" : diff === 0 ? "#d97706" : pr?.color || "#6366f1";
  return (
    <div className="card" style={{borderLeft:`3px solid ${color}`,marginBottom:8,cursor:"pointer"}} onClick={() => onEdit(item)}>
      <div className="card-title">{item.title}</div>
      <div className="card-meta">
        <DaysTag dueDate={item.dueDate} />
        {pr && <span className="pill" style={{background:`${pr.color}15`,color:pr.color,border:`1px solid ${pr.color}40`}}>{pr.label}</span>}
        {project && <span className="pill" style={{background:`${project.color||"#6366f1"}15`,color:project.color||"#6366f1",border:`1px solid ${project.color||"#6366f1"}40`}}>📁 {project.title}</span>}
        {item.context && <span style={{fontSize:10,color:"#6366f1",fontFamily:"'DM Mono',monospace"}}>{item.context}</span>}
        {item.waitingFor && <span style={{fontSize:10,color:"#7c3aed",fontWeight:600}}>⏳ {item.waitingFor}</span>}
        {parseHashtags(item.hashtags).map(t => <span key={t} className="hashtag" style={{cursor:"default"}}>{t}</span>)}
      </div>
    </div>
  );
}

// ── COACH SYSTEM PROMPT ──────────────────────────────────────────────────────
const buildCoachPrompt = (items, projects) => {
  const overdue = items.filter(i => i.bucket === "agenda" && getDaysInfo(i.dueDate) > 0).length;
  const unprocessed = items.filter(i => i.bucket === "inbox" && !i.processed).length;
  const activeProjects = projects.filter(p => p.status === "active").map(p => p.title).join(", ");
  const nextActions = items.filter(i => i.bucket === "next" && i.processed).length;

  return `Eres el Coach de Frecuencia personal de Luis Miguel Cervantes (LM). Tu rol es ser un guardián de su frecuencia — no un asistente de productividad genérico.

CONTEXTO DE TRANSURFING:
Trabajas con los principios de Reality Transurfing de Vadim Zeland. Los conceptos clave que debes aplicar:
- **Péndulos**: estructuras energéticas que jalan la atención y drenan energía. El trabajo, las noticias, las redes sociales, conversaciones negativas. LM debe reconocerlos y no alimentarlos.
- **Importancia excesiva**: cuando algo "significa demasiado" crea tensión que aleja el objetivo. La actitud correcta es calma + certeza.
- **Intención tranquila**: como ir al supermercado a buscar leche — sin dudar que está ahí. Ese es el estado maestro.
- **Canal de abundancia**: se sintoniza desde el estado, no desde el deseo intenso. El estado habitual es lo que el espejo refleja.
- **Espacio de variaciones**: ya existe la línea de tiempo donde LM tiene libertad financiera. Solo necesita alinearse con ella, no forzarla.

AFIRMACIONES DE LM (su canal destino — ya son hechos inevitables):
1. Todo lo que hago siempre sale a mi favor. Si me ocurre qué bueno, si no me ocurre qué bueno, porque viene algo mejor. No fuerzo las cosas, permito que sucedan y fluyo. Confío plenamente en Dios. It is done.
2. Siempre tengo más dinero del que puedo gastar. Estoy siempre en la frecuencia de abundancia. El dinero fluye naturalmente hacia mí y desde mí.
3. Tengo varias fuentes de ingresos pasivos que me dan libertad de tiempo y financiera. Gracias Dios por esta bendición.
4. El tiempo es maleable. Estoy y vivo siempre en coherencia.
5. No sé cómo fue, pero pasó. Recibí ese dinero extra 3-4 veces de lo que siempre recibo. Gracias por esa sorpresa que me catapultó.
6. El libro "A Nadie Le Importa Tu Propuesta" ya es Best Seller en Latinoamérica.

SITUACIÓN FINANCIERA ACTUAL DE LM:
Esta información es confidencial y sirve para que el Coach haga preguntas relevantes — no para juzgar sino para expandir.

INGRESOS MENSUALES: $7,850 USD
- Salario 1Q: $3,250
- Salario 2Q: $3,250
- Apoyo renta: $1,350

COMPROMISOS FIJOS MENSUALES:
Educación hijos:
- Colegiatura Emiliano: $802 (adeudo 2 meses = $1,604)
- Colegiatura Frida: $898 (adeudo 2 meses = $1,797)
- Clubes: $78 | Happy: $130 | Otros: $134

Casa:
- Mantenimiento: $401 (adeudo 1 mes)
- Hipoteca: $1,210 | Complemento casa: $1,060 | Arreglos: $162

Pasivos/Deudas:
- Tarjeta Banorte: $222/mes (adeudo 2 meses = $444)
- Amex CR: $606/mes (adeudo 2 meses = $1,212)
- Préstamo empresa: $866 (pago único pendiente)
- Checolin: $292 quincenal
- CrediQ: $720 (adeudo 3 meses = $2,160)
- SIMAN viejo: $48 (adeudo 1 mes)
- SIMAN tarjeta: $411 (adeudo 1 mes)
- Marchamo: $1,082 (pago único pendiente)
- Impuestos casa: $1,299 (pago único pendiente)

Gastos variables:
- Gasolina: $433 | Adriana: $649 | Comidas/viajes: $325
- Apps: $40 | Office: $50 | Gimnasio: $75
- Teléfono Adry: $40
- Despensa total: ~$1,558 (4 despensas)

ANÁLISIS DE LA SITUACIÓN:
- Ingresos: $7,850/mes
- Compromisos fijos mensuales: ~$10,345/mes
- Déficit mensual real: ~$2,495/mes (sin contar pagos únicos pendientes)
- Adeudos acumulados urgentes: ~$9,557 USD
- Pagos únicos pendientes: ~$3,247 USD
- La brecha de $2,495/mes es el péndulo financiero más activo y urgente en su vida
- Para solo equilibrar necesita $2,500 adicionales al mes. Para libertad financiera, mucho más.

CONTEXTO ACTUAL DEL GTD DE LM:
- Tareas vencidas: ${overdue}
- Items sin procesar en inbox: ${unprocessed}
- Next actions pendientes: ${nextActions}
- Proyectos activos: ${activeProjects || "ninguno registrado"}

PATRONES DE LM QUE EL COACH DEBE RECONOCER INMEDIATAMENTE:
- Usa el "día a día de Van Heusen" como excusa para no ejecutar proyectos propios
- Su voz crítica dice "no es suficientemente bueno" justo antes de lanzar algo
- Confunde planificación con acción — puede hablar de un proyecto por semanas sin moverlo
- Cuando está en frecuencia alta: hombros sin peso, decisiones rápidas, no necesita validación externa
- Cuando está en péndulo: busca más información, más perfección, más preparación antes de actuar
- Su ancla física es la pulsera. Su ancla de frecuencia es el texto de Místico.
- Si menciona Van Heusen como razón para no avanzar en algo propio — nombrarlo como péndulo directamente
- Si está "preparando" o "afinando" algo por más de una semana — preguntarle qué está evitando realmente

TU MISIÓN:
1. Detectar si LM está operando desde el canal correcto o desde un péndulo
2. Hacer preguntas que expandan — no que administren
3. Confrontar la complacencia cuando la detectes — especialmente frente al déficit financiero
4. Recordarle que la libertad financiera no es un objetivo futuro — ya existe en el espacio de variaciones
5. Ayudarlo a identificar qué acciones generan valor REAL vs cuáles solo llenan tiempo
6. Identificar qué fuentes de ingreso adicional no están en su GTD y deberían estar
7. La pregunta clave siempre: ¿esto que estás haciendo te acerca a cerrar la brecha financiera o es un péndulo?

ESTILO:
- Directo y cálido — como un socio que te conoce bien y no te va a dejar en la complacencia
- Usa preguntas poderosas más que afirmaciones
- Cuando detectes péndulo activo, nómbralo directamente
- Máximo 3-4 oraciones por respuesta — denso y enfocado, sin relleno
- Habla en español
- No trates el déficit como catástrofe — trátalo como información para moverse con intención

NUNCA:
- Ser solo motivacional sin confrontar
- Celebrar estar ocupado sin generar valor real
- Ignorar las señales de péndulo en lo que LM comparte
- Dar listas de tareas — eso es el GTD, no el Coach
- Crear ansiedad sobre las deudas — eso es importancia excesiva. La frecuencia correcta es certeza + movimiento`;
};

// ── COACH VIEW ────────────────────────────────────────────────────────────────
const COACH_COLL = "coach_sessions";

const saveCoachSession = async (messages) => {
  if (messages.length < 2) return;
  const id = `session_${Date.now()}`;
  const ref = doc(firestore, COACH_COLL, id);
  const summary = messages.slice(0, 4).map(m =>
    `${m.role === "user" ? "LM" : "Coach"}: ${m.content.slice(0, 200)}`
  ).join("\n");
  await setDoc(ref, {
    _id: id,
    date: new Date().toISOString().slice(0, 10),
    timestamp: Date.now(),
    summary,
    messageCount: messages.length,
  });
};

const loadRecentSessions = async () => {
  try {
    const { getDocs, query, orderBy, limit } = await import("firebase/firestore");
    const q = query(collection(firestore, COACH_COLL), orderBy("timestamp", "desc"), limit(5));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data()).reverse();
  } catch {
    return [];
  }
};

function CoachView({ items, projects }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [pastSessions, setPastSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [checkinDone, setCheckinDone] = useState(false);

  // Verificar si ya hizo check-in hoy
  const todayKey = new Date().toISOString().slice(0, 10);
  const checkinStorageKey = `coach_checkin_${todayKey}`;

  const STARTERS = [
    "¿En qué frecuencia estás operando ahora mismo?",
    "¿Hay algún péndulo activo en tu vida esta semana?",
    "¿Qué no está en tu GTD que necesita estar para que tu libertad financiera sea inevitable?",
    "¿Estás generando valor real hoy, o solo llenando tiempo?",
    "¿Cuándo fue la última vez que sentiste la certeza de 'it is done'?",
  ];

  useEffect(() => {
    loadRecentSessions().then(sessions => {
      setPastSessions(sessions);
      setLoadingSessions(false);
    });
    // Verificar si ya hizo check-in hoy
    const done = sessionStorage.getItem(checkinStorageKey);
    if (done) {
      setCheckinDone(true);
    }
  }, [checkinStorageKey]);

  const buildSystemWithMemory = () => {
    const base = buildCoachPrompt(items, projects);
    if (pastSessions.length === 0) return base;
    const memory = pastSessions.map(s => `[${s.date}]\n${s.summary}`).join("\n\n");
    return `${base}

HISTORIAL DE SESIONES ANTERIORES (últimas ${pastSessions.length}):
${memory}

Usa este historial para dar continuidad — menciona lo que se habló si es relevante, no repitas preguntas ya respondidas, y nota la evolución de LM entre sesiones.`;
  };

  const startSession = async (starter) => {
    setSessionStarted(true);
    const userMsg = { role: "user", content: starter };
    setMessages([userMsg]);
    await callCoach([userMsg]);
  };

  const callCoach = async (msgs) => {
    setLoading(true);
    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: buildSystemWithMemory(), messages: msgs }),
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text || "Error al conectar con el coach.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Error de conexión. Intenta de nuevo." }]);
    }
    setLoading(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input.trim() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    await callCoach(newMsgs);
  };

  const reset = async () => {
    await saveCoachSession(messages);
    const sessions = await loadRecentSessions();
    setPastSessions(sessions);
    setMessages([]);
    setSessionStarted(false);
    setInput("");
  };

  const handleCheckin = (answer) => {
    sessionStorage.setItem(checkinStorageKey, answer);
    setCheckinDone(true);
    // Arrancar sesión automáticamente según respuesta
    const starter = answer === "light"
      ? "Hombros sin peso hoy. ¿Qué vamos a mover que lleva tiempo esperando?"
      : "Hombros con peso hoy. ¿Qué péndulo está activo ahora mismo?";
    startSession(starter);
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div style={{maxWidth:680,margin:"0 auto"}}>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:20,fontWeight:700,color:"#111827",marginBottom:4,letterSpacing:-0.5}}>🧠 Coach de Frecuencia</div>
        <div style={{fontSize:12,color:"#9ca3af"}}>Anti-péndulos · Transurfing · Expansión continua</div>
      </div>

      {/* CHECK-IN DIARIO — solo si no se ha hecho hoy */}
      {!sessionStarted && !checkinDone && (
        <div style={{background:"#fff",border:"1px solid #e9e9f0",borderLeft:"3px solid #4f46e5",borderRadius:12,padding:"24px 20px",marginBottom:20,textAlign:"center"}}>
          <div style={{fontSize:16,fontWeight:700,color:"#111827",marginBottom:6}}>{greeting}, LM 👋</div>
          <div style={{fontSize:13,color:"#6b7280",marginBottom:20,lineHeight:1.6}}>
            Antes de arrancar —<br/>
            <strong style={{color:"#374151"}}>¿Hombros con peso o sin peso hoy?</strong>
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"center"}}>
            <button onClick={() => handleCheckin("light")}
              style={{padding:"12px 24px",background:"#f0fdf4",border:"2px solid #86efac",borderRadius:10,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,color:"#166534",transition:"all 0.12s"}}>
              🌿 Sin peso
            </button>
            <button onClick={() => handleCheckin("heavy")}
              style={{padding:"12px 24px",background:"#fff7ed",border:"2px solid #fed7aa",borderRadius:10,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,color:"#92400e",transition:"all 0.12s"}}>
              🔺 Con peso
            </button>
          </div>
        </div>
      )}

      {!sessionStarted && checkinDone && (
        <div>
          {/* CONTEXTO GTD */}
          <div style={{background:"linear-gradient(135deg,#fafaf9,#f5f3ff)",border:"1px solid #e9e9f0",borderLeft:"3px solid #4f46e5",borderRadius:10,padding:"16px 18px",marginBottom:16}}>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",color:"#7c3aed",marginBottom:6}}>Tu sistema ahora</div>
            <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
              {[
                ["📥",items.filter(i=>i.bucket==="inbox"&&!i.processed).length,"sin procesar"],
                ["🚨",items.filter(i=>i.bucket==="agenda"&&getDaysInfo(i.dueDate)>0).length,"vencidas"],
                ["⚡",items.filter(i=>i.bucket==="next"&&i.processed).length,"next actions"],
                ["📁",projects.filter(p=>p.status==="active").length,"proyectos activos"],
              ].map(([icon,n,lbl]) => (
                <div key={lbl} style={{textAlign:"center"}}>
                  <div style={{fontSize:13}}>{icon}</div>
                  <div style={{fontSize:18,fontWeight:700,color:"#4f46e5"}}>{n}</div>
                  <div style={{fontSize:10,color:"#9ca3af"}}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* SESIONES ANTERIORES */}
          {!loadingSessions && pastSessions.length > 0 && (
            <div style={{marginBottom:16}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"#9ca3af",marginBottom:8}}>
                🕐 Sesiones anteriores ({pastSessions.length})
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:4}}>
                {pastSessions.slice().reverse().map((s,i) => (
                  <div key={i} style={{background:"#f9fafb",border:"1px solid #f0f0f0",borderRadius:8,padding:"10px 12px"}}>
                    <div style={{fontSize:10,color:"#9ca3af",marginBottom:3,fontFamily:"'DM Mono',monospace"}}>{s.date} · {s.messageCount} mensajes</div>
                    <div style={{fontSize:12,color:"#374151",lineHeight:1.5,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                      {s.summary.split("\n")[0]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STARTERS */}
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"#9ca3af",marginBottom:8}}>¿Por dónde empezamos?</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {STARTERS.map((s,i) => (
              <button key={i} onClick={() => startSession(s)}
                style={{textAlign:"left",padding:"12px 16px",background:"#fff",border:"1px solid #f0f0f0",borderRadius:10,cursor:"pointer",fontSize:13,color:"#374151",fontFamily:"inherit",fontWeight:500,lineHeight:1.5}}>
                {s}
              </button>
            ))}
          </div>
          <div style={{marginTop:10}}>
            <input
              style={{width:"100%",background:"#f9fafb",border:"1px solid #f0f0f0",borderRadius:8,color:"#111827",fontFamily:"inherit",fontSize:14,padding:"10px 14px",outline:"none"}}
              placeholder="O escribe tu propio punto de partida..."
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key==="Enter" && input.trim() && startSession(input.trim())}
            />
          </div>
        </div>
      )}

      {sessionStarted && (
        <div>
          <div style={{background:"#fff",border:"1px solid #f0f0f0",borderRadius:12,padding:"16px",marginBottom:12,minHeight:300,maxHeight:"60vh",overflowY:"auto",display:"flex",flexDirection:"column",gap:12}}>
            {messages.map((m,i) => (
              <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                <div style={{maxWidth:"80%",padding:"10px 14px",borderRadius:10,fontSize:13,lineHeight:1.6,
                  background:m.role==="user"?"#4f46e5":"#f9fafb",
                  color:m.role==="user"?"#fff":"#111827",
                  border:m.role==="assistant"?"1px solid #f0f0f0":"none"}}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{display:"flex",justifyContent:"flex-start"}}>
                <div style={{background:"#f9fafb",border:"1px solid #f0f0f0",borderRadius:10,padding:"10px 16px",fontSize:13,color:"#9ca3af"}}>Pensando...</div>
              </div>
            )}
          </div>
          <div style={{display:"flex",gap:8}}>
            <input
              style={{flex:1,background:"#f9fafb",border:"1px solid #f0f0f0",borderRadius:8,color:"#111827",fontFamily:"inherit",fontSize:14,padding:"10px 14px",outline:"none"}}
              placeholder="Responde al coach..."
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key==="Enter" && sendMessage()}
              disabled={loading}
            />
            <button onClick={sendMessage} disabled={loading||!input.trim()}
              style={{background:"#4f46e5",border:"none",borderRadius:8,color:"#fff",padding:"10px 18px",cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit",opacity:loading||!input.trim()?0.5:1}}>
              →
            </button>
          </div>
          <button onClick={reset}
            style={{marginTop:10,background:"none",border:"none",color:"#9ca3af",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>
            ↩ Guardar y nueva sesión
          </button>
        </div>
      )}
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
  const [dateFilter, setDateFilter] = useState(""); // "overdue" | "today" | "next7" | ""
  const [globalSearch, setGlobalSearch] = useState("");
  const [showCapture, setShowCapture] = useState(false);
  const [showProcess, setShowProcess] = useState(false);
  const [showProj, setShowProj] = useState(false);
  const [showConvert, setShowConvert] = useState(false);
  const [convertItem, setConvertItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [editProj, setEditProj] = useState(null);
  const [newItemProjId, setNewItemProjId] = useState("");
  const [online, setOnline] = useState(navigator.onLine);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    if (!item) return;
    await db.put({ ...item, bucket: "archive", processed: true });
    // Si es recurrente, generar siguiente instancia
    if (item.recurrence && item.dueDate) {
      const nextDate = calcNextDate(item.dueDate, item.recurrence, item.customDays);
      await db.put({
        ...item,
        _id: undefined, // nuevo ID
        bucket: "agenda",
        dueDate: nextDate,
        processed: true,
        updatedAt: Date.now(),
      });
    }
  };
  const delProj = async (id) => {
    for (const i of allDocs.filter(d => d.type==="item" && d.projectId===id)) await db.put({...i,projectId:""});
    await db.del(id);
  };
  const convertToProject = async (item, role, color) => {
    // Create project
    const projId = `project_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    await db.put({
      _id: projId,
      type: "project",
      title: item.title,
      description: role === "description" ? item.title : "",
      status: "active",
      color,
      updatedAt: Date.now(),
    });
    if (role === "first-action") {
      // Link item to project as first action, move to next
      await db.put({ ...item, projectId: projId, bucket: "next", processed: true });
    } else {
      // Archive original item (it's the description), project starts fresh
      await db.put({ ...item, projectId: projId, bucket: "archive", processed: true });
    }
  };
  const moveTo = async (id, nb) => {
    const item = allDocs.find(d => d._id===id);
    if (item) await db.put({...item,bucket:nb});
  };
  const handleTagClick = tag => { setActiveTag(p => p===tag?"":tag); setSearch(""); };
  const openEdit = (item) => { setEditItem(item); setShowProcess(true); };
  const navigateTo = (targetBucket, filter="") => {
    setBucket(targetBucket);
    setView("bucket");
    setDateFilter(filter);
    setSearch("");
    setActiveTag("");
  };

  return (
    <>
      <style>{css}</style>
      <div className="gtd-root">

        {/* TOPBAR */}
        <div className="topbar">
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button className="hamburger" onClick={() => setDrawerOpen(true)}>☰</button>
            <div className="logo"><div className="logo-dot" />GTD Personal</div>
          </div>
          <div className="gsearch-wrap">
            <span className="gsearch-icon">🔍</span>
            <input className="gsearch-inp"
              placeholder="Buscar..."
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              onKeyDown={e => e.key === "Escape" && setGlobalSearch("")}
            />
            {globalSearch && <button className="gsearch-clear" onClick={() => setGlobalSearch("")}>✕</button>}
          </div>
          <div className="topbar-right">
            <button className={`topbtn${view==="coach"?" active":""}`} onClick={() => { setView("coach"); setGlobalSearch(""); }}>🧠</button>
            <button className={`topbtn${view==="calendar"?" active":""}`} onClick={() => { setView("calendar"); setGlobalSearch(""); }}>📆</button>
            <button className={`topbtn${view==="dashboard"?" active":""}`} onClick={() => { setView("dashboard"); setGlobalSearch(""); }}>🏠</button>
            <button className={`topbtn${view==="projects"?" active":""}`} onClick={() => { setView("projects"); setGlobalSearch(""); }}>📁</button>
            <button className={`topbtn${view==="settings"?" active":""}`} onClick={() => { setView("settings"); setGlobalSearch(""); }}>⚙️</button>
          </div>
        </div>

        {/* MOBILE DRAWER */}
        <div className={`drawer-overlay${drawerOpen?" open":""}`} onClick={() => setDrawerOpen(false)} />
        <div className={`drawer${drawerOpen?" open":""}`}>
          <div className="drawer-header">
            <div className="drawer-logo"><div className="logo-dot" />GTD Personal</div>
            <button className="drawer-close" onClick={() => setDrawerOpen(false)}>✕</button>
          </div>
          <button className="drawer-capture" onClick={() => { setShowCapture(true); setDrawerOpen(false); }}>
            + Capturar pensamiento
          </button>
          <hr className="drawer-divider" />
          <div className="drawer-section">Vistas</div>
          {[["dashboard","🏠","Dashboard"],["coach","🧠","Coach"],["calendar","📆","Calendario"],["projects","📁","Proyectos"],["settings","⚙️","Configuración"]].map(([v,icon,lbl]) => (
            <button key={v} className={`drawer-btn${view===v?" active":""}`}
              onClick={() => { setView(v); setGlobalSearch(""); setDrawerOpen(false); }}>
              <span style={{fontSize:14}}>{icon}</span>{lbl}
            </button>
          ))}
          <hr className="drawer-divider" />
          <div className="drawer-section">Bandejas</div>
          {BUCKETS.map(b => {
            const count = items.filter(i=>i.bucket===b.id).length;
            const active = view==="bucket" && bucket===b.id;
            return (
              <button key={b.id} className={`drawer-btn${active?" active":""}`}
                onClick={() => { setBucket(b.id); setView("bucket"); setSearch(""); setActiveTag(""); setDrawerOpen(false); }}>
                <span style={{fontSize:14}}>{b.icon}</span>{b.label}
                {count > 0 && <span className="drawer-badge">{count}</span>}
              </button>
            );
          })}
          {projects.filter(p=>p.status==="active").length > 0 && <>
            <hr className="drawer-divider" />
            <div className="drawer-section">Proyectos</div>
            {projects.filter(p=>p.status==="active").map(p => (
              <button key={p._id} className="drawer-btn"
                onClick={() => { setView("projects"); setDrawerOpen(false); }}>
                <span style={{color:p.color||"#4f46e5",fontSize:10}}>●</span>
                <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.title}</span>
              </button>
            ))}
          </>}
          <div style={{flex:1}} />
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 10px"}}>
            <div className={`sync-dot${online?"":" off"}`} />
            <span style={{fontSize:10,color:"#9ca3af"}}>{online?"Sincronizado":"Sin conexión"}</span>
          </div>
        </div>

        {/* BUCKET NAV — desktop only via sidebar, mobile hidden */}
        <div className="nav" style={{display:"none"}}>
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

        {/* MOBILE BOTTOM NAV */}
        <div className="bottom-nav">
          <button className={`bottom-nav-btn${view==="dashboard"?" active":""}`}
            onClick={() => { setView("dashboard"); setGlobalSearch(""); }}>
            <span className="bn-icon">🏠</span>
            <span className="bn-label">Inicio</span>
          </button>
          <button className={`bottom-nav-btn${view==="bucket"&&bucket==="inbox"?" active":""}`}
            onClick={() => { setBucket("inbox"); setView("bucket"); setSearch(""); setActiveTag(""); }}>
            <span className="bn-icon">📥</span>
            <span className="bn-label" style={{color: items.filter(i=>i.bucket==="inbox"&&!i.processed).length>0?"#ef4444":undefined}}>
              {items.filter(i=>i.bucket==="inbox"&&!i.processed).length>0 ? `${items.filter(i=>i.bucket==="inbox"&&!i.processed).length} inbox` : "Inbox"}
            </span>
          </button>
          <button className={`bottom-nav-btn${view==="coach"?" active":""}`}
            onClick={() => { setView("coach"); setGlobalSearch(""); }}>
            <span className="bn-icon">🧠</span>
            <span className="bn-label">Coach</span>
          </button>
          <button className={`bottom-nav-btn${view==="calendar"?" active":""}`}
            onClick={() => { setView("calendar"); setGlobalSearch(""); }}>
            <span className="bn-icon">📅</span>
            <span className="bn-label">Agenda</span>
          </button>
          <button className="bottom-nav-more" onClick={() => setDrawerOpen(true)}>
            <span className="bn-icon">☰</span>
            <span className="bn-label">Más</span>
          </button>
        </div>

        <div className="app-layout">
          {/* SIDEBAR — desktop only */}
          <div className="sidebar">
            <button className="sidebar-capture" onClick={() => setShowCapture(true)}>
              <span>+</span> Capturar pensamiento
            </button>
            <hr className="sidebar-divider" />

            <div className="sidebar-section">Vistas</div>
            {[
              ["dashboard","🏠","Dashboard"],
              ["coach","🧠","Coach"],
              ["calendar","📆","Calendario"],
              ["projects","📁","Proyectos"],
              ["settings","⚙️","Configuración"],
            ].map(([v,icon,lbl]) => (
              <button key={v} className={`sidebar-btn${view===v?" active":""}`}
                onClick={() => { setView(v); setGlobalSearch(""); }}>
                <span className="sidebar-icon">{icon}</span>{lbl}
              </button>
            ))}

            <hr className="sidebar-divider" />
            <div className="sidebar-section">Bandejas</div>
            {BUCKETS.map(b => {
              const count = items.filter(i=>i.bucket===b.id).length;
              const active = view==="bucket" && bucket===b.id;
              return (
                <button key={b.id} className={`sidebar-btn${active?" active":""}`}
                  onClick={() => { setBucket(b.id); setView("bucket"); setSearch(""); setActiveTag(""); }}>
                  <span className="sidebar-icon">{b.icon}</span>
                  {b.label}
                  {count > 0 && <span className="sidebar-badge">{count}</span>}
                </button>
              );
            })}

            <hr className="sidebar-divider" />
            <div className="sidebar-section">Proyectos</div>
            {projects.filter(p=>p.status==="active").map(p => (
              <button key={p._id} className="sidebar-btn"
                onClick={() => { setView("projects"); setGlobalSearch(""); }}>
                <span className="sidebar-icon" style={{color:p.color||"#4f46e5"}}>●</span>
                <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.title}</span>
              </button>
            ))}
            {projects.filter(p=>p.status==="active").length === 0 && (
              <div style={{fontSize:11,color:"#d1d5db",padding:"4px 10px"}}>Sin proyectos activos</div>
            )}

            <div style={{flex:1}} />
            <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 10px",marginTop:8}}>
              <div className={`sync-dot${online?"":" off"}`} />
              <span style={{fontSize:10,color:"#9ca3af"}}>{online?"Sincronizado":"Sin conexión"}</span>
            </div>
          </div>

          {/* MAIN */}
          <div className="main">
            {globalSearch.trim() ? (
              <GlobalSearchResults query={globalSearch} items={items} projects={projects} onEdit={openEdit} />
            ) : view === "dashboard" ? (
              <Dashboard items={items} projects={projects} onEdit={openEdit} onDone={markDone}
                onNewItem={() => { setEditItem(null); setShowProcess(true); }}
                onCapture={() => setShowCapture(true)}
                onNavigate={navigateTo} />
            ) : view === "bucket" ? (
              <BucketView bucket={bucket} items={items} projects={projects} allItems={items}
                onEdit={openEdit} onMoveTo={moveTo} onDone={markDone} onTagClick={handleTagClick}
                activeTag={activeTag} search={search} setSearch={setSearch} setActiveTag={setActiveTag}
                dateFilter={dateFilter} setDateFilter={setDateFilter}
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
            ) : view === "coach" ? (
              <CoachView items={items} projects={projects} />
            ) : view === "calendar" ? (
              <CalendarView items={items} projects={projects} onEdit={openEdit} />
            ) : view === "settings" ? (
              <SettingsView items={items} projects={projects} online={online} />
            ) : null}
          </div>
        </div>

        {/* FAB */}
        <button className="fab" onClick={() => setShowCapture(true)} title="Capturar">+</button>

        {/* MODALS */}
        {showCapture && (
          <CaptureModal onSave={async d => await saveItem(d)} onClose={() => setShowCapture(false)} />
        )}
        {showProcess && (
          <ProcessModal item={editItem} projects={projects} allItems={items}
            unprocessedCount={unprocessed.length}
            onSave={async d => { if (newItemProjId && !d.projectId) d.projectId = newItemProjId; await saveItem(d); }}
            onDelete={delItem}
            onConvertToProject={(item, f) => {
              setConvertItem(item);
              setShowConvert(true);
              setShowProcess(false);
            }}
            onNext={() => {
              const remaining = items.filter(i => i.bucket === "inbox" && !i.processed && i._id !== editItem?._id);
              if (remaining.length > 0) setEditItem(remaining[0]);
              else { setShowProcess(false); setEditItem(null); }
            }}
            onClose={() => { setShowProcess(false); setEditItem(null); setNewItemProjId(""); }} />
        )}
        {showConvert && convertItem && (
          <ConvertToProjectModal
            item={convertItem}
            onConfirm={async (role, color) => {
              await convertToProject(convertItem, role, color);
              setShowConvert(false);
              setConvertItem(null);
              setView("projects");
            }}
            onClose={() => { setShowConvert(false); setConvertItem(null); }} />
        )}
        {showProj && (
          <ProjectForm project={editProj} onSave={saveProj} onDelete={delProj}
            onClose={() => { setShowProj(false); setEditProj(null); }} />
        )}
      </div>
    </>
  );
}
