import { C, gs } from '../lib/constants'

export const Badge = ({ label, cor }) => (
  <span style={gs.badge(cor)}>{label}</span>
)

export const StatCard = ({ label, value, sub, cor = C.lime }) => (
  <div style={{ ...gs.card, flex: 1, minWidth: 130 }}>
    <div style={{ color: C.gray, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
    <div style={{ color: cor, fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ color: C.gray, fontSize: 11, marginTop: 6 }}>{sub}</div>}
  </div>
)

export const ProgressBar = ({ pct, cor }) => (
  <div style={{ background: C.border, borderRadius: 99, height: 4, marginTop: 8 }}>
    <div style={{ width: `${Math.min(pct, 100)}%`, height: 4, background: cor, borderRadius: 99, transition: "width .3s" }} />
  </div>
)

export const Modal = ({ title, subtitle, onClose, children }) => (
  <div style={{ position: "fixed", inset: 0, background: "#000000AA", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 32, width: 440, maxWidth: "90vw", boxShadow: "0 32px 80px #000A" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <div style={{ color: C.white, fontWeight: 700, fontSize: 18 }}>{title}</div>
          {subtitle && <div style={{ color: C.gray, fontSize: 12, marginTop: 4 }}>{subtitle}</div>}
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.gray, cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
      </div>
      {children}
    </div>
  </div>
)

export const Field = ({ label, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={gs.label}>{label}</label>
    {children}
  </div>
)
