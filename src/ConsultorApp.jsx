import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { supabase } from "./lib/supabase.js";
import VendaModal from "./VendaModal.jsx";
import { C, gs, fmtMoney, fmtDate, today, calcStatus, CATEGORIAS, Badge, ProgressBar, StatCard, Field, Modal, PageHeader } from "./utils.jsx";

// ── Consultor Sidebar ─────────────────────────────────
const ConsultorSidebar = ({ aba, setAba, user, onLogout }) => {
  const navItems = [
    { id:"carteira", label:"Minha Carteira", icon:"▦" },
    { id:"clientes", label:"Meus Clientes", icon:"◈" },
    { id:"vendas", label:"Minhas Vendas", icon:"◆" },
    { id:"tickets", label:"Tickets", icon:"✎" },
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

  const [modalVenda, setModalVenda] = useState(null);



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
      <div style={{ display:"flex", alignItems:"flex-start", gap:12, marginBottom:28, flexWrap:"wrap" }}>
        <button onClick={() => setDetalhe(null)} style={{ ...gs.btnOutline, padding:"7px 14px", fontSize:12, flexShrink:0 }}>← Voltar</button>
        <div style={{ flex:1 }}>
          {/* Nome e status */}
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,flexWrap:"wrap"}}>
            <div style={{color:C.white,fontSize:22,fontWeight:700}}>{detCliente.nome}</div>
            <span style={gs.badge(detCliente.status_ativo!==false?C.green:C.red)}>
              {detCliente.status_ativo!==false?"● Ativo":"● Inativo"}
            </span>
            <span style={gs.badge(detCliente.status.cor)}>{detCliente.status.label}</span>
          </div>
          {/* Dados cadastrais */}
          <div style={{...gs.card,marginBottom:16,padding:"20px 24px"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px 40px"}}>
              <div><label style={gs.label}>Ciclo de Compra</label><div style={{color:C.white,fontSize:14}}>{detCliente.ciclo_dias} dias</div></div>
              <div><label style={gs.label}>Categoria</label><div style={{color:C.white,fontSize:14}}>{detCliente.categoria||"—"}</div></div>
              <div><label style={gs.label}>Primeira Compra</label><div style={{color:C.white,fontSize:14}}>{fmtDate(detCliente.data_primeira_compra||detCliente.ultima_compra)}</div></div>
              <div><label style={gs.label}>Última Compra</label><div style={{color:C.white,fontSize:14}}>{fmtDate(detCliente.ultima_compra)}</div></div>
              <div><label style={gs.label}>Endereço</label><div style={{color:C.white,fontSize:14}}>{detCliente.endereco||"—"}</div></div>
              <div><label style={gs.label}>Instagram</label>
                {detCliente.instagram
                  ?<a href={detCliente.instagram.startsWith("http")?detCliente.instagram:`https://instagram.com/${detCliente.instagram.replace("@","")}`} target="_blank" rel="noreferrer" style={{color:C.blue,fontSize:14,textDecoration:"none",wordBreak:"break-all"}}>{detCliente.instagram}</a>
                  :<div style={{color:C.white,fontSize:14}}>—</div>}
              </div>
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,flexShrink:0,flexWrap:"wrap"}}>
          <button style={{...gs.btn(C.blue,C.white)}} onClick={()=>{setModalCompra(detCliente);setCData(new Date().toISOString().split("T")[0]);}}>+ Registrar Venda</button>
          <button style={gs.btn()} onClick={()=>setModalObs(detCliente)}>+ Observação</button>
        </div>
      </div>

      <div style={{ display:"flex", gap:16, marginBottom:20, flexWrap:"wrap" }}>
        <StatCard label="LTV Total" value={fmtMoney(detCliente.ltv)} cor={C.lime} sub={`${detCliente.hist.length} compras`}/>
        <StatCard label="Última Compra" value={fmtDate(detCliente.ultima_compra)} cor={detCliente.status.cor} sub={detCliente.status.label}/>
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
      {modalVenda && <VendaModal
        cliente={modalVenda}
        userId={user?.id}
        onClose={() => setModalVenda(null)}
        onSaved={(cp) => {
          setCompras(p => [cp, ...p]);
          setModalVenda(null);
        }}
      />}
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
              <button style={{ ...gs.btn(C.blue, C.white), padding:"6px 12px", fontSize:11 }} onClick={() => setModalVenda(cl)}>+ Venda</button>
              <button style={{ ...gs.btn(), padding:"6px 14px", fontSize:11 }} onClick={() => setDetalhe(cl.id)}>Ver</button>
            </div>
          </div>
        ))}
      </div>
    {modalVenda && <VendaModal
      cliente={modalVenda}
      userId={user?.id}
      onClose={() => setModalVenda(null)}
      onSaved={(cp) => {
        setCompras(p => [cp, ...p]);
        setModalVenda(null);
      }}
    />}
    </div>
  );
};


