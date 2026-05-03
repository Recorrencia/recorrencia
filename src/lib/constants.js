export const C = {
  dark: "#08090C", panel: "#111318", panel2: "#181B22",
  border: "#232731", lime: "#C8F135", white: "#F0F2F8",
  gray: "#6B7280", lgray: "#9CA3AF", red: "#FF4455",
  yellow: "#FFB800", green: "#00C98C", blue: "#4A9EFF",
}

export const calcStatus = (ultimaCompra, ciclo) => {
  const hoje = new Date()
  const ultima = new Date(ultimaCompra)
  const dias = Math.floor((hoje - ultima) / 86400000)
  const restam = ciclo - dias
  if (dias >= ciclo) return { label: "Atrasado", cor: C.red, pct: Math.min((dias / ciclo) * 100, 100), dias }
  if (restam <= Math.ceil(ciclo * 0.25)) return { label: "Atenção", cor: C.yellow, pct: (dias / ciclo) * 100, dias }
  return { label: "Em dia", cor: C.green, pct: (dias / ciclo) * 100, dias }
}

export const fmtMoney = (v) =>
  "R$ " + Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 0 })

export const fmtDate = (d) => new Date(d).toLocaleDateString("pt-BR")

export const today = () => new Date().toISOString().split("T")[0]

export const gs = {
  page: { minHeight: "100vh", background: C.dark, fontFamily: "'DM Mono', monospace", color: C.white },
  sidebar: { width: 220, background: C.panel, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 10 },
  main: { marginLeft: 220, padding: "28px 32px", minHeight: "100vh" },
  card: { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 24px" },
  input: { background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: C.white, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
  select: { background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", color: C.white, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit", cursor: "pointer" },
  btn: (bg = C.lime, fg = "#08090C") => ({ background: bg, color: fg, border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "inherit" }),
  btnOutline: { background: "transparent", color: C.lgray, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 18px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" },
  label: { color: C.gray, fontSize: 11, letterSpacing: 1, marginBottom: 6, display: "block", textTransform: "uppercase" },
  badge: (cor) => ({ background: cor + "22", color: cor, border: `1px solid ${cor}55`, borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, display: "inline-block" }),
}
