// ── Palette ──────────────────────────────────────────
export const C = {
  dark:"#08090C",panel:"#111318",panel2:"#181B22",border:"#232731",
  lime:"#C8F135",white:"#F0F2F8",gray:"#6B7280",lgray:"#9CA3AF",
  red:"#FF4455",yellow:"#FFB800",green:"#00C98C",blue:"#4A9EFF",
  purple:"#A855F7",orange:"#F97316",
};

// ── Helpers ───────────────────────────────────────────
export const fmtMoney = v => "R$ " + Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 0 });
export const fmtDate = d => d ? new Date(d + "T12:00:00").toLocaleDateString("pt-BR") : "—";
export const fmtDt = iso => iso ? new Date(iso).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "—";
export const today = () => new Date().toISOString().split("T")[0];

export const calcStatus = (ultimaCompra, ciclo) => {
  if (!ultimaCompra) return { label:"Sem compra", cor:C.gray, pct:0 };
  const dias = Math.floor((new Date() - new Date(ultimaCompra)) / 86400000);
  const pct = (dias / ciclo) * 100;
  if (dias >= ciclo) return { label:"Atrasado", cor:C.red, pct:Math.min(pct,100), dias };
  if (ciclo - dias <= Math.ceil(ciclo * 0.25)) return { label:"Atenção", cor:C.yellow, pct, dias };
  return { label:"Em dia", cor:C.green, pct, dias };
};

// ── Categories ────────────────────────────────────────
export const CATEGORIAS = [
  "Loja de Suplementos",
  "Revendedor",
  "Personal",
  "Supermercado",
  "Farmácia",
  "Nutricionista",
];

// ── Styles ────────────────────────────────────────────
export const gs = {
  page: { minHeight:"100vh", background:C.dark, fontFamily:"'DM Mono','Fira Mono',monospace", color:C.white },
  sidebar: { width:220, background:C.panel, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, bottom:0, zIndex:10 },
  main: { marginLeft:220, padding:"28px 32px", minHeight:"100vh" },
  card: { background:C.panel, border:`1px solid ${C.border}`, borderRadius:12, padding:"20px 24px" },
  input: { background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", color:C.white, fontSize:13, outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit" },
  select: { background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", color:C.white, fontSize:13, outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit", cursor:"pointer" },
  btn: (bg=C.lime, fg="#08090C") => ({ background:bg, color:fg, border:"none", borderRadius:8, padding:"9px 18px", fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:"inherit" }),
  btnOutline: { background:"transparent", color:C.lgray, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 18px", cursor:"pointer", fontSize:13, fontFamily:"inherit" },
  label: { color:C.gray, fontSize:11, letterSpacing:1, marginBottom:6, display:"block", textTransform:"uppercase" },
  badge: (cor) => ({ background:cor+"22", color:cor, border:`1px solid ${cor}55`, borderRadius:6, padding:"3px 10px", fontSize:11, fontWeight:700, display:"inline-block" }),
};

// ── Shared Components ─────────────────────────────────
import { useState } from "react";

export const Badge = ({ label, cor }) => <span style={gs.badge(cor)}>{label}</span>;

export const ProgressBar = ({ pct, cor }) => (
  <div style={{ background:C.border, borderRadius:99, height:4, marginTop:8 }}>
    <div style={{ width:`${Math.min(pct,100)}%`, height:4, background:cor, borderRadius:99, transition:"width .3s" }}/>
  </div>
);

export const StatCard = ({ label, value, sub, cor=C.lime }) => (
  <div style={{ ...gs.card, flex:1, minWidth:130 }}>
    <div style={{ color:C.gray, fontSize:11, letterSpacing:1, textTransform:"uppercase", marginBottom:8 }}>{label}</div>
    <div style={{ color:cor, fontSize:28, fontWeight:700, lineHeight:1 }}>{value}</div>
    {sub && <div style={{ color:C.gray, fontSize:11, marginTop:6 }}>{sub}</div>}
  </div>
);

export const Field = ({ label, children }) => (
  <div style={{ marginBottom:16 }}>
    <label style={gs.label}>{label}</label>
    {children}
  </div>
);

export const Modal = ({ title, subtitle, onClose, children, wide=false }) => (
  <div style={{ position:"fixed", inset:0, background:"#000000AA", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
    <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:16, padding:32, width:"100%", maxWidth:wide?620:440, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 32px 80px #000A" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <div style={{ color:C.white, fontWeight:700, fontSize:18 }}>{title}</div>
          {subtitle && <div style={{ color:C.gray, fontSize:12, marginTop:4 }}>{subtitle}</div>}
        </div>
        <button onClick={onClose} style={{ background:"none", border:"none", color:C.gray, cursor:"pointer", fontSize:20, lineHeight:1 }}>×</button>
      </div>
      {children}
    </div>
  </div>
);

export const Spinner = () => (
  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:C.dark }}>
    <div style={{ width:36, height:36, border:`3px solid ${C.border}`, borderTop:`3px solid ${C.lime}`, borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

export const PageHeader = ({ title, sub, children }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28, flexWrap:"wrap", gap:12 }}>
    <div>
      <div style={{ color:C.white, fontSize:22, fontWeight:700, marginBottom:4 }}>{title}</div>
      {sub && <div style={{ color:C.gray, fontSize:13 }}>{sub}</div>}
    </div>
    <div style={{ display:"flex", gap:10 }}>{children}</div>
  </div>
);
