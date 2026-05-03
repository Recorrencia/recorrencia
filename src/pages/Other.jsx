import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { C, gs, calcStatus, fmtMoney, fmtDate } from '../lib/constants'
import { Badge, StatCard } from '../components/UI'

// ═══════════════════════════════════════════
// CONSULTORES
// ═══════════════════════════════════════════
export function Consultores({ consultores, clientes, compras }) {
  const [filtro, setFiltro] = useState("Todos")

  const enriched = consultores.map(con => {
    const cart = clientes.filter(c => c.consultor_id === con.id)
    const comStatus = cart.map(c => ({ ...c, status: calcStatus(c.ultima_compra, c.ciclo_dias) }))
    const emDia    = comStatus.filter(c => c.status.label === "Em dia").length
    const atencao  = comStatus.filter(c => c.status.label === "Atenção").length
    const atrasado = comStatus.filter(c => c.status.label === "Atrasado").length
    const ids      = cart.map(c => c.id)
    const receita  = compras.filter(cp => ids.includes(cp.cliente_id)).reduce((s, c) => s + c.valor, 0)
    const pct      = cart.length ? Math.round(emDia / cart.length * 100) : 0
    return { ...con, cart, emDia, atencao, atrasado, receita, pct }
  }).filter(c => filtro === "Todos" || c.setor === filtro)

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={{ color: C.white, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Consultores</div>
          <div style={{ color: C.gray, fontSize: 13 }}>Desempenho por carteira</div>
        </div>
        <select style={{ ...gs.select, width: 150 }} value={filtro} onChange={e => setFiltro(e.target.value)}>
          <option>Todos</option><option>Farm</option><option>1ª Compra</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {enriched.map(con => (
          <div key={con.id} style={gs.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <div style={{ color: C.white, fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{con.nome}</div>
                <span style={gs.badge(con.setor === "Farm" ? C.blue : C.lime)}>{con.setor}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: C.lime, fontWeight: 700, fontSize: 22 }}>{con.pct}%</div>
                <div style={{ color: C.gray, fontSize: 10 }}>recorrência</div>
              </div>
            </div>

            <div style={{ background: C.panel2, borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: C.gray }}>Carteira</span>
                <span style={{ color: C.white, fontWeight: 700 }}>{con.cart.length} clientes</span>
              </div>
              {con.cart.length > 0 && (
                <div style={{ display: "flex", gap: 2, height: 6, borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ flex: con.emDia,    background: C.green  }} />
                  <div style={{ flex: con.atencao,  background: C.yellow }} />
                  <div style={{ flex: con.atrasado, background: C.red    }} />
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
              {[["Em dia", con.emDia, C.green], ["Atenção", con.atencao, C.yellow], ["Atrasado", con.atrasado, C.red]].map(([l, v, cor]) => (
                <div key={l} style={{ textAlign: "center", background: C.panel2, borderRadius: 6, padding: "8px 4px" }}>
                  <div style={{ color: cor, fontWeight: 700, fontSize: 18 }}>{v}</div>
                  <div style={{ color: C.gray, fontSize: 10 }}>{l}</div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: C.gray }}>Receita gerada</span>
              <span style={{ color: C.lime, fontWeight: 700 }}>{fmtMoney(con.receita)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// COMPRAS
// ═══════════════════════════════════════════
export function Compras({ compras, clientes, consultores }) {
  const [filtroData, setFiltroData] = useState("")

  const enriched = [...compras]
    .sort((a, b) => b.data.localeCompare(a.data))
    .map(cp => {
      const cl  = clientes.find(c => c.id === cp.cliente_id)
      const con = cl ? consultores.find(c => c.id === cl.consultor_id) : null
      return { ...cp, cliente: cl, consultor: con }
    })
    .filter(cp => !filtroData || cp.data.startsWith(filtroData))

  const totalFiltrado = enriched.reduce((s, c) => s + c.valor, 0)

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={{ color: C.white, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Compras</div>
          <div style={{ color: C.gray, fontSize: 13 }}>{enriched.length} registros · {fmtMoney(totalFiltrado)}</div>
        </div>
        <input style={{ ...gs.select, width: 160 }} type="month" value={filtroData} onChange={e => setFiltroData(e.target.value)} />
      </div>

      <div style={gs.card}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ color: C.gray, fontSize: 11, textTransform: "uppercase" }}>
              {["Data", "Cliente", "Consultor", "Setor", "Valor"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 14px", borderBottom: `1px solid ${C.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {enriched.slice(0, 100).map(cp => (
              <tr key={cp.id} style={{ borderBottom: `1px solid ${C.border}22` }}>
                <td style={{ padding: "11px 14px", color: C.gray }}>{fmtDate(cp.data)}</td>
                <td style={{ padding: "11px 14px", color: C.white, fontWeight: 600 }}>{cp.cliente?.nome || "—"}</td>
                <td style={{ padding: "11px 14px", color: C.lgray }}>{cp.consultor?.nome || "—"}</td>
                <td style={{ padding: "11px 14px" }}>
                  {cp.cliente && <span style={gs.badge(cp.cliente.setor_atual === "Farm" ? C.blue : C.lime)}>{cp.cliente.setor_atual}</span>}
                </td>
                <td style={{ padding: "11px 14px", color: C.lime, fontWeight: 700 }}>{fmtMoney(cp.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// LTV
// ═══════════════════════════════════════════
export function LTV({ clientes, compras, consultores }) {
  const [ordenar, setOrdenar] = useState("ltv")

  const enriched = clientes.map(cl => {
    const hist = compras.filter(cp => cp.cliente_id === cl.id)
    const ltv  = hist.reduce((s, c) => s + c.valor, 0)
    const con  = consultores.find(c => c.id === cl.consultor_id)
    const ticketMedio = hist.length ? ltv / hist.length : 0
    const status = calcStatus(cl.ultima_compra, cl.ciclo_dias)
    return { ...cl, ltv, hist, ticketMedio, status, consultor: con }
  }).sort((a, b) => ordenar === "ltv" ? b.ltv - a.ltv : b.ticketMedio - a.ticketMedio)

  const totalLTV = enriched.reduce((s, c) => s + c.ltv, 0)
  const ltvMedio = enriched.length ? totalLTV / enriched.length : 0
  const top5 = enriched.slice(0, 5)

  const ltvConsultor = consultores.map(con => {
    const cart = clientes.filter(c => c.consultor_id === con.id)
    const ids  = cart.map(c => c.id)
    const ltv  = compras.filter(cp => ids.includes(cp.cliente_id)).reduce((s, c) => s + c.valor, 0)
    return { nome: con.nome.split(" ")[0], ltv }
  }).sort((a, b) => b.ltv - a.ltv)

  const tt = { background: C.panel, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: "inherit" }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: C.white, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>LTV — Lifetime Value</div>
        <div style={{ color: C.gray, fontSize: 13 }}>Valor gerado por cada cliente ao longo do tempo</div>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard label="LTV Total"  value={fmtMoney(totalLTV)} cor={C.lime} />
        <StatCard label="LTV Médio"  value={fmtMoney(ltvMedio)} cor={C.blue} sub="por cliente" />
        <StatCard label="Maior LTV"  value={fmtMoney(enriched[0]?.ltv || 0)} cor={C.green} sub={enriched[0]?.nome} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        <div style={gs.card}>
          <div style={{ color: C.white, fontWeight: 700, marginBottom: 16, fontSize: 14 }}>Top 5 Clientes por LTV</div>
          {top5.map((cl, i) => (
            <div key={cl.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ color: C.gray, fontSize: 12, width: 20 }}>#{i+1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: C.white, fontSize: 13, fontWeight: 600 }}>{cl.nome}</span>
                  <span style={{ color: C.lime, fontWeight: 700, fontSize: 13 }}>{fmtMoney(cl.ltv)}</span>
                </div>
                <div style={{ background: C.border, borderRadius: 99, height: 4 }}>
                  <div style={{ width: `${enriched[0]?.ltv ? (cl.ltv / enriched[0].ltv) * 100 : 0}%`, height: 4, background: C.lime, borderRadius: 99 }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={gs.card}>
          <div style={{ color: C.white, fontWeight: 700, marginBottom: 16, fontSize: 14 }}>LTV por Consultor</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ltvConsultor} layout="vertical">
              <XAxis type="number" tick={{ fill: C.gray, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => "R$" + (v/1000).toFixed(0) + "k"} />
              <YAxis type="category" dataKey="nome" tick={{ fill: C.gray, fontSize: 10 }} axisLine={false} tickLine={false} width={60} />
              <Tooltip contentStyle={tt} formatter={v => [fmtMoney(v), "LTV"]} />
              <Bar dataKey="ltv" fill={C.blue} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={gs.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ color: C.white, fontWeight: 700, fontSize: 14 }}>Ranking de Clientes</div>
          <select style={{ ...gs.select, width: 180 }} value={ordenar} onChange={e => setOrdenar(e.target.value)}>
            <option value="ltv">Ordenar por LTV</option>
            <option value="ticket">Ordenar por Ticket Médio</option>
          </select>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ color: C.gray, fontSize: 11, textTransform: "uppercase" }}>
              {["#", "Cliente", "Consultor", "Compras", "Ticket Médio", "LTV Total", "Status"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "7px 12px", borderBottom: `1px solid ${C.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {enriched.map((cl, i) => (
              <tr key={cl.id} style={{ borderBottom: `1px solid ${C.border}22` }}>
                <td style={{ padding: "10px 12px", color: C.gray }}>{i+1}</td>
                <td style={{ padding: "10px 12px", color: C.white, fontWeight: 600 }}>{cl.nome}</td>
                <td style={{ padding: "10px 12px", color: C.lgray }}>{cl.consultor?.nome}</td>
                <td style={{ padding: "10px 12px", color: C.lgray }}>{cl.hist.length}</td>
                <td style={{ padding: "10px 12px", color: C.blue }}>{fmtMoney(cl.ticketMedio)}</td>
                <td style={{ padding: "10px 12px", color: C.lime, fontWeight: 700 }}>{fmtMoney(cl.ltv)}</td>
                <td style={{ padding: "10px 12px" }}><Badge label={cl.status.label} cor={cl.status.cor} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
