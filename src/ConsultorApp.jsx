import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { supabase } from "./lib/supabase.js";
import { C, gs, fmtMoney, fmtDate, today, calcStatus, CATEGORIAS, Badge, ProgressBar, StatCard, Field, Modal, PageHeader } from "./utils.jsx";

// ── Consultor Sidebar ─────────────────────────────────
const ConsultorSidebar = ({ aba, setAba, user, onLogout }) => {
  const navItems = [
    { id:"carteira", label:"Minha Carteira", icon:"▦" },
    { id:"clientes", label:"Meus Clientes", icon:"◈" },
  ];
  return (
    <div style={gs.sidebar}>
      <div style={{ padding:"24px 20px 16px", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, background:C.lime, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, color:C.dark, fontSize:16 }}>R</div>
          <div>
            <div style={{ color:C.white, fontWeight:700, fontSize:13 }}>RecorrênciaOS</div>
            <div style={{ color:C.gray, fontSize:10 }}>Portal do Consultor</div>
          </div>
        </div>
      </div>
      <nav style={{ flex:1, padding:"16px 12px" }}>
        {navItems.map(n => (
          <button key={n.id} onClick={() => setAba(n.id)} style={{
            width:"100%", textAlign:"left", background:aba===n.id?C.lime+"18":"transparent",
            border:`1px solid ${aba===n.id?C.lime+"44":"transparent"}`,
            borderRadius:8, padding:"10px 14px", color:aba===n.id?C.lime:C.gray,
            cursor:"pointer", fontSize:13, fontFamily:"inherit", fontWeight:aba===n.id?700:400,
            display:"flex", alignItems:"center", gap:10, marginBottom:4,
          }}>
            <span style={{ fontSize:16 }}>{n.icon}</span>{n.label}
          </button>
        ))}
      </nav>
      <div style={{ padding:"16px 20px", borderTop:`1px solid ${C.border}` }}>
        <div style={{ color:C.white, fontSize:12, fontWeight:700, marginBottom:2 }}>{user?.nome}</div>
        <div style={{ color:C.gray, fontSize:11, marginBottom:10 }}>{user?.setor}</div>
        <button onClick={onLogout} style={{ ...gs.btnOutline, width:"100%", fontSize:11 }}>Sair</button>
      </div>
    </div>
  );
};

// ── Minha Carteira ────────────────────────────────────
const MinhaCarteira = ({ clientes, compras, consultorId, meta }) => {
  const mesAtual = new Date().toISOString().slice(0,7);
  const hoje = new Date();
  const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth()+1, 0).getDate();
  const diaAtual = hoje.getDate();

  const faturadoMes = compras
    .filter(cp => cp.data?.startsWith(mesAtual))
    .reduce((s,c) => s+Number(c.valor), 0);

  const pctMeta = meta > 0 ? Math.min((faturadoMes/meta)*100, 100) : 0;
  const faltaMeta = Math.max(0, meta - faturadoMes);
  const mediaDiaria = diaAtual > 0 ? faturadoMes/diaAtual : 0;
  const mediaNecessaria = faltaMeta > 0 ? faltaMeta/(diasNoMes-diaAtual+1) : 0;

  const enriched = clientes.map(cl => ({ ...cl, status:calcStatus(cl.ultima_compra, cl.ciclo_dias) }));
  const emDia = enriched.filter(c => c.status.label==="Em dia").length;
  const atencao = enriched.filter(c => c.status.label==="Atenção").length;
  const atrasado = enriched.filter(c => c.status.label==="Atrasado").length;

  // Faturamento últimos 6 meses
  const chartData = Array.from({length:6}, (_,i) => {
    const d = new Date(); d.setMonth(d.getMonth()-(5-i));
    const m = d.toISOString().slice(0,7);
    const mes = d.toLocaleDateString("pt-BR", { month:"short" });
    const val = compras.filter(cp => cp.data?.startsWith(m)).reduce((s,c)=>s+Number(c.valor),0);
    return { mes, valor:Math.round(val) };
  });

  const tt = { background:C.panel, border:`1px solid ${C.border}`, borderRadius:8, fontSize:12, color:C.white, fontFamily:"inherit" };

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <div style={{ color:C.white, fontSize:22, fontWeight:700, marginBottom:4 }}>Minha Carteira</div>
        <div style={{ color:C.gray, fontSize:13 }}>{new Date().toLocaleDateString("pt-BR", { weekday:"long", day:"numeric", month:"long" })}</div>
      </div>

      {/* Meta */}
      <div style={{ ...gs.card, marginBottom:20, borderColor:pctMeta>=100?C.green+"55":C.border, background:pctMeta>=100?`linear-gradient(135deg,${C.panel} 60%,${C.green}08)`:C.panel }}>
        <div style={{ color:C.gray, fontSize:11, letterSpacing:1, textTransform:"uppercase", marginBottom:12 }}>Meta do Mês</div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:16, marginBottom:16 }}>
          <div>
            <div style={{ color:pctMeta>=100?C.green:C.white, fontSize:36, fontWeight:700, lineHeight:1, marginBottom:4 }}>
              {fmtMoney(faturadoMes)}
            </div>
            <div style={{ color:C.gray, fontSize:13 }}>de {fmtMoney(meta)} · {pctMeta.toFixed(1)}%</div>
          </div>
          <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ color:C.lime, fontSize:20, fontWeight:700 }}>{fmtMoney(mediaDiaria)}</div>
              <div style={{ color:C.gray, fontSize:11 }}>Média diária atual</div>
            </div>
            {faltaMeta > 0 && (
              <div style={{ textAlign:"center" }}>
                <div style={{ color:C.yellow, fontSize:20, fontWeight:700 }}>{fmtMoney(mediaNecessaria)}</div>
                <div style={{ color:C.gray, fontSize:11 }}>Média necessária/dia</div>
              </div>
            )}
            {faltaMeta > 0 && (
              <div style={{ textAlign:"center" }}>
                <div style={{ color:C.red, fontSize:20, fontWeight:700 }}>{fmtMoney(faltaMeta)}</div>
                <div style={{ color:C.gray, fontSize:11 }}>Falta para a meta</div>
              </div>
            )}
          </div>
        </div>
        <div style={{ background:C.border, borderRadius:99, height:12 }}>
          <div style={{
            width:`${pctMeta}%`, height:12, borderRadius:99,
            background:pctMeta>=100?C.green:pctMeta>75?C.yellow:pctMeta>40?C.blue:C.red,
            transition:"width .5s"
          }}/>
        </div>
        {pctMeta >= 100 && (
          <div style={{ color:C.green, fontSize:14, fontWeight:700, marginTop:10, textAlign:"center" }}>🎉 Meta batida!</div>
        )}
      </div>

      {/* Stats carteira */}
      <div style={{ display:"flex", gap:16, marginBottom:20, flexWrap:"wrap" }}>
        <StatCard label="Total Clientes" value={clientes.length} sub="na sua carteira"/>
        <StatCard label="Em dia" value={emDia} cor={C.green} sub={`${clientes.length?Math.round(emDia/clientes.length*100):0}% da carteira`}/>
        <StatCard label="Atenção" value={atencao} cor={C.yellow} sub="Próximos ao vencimento"/>
        <StatCard label="Atrasados" value={atrasado} cor={C.red} sub="Requer contato"/>
      </div>

      {/* Gráfico faturamento */}
      <div style={gs.card}>
        <div style={{ color:C.white, fontWeight:700, marginBottom:4, fontSize:14 }}>Faturamento por Mês</div>
        <div style={{ color:C.gray, fontSize:12, marginBottom:16 }}>Últimos 6 meses</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <XAxis dataKey="mes" tick={{ fill:C.gray, fontSize:11 }} axisLine={false} tickLine={false}/>
            <YAxis tick={{ fill:C.gray, fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v=>"R$"+(v/1000).toFixed(0)+"k"}/>
            <Tooltip contentStyle={tt} wrapperStyle={{outline:"none"}} itemStyle={{color:C.lgray}} cursor={{fill:C.white,fillOpacity:0.05}} formatter={v=>[fmtMoney(v),"Faturado"]}/>
            <Bar dataKey="valor" radius={[4,4,0,0]}>
              {chartData.map((d,i)=><Cell key={i} fill={i===5?C.lime:C.lime+"55"}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ── Meus Clientes ─────────────────────────────────────
const MeusClientes = ({ clientes, compras, user, setCompras }) => {
  const [detalhe, setDetalhe] = useState(null);
  const [modalObs, setModalObs] = useState(null);
  const [obsTexto, setObsTexto] = useState("");
  const [obsMes, setObsMes] = useState(new Date().toISOString().slice(0,7));
  const [obsConsultor, setObsConsultor] = useState("");
  const [observacoes, setObservacoes] = useState({});
  const [filtroStatus, setFiltroStatus] = useState("Todos");
  const [filtroCategoria, setFiltroCategoria] = useState("Todos");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    // Load observations from Supabase
    const ids = clientes.map(c => c.id);
    if (ids.length === 0) return;
    supabase.from("observacoes").select("*").in("cliente_id", ids).order("created_at", { ascending:false })
      .then(({ data }) => {
        const obj = {};
        (data||[]).forEach(o => {
          if (!obj[o.cliente_id]) obj[o.cliente_id] = [];
          obj[o.cliente_id].push({ ...o, mes:o.mes_referencia, data:o.created_at?.split("T")[0], consultorNome:o.consultor_relatou_nome, registradoPor:o.registrado_por_nome });
        });
        setObservacoes(obj);
      });
  }, [clientes]);

  const enriched = clientes.map(cl => {
    const status = calcStatus(cl.ultima_compra, cl.ciclo_dias);
    const hist = compras.filter(cp => cp.cliente_id === cl.id);
    const ltv = hist.reduce((s,c) => s+Number(c.valor), 0);
    return { ...cl, status, hist, ltv };
  });

  const filtered = enriched.filter(c => {
    if (filtroStatus !== "Todos" && c.status.label !== filtroStatus) return false;
    if (filtroCategoria !== "Todos" && c.categoria !== filtroCategoria) return false;
    if (busca && !c.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const [modalCompra, setModalCompra] = useState(null);
  const [cData, setCData] = useState("");
  const [cValor, setCValor] = useState("");

  const addCompra = async () => {
    if (!cValor || !modalCompra) return;
    const dataVenda = cData || new Date().toISOString().split("T")[0];
    const { data:cp, error } = await supabase.from("compras").insert({
      cliente_id: modalCompra.id,
      data: dataVenda,
      valor: Number(cValor),
      registrado_por: user?.id,
    }).select().single();
    if (error) { alert("Erro ao registrar venda: " + error.message); return; }
    // Update local state
    setCompras(p => [...p, cp]);
    // Update ultima_compra do cliente localmente
    const hoje = new Date().toISOString().split("T")[0];
    setModalCompra(null); setCValor(""); setCData("");
    // Reload to get fresh data
    window.location.reload();
  };

  const addObs = async () => {
    if (!obsTexto || !modalObs) return;
    const { data, error } = await supabase.from("observacoes").insert({
      cliente_id: modalObs.id,
      mes_referencia: obsMes,
      texto: obsTexto,
      consultor_relatou_nome: user?.nome,
      registrado_por_nome: user?.nome,
      criado_por: user?.id,
    }).select().single();
    if (error) { alert("Erro: " + error.message); return; }
    const obsFormatada = { ...data, mes:data.mes_referencia, data:data.created_at?.split("T")[0], consultorNome:user?.nome, registradoPor:user?.nome };
    setObservacoes(p => ({ ...p, [modalObs.id]:[obsFormatada,...(p[modalObs.id]||[])] }));
    setModalObs(null); setObsTexto("");
  };

  const detCliente = detalhe ? enriched.find(c => c.id === detalhe) : null;
  const detObs = detalhe ? (observacoes[detalhe]||[]) : [];
  const detChart = detCliente ? Array.from({length:6}, (_,i) => {
    const d = new Date(); d.setMonth(d.getMonth()-(5-i));
    const m = d.toISOString().slice(0,7);
    const mes = d.toLocaleDateString("pt-BR", { month:"short" });
    const val = detCliente.hist.filter(c => c.data?.startsWith(m)).reduce((s,c)=>s+Number(c.valor),0);
    return { mes, valor:val };
  }) : [];

  const tt = { background:C.panel, border:`1px solid ${C.border}`, borderRadius:8, fontSize:12, color:C.white, fontFamily:"inherit" };

  if (detalhe && detCliente) return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28, flexWrap:"wrap" }}>
        <button onClick={() => setDetalhe(null)} style={{ ...gs.btnOutline, padding:"7px 14px", fontSize:12 }}>← Voltar</button>
        <div style={{ flex:1 }}>
          <div style={{ color:C.white, fontSize:20, fontWeight:700 }}>{detCliente.nome}</div>
          <div style={{ color:C.gray, fontSize:12 }}>{detCliente.categoria||"—"} · Ciclo: {detCliente.ciclo_dias} dias</div>
        </div>
        <button style={{ ...gs.btn(C.blue, C.white) }} onClick={() => { setModalCompra(detCliente); setCData(new Date().toISOString().split("T")[0]); }}>+ Registrar Venda</button>
        <button style={gs.btn()} onClick={() => setModalObs(detCliente)}>+ Observação</button>
      </div>

      <div style={{ display:"flex", gap:16, marginBottom:20, flexWrap:"wrap" }}>
        <StatCard label="Status" value={detCliente.status.label} cor={detCliente.status.cor} sub={`Última compra: ${fmtDate(detCliente.ultima_compra)}`}/>
        <StatCard label="LTV Total" value={fmtMoney(detCliente.ltv)} cor={C.lime} sub={`${detCliente.hist.length} compras`}/>
        <StatCard label="Ciclo" value={`${detCliente.ciclo_dias}d`} sub="Frequência esperada"/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>
        <div style={gs.card}>
          <div style={{ color:C.white, fontWeight:700, marginBottom:16, fontSize:14 }}>Compras por Mês</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={detChart}>
              <XAxis dataKey="mes" tick={{ fill:C.gray, fontSize:11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill:C.gray, fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v=>"R$"+(v/1000).toFixed(0)+"k"}/>
              <Tooltip contentStyle={tt} wrapperStyle={{outline:"none"}} itemStyle={{color:C.lgray}} cursor={{fill:C.white,fillOpacity:0.05}} formatter={v=>[fmtMoney(v),"Valor"]}/>
              <Bar dataKey="valor" radius={[4,4,0,0]}>
                {detChart.map((d,i) => <Cell key={i} fill={d.valor>0?C.lime:C.red+"44"}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={gs.card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ color:C.white, fontWeight:700, fontSize:14 }}>Observações</div>
          </div>
          <div style={{ maxHeight:200, overflowY:"auto", paddingRight:4 }}>
            {detObs.length===0 ? <div style={{ color:C.gray, fontSize:12 }}>Nenhuma observação registrada.</div> :
              detObs.map((o,i) => (
                <div key={i} style={{ background:C.panel2, borderRadius:8, padding:"10px 12px", marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ color:C.yellow, fontSize:10, fontWeight:700 }}>{o.mes}</span>
                    <span style={{ color:C.gray, fontSize:10 }}>{fmtDate(o.data)}</span>
                  </div>
                  <div style={{ color:C.lgray, fontSize:12, marginBottom:6 }}>{o.texto}</div>
                  <div style={{ fontSize:10, color:C.gray }}>Por: <span style={{ color:C.lime }}>{o.consultorNome||"—"}</span></div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div style={gs.card}>
        <div style={{ color:C.white, fontWeight:700, marginBottom:16, fontSize:14 }}>Histórico de Compras</div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead><tr style={{ color:C.gray, fontSize:11, textTransform:"uppercase" }}>
            {["Data","Valor"].map(h => <th key={h} style={{ textAlign:"left", padding:"6px 12px", borderBottom:`1px solid ${C.border}` }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {[...detCliente.hist].sort((a,b) => b.data?.localeCompare(a.data)).map(cp => (
              <tr key={cp.id} style={{ borderBottom:`1px solid ${C.border}22` }}>
                <td style={{ padding:"10px 12px", color:C.lgray }}>{fmtDate(cp.data)}</td>
                <td style={{ padding:"10px 12px", color:C.lime, fontWeight:700 }}>{fmtMoney(cp.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalObs && (
        <Modal title="Adicionar Observação" subtitle={modalObs.nome} onClose={() => setModalObs(null)}>
          <Field label="Mês de referência"><input style={gs.input} type="month" value={obsMes} onChange={e => setObsMes(e.target.value)}/></Field>
          <Field label="Observação / Motivo">
            <textarea style={{ ...gs.input, height:90, resize:"vertical" }} value={obsTexto} onChange={e => setObsTexto(e.target.value)} placeholder="Ex: Cliente informou que o estoque está cheio. Retorna em 15 dias."/>
          </Field>
          <div style={{ display:"flex", gap:10, marginTop:8 }}>
            <button style={{ ...gs.btnOutline, flex:1 }} onClick={() => setModalObs(null)}>Cancelar</button>
            <button style={{ ...gs.btn(), flex:1 }} onClick={addObs}>Salvar</button>
          </div>
        </Modal>
      )}
    </div>
  );

  return (
    <div>
      <PageHeader title="Meus Clientes" sub={`${filtered.length} de ${clientes.length} exibidos`}/>

      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        <input style={{ ...gs.input, width:200 }} placeholder="Buscar cliente..." value={busca} onChange={e => setBusca(e.target.value)}/>
        <select style={{ ...gs.select, width:140 }} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option>Todos</option><option>Em dia</option><option>Atenção</option><option>Atrasado</option>
        </select>
        <select style={{ ...gs.select, width:160 }} value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}>
          <option value="Todos">Todas categorias</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {filtered.map(cl => (
          <div key={cl.id} style={{ ...gs.card, display:"flex", alignItems:"center", gap:16, padding:"16px 20px" }}>
            <div style={{ flex:1, cursor:"pointer" }} onClick={() => setDetalhe(cl.id)}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6, flexWrap:"wrap" }}>
                <span style={{ color:C.white, fontWeight:700, fontSize:14 }}>{cl.nome}</span>
                <Badge label={cl.status.label} cor={cl.status.cor}/>
                {cl.categoria && <span style={{ ...gs.badge(C.blue), fontSize:10 }}>{cl.categoria}</span>}
              </div>
              <div style={{ display:"flex", gap:20, fontSize:12, color:C.gray, flexWrap:"wrap" }}>
                <span>Ciclo: {cl.ciclo_dias}d</span>
                <span>Última compra: {fmtDate(cl.ultima_compra)}</span>
                <span style={{ color:C.lime }}>LTV: {fmtMoney(cl.ltv)}</span>
              </div>
              <ProgressBar pct={cl.status.pct} cor={cl.status.cor}/>
            </div>
            <div style={{ display:"flex", gap:8, flexShrink:0 }}>
              <button style={{ ...gs.btnOutline, fontSize:11, padding:"6px 12px" }} onClick={() => setModalObs(cl)}>+ Obs</button>
              <button style={{ ...gs.btn(C.blue, C.white), padding:"6px 12px", fontSize:11 }} onClick={() => { setModalCompra(cl); setCData(new Date().toISOString().split("T")[0]); }}>+ Venda</button>
              <button style={{ ...gs.btn(), padding:"6px 14px", fontSize:11 }} onClick={() => setDetalhe(cl.id)}>Ver</button>
            </div>
          </div>
        ))}
      </div>
    {modalCompra && (
      <Modal title="Registrar Venda" subtitle={modalCompra.nome} onClose={() => setModalCompra(null)}>
        <Field label="Data da venda">
          <input style={gs.input} type="date" value={cData} onChange={e => setCData(e.target.value)}/>
        </Field>
        <Field label="Valor (R$)">
          <input style={gs.input} type="number" value={cValor} onChange={e => setCValor(e.target.value)} placeholder="Ex: 5000"/>
        </Field>
        <div style={{ background:"#181B22", borderRadius:8, padding:"10px 14px", marginBottom:12, fontSize:11, color:"#6B7280" }}>
          ℹ A venda será registrada e atualizará o dashboard, ranking e status do cliente automaticamente.
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button style={{ ...gs.btnOutline, flex:1 }} onClick={() => setModalCompra(null)}>Cancelar</button>
          <button style={{ ...gs.btn(), flex:1 }} onClick={addCompra}>Confirmar Venda</button>
        </div>
      </Modal>
    )}
    </div>
  );
};

// ── Consultor App ─────────────────────────────────────
export default function ConsultorApp({ user, onLogout }) {
  const [aba, setAba] = useState("carteira");
  const [clientes, setClientes] = useState([]);
  const [compras, setCompras] = useState([]);
  const [meta, setMeta] = useState(0);
  const [consultorId, setConsultorId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data:cons } = await supabase.from("consultores").select("*").eq("user_id", user.id);
      const con = cons?.[0];
      if (!con) { console.error("Consultor não encontrado para user_id:", user.id); setLoading(false); return; }
      setConsultorId(con.id);
      const mesAtual = new Date().toISOString().slice(0,7);
      const { data:clis } = await supabase.from("clientes").select("*").eq("consultor_id", con.id).eq("ativo", true).order("nome");
      const { data:comps } = await supabase.from("compras").select("*").order("data", { ascending:false });
      const { data:metaArr } = await supabase.from("metas").select("*").eq("consultor_id", con.id).eq("mes", mesAtual);
      const metaData = metaArr?.[0] || null;
      const ids = (clis||[]).map(c => c.id);
      const comprasFiltradas = (comps||[]).filter(cp => ids.includes(cp.cliente_id));
      setClientes(clis||[]);
      setCompras(comprasFiltradas);
      setMeta(metaData?.valor||0);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#08090C", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:36, height:36, border:"3px solid #232731", borderTop:"3px solid #C8F135", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={gs.page}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <ConsultorSidebar aba={aba} setAba={setAba} user={user} onLogout={onLogout}/>
      <div style={gs.main}>
        {aba === "carteira" && <MinhaCarteira clientes={clientes} compras={compras} consultorId={consultorId} meta={meta}/>}
        {aba === "clientes" && <MeusClientes clientes={clientes} compras={compras} user={user} setCompras={setCompras}/>}
      </div>
    </div>
  );
}