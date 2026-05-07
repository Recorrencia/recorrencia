import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
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
const MinhaCarteira = ({ clientes, compras, consultorId, metas }) => {
  const hoje = new Date();
  const mesAtual = hoje.toISOString().slice(0,7);
  const [filtroMes, setFiltroMes] = useState(mesAtual);

  const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth()+1, 0).getDate();
  const diaAtual = hoje.getDate();
  const diasRestantes = Math.max(1, diasNoMes - diaAtual);

  const metaObj = metas || { meta_desejada:0, meta_desafio:0, meta_ultra:0 };
  const { meta_desejada:desejada=0, meta_desafio:desafio=0, meta_ultra:ultra=0 } = metaObj;

  const faturadoMes = compras
    .filter(cp => cp.data?.startsWith(filtroMes))
    .reduce((s,c) => s+Number(c.valor), 0);

  const ticketMedio = (() => {
    const comprasMes = compras.filter(cp => cp.data?.startsWith(filtroMes));
    return comprasMes.length > 0 ? faturadoMes/comprasMes.length : 0;
  })();

  const mediaDiaria = diaAtual > 0 ? faturadoMes/diaAtual : 0;

  // Próxima meta não batida
  const proximaMeta = faturadoMes < desejada ? desejada
    : faturadoMes < desafio ? desafio
    : faturadoMes < ultra ? ultra : null;
  const mediaNecessaria = proximaMeta ? Math.max(0,(proximaMeta-faturadoMes)/diasRestantes) : 0;

  // Níveis de meta
  const niveis = [
    { label:"Meta Desejada", icon:"🎯", valor:desejada, cor:C.green },
    { label:"Meta Desafio",  icon:"🔥", valor:desafio,  cor:C.yellow },
    { label:"Ultrameta",     icon:"⚡", valor:ultra,    cor:C.red },
  ].filter(n => n.valor > 0);

  const enriched = clientes.map(cl => ({ ...cl, status:calcStatus(cl.ultima_compra, cl.ciclo_dias) }));
  const emDia = enriched.filter(c => c.status.label==="Em dia").length;
  const atencao = enriched.filter(c => c.status.label==="Atenção").length;
  const atrasado = enriched.filter(c => c.status.label==="Atrasado").length;

  // Gráfico diário do mês filtrado
  const [ano, mes] = filtroMes.split("-").map(Number);
  const diasDoMes = new Date(ano, mes, 0).getDate();
  const dailyData = Array.from({length:diasDoMes}, (_,i) => {
    const dia = i+1;
    const dataStr = `${filtroMes}-${String(dia).padStart(2,"0")}`;
    const valor = compras.filter(cp=>cp.data===dataStr).reduce((s,c)=>s+Number(c.valor),0);
    return { dia:String(dia), valor:Math.round(valor) };
  });

  // Linha de meta diária necessária
  const metaDiaria = proximaMeta && filtroMes===mesAtual
    ? Math.round(mediaNecessaria)
    : desejada > 0 ? Math.round(desejada/diasDoMes) : 0;

  const mesesOpts = Array.from({length:6},(_,i)=>{
    const d=new Date();d.setMonth(d.getMonth()-i);
    return{value:d.toISOString().slice(0,7),label:d.toLocaleDateString("pt-BR",{month:"long",year:"numeric"})};
  });

  const tt = { background:C.panel, border:`1px solid ${C.border}`, borderRadius:8, fontSize:12, color:C.white, fontFamily:"inherit" };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28, flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ color:C.white, fontSize:22, fontWeight:700, marginBottom:4 }}>Minha Carteira</div>
          <div style={{ color:C.gray, fontSize:13 }}>{hoje.toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"})}</div>
        </div>
        <select style={{...gs.select,width:200}} value={filtroMes} onChange={e=>setFiltroMes(e.target.value)}>
          {mesesOpts.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      {/* Faturado destaque */}
      <div style={{...gs.card, marginBottom:20, background:`linear-gradient(135deg,${C.panel} 60%,${C.lime}08)`, borderColor:C.lime+"33"}}>
        <div style={{color:C.gray,fontSize:11,letterSpacing:1,textTransform:"uppercase",marginBottom:12}}>Faturamento do Mês</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:20}}>
          <div>
            <div style={{color:C.lime,fontSize:40,fontWeight:700,lineHeight:1,marginBottom:6}}>{fmtMoney(faturadoMes)}</div>
            {proximaMeta?(
              <div style={{color:C.gray,fontSize:13}}>
                Próxima meta: <span style={{color:C.white,fontWeight:700}}>{fmtMoney(proximaMeta)}</span>
                {" · "}<span style={{color:C.yellow}}>Faltam {fmtMoney(proximaMeta-faturadoMes)}</span>
              </div>
            ):<div style={{color:C.green,fontWeight:700,fontSize:14}}>🎉 Todas as metas batidas!</div>}
          </div>
          <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
            <div style={{textAlign:"center"}}>
              <div style={{color:C.lime,fontSize:20,fontWeight:700}}>{fmtMoney(mediaDiaria)}</div>
              <div style={{color:C.gray,fontSize:11}}>Média diária atual</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{color:C.blue,fontSize:20,fontWeight:700}}>{fmtMoney(ticketMedio)}</div>
              <div style={{color:C.gray,fontSize:11}}>Ticket médio</div>
            </div>
            {proximaMeta&&filtroMes===mesAtual&&(
              <div style={{textAlign:"center"}}>
                <div style={{color:C.yellow,fontSize:20,fontWeight:700}}>{fmtMoney(mediaNecessaria)}</div>
                <div style={{color:C.gray,fontSize:11}}>Necessário/dia</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3 Níveis de Meta */}
      {niveis.length > 0 && (
        <div style={{display:"flex",gap:16,marginBottom:20,flexWrap:"wrap"}}>
          {niveis.map(n=>{
            const pct = n.valor > 0 ? (faturadoMes/n.valor)*100 : 0;
            const bateu = faturadoMes >= n.valor;
            const falta = Math.max(0, n.valor-faturadoMes);
            const diasNec = falta > 0 && filtroMes===mesAtual ? Math.ceil(falta/diasRestantes) : 0;
            return(
              <div key={n.label} style={{
                ...gs.card, flex:1, minWidth:180,
                borderColor: bateu?n.cor+"66":C.border,
                background: bateu?`linear-gradient(135deg,${C.panel} 60%,${n.cor}08)`:C.panel,
              }}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{color:C.gray,fontSize:11,textTransform:"uppercase",letterSpacing:0.5}}>{n.icon} {n.label}</div>
                  {bateu&&<span style={{...gs.badge(n.cor),fontSize:10}}>✓ Batida!</span>}
                </div>
                <div style={{color:n.cor,fontSize:24,fontWeight:700,marginBottom:4}}>{pct.toFixed(1)}%</div>
                <div style={{color:C.white,fontSize:14,marginBottom:8}}>{fmtMoney(n.valor)}</div>
                <div style={{background:C.border,borderRadius:99,height:6,marginBottom:8}}>
                  <div style={{
                    width:`${Math.min(pct,100)}%`,height:6,borderRadius:99,
                    background:n.cor,transition:"width .5s"
                  }}/>
                </div>
                {!bateu?(
                  <div style={{fontSize:11,color:C.gray}}>
                    Faltam <span style={{color:n.cor,fontWeight:700}}>{fmtMoney(falta)}</span>
                    {diasNec>0&&<span> · R${(diasNec/1000).toFixed(1)}k/dia</span>}
                  </div>
                ):(
                  <div style={{fontSize:11,color:n.cor,fontWeight:700}}>🎉 Parabéns!</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Stats carteira */}
      <div style={{display:"flex",gap:16,marginBottom:20,flexWrap:"wrap"}}>
        <StatCard label="Total Clientes" value={clientes.length} sub="na sua carteira"/>
        <StatCard label="Em dia" value={emDia} cor={C.green} sub={`${clientes.length?Math.round(emDia/clientes.length*100):0}% da carteira`}/>
        <StatCard label="Atenção" value={atencao} cor={C.yellow} sub="Próximos ao vencimento"/>
        <StatCard label="Atrasados" value={atrasado} cor={C.red} sub="Requer contato"/>
      </div>

      {/* Gráfico diário */}
      <div style={gs.card}>
        <div style={{color:C.white,fontWeight:700,marginBottom:4,fontSize:14}}>Vendas Diárias — {mesesOpts.find(m=>m.value===filtroMes)?.label}</div>
        <div style={{color:C.gray,fontSize:12,marginBottom:16}}>
          {metaDiaria>0&&<>Linha de referência: <span style={{color:C.yellow,fontWeight:700}}>{fmtMoney(metaDiaria)}/dia</span> necessários para {proximaMeta&&filtroMes===mesAtual?"próxima meta":"meta desejada"}</>}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={dailyData} margin={{top:10,right:10,left:0,bottom:0}}>
            <XAxis dataKey="dia" tick={{fill:C.gray,fontSize:9}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:C.gray,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>v>0?"R$"+(v/1000).toFixed(1)+"k":""}/>
            <Tooltip contentStyle={tt} wrapperStyle={{outline:"none"}} itemStyle={{color:C.lgray}} cursor={{fill:C.white,fillOpacity:0.05}} formatter={v=>[fmtMoney(v),"Vendas"]}/>
            {metaDiaria>0&&<ReferenceLine y={metaDiaria} stroke={C.yellow} strokeDasharray="4 2" strokeWidth={2}/>}
            <Bar dataKey="valor" radius={[4,4,0,0]}>
              {dailyData.map((d,i)=><Cell key={i} fill={d.valor>=metaDiaria&&d.valor>0?C.lime:d.valor>0?C.lime+"77":C.border}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {metaDiaria>0&&(
          <div style={{display:"flex",gap:16,marginTop:8,fontSize:11}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:12,height:12,borderRadius:3,background:C.lime}}/>
              <span style={{color:C.gray}}>Acima da meta diária</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:12,height:12,borderRadius:3,background:C.lime+"77"}}/>
              <span style={{color:C.gray}}>Abaixo da meta diária</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{width:24,height:2,background:C.yellow,borderRadius:99}}/>
              <span style={{color:C.gray}}>Meta diária necessária</span>
            </div>
          </div>
        )}
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
      {modalCompra && (
        <Modal title="Registrar Venda" subtitle={modalCompra.nome} onClose={() => setModalCompra(null)}>
          <Field label="Data da venda">
            <input style={gs.input} type="date" value={cData} onChange={e => setCData(e.target.value)}/>
          </Field>
          <Field label="Valor (R$)">
            <input style={gs.input} type="number" value={cValor} onChange={e => setCValor(e.target.value)} placeholder="Ex: 5000"/>
          </Field>
          <div style={{ background:"#181B22", borderRadius:8, padding:"10px 14px", marginBottom:12, fontSize:11, color:"#6B7280" }}>
            ℹ A venda será registrada e atualizará o dashboard e ranking automaticamente.
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button style={{ ...gs.btnOutline, flex:1 }} onClick={() => setModalCompra(null)}>Cancelar</button>
            <button style={{ ...gs.btn(), flex:1 }} onClick={addCompra}>Confirmar Venda</button>
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
  const [metas, setMetas] = useState(null);
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
      setMetas(metaData||null);
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
      <ConsultorSidebar aba={aba} setAba={setAba} user={user} onLogout={()=>{sessionStorage.removeItem("recorrenciaos-user");onLogout();}}/>
      <div style={gs.main}>
        {aba === "carteira" && <MinhaCarteira clientes={clientes} compras={compras} consultorId={consultorId} metas={metas}/>}
        {aba === "clientes" && <MeusClientes clientes={clientes} compras={compras} user={user} setCompras={setCompras}/>}
      </div>
    </div>
  );
}