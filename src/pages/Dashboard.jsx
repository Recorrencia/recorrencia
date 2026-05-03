import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts'
import { C, gs, calcStatus, fmtMoney } from '../lib/constants'
import { StatCard } from '../components/UI'

export default function Dashboard({ clientes, compras, consultores }) {
  const enriched = clientes.map(cl => ({ ...cl, status: calcStatus(cl.ultima_compra, cl.ciclo_dias) }))
  const emDia    = enriched.filter(c => c.status.label === "Em dia").length
  const atencao  = enriched.filter(c => c.status.label === "Atenção").length
  const atrasado = enriched.filter(c => c.status.label === "Atrasado").length
  const receitaTotal = compras.reduce((s, c) => s + c.valor, 0)

  const vendasDiarias = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i))
    const ds = d.toISOString().split("T")[0]
    const total = compras.filter(c => c.data === ds).reduce((s, c) => s + c.valor, 0)
    return { dia: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), total }
  }), [compras])

  const recMeses = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i))
    const mes = d.toLocaleDateString("pt-BR", { month: "short" })
    const mesStr = d.toISOString().slice(0, 7)
    const comprasMes = compras.filter(c => c.data.startsWith(mesStr))
    const clientesCompraram = new Set(comprasMes.map(c => c.cliente_id)).size
    const naoCompraram = Math.max(clientes.length - clientesCompraram, 0)
    return { mes, emDia: clientesCompraram, atrasado: naoCompraram }
  }), [compras, clientes])

  const pieData = [
    { name: "Em dia",   value: emDia,    fill: C.green  },
    { name: "Atenção",  value: atencao,  fill: C.yellow },
    { name: "Atrasado", value: atrasado, fill: C.red    },
  ]

  const tt = { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.white, fontFamily: "inherit" }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: C.white, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Dashboard</div>
        <div style={{ color: C.gray, fontSize: 13 }}>
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <StatCard label="Total Clientes" value={clientes.length} sub={`${consultores.length} consultores ativos`} />
        <StatCard label="Em dia"    value={emDia}    cor={C.green}  sub={`${clientes.length ? Math.round(emDia / clientes.length * 100) : 0}% da carteira`} />
        <StatCard label="Atenção"   value={atencao}  cor={C.yellow} sub="Próximos ao vencimento" />
        <StatCard label="Atrasados" value={atrasado} cor={C.red}    sub="Requer contato imediato" />
        <StatCard label="Receita Total" value={fmtMoney(receitaTotal)} cor={C.blue} sub="Histórico completo" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, marginBottom: 20 }}>
        <div style={gs.card}>
          <div style={{ color: C.white, fontWeight: 700, marginBottom: 4, fontSize: 14 }}>Vendas Diárias</div>
          <div style={{ color: C.gray, fontSize: 12, marginBottom: 16 }}>Últimos 14 dias</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={vendasDiarias}>
              <XAxis dataKey="dia" tick={{ fill: C.gray, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.gray, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => "R$" + (v/1000).toFixed(0) + "k"} />
              <Tooltip contentStyle={tt} formatter={v => [fmtMoney(v), "Vendas"]} />
              <Bar dataKey="total" radius={[4,4,0,0]}>
                {vendasDiarias.map((_, i) => <Cell key={i} fill={i === 13 ? C.lime : C.lime + "55"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={gs.card}>
          <div style={{ color: C.white, fontWeight: 700, marginBottom: 4, fontSize: 14 }}>Status da Carteira</div>
          <div style={{ color: C.gray, fontSize: 12, marginBottom: 16 }}>Distribuição atual</div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Pie>
              <Tooltip contentStyle={tt} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 8 }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                <div style={{ width: 8, height: 8, borderRadius: 99, background: d.fill }} />
                <span style={{ color: C.gray }}>{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={gs.card}>
        <div style={{ color: C.white, fontWeight: 700, marginBottom: 4, fontSize: 14 }}>Recorrência por Mês</div>
        <div style={{ color: C.gray, fontSize: 12, marginBottom: 16 }}>Últimos 6 meses — Compraram vs Não compraram</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={recMeses}>
            <XAxis dataKey="mes" tick={{ fill: C.gray, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: C.gray, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tt} />
            <Bar dataKey="emDia"    name="Compraram"     stackId="a" fill={C.green}        radius={[0,0,0,0]} />
            <Bar dataKey="atrasado" name="Não compraram" stackId="a" fill={C.red + "88"}   radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