// ── Minhas Vendas ─────────────────────────────────────
const MinhasVendas = ({ compras, clientes }) => {
  const now = new Date();
  const [filtroMes, setFiltroMes] = useState(now.toISOString().slice(0,7));
  const [filtroCategoria, setFiltroCategoria] = useState("Todos");
  const [semFiltroMes, setSemFiltroMes] = useState(false);

  const mesesOpts = Array.from({length:12},(_,i)=>{
    const d=new Date();d.setMonth(d.getMonth()-i);
    return{value:d.toISOString().slice(0,7),label:d.toLocaleDateString("pt-BR",{month:"long",year:"numeric"})};
  });

  const CATEGORIAS_LOCAL = ["Loja de Suplementos","Revendedor","Personal","Supermercado","Farmácia","Nutricionista"];

  const enriched = [...compras]
    .sort((a,b)=>b.data?.localeCompare(a.data))
    .map(cp=>{
      const cl=clientes.find(c=>c.id===cp.cliente_id);
      return{...cp,cliente:cl};
    })
    .filter(cp=>{
      if(!semFiltroMes&&!cp.data?.startsWith(filtroMes))return false;
      if(filtroCategoria!=="Todos"&&cp.cliente?.categoria!==filtroCategoria)return false;
      return true;
    });

  const total=enriched.reduce((s,c)=>s+Number(c.valor),0);
  const ticketMedio=enriched.length?total/enriched.length:0;

  return(
    <div>
      <div style={{marginBottom:28}}>
        <div style={{color:C.white,fontSize:22,fontWeight:700,marginBottom:4}}>Minhas Vendas</div>
        <div style={{color:C.gray,fontSize:13}}>{enriched.length} registros · {fmtMoney(total)}</div>
      </div>

      <div style={{display:"flex",gap:16,marginBottom:24,flexWrap:"wrap"}}>
        <StatCard label="Total do Período" value={fmtMoney(total)} cor={C.lime}/>
        <StatCard label="Qtd Vendas" value={enriched.length} cor={C.blue}/>
        <StatCard label="Ticket Médio" value={fmtMoney(ticketMedio)} cor={C.yellow}/>
      </div>

      <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
        <select style={{...gs.select,width:180}} value={filtroMes} onChange={e=>{setFiltroMes(e.target.value);setSemFiltroMes(false);}} disabled={semFiltroMes}>
          {mesesOpts.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select style={{...gs.select,width:160}} value={filtroCategoria} onChange={e=>setFiltroCategoria(e.target.value)}>
          <option value="Todos">Todas categorias</option>
          {CATEGORIAS_LOCAL.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={()=>setSemFiltroMes(p=>!p)} style={{
          ...gs.btn(semFiltroMes?C.lime:C.panel2,semFiltroMes?"#08090C":C.lgray),
          border:`1px solid ${semFiltroMes?C.lime:C.border}`,fontSize:12,
        }}>{semFiltroMes?"Filtrado por mês":"Ver tudo"}</button>
      </div>

      <div style={gs.card}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead><tr style={{color:C.gray,fontSize:11,textTransform:"uppercase"}}>
            {["Data","Cliente","Categoria","Valor"].map(h=>(
              <th key={h} style={{textAlign:"left",padding:"8px 14px",borderBottom:`1px solid ${C.border}`}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {enriched.length===0?(
              <tr><td colSpan={4} style={{padding:32,textAlign:"center",color:C.gray}}>Nenhuma venda encontrada no período.</td></tr>
            ):enriched.map(cp=>(
              <tr key={cp.id} style={{borderBottom:`1px solid ${C.border}22`}}>
                <td style={{padding:"11px 14px",color:C.gray}}>{fmtDate(cp.data)}</td>
                <td style={{padding:"11px 14px",color:C.white,fontWeight:600}}>{cp.cliente?.nome||"—"}</td>
                <td style={{padding:"11px 14px"}}>
                  {cp.cliente?.categoria&&<span style={{...gs.badge(C.purple),fontSize:10}}>{cp.cliente.categoria}</span>}
                </td>
                <td style={{padding:"11px 14px",color:C.lime,fontWeight:700}}>{fmtMoney(cp.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Tickets Consultor ─────────────────────────────────
const TicketsConsultor = ({ user, clientes, compras }) => {
  const [tickets, setTickets] = useState([]);
  const [modalNovo, setModalNovo] = useState(false);
  const [modalDetalhe, setModalDetalhe] = useState(null);
  const [tTipo, setTTipo] = useState("Valor da compra incorreto");
  const [tCliente, setTCliente] = useState("");
  const [tCompra, setTCompra] = useState("");
  const [tDescricao, setTDescricao] = useState("");
  const [tLink, setTLink] = useState("");
  const [tValorErrado, setTValorErrado] = useState("");
  const [tValorCorreto, setTValorCorreto] = useState("");

  const TIPOS = [
    "Valor da compra incorreto",
    "Data da compra incorreta",
    "Cliente errado",
    "Ciclo de compra incorreto",
    "Dados cadastrais incorretos",
    "Outro",
  ];

  const STATUS_COR = { aberto:C.red, analise:C.yellow, corrigido:C.green, recusado:C.gray };

  useEffect(()=>{
    supabase.from("tickets").select("*")
      .eq("aberto_por_id", user?.id)
      .order("created_at",{ascending:false})
      .then(({data})=>setTickets(data||[]));
  },[user]);

  const comprasCliente = compras.filter(cp=>cp.cliente_id===Number(tCliente)).sort((a,b)=>b.data?.localeCompare(a.data));

  const abrirTicket = async() => {
    if(!tDescricao||!tCliente)return;
    const cl = clientes.find(c=>c.id===Number(tCliente));
    const novo = {
      tipo:tTipo, cliente_id:Number(tCliente),
      compra_id:tCompra?Number(tCompra):null,
      descricao:tDescricao, link_comprovante:tLink,
      valor_errado:tValorErrado, valor_correto:tValorCorreto,
      status:"aberto",
      aberto_por:user?.nome,
      aberto_por_id:user?.id,
      aberto_por_perfil:"consultor",
      aberto_em:new Date().toISOString(),
      historico:JSON.stringify([{
        acao:"Ticket aberto",por:user?.nome,
        perfil:"consultor",em:new Date().toISOString(),
        detalhe:`Tipo: ${tTipo} | Cliente: ${cl?.nome}`,
      }]),
    };
    const{data}=await supabase.from("tickets").insert(novo).select().single();
    if(data)setTickets(p=>[data,...p]);
    setModalNovo(false);
    setTDescricao("");setTLink("");setTValorErrado("");setTValorCorreto("");setTCliente("");setTCompra("");
  };

  const detalhe = modalDetalhe ? tickets.find(t=>t.id===modalDetalhe) : null;
  const fmtDt = iso => iso ? new Date(iso).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—";

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
        <div>
          <div style={{color:C.white,fontSize:22,fontWeight:700,marginBottom:4}}>Meus Tickets</div>
          <div style={{color:C.gray,fontSize:13}}>Solicitações de correção enviadas ao gestor</div>
        </div>
        <button style={gs.btn()} onClick={()=>setModalNovo(true)}>+ Abrir Ticket</button>
      </div>

      {tickets.length===0?(
        <div style={{...gs.card,textAlign:"center",padding:48}}>
          <div style={{fontSize:32,marginBottom:12}}>✓</div>
          <div style={{color:C.green,fontWeight:700,fontSize:16,marginBottom:6}}>Nenhum ticket aberto</div>
          <div style={{color:C.gray,fontSize:13}}>Use tickets para solicitar correções ao gestor.</div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {tickets.map(t=>{
            const cl=clientes.find(c=>c.id===t.cliente_id);
            const cor=STATUS_COR[t.status]||C.gray;
            return(
              <div key={t.id} style={{...gs.card,padding:"16px 20px",cursor:"pointer",borderColor:cor+"44"}}
                onClick={()=>setModalDetalhe(t.id)}>
                <div style={{display:"flex",alignItems:"flex-start",gap:16,flexWrap:"wrap"}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,flexWrap:"wrap"}}>
                      <span style={{...gs.badge(cor),fontSize:10}}>{t.status}</span>
                      <span style={{color:C.white,fontWeight:700,fontSize:14}}>{t.tipo}</span>
                    </div>
                    <div style={{color:C.lgray,fontSize:12,marginBottom:6}}>{t.descricao}</div>
                    <div style={{fontSize:11,color:C.gray}}>
                      Cliente: <span style={{color:C.lgray}}>{cl?.nome||"—"}</span>
                    </div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{color:C.gray,fontSize:10}}>{fmtDt(t.aberto_em||t.created_at)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalNovo&&(
        <Modal title="Abrir Ticket" subtitle="Solicite uma correção ao gestor" onClose={()=>setModalNovo(false)}>
          <Field label="Tipo de erro">
            <select style={gs.select} value={tTipo} onChange={e=>setTTipo(e.target.value)}>
              {TIPOS.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Cliente relacionado">
            <select style={gs.select} value={tCliente} onChange={e=>{setTCliente(e.target.value);setTCompra("");}}>
              <option value="">Selecione o cliente...</option>
              {clientes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </Field>
          {tCliente&&comprasCliente.length>0&&(
            <Field label="Compra relacionada (opcional)">
              <select style={gs.select} value={tCompra} onChange={e=>setTCompra(e.target.value)}>
                <option value="">Nenhuma compra específica</option>
                {comprasCliente.map(cp=><option key={cp.id} value={cp.id}>{fmtDate(cp.data)} — {fmtMoney(cp.valor)}</option>)}
              </select>
            </Field>
          )}
          {(tTipo==="Valor da compra incorreto")&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Field label="Valor incorreto"><input style={gs.input} type="number" value={tValorErrado} onChange={e=>setTValorErrado(e.target.value)} placeholder="Ex: 5000"/></Field>
              <Field label="Valor correto"><input style={gs.input} type="number" value={tValorCorreto} onChange={e=>setTValorCorreto(e.target.value)} placeholder="Ex: 5500"/></Field>
            </div>
          )}
          <Field label="Descrição do erro">
            <textarea style={{...gs.input,height:80,resize:"vertical"}} value={tDescricao} onChange={e=>setTDescricao(e.target.value)} placeholder="Descreva o que está errado..."/>
          </Field>
          <Field label="Link do comprovante (opcional)">
            <input style={gs.input} value={tLink} onChange={e=>setTLink(e.target.value)} placeholder="https://drive.google.com/..."/>
          </Field>
          <div style={{background:C.panel2,borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:11,color:C.gray}}>
            ℹ O gestor será notificado e fará a correção após análise.
          </div>
          <div style={{display:"flex",gap:10}}>
            <button style={{...gs.btnOutline,flex:1}} onClick={()=>setModalNovo(false)}>Cancelar</button>
            <button style={{...gs.btn(),flex:1}} onClick={abrirTicket}>Enviar Ticket</button>
          </div>
        </Modal>
      )}

      {detalhe&&(
        <Modal title={`Ticket — ${detalhe.tipo}`} subtitle={detalhe.descricao} onClose={()=>setModalDetalhe(null)}>
          <div style={{background:C.panel2,borderRadius:10,padding:"14px 16px",marginBottom:16}}>
            <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:8}}>
              <span style={{...gs.badge(STATUS_COR[detalhe.status]||C.gray)}}>{detalhe.status}</span>
              <span style={{color:C.gray,fontSize:12}}>{fmtDt(detalhe.aberto_em||detalhe.created_at)}</span>
            </div>
            {detalhe.valor_errado&&<div style={{fontSize:12,color:C.gray,marginBottom:4}}>Valor errado: <span style={{color:C.red}}>R$ {detalhe.valor_errado}</span></div>}
            {detalhe.valor_correto&&<div style={{fontSize:12,color:C.gray,marginBottom:4}}>Valor correto: <span style={{color:C.green}}>R$ {detalhe.valor_correto}</span></div>}
            {detalhe.link_comprovante&&<a href={detalhe.link_comprovante} target="_blank" rel="noreferrer" style={{color:C.blue,fontSize:12}}>🔗 Ver comprovante</a>}
          </div>
          {detalhe.correcao&&(
            <div style={{background:detalhe.status==="corrigido"?C.green+"11":C.red+"11",border:`1px solid ${detalhe.status==="corrigido"?C.green+"44":C.red+"44"}`,borderRadius:10,padding:"14px 16px"}}>
              <div style={{color:detalhe.status==="corrigido"?C.green:C.red,fontWeight:700,marginBottom:6}}>
                {detalhe.status==="corrigido"?"✓ Correção aplicada":"✕ Ticket recusado"}
              </div>
              <div style={{fontSize:12,color:C.lgray}}>{typeof detalhe.correcao==="string"?JSON.parse(detalhe.correcao)?.justificativa:detalhe.correcao?.justificativa}</div>
            </div>
          )}
          <button style={{...gs.btnOutline,width:"100%",marginTop:16}} onClick={()=>setModalDetalhe(null)}>Fechar</button>
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
        {aba === "vendas" && <MinhasVendas compras={compras} clientes={clientes}/>}
        {aba === "tickets" && <TicketsConsultor user={user} clientes={clientes} compras={compras}/>}
      </div>
    </div>
  );
}