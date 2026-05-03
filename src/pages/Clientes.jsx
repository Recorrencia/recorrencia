import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { supabase } from '../lib/supabase'
import { C, gs, calcStatus, fmtMoney, fmtDate, today } from '../lib/constants'
import { Badge, StatCard, ProgressBar, Modal, Field } from '../components/UI'

export default function Clientes({ clientes, setClientes, consultores, compras, setCompras }) {
  const [filtroSetor,     setFiltroSetor]     = useState("Todos")
  const [filtroConsultor, setFiltroConsultor] = useState("Todos")
  const [filtroStatus,    setFiltroStatus]    = useState("Todos")
  const [busca,           setBusca]           = useState("")
  const [detalhe,         setDetalhe]         = useState(null)
  const [modalCompra,     setModalCompra]     = useState(null)
  const [modalTransf,     setModalTransf]     = useState(null)
  const [modalObs,        setModalObs]        = useState(null)
  const [modalNovo,       setModalNovo]       = useState(false)
  const [observacoes,     setObservacoes]     = useState({})

  // forms
  const [ncNome,     setNcNome]     = useState("")
  const [ncConsultor,setNcConsultor]= useState(consultores[0]?.id || "")
  const [ncCiclo,    setNcCiclo]    = useState(30)
  const [ncValor,    setNcValor]    = useState("")
  const [cData,      setCData]      = useState(today())
  const [cValor,     setCValor]     = useState("")
  const [tConsultor, setTConsultor] = useState("")
  const [tSetor,     setTSetor]     = useState("Farm")
  const [obsTexto,   setObsTexto]   = useState("")
  const [obsMes,     setObsMes]     = useState(new Date().toISOString().slice(0, 7))

  const enrich = (cl) => {
    const con = consultores.find(c => c.id === cl.consultor_id)
    const status = calcStatus(cl.ultima_compra, cl.ciclo_dias)
    const hist = compras.filter(cp => cp.cliente_id === cl.id)
    const ltv = hist.reduce((s, c) => s + c.valor, 0)
    return { ...cl, consultor: con, status, hist, ltv }
  }

  const enriched = clientes.map(enrich)

  const filtered = enriched.filter(c => {
    if (filtroSetor !== "Todos" && c.setor_atual !== filtroSetor) return false
    if (filtroConsultor !== "Todos" && String(c.consultor_id) !== filtroConsultor) return false
    if (filtroStatus !== "Todos" && c.status.label !== filtroStatus) return false
    if (busca && !c.nome.toLowerCase().includes(busca.toLowerCase())) return false
    return true
  })

  // ── CRUD ───────────────────────────────────────────
  const addCliente = async () => {
    if (!ncNome) return
    const con = consultores.find(c => c.id === Number(ncConsultor))
    const novo = { nome: ncNome, consultor_id: Number(ncConsultor), setor_atual: con?.setor || "1ª Compra", ciclo_dias: ncCiclo, ultima_compra: today() }
    const { data, error } = await supabase.from("clientes").insert(novo).select().single()
    if (error) { alert("Erro ao cadastrar: " + error.message); return }
    setClientes(p => [...p, data])
    if (ncValor) {
      const { data: cp } = await supabase.from("compras").insert({ cliente_id: data.id, data: today(), valor: Number(ncValor) }).select().single()
      if (cp) setCompras(p => [...p, cp])
    }
    setModalNovo(false); setNcNome(""); setNcValor("")
  }

  const addCompra = async () => {
    if (!cValor || !modalCompra) return
    const { data, error } = await supabase.from("compras").insert({ cliente_id: modalCompra.id, data: cData, valor: Number(cValor) }).select().single()
    if (error) { alert("Erro: " + error.message); return }
    setCompras(p => [...p, data])
    await supabase.from("clientes").update({ ultima_compra: cData }).eq("id", modalCompra.id)
    setClientes(p => p.map(c => c.id === modalCompra.id ? { ...c, ultima_compra: cData } : c))
    setModalCompra(null); setCValor("")
  }

  const transferir = async () => {
    if (!tConsultor || !modalTransf) return
    const { error } = await supabase.from("clientes").update({ consultor_id: Number(tConsultor), setor_atual: tSetor }).eq("id", modalTransf.id)
    if (error) { alert("Erro: " + error.message); return }
    // registra transferencia
    await supabase.from("transferencias").insert({ cliente_id: modalTransf.id, consultor_origem_id: modalTransf.consultor_id, consultor_destino_id: Number(tConsultor) })
    setClientes(p => p.map(c => c.id === modalTransf.id ? { ...c, consultor_id: Number(tConsultor), setor_atual: tSetor } : c))
    setModalTransf(null)
  }

  const addObs = async () => {
    if (!obsTexto || !modalObs) return
    const { data, error } = await supabase.from("observacoes").insert({ cliente_id: modalObs.id, mes_referencia: obsMes + "-01", texto: obsTexto }).select().single()
    if (error) { alert("Erro: " + error.message); return }
    setObservacoes(p => ({ ...p, [modalObs.id]: [...(p[modalObs.id] || []), data] }))
    setModalObs(null); setObsTexto("")
  }

  // ── Detalhe ─────────────────────────────────────────
  const detCliente = detalhe ? enriched.find(c => c.id === detalhe) : null
  const detObs = detalhe ? (observacoes[detalhe] || []) : []

  const detChart = detCliente ? Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i))
    const m = d.toISOString().slice(0, 7)
    const mes = d.toLocaleDateString("pt-BR", { month: "short" })
    const val = detCliente.hist.filter(c => c.data.startsWith(m)).reduce((s, c) => s + c.valor, 0)
    return { mes, valor: val }
  }) : []

  const tt = { background: C.panel, border: `1px solid ${C.border}`, fontSize: 12, fontFamily: "inherit" }

  // ── Tela detalhe ────────────────────────────────────
  if (detalhe && detCliente) return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <button onClick={() => setDetalhe(null)} style={{ ...gs.btnOutline, padding: "7px 14px", fontSize: 12 }}>← Voltar</button>
        <div>
          <div style={{ color: C.white, fontSize: 20, fontWeight: 700 }}>{detCliente.nome}</div>
          <div style={{ color: C.gray, fontSize: 12 }}>{detCliente.setor_atual} · {detCliente.consultor?.nome} · Ciclo: {detCliente.ciclo_dias} dias</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
          <button style={gs.btn(C.blue, C.white)} onClick={() => { setModalTransf(detCliente); setTSetor(detCliente.setor_atual); setTConsultor(String(detCliente.consultor_id)) }}>Transferir</button>
          <button style={gs.btn()} onClick={() => { setModalObs(detCliente) }}>+ Observação</button>
          <button style={gs.btn()} onClick={() => { setModalCompra(detCliente); setCData(today()) }}>+ Compra</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard label="Status" value={detCliente.status.label} cor={detCliente.status.cor} sub={`Última compra: ${fmtDate(detCliente.ultima_compra)}`} />
        <StatCard label="LTV Total" value={fmtMoney(detCliente.ltv)} cor={C.lime} sub={`${detCliente.hist.length} compras registradas`} />
        <StatCard label="Ciclo" value={`${detCliente.ciclo_dias}d`} sub="Frequência esperada" />
        <StatCard label="Dias desde última compra" value={detCliente.status.dias} cor={detCliente.status.cor} sub={`Vence em ${detCliente.ciclo_dias} dias`} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div style={gs.card}>
          <div style={{ color: C.white, fontWeight: 700, marginBottom: 16, fontSize: 14 }}>Compras por Mês</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={detChart}>
              <XAxis dataKey="mes" tick={{ fill: C.gray, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.gray, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => "R$" + (v/1000).toFixed(0) + "k"} />
              <Tooltip contentStyle={tt} formatter={v => [fmtMoney(v), "Valor"]} />
              <Bar dataKey="valor" radius={[4,4,0,0]}>
                {detChart.map((d, i) => <Cell key={i} fill={d.valor > 0 ? C.lime : C.red + "44"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={gs.card}>
          <div style={{ color: C.white, fontWeight: 700, marginBottom: 16, fontSize: 14 }}>Observações</div>
          {detObs.length === 0
            ? <div style={{ color: C.gray, fontSize: 12 }}>Nenhuma observação registrada.</div>
            : detObs.map((o, i) => (
              <div key={i} style={{ background: C.panel2, borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
                <div style={{ color: C.yellow, fontSize: 10, fontWeight: 700, marginBottom: 4 }}>{o.mes_referencia?.slice(0,7)}</div>
                <div style={{ color: C.lgray, fontSize: 12 }}>{o.texto}</div>
              </div>
            ))}
        </div>
      </div>

      <div style={gs.card}>
        <div style={{ color: C.white, fontWeight: 700, marginBottom: 16, fontSize: 14 }}>Histórico de Compras</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ color: C.gray, fontSize: 11, textTransform: "uppercase" }}>
              {["Data", "Valor"].map(h => <th key={h} style={{ textAlign: "left", padding: "6px 12px", borderBottom: `1px solid ${C.border}` }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {[...detCliente.hist].sort((a,b) => b.data.localeCompare(a.data)).map(cp => (
              <tr key={cp.id} style={{ borderBottom: `1px solid ${C.border}20` }}>
                <td style={{ padding: "10px 12px", color: C.lgray }}>{fmtDate(cp.data)}</td>
                <td style={{ padding: "10px 12px", color: C.lime, fontWeight: 700 }}>{fmtMoney(cp.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  // ── Tela lista ──────────────────────────────────────
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={{ color: C.white, fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Clientes</div>
          <div style={{ color: C.gray, fontSize: 13 }}>{filtered.length} de {clientes.length} exibidos</div>
        </div>
        <button style={gs.btn()} onClick={() => setModalNovo(true)}>+ Novo Cliente</button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input style={{ ...gs.input, width: 200 }} placeholder="Buscar cliente..." value={busca} onChange={e => setBusca(e.target.value)} />
        <select style={{ ...gs.select, width: 130 }} value={filtroSetor} onChange={e => setFiltroSetor(e.target.value)}>
          <option>Todos</option><option>Farm</option><option>1ª Compra</option>
        </select>
        <select style={{ ...gs.select, width: 160 }} value={filtroConsultor} onChange={e => setFiltroConsultor(e.target.value)}>
          <option value="Todos">Todos consultores</option>
          {consultores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <select style={{ ...gs.select, width: 140 }} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option>Todos</option><option>Em dia</option><option>Atenção</option><option>Atrasado</option>
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(cl => (
          <div key={cl.id} style={{ ...gs.card, display: "flex", alignItems: "center", gap: 16, padding: "16px 20px" }}>
            <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setDetalhe(cl.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ color: C.white, fontWeight: 700, fontSize: 14 }}>{cl.nome}</span>
                <Badge label={cl.status.label} cor={cl.status.cor} />
                <span style={{ ...gs.badge(cl.setor_atual === "Farm" ? C.blue : C.lime), fontSize: 10 }}>{cl.setor_atual}</span>
              </div>
              <div style={{ display: "flex", gap: 20, fontSize: 12, color: C.gray }}>
                <span>{cl.consultor?.nome}</span>
                <span>Ciclo: {cl.ciclo_dias}d</span>
                <span>Última compra: {fmtDate(cl.ultima_compra)}</span>
                <span style={{ color: C.lime }}>LTV: {fmtMoney(cl.ltv)}</span>
              </div>
              <ProgressBar pct={cl.status.pct} cor={cl.status.cor} />
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button style={{ ...gs.btnOutline, fontSize: 11, padding: "6px 12px" }} onClick={() => setModalObs(cl)}>Obs</button>
              <button style={{ ...gs.btn(C.panel2, C.lgray), fontSize: 11, padding: "6px 12px", border: `1px solid ${C.border}` }} onClick={() => { setModalTransf(cl); setTSetor(cl.setor_atual); setTConsultor(String(cl.consultor_id)) }}>Transferir</button>
              <button style={{ ...gs.btn(), padding: "6px 14px", fontSize: 11 }} onClick={() => { setModalCompra(cl); setCData(today()) }}>+ Compra</button>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {modalNovo && (
        <Modal title="Novo Cliente" subtitle="Preencha os dados do cliente" onClose={() => setModalNovo(false)}>
          <Field label="Nome do cliente"><input style={gs.input} value={ncNome} onChange={e => setNcNome(e.target.value)} placeholder="Ex: Academia FitMax" /></Field>
          <Field label="Consultor responsável">
            <select style={gs.select} value={ncConsultor} onChange={e => setNcConsultor(e.target.value)}>
              {consultores.map(c => <option key={c.id} value={c.id}>{c.nome} ({c.setor})</option>)}
            </select>
          </Field>
          <Field label="Ciclo de compra">
            <select style={gs.select} value={ncCiclo} onChange={e => setNcCiclo(Number(e.target.value))}>
              {[15,30,45,60].map(d => <option key={d} value={d}>{d} dias</option>)}
            </select>
          </Field>
          <Field label="Valor da 1ª compra (opcional)"><input style={gs.input} type="number" value={ncValor} onChange={e => setNcValor(e.target.value)} placeholder="R$ 0,00" /></Field>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button style={{ ...gs.btnOutline, flex: 1 }} onClick={() => setModalNovo(false)}>Cancelar</button>
            <button style={{ ...gs.btn(), flex: 1 }} onClick={addCliente}>Cadastrar</button>
          </div>
        </Modal>
      )}

      {modalCompra && (
        <Modal title="Registrar Compra" subtitle={modalCompra.nome} onClose={() => setModalCompra(null)}>
          <Field label="Data da compra"><input style={gs.input} type="date" value={cData} onChange={e => setCData(e.target.value)} /></Field>
          <Field label="Valor (R$)"><input style={gs.input} type="number" value={cValor} onChange={e => setCValor(e.target.value)} placeholder="0,00" /></Field>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button style={{ ...gs.btnOutline, flex: 1 }} onClick={() => setModalCompra(null)}>Cancelar</button>
            <button style={{ ...gs.btn(), flex: 1 }} onClick={addCompra}>Confirmar</button>
          </div>
        </Modal>
      )}

      {modalTransf && (
        <Modal title="Transferir Cliente" subtitle={modalTransf.nome} onClose={() => setModalTransf(null)}>
          <Field label="Setor destino">
            <select style={gs.select} value={tSetor} onChange={e => setTSetor(e.target.value)}>
              <option>Farm</option><option>1ª Compra</option>
            </select>
          </Field>
          <Field label="Consultor destino">
            <select style={gs.select} value={tConsultor} onChange={e => setTConsultor(e.target.value)}>
              {consultores.filter(c => c.setor === tSetor).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </Field>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button style={{ ...gs.btnOutline, flex: 1 }} onClick={() => setModalTransf(null)}>Cancelar</button>
            <button style={{ ...gs.btn(C.blue, C.white), flex: 1 }} onClick={transferir}>Transferir</button>
          </div>
        </Modal>
      )}

      {modalObs && (
        <Modal title="Adicionar Observação" subtitle={modalObs.nome} onClose={() => setModalObs(null)}>
          <Field label="Mês de referência"><input style={gs.input} type="month" value={obsMes} onChange={e => setObsMes(e.target.value)} /></Field>
          <Field label="Motivo / Observação">
            <textarea style={{ ...gs.input, height: 90, resize: "vertical" }} value={obsTexto} onChange={e => setObsTexto(e.target.value)} placeholder="Ex: Cliente informou que o estoque ainda está cheio." />
          </Field>
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button style={{ ...gs.btnOutline, flex: 1 }} onClick={() => setModalObs(null)}>Cancelar</button>
            <button style={{ ...gs.btn(), flex: 1 }} onClick={addObs}>Salvar</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
