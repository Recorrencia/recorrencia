import { C, gs } from '../lib/constants'

const navItems = [
  { id: "dashboard",   label: "Dashboard",   icon: "▦" },
  { id: "clientes",    label: "Clientes",    icon: "◈" },
  { id: "consultores", label: "Consultores", icon: "◉" },
  { id: "compras",     label: "Compras",     icon: "◆" },
  { id: "ltv",         label: "LTV",         icon: "◐" },
]

export default function Sidebar({ aba, setAba, user, onLogout }) {
  return (
    <div style={gs.sidebar}>
      <div style={{ padding: "24px 20px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: C.lime, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: C.dark, fontSize: 16 }}>R</div>
          <div>
            <div style={{ color: C.white, fontWeight: 700, fontSize: 13 }}>RecorrênciaOS</div>
            <div style={{ color: C.gray, fontSize: 10 }}>v1.0</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "16px 12px" }}>
        {navItems.map(n => (
          <button key={n.id} onClick={() => setAba(n.id)} style={{
            width: "100%", textAlign: "left",
            background: aba === n.id ? C.lime + "18" : "transparent",
            border: `1px solid ${aba === n.id ? C.lime + "44" : "transparent"}`,
            borderRadius: 8, padding: "10px 14px",
            color: aba === n.id ? C.lime : C.gray,
            cursor: "pointer", fontSize: 13, fontFamily: "inherit",
            fontWeight: aba === n.id ? 700 : 400,
            display: "flex", alignItems: "center", gap: 10,
            marginBottom: 4, transition: "all .15s"
          }}>
            <span style={{ fontSize: 16 }}>{n.icon}</span> {n.label}
          </button>
        ))}
      </nav>

      <div style={{ padding: "16px 20px", borderTop: `1px solid ${C.border}` }}>
        <div style={{ color: C.white, fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{user.nome}</div>
        <div style={{ color: C.gray, fontSize: 11, marginBottom: 10 }}>{user.perfil}</div>
        <button onClick={onLogout} style={{ ...gs.btnOutline, width: "100%", fontSize: 11 }}>Sair</button>
      </div>
    </div>
  )
}
