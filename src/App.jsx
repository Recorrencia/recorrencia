import { useState, useMemo, useEffect, useCallback } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, ReferenceLine } from "recharts";

const C = {
  dark:"#08090C",panel:"#111318",panel2:"#181B22",border:"#232731",
  lime:"#C8F135",white:"#F0F2F8",gray:"#6B7280",lgray:"#9CA3AF",
  red:"#FF4455",yellow:"#FFB800",green:"#00C98C",blue:"#4A9EFF",
};

const calcStatus=(ultimaCompra,ciclo)=>{
  if(!ultimaCompra)return{label:"Sem compra",cor:C.gray,pct:0};
  const dias=Math.floor((new Date()-new Date(ultimaCompra))/86400000);
  const pct=(dias/ciclo)*100;
  if(dias>=ciclo)return{label:"Atrasado",cor:C.red,pct:Math.min(pct,100)};
  if(ciclo-dias<=Math.ceil(ciclo*0.25))return{label:"Atenção",cor:C.yellow,pct};
  return{label:"Em dia",cor:C.green,pct};
};

const fmtMoney=v=>"R$ "+Number(v).toLocaleString("pt-BR",{minimumFractionDigits:0});
const fmtDate=d=>d?new Date(d+"T12:00:00").toLocaleDateString("pt-BR"):"—";
const today=()=>new Date().toISOString().split("T")[0];
const daysAgo=n=>{const d=new Date();d.setDate(d.getDate()-n);return d.toISOString().split("T")[0];};

// ── Seed data ─────────────────────────────────────────
const CONSULTORES_SEED=[
  {id:1,nome:"Walesca",setor:"Farm"},
  {id:2,nome:"Caio",setor:"Farm"},
  {id:3,nome:"Maycon",setor:"Farm"},
  {id:4,nome:"Alef",setor:"Farm"},
  {id:5,nome:"Giovanna",setor:"Farm"},
  {id:6,nome:"Sangela",setor:"Farm"},
  {id:7,nome:"Jandreson",setor:"Farm"},
  {id:8,nome:"Thayrlla",setor:"Farm"},
  {id:9,nome:"Thays",setor:"Farm"},
  {id:10,nome:"Rellen",setor:"1ª Compra"},
  {id:11,nome:"Aline",setor:"1ª Compra"},
];

const CLIENTES_SEED=[
  {id:1,nome:"Suplementos Vitória",consultor_id:1,setor:"Farm",ciclo_dias:30,ultima_compra:daysAgo(24)},
  {id:2,nome:"Academia FitMax",consultor_id:1,setor:"Farm",ciclo_dias:30,ultima_compra:daysAgo(35)},
  {id:3,nome:"Nutri Store SP",consultor_id:2,setor:"Farm",ciclo_dias:15,ultima_compra:daysAgo(10)},
  {id:4,nome:"Power Gym Suplementos",consultor_id:2,setor:"Farm",ciclo_dias:30,ultima_compra:daysAgo(18)},
  {id:5,nome:"Fórmula Certa BH",consultor_id:3,setor:"Farm",ciclo_dias:30,ultima_compra:daysAgo(38)},
  {id:6,nome:"Top Nutri CE",consultor_id:3,setor:"Farm",ciclo_dias:15,ultima_compra:daysAgo(12)},
  {id:7,nome:"Protein House",consultor_id:4,setor:"Farm",ciclo_dias:30,ultima_compra:daysAgo(5)},
  {id:8,nome:"Mega Suplementos",consultor_id:4,setor:"Farm",ciclo_dias:60,ultima_compra:daysAgo(45)},
  {id:9,nome:"Fit Lab RJ",consultor_id:5,setor:"Farm",ciclo_dias:30,ultima_compra:daysAgo(29)},
  {id:10,nome:"Corpo & Saúde",consultor_id:5,setor:"Farm",ciclo_dias:15,ultima_compra:daysAgo(16)},
  {id:11,nome:"Alpha Nutrition",consultor_id:6,setor:"Farm",ciclo_dias:30,ultima_compra:daysAgo(8)},
  {id:12,nome:"Health Point",consultor_id:7,setor:"Farm",ciclo_dias:30,ultima_compra:daysAgo(33)},
  {id:13,nome:"Sport Life",consultor_id:8,setor:"Farm",ciclo_dias:15,ultima_compra:daysAgo(7)},
  {id:14,nome:"Nutri Max GO",consultor_id:9,setor:"Farm",ciclo_dias:30,ultima_compra:daysAgo(22)},
  {id:15,nome:"Força Total Gym",consultor_id:10,setor:"1ª Compra",ciclo_dias:30,ultima_compra:daysAgo(2)},
  {id:16,nome:"Active Supplements",consultor_id:11,setor:"1ª Compra",ciclo_dias:30,ultima_compra:daysAgo(4)},
];

const COMPRAS_SEED=(() => {
  const compras=[];let id=1;
  CLIENTES_SEED.forEach(cl=>{
    for(let m=5;m>=0;m--){
      const d=new Date();d.setMonth(d.getMonth()-m);
      const skip=m===0&&cl.id%3===0;
      if(!skip){
        compras.push({id:id++,cliente_id:cl.id,data:d.toISOString().split("T")[0],valor:Math.floor(Math.random()*8000+2000)});
      }
    }
  });
  return compras;
})();

// ── Styles ─────────────────────────────────────────────
const gs={
  page:{minHeight:"100vh",background:C.dark,fontFamily:"'DM Mono','Fira Mono',monospace",color:C.white},
  sidebar:{width:220,background:C.panel,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",position:"fixed",top:0,left:0,bottom:0,zIndex:10},
  main:{marginLeft:220,padding:"28px 32px",minHeight:"100vh"},
  card:{background:C.panel,border:`1px solid ${C.border}`,borderRadius:12,padding:"20px 24px"},
  input:{background:C.panel2,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.white,fontSize:13,outline:"none",width:"100%",boxSizing:"border-box",fontFamily:"inherit"},
  select:{background:C.panel2,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 12px",color:C.white,fontSize:13,outline:"none",width:"100%",boxSizing:"border-box",fontFamily:"inherit",cursor:"pointer"},
  btn:(bg=C.lime,fg="#08090C")=>({background:bg,color:fg,border:"none",borderRadius:8,padding:"9px 18px",fontWeight:700,cursor:"pointer",fontSize:13,fontFamily:"inherit"}),
  btnOutline:{background:"transparent",color:C.lgray,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 18px",cursor:"pointer",fontSize:13,fontFamily:"inherit"},
  label:{color:C.gray,fontSize:11,letterSpacing:1,marginBottom:6,display:"block",textTransform:"uppercase"},
  badge:(cor)=>({background:cor+"22",color:cor,border:`1px solid ${cor}55`,borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:700,display:"inline-block"}),
};

const Badge=({label,cor})=><span style={gs.badge(cor)}>{label}</span>;
const ProgressBar=({pct,cor})=>(
  <div style={{background:C.border,borderRadius:99,height:4,marginTop:8}}>
    <div style={{width:`${Math.min(pct,100)}%`,height:4,background:cor,borderRadius:99,transition:"width .3s"}}/>
  </div>
);
const StatCard=({label,value,sub,cor=C.lime})=>(
  <div style={{...gs.card,flex:1,minWidth:130}}>
    <div style={{color:C.gray,fontSize:11,letterSpacing:1,textTransform:"uppercase",marginBottom:8}}>{label}</div>
    <div style={{color:cor,fontSize:28,fontWeight:700,lineHeight:1}}>{value}</div>
    {sub&&<div style={{color:C.gray,fontSize:11,marginTop:6}}>{sub}</div>}
  </div>
);
const Field=({label,children})=>(
  <div style={{marginBottom:16}}>
    <label style={gs.label}>{label}</label>
    {children}
  </div>
);
const Modal=({title,subtitle,onClose,children})=>(
  <div style={{position:"fixed",inset:0,background:"#000000AA",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:16,padding:32,width:440,maxWidth:"90vw",boxShadow:"0 32px 80px #000A"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
        <div>
          <div style={{color:C.white,fontWeight:700,fontSize:18}}>{title}</div>
          {subtitle&&<div style={{color:C.gray,fontSize:12,marginTop:4}}>{subtitle}</div>}
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",color:C.gray,cursor:"pointer",fontSize:20,lineHeight:1}}>×</button>
      </div>
      {children}
    </div>
  </div>
);

// ══════════════════════════════════════════════════════
// LOGIN — modo demo (sem Supabase)
// ══════════════════════════════════════════════════════
const USERS_DEMO=[
  {id:"1",email:"gestor@recorrencia.com",pass:"gestor123",nome:"Carlos Gestor",perfil:"Gerente"},
  {id:"2",email:"assistente@recorrencia.com",pass:"assist123",nome:"Mariana Assistente",perfil:"Assistente"},{id:"3",email:"dono@recorrencia.com",pass:"dono123",nome:"Roberto Dono",perfil:"Dono"},
];

const Login=({onLogin})=>{
  const[email,setEmail]=useState("");
  const[pass,setPass]=useState("");
  const[erro,setErro]=useState("");

  const handle=()=>{
    const u=USERS_DEMO.find(u=>u.email===email&&u.pass===pass);
    if(u){onLogin(u);}
    else{setErro("E-mail ou senha inválidos.");}
  };

  return(
    <div style={{minHeight:"100vh",background:C.dark,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Mono',monospace"}}>
      <div style={{width:380}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:40}}>
          <div style={{width:40,height:40,background:C.lime,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:C.dark,fontSize:20}}>R</div>
          <div>
            <div style={{color:C.white,fontWeight:700,fontSize:18}}>RecorrênciaOS</div>
            <div style={{color:C.gray,fontSize:11}}>Gestão de Carteiras · Modo Demo</div>
          </div>
        </div>
        <div style={{...gs.card,padding:32}}>
          <div style={{color:C.white,fontWeight:700,fontSize:20,marginBottom:4}}>Entrar</div>
          <div style={{color:C.gray,fontSize:12,marginBottom:28}}>Acesso restrito ao gestor e dono</div>
          {erro&&<div style={{background:C.red+"22",border:`1px solid ${C.red}55`,borderRadius:8,padding:"10px 14px",color:C.red,fontSize:12,marginBottom:16}}>{erro}</div>}
          <Field label="E-mail">
            <input style={gs.input} value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" type="email"/>
          </Field>
          <Field label="Senha">
            <input style={gs.input} value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" type="password" onKeyDown={e=>e.key==="Enter"&&handle()}/>
          </Field>
          <button style={{...gs.btn(),width:"100%",marginTop:8,padding:"11px 18px"}} onClick={handle}>Entrar</button>
          <div style={{marginTop:20,padding:14,background:C.panel2,borderRadius:8,fontSize:11,color:C.gray}}>
            <div style={{marginBottom:6,color:C.lgray,fontWeight:700}}>Credenciais de demo:</div>
            <div style={{marginBottom:3}}>gestor@recorrencia.com / gestor123</div>
            <div style={{marginBottom:3}}>assistente@recorrencia.com / assist123</div>
            <div>dono@recorrencia.com / dono123</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════
// SIDEBAR
// ══════════════════════════════════════════════════════
const navItems=[
  {id:"dashboard",label:"Dashboard",icon:"▦"},
  {id:"clientes",label:"Clientes",icon:"◈"},
  {id:"consultores",label:"Consultores",icon:"◉"},
  {id:"compras",label:"Compras",icon:"◆"},
  {id:"ltv",label:"LTV",icon:"◐"},
  {id:"alertas",label:"Alertas",icon:"⚠"},
  {id:"tickets",label:"Tickets",icon:"✎"},
];
const Sidebar=({aba,setAba,user,onLogout,ticketsAbertos})=>(
  <div style={gs.sidebar}>
    <div style={{padding:"24px 20px 16px",borderBottom:`1px solid ${C.border}`}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:32,height:32,background:C.lime,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:C.dark,fontSize:16}}>R</div>
        <div>
          <div style={{color:C.white,fontWeight:700,fontSize:13}}>RecorrênciaOS</div>
          <div style={{color:C.gray,fontSize:10}}>v1.0 · Demo</div>
        </div>
      </div>
    </div>
    <nav style={{flex:1,padding:"16px 12px"}}>
      {navItems.map(n=>(
        <button key={n.id} onClick={()=>setAba(n.id)} style={{
          width:"100%",textAlign:"left",background:aba===n.id?C.lime+"18":"transparent",
          border:`1px solid ${aba===n.id?C.lime+"44":"transparent"}`,
          borderRadius:8,padding:"10px 14px",color:aba===n.id?C.lime:C.gray,
          cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:aba===n.id?700:400,
          display:"flex",alignItems:"center",gap:10,marginBottom:4,transition:"all .15s"
        }}>
          <span style={{fontSize:16}}>{n.icon}</span>
          <span style={{flex:1}}>{n.label}</span>
          {n.id==="tickets"&&ticketsAbertos>0&&(
            <span style={{background:C.red,color:C.white,borderRadius:99,fontSize:10,fontWeight:700,padding:"1px 7px",minWidth:18,textAlign:"center"}}>
              {ticketsAbertos}
            </span>
          )}
        </button>
      ))}
    </nav>
    <div style={{padding:"16px 20px",borderTop:`1px solid ${C.border}`}}>
      <div style={{color:C.white,fontSize:12,fontWeight:700,marginBottom:2}}>{user?.nome}</div>
      <div style={{color:C.gray,fontSize:11,marginBottom:10,textTransform:"capitalize"}}>{user?.perfil}</div>
      <button onClick={onLogout} style={{...gs.btnOutline,width:"100%",fontSize:11}}>Sair</button>
    </div>
  </div>
);

// ══════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════
const Dashboard=({clientes,compras,consultores})=>{
  const enriched=clientes.map(cl=>({...cl,status:calcStatus(cl.ultima_compra,cl.ciclo_dias)}));
  const emDia=enriched.filter(c=>c.status.label==="Em dia").length;
  const atencao=enriched.filter(c=>c.status.label==="Atenção").length;
  const atrasado=enriched.filter(c=>c.status.label==="Atrasado").length;
  const receitaTotal=compras.reduce((s,c)=>s+Number(c.valor),0);

  const vendasDiarias=Array.from({length:14},(_,i)=>{
    const d=new Date();d.setDate(d.getDate()-(13-i));
    const ds=d.toISOString().split("T")[0];
    const total=compras.filter(c=>c.data===ds).reduce((s,c)=>s+Number(c.valor),0);
    return{dia:d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}),total};
  });

  const recMeses=Array.from({length:6},(_,i)=>{
    const d=new Date();d.setMonth(d.getMonth()-(5-i));
    const mes=d.toLocaleDateString("pt-BR",{month:"short"});
    const m=d.toISOString().slice(0,7);
    const clientesComCompra=new Set(compras.filter(c=>c.data?.startsWith(m)).map(c=>c.cliente_id));
    return{mes,emDia:clientesComCompra.size,atrasado:Math.max(0,clientes.length-clientesComCompra.size)};
  });

  // ── Ticket médio por cliente ─────────────────────────
  const ticketMedio=cl=>{
    const hist=compras.filter(cp=>cp.cliente_id===cl.id);
    return hist.length?hist.reduce((a,c)=>a+Number(c.valor),0)/hist.length:0;
  };

  // ── Risco do mês atual por status ────────────────────
  const mesHoje=new Date().toISOString().slice(0,7);
  const clientesAtrasados=enriched.filter(c=>c.status.label==="Atrasado");
  const clientesAtencao=enriched.filter(c=>c.status.label==="Atenção");
  const riscoAtrasados=Math.round(clientesAtrasados.reduce((s,cl)=>s+ticketMedio(cl),0));
  const riscoAtencao=Math.round(clientesAtencao.reduce((s,cl)=>s+ticketMedio(cl),0));
  const riscoTotal=riscoAtrasados+riscoAtencao;

  // ── Gráfico de perdas — últimos 6 meses ──────────────
  const hoje=new Date();
  const mesHojeStr=hoje.toISOString().slice(0,7);

  const perdaMeses=Array.from({length:6},(_,i)=>{
    const d=new Date();d.setMonth(d.getMonth()-(5-i));
    const mes=d.toLocaleDateString("pt-BR",{month:"short"});
    const m=d.toISOString().slice(0,7);
    const isMesAtual=m===mesHojeStr;

    // Faturamento realizado no mês
    const faturado=compras.filter(c=>c.data?.startsWith(m)).reduce((s,c)=>s+Number(c.valor),0);

    let risco=0;
    if(isMesAtual){
      // Mês atual: risco em tempo real = Atenção + Atrasado (ainda não compraram)
      // Conforme compras são registradas eles saem do risco e entram no faturado
      risco=riscoTotal;
    } else {
      // Meses passados: resultado final = quem de fato não comprou naquele mês
      // (risco que não foi convertido)
      const clientesSemCompra=clientes.filter(cl=>{
        return compras.filter(cp=>cp.cliente_id===cl.id&&cp.data?.startsWith(m)).length===0;
      });
      risco=clientesSemCompra.reduce((s,cl)=>s+ticketMedio(cl),0);
    }

    return{mes,faturado:Math.round(faturado),risco:Math.round(risco),isMesAtual};
  });

  // Card de risco do mês atual
  const mesAtual=perdaMeses[perdaMeses.length-1];
  const pctRisco=riscoTotal>0?Math.round(riscoTotal/(mesAtual.faturado+riscoTotal)*100):0;

  const pieData=[
    {name:"Em dia",value:emDia,fill:C.green},
    {name:"Atenção",value:atencao,fill:C.yellow},
    {name:"Atrasado",value:atrasado,fill:C.red},
  ];
  const tt={background:C.panel,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,color:C.white,fontFamily:"inherit"};
  const ttWrapper={outline:"none"};
  const ttItem={color:C.lgray};
  const ttCursor={fill:C.white,fillOpacity:0.05};

  return(
    <div>
      <div style={{marginBottom:28}}>
        <div style={{color:C.white,fontSize:22,fontWeight:700,marginBottom:4}}>Dashboard</div>
        <div style={{color:C.gray,fontSize:13}}>{new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
      </div>

      {/* Stats */}
      <div style={{display:"flex",gap:16,marginBottom:24,flexWrap:"wrap"}}>
        <StatCard label="Total Clientes" value={clientes.length} sub={`${consultores.length} consultores ativos`}/>
        <StatCard label="Em dia" value={emDia} cor={C.green} sub={clientes.length?`${Math.round(emDia/clientes.length*100)}% da carteira`:""}/>
        <StatCard label="Atenção" value={atencao} cor={C.yellow} sub="Próximos ao vencimento"/>
        <StatCard label="Atrasados" value={atrasado} cor={C.red} sub="Requer contato imediato"/>
        <StatCard label="Receita Total" value={fmtMoney(receitaTotal)} cor={C.blue} sub="Histórico completo"/>
      </div>

      {/* Card destaque risco financeiro */}
      <div style={{...gs.card,marginBottom:20,borderColor:C.red+"55",background:`linear-gradient(135deg,${C.panel} 60%,${C.red}08)`}}>
        <div style={{color:C.gray,fontSize:11,letterSpacing:1,textTransform:"uppercase",marginBottom:14}}>⚠ Risco Financeiro do Mês Atual</div>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:20}}>

          {/* Total */}
          <div>
            <div style={{color:C.gray,fontSize:11,marginBottom:4}}>Total em risco</div>
            <div style={{color:C.red,fontSize:36,fontWeight:700,lineHeight:1,marginBottom:6}}>{fmtMoney(riscoTotal)}</div>
            <div style={{color:C.gray,fontSize:11}}>{pctRisco}% do potencial do mês em risco</div>
          </div>

          {/* Divisor */}
          <div style={{width:1,background:C.border,alignSelf:"stretch",flexShrink:0}}/>

          {/* Por status */}
          <div style={{display:"flex",gap:24,flexWrap:"wrap",flex:1}}>
            <div style={{flex:1,minWidth:140}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                <div style={{width:8,height:8,borderRadius:99,background:C.red}}/>
                <span style={{color:C.gray,fontSize:11,textTransform:"uppercase",letterSpacing:0.5}}>Atrasados</span>
              </div>
              <div style={{color:C.red,fontSize:22,fontWeight:700,marginBottom:4}}>{fmtMoney(riscoAtrasados)}</div>
              <div style={{color:C.gray,fontSize:11}}>{clientesAtrasados.length} clientes · prazo vencido</div>
              <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:4}}>
                {clientesAtrasados.slice(0,3).map(cl=>(
                  <div key={cl.id} style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.gray}}>
                    <span style={{color:C.lgray}}>{cl.nome}</span>
                    <span style={{color:C.red}}>{fmtMoney(ticketMedio(cl))}</span>
                  </div>
                ))}
                {clientesAtrasados.length>3&&<div style={{fontSize:10,color:C.gray}}>+{clientesAtrasados.length-3} outros</div>}
              </div>
            </div>

            <div style={{width:1,background:C.border,flexShrink:0}}/>

            <div style={{flex:1,minWidth:140}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                <div style={{width:8,height:8,borderRadius:99,background:C.yellow}}/>
                <span style={{color:C.gray,fontSize:11,textTransform:"uppercase",letterSpacing:0.5}}>Atenção</span>
              </div>
              <div style={{color:C.yellow,fontSize:22,fontWeight:700,marginBottom:4}}>{fmtMoney(riscoAtencao)}</div>
              <div style={{color:C.gray,fontSize:11}}>{clientesAtencao.length} clientes · ainda recuperável</div>
              <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:4}}>
                {clientesAtencao.slice(0,3).map(cl=>(
                  <div key={cl.id} style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.gray}}>
                    <span style={{color:C.lgray}}>{cl.nome}</span>
                    <span style={{color:C.yellow}}>{fmtMoney(ticketMedio(cl))}</span>
                  </div>
                ))}
                {clientesAtencao.length>3&&<div style={{fontSize:10,color:C.gray}}>+{clientesAtencao.length-3} outros</div>}
              </div>
            </div>

            <div style={{width:1,background:C.border,flexShrink:0}}/>

            {/* Faturado */}
            <div style={{flex:1,minWidth:140}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                <div style={{width:8,height:8,borderRadius:99,background:C.green}}/>
                <span style={{color:C.gray,fontSize:11,textTransform:"uppercase",letterSpacing:0.5}}>Faturado no mês</span>
              </div>
              <div style={{color:C.green,fontSize:22,fontWeight:700,marginBottom:4}}>{fmtMoney(mesAtual.faturado)}</div>
              <div style={{color:C.gray,fontSize:11}}>{emDia} clientes em dia</div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de linhas — faturamento vs risco */}
      <div style={{...gs.card,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,flexWrap:"wrap",gap:8}}>
          <div>
            <div style={{color:C.white,fontWeight:700,fontSize:14,marginBottom:4}}>Faturamento Realizado vs Risco de Perda</div>
            <div style={{color:C.gray,fontSize:12}}>
              Meses passados = resultado final · Mês atual = risco em tempo real (Atenção + Atrasado)
            </div>
          </div>
          <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11}}>
              <div style={{width:24,height:2,background:C.green,borderRadius:99}}/>
              <span style={{color:C.gray}}>Faturado</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11}}>
              <div style={{width:24,height:2,background:C.red,borderRadius:99}}/>
              <span style={{color:C.gray}}>Não convertido / Em risco</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={perdaMeses} margin={{top:10,right:20,left:0,bottom:0}}>
            <XAxis dataKey="mes" tick={{fill:C.gray,fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:C.gray,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>"R$"+(v/1000).toFixed(0)+"k"}/>
            <Tooltip
              contentStyle={tt}
              wrapperStyle={ttWrapper}
              itemStyle={ttItem}
              cursor={{stroke:C.border,strokeWidth:1}}
              formatter={(v,name,props)=>{
                const label=name==="faturado"?"Faturado":"Não convertido / Em risco";
                const extra=props?.payload?.isMesAtual&&name==="risco"?" (tempo real)":"";
                return[fmtMoney(v),label+extra];
              }}
            />
            <Line
              type="monotone" dataKey="faturado" name="faturado"
              stroke={C.green} strokeWidth={2.5}
              dot={(props)=>{
                const{cx,cy,payload}=props;
                return<circle key={cx} cx={cx} cy={cy} r={payload.isMesAtual?6:4}
                  fill={C.green} stroke={payload.isMesAtual?C.dark:"none"}
                  strokeWidth={payload.isMesAtual?2:0}/>;
              }}
              activeDot={{r:7,fill:C.green,stroke:C.dark,strokeWidth:2}}
            />
            <Line
              type="monotone" dataKey="risco" name="risco"
              stroke={C.red} strokeWidth={2.5} strokeDasharray="6 3"
              dot={(props)=>{
                const{cx,cy,payload}=props;
                return<circle key={cx} cx={cx} cy={cy} r={payload.isMesAtual?6:4}
                  fill={C.red} stroke={payload.isMesAtual?C.dark:"none"}
                  strokeWidth={payload.isMesAtual?2:0}/>;
              }}
              activeDot={{r:7,fill:C.red,stroke:C.dark,strokeWidth:2}}
            />
          </LineChart>
        </ResponsiveContainer>
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}>
          <div style={{fontSize:10,color:C.gray,background:C.panel2,borderRadius:6,padding:"4px 10px"}}>
            ● ponto maior = mês atual (em andamento)
          </div>
        </div>
      </div>

      {/* Row: vendas diárias + pizza */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:20,marginBottom:20}}>
        <div style={gs.card}>
          <div style={{color:C.white,fontWeight:700,marginBottom:4,fontSize:14}}>Vendas Diárias</div>
          <div style={{color:C.gray,fontSize:12,marginBottom:16}}>Últimos 14 dias</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={vendasDiarias}>
              <XAxis dataKey="dia" tick={{fill:C.gray,fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fill:C.gray,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>"R$"+(v/1000).toFixed(0)+"k"}/>
              <Tooltip contentStyle={tt} wrapperStyle={ttWrapper} itemStyle={ttItem} cursor={ttCursor} formatter={v=>[fmtMoney(v),"Vendas"]}/>
              <Bar dataKey="total" radius={[4,4,0,0]} fill={C.lime}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={gs.card}>
          <div style={{color:C.white,fontWeight:700,marginBottom:4,fontSize:14}}>Status da Carteira</div>
          <div style={{color:C.gray,fontSize:12,marginBottom:8}}>Distribuição atual</div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} dataKey="value" paddingAngle={3}>
                {pieData.map((d,i)=><Cell key={i} fill={d.fill}/>)}
              </Pie>
              <Tooltip contentStyle={tt} wrapperStyle={ttWrapper} itemStyle={ttItem}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:8,flexWrap:"wrap"}}>
            {pieData.map(d=>(
              <div key={d.name} style={{display:"flex",alignItems:"center",gap:5,fontSize:11}}>
                <div style={{width:8,height:8,borderRadius:99,background:d.fill}}/>
                <span style={{color:C.gray}}>{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recorrência por mês */}
      <div style={gs.card}>
        <div style={{color:C.white,fontWeight:700,marginBottom:4,fontSize:14}}>Recorrência por Mês</div>
        <div style={{color:C.gray,fontSize:12,marginBottom:16}}>Clientes que compraram vs não compraram</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={recMeses}>
            <XAxis dataKey="mes" tick={{fill:C.gray,fontSize:11}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fill:C.gray,fontSize:11}} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={tt} wrapperStyle={ttWrapper} itemStyle={ttItem} cursor={ttCursor}/>
            <Bar dataKey="emDia" name="Compraram" stackId="a" fill={C.green}/>
            <Bar dataKey="atrasado" name="Não compraram" stackId="a" fill={C.red+"88"} radius={[4,4,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════
// CLIENTES
// ══════════════════════════════════════════════════════
const Clientes=({clientes,setClientes,consultores,compras,setCompras,user,observacoes,setObservacoes})=>{
  const[filtroSetor,setFiltroSetor]=useState("Todos");
  const[filtroConsultor,setFiltroConsultor]=useState("Todos");
  const[filtroStatus,setFiltroStatus]=useState("Todos");
  const[busca,setBusca]=useState("");
  const[modalCompra,setModalCompra]=useState(null);
  const[modalTransf,setModalTransf]=useState(null);
  const[modalObs,setModalObs]=useState(null);
  const[modalNovoCliente,setModalNovoCliente]=useState(false);
  const[detalhe,setDetalhe]=useState(null);
  const[ncNome,setNcNome]=useState("");
  const[ncConsultor,setNcConsultor]=useState(consultores[0]?.id||"");
  const[ncCiclo,setNcCiclo]=useState(30);
  const[ncValor,setNcValor]=useState("");
  const[cData,setCData]=useState(today());
  const[cValor,setCValor]=useState("");
  const[tConsultor,setTConsultor]=useState("");
  const[tSetor,setTSetor]=useState("Farm");
  const[obsTexto,setObsTexto]=useState("");
  const[obsMes,setObsMes]=useState(new Date().toISOString().slice(0,7));
  const[obsConsultor,setObsConsultor]=useState("");

  const enriched=clientes.map(cl=>{
    const con=consultores.find(c=>c.id===cl.consultor_id);
    const status=calcStatus(cl.ultima_compra,cl.ciclo_dias);
    const hist=compras.filter(cp=>cp.cliente_id===cl.id);
    const ltv=hist.reduce((s,c)=>s+Number(c.valor),0);
    return{...cl,consultor:con,status,hist,ltv};
  });

  const filtered=enriched.filter(c=>{
    if(filtroSetor!=="Todos"&&c.setor!==filtroSetor)return false;
    if(filtroConsultor!=="Todos"&&String(c.consultor_id)!==filtroConsultor)return false;
    if(filtroStatus!=="Todos"&&c.status.label!==filtroStatus)return false;
    if(busca&&!c.nome.toLowerCase().includes(busca.toLowerCase()))return false;
    return true;
  });

  const addCliente=()=>{
    if(!ncNome)return;
    const setor=consultores.find(c=>c.id===Number(ncConsultor))?.setor||"1ª Compra";
    const novo={id:Date.now(),nome:ncNome,consultor_id:Number(ncConsultor),setor,ciclo_dias:ncCiclo,ultima_compra:ncValor?today():null};
    setClientes(p=>[...p,novo]);
    if(ncValor)setCompras(p=>[...p,{id:Date.now()+1,cliente_id:novo.id,data:today(),valor:Number(ncValor)}]);
    setModalNovoCliente(false);setNcNome("");setNcValor("");
  };

  const addCompra=()=>{
    if(!cValor||!modalCompra)return;
    setCompras(p=>[...p,{id:Date.now(),cliente_id:modalCompra.id,data:cData,valor:Number(cValor)}]);
    setClientes(p=>p.map(c=>c.id===modalCompra.id?{...c,ultima_compra:cData}:c));
    setModalCompra(null);setCValor("");
  };

  const transferir=()=>{
    if(!tConsultor||!modalTransf)return;
    setClientes(p=>p.map(c=>c.id===modalTransf.id?{...c,consultor_id:Number(tConsultor),setor:tSetor}:c));
    setModalTransf(null);
  };

  const addObs=(user)=>{
    if(!obsTexto||!modalObs)return;
    const consultorNome=consultores.find(c=>c.id===Number(obsConsultor))?.nome||"Não informado";
    setObservacoes(p=>({...p,[modalObs.id]:[{mes:obsMes,texto:obsTexto,data:today(),consultorNome,registradoPor:user?.nome||"Gerente"},...(p[modalObs.id]||[])]}));
    setModalObs(null);setObsTexto("");setObsConsultor("");
  };

  const detCliente=detalhe?enriched.find(c=>c.id===detalhe):null;
  const detObs=detalhe?(observacoes[detalhe]||[]):[];
  const detChart=detCliente?Array.from({length:6},(_,i)=>{
    const d=new Date();d.setMonth(d.getMonth()-(5-i));
    const m=d.toISOString().slice(0,7);
    const mes=d.toLocaleDateString("pt-BR",{month:"short"});
    const val=detCliente.hist.filter(c=>c.data?.startsWith(m)).reduce((s,c)=>s+Number(c.valor),0);
    return{mes,valor:val};
  }):[];

  if(detalhe&&detCliente){
    return(
      <div>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:28,flexWrap:"wrap"}}>
          <button onClick={()=>setDetalhe(null)} style={{...gs.btnOutline,padding:"7px 14px",fontSize:12}}>← Voltar</button>
          <div style={{flex:1}}>
            <div style={{color:C.white,fontSize:20,fontWeight:700}}>{detCliente.nome}</div>
            <div style={{color:C.gray,fontSize:12}}>{detCliente.setor} · {detCliente.consultor?.nome} · Ciclo: {detCliente.ciclo_dias} dias</div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button style={gs.btn(C.blue,C.white)} onClick={()=>{setModalTransf(detCliente);setTSetor(detCliente.setor);setTConsultor(String(detCliente.consultor_id));}}>Transferir</button>
            <button style={gs.btn()} onClick={()=>{setModalCompra(detCliente);setCData(today());}}>+ Registrar Compra</button>
          </div>
        </div>
        <div style={{display:"flex",gap:16,marginBottom:20,flexWrap:"wrap"}}>
          <StatCard label="Status" value={detCliente.status.label} cor={detCliente.status.cor} sub={`Última compra: ${fmtDate(detCliente.ultima_compra)}`}/>
          <StatCard label="LTV Total" value={fmtMoney(detCliente.ltv)} cor={C.lime} sub={`${detCliente.hist.length} compras`}/>
          <StatCard label="Ciclo" value={`${detCliente.ciclo_dias}d`} sub="Frequência esperada"/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
          <div style={gs.card}>
            <div style={{color:C.white,fontWeight:700,marginBottom:16,fontSize:14}}>Compras por Mês</div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={detChart}>
                <XAxis dataKey="mes" tick={{fill:C.gray,fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:C.gray,fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>"R$"+(v/1000).toFixed(0)+"k"}/>
                <Tooltip contentStyle={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,fontFamily:"inherit",color:C.white}} wrapperStyle={{outline:"none"}} itemStyle={{color:C.lgray}} cursor={{fill:C.white,fillOpacity:0.05}} formatter={v=>[fmtMoney(v),"Valor"]}/>
                <Bar dataKey="valor" radius={[4,4,0,0]} fill={C.lime}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={gs.card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div style={{color:C.white,fontWeight:700,fontSize:14}}>Observações</div>
              <button style={{...gs.btn(C.panel2,C.lgray),padding:"5px 12px",fontSize:11,border:`1px solid ${C.border}`}} onClick={()=>setModalObs(detCliente)}>+ Obs</button>
            </div>
            <div style={{maxHeight:260,overflowY:"auto",paddingRight:4}}>
            {detObs.length===0?<div style={{color:C.gray,fontSize:12}}>Nenhuma observação registrada.</div>:
              detObs.map((o,i)=>(
                <div key={i} style={{background:C.panel2,borderRadius:8,padding:"10px 12px",marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                    <span style={{color:C.yellow,fontSize:10,fontWeight:700}}>{o.mes}</span>
                    <span style={{color:C.gray,fontSize:10}}>{fmtDate(o.data)}</span>
                  </div>
                  <div style={{color:C.lgray,fontSize:12,marginBottom:8}}>{o.texto}</div>
                  <div style={{display:"flex",gap:12,borderTop:`1px solid ${C.border}`,paddingTop:6}}>
                    <div style={{fontSize:10}}>
                      <span style={{color:C.gray}}>Consultor: </span>
                      <span style={{color:C.blue,fontWeight:700}}>{o.consultorNome||"—"}</span>
                    </div>
                    <div style={{fontSize:10}}>
                      <span style={{color:C.gray}}>Registrado por: </span>
                      <span style={{color:C.lime,fontWeight:700}}>{o.registradoPor||"—"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={gs.card}>
          <div style={{color:C.white,fontWeight:700,marginBottom:16,fontSize:14}}>Histórico de Compras</div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{color:C.gray,fontSize:11,textTransform:"uppercase"}}>
              {["Data","Valor"].map(h=><th key={h} style={{textAlign:"left",padding:"6px 12px",borderBottom:`1px solid ${C.border}`}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {[...detCliente.hist].sort((a,b)=>b.data?.localeCompare(a.data)).map(cp=>(
                <tr key={cp.id} style={{borderBottom:`1px solid ${C.border}22`}}>
                  <td style={{padding:"10px 12px",color:C.lgray}}>{fmtDate(cp.data)}</td>
                  <td style={{padding:"10px 12px",color:C.lime,fontWeight:700}}>{fmtMoney(cp.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {modalCompra&&<Modal title="Registrar Compra" subtitle={modalCompra.nome} onClose={()=>setModalCompra(null)}>
          <Field label="Data da compra"><input style={gs.input} type="date" value={cData} onChange={e=>setCData(e.target.value)}/></Field>
          <Field label="Valor (R$)"><input style={gs.input} type="number" value={cValor} onChange={e=>setCValor(e.target.value)} placeholder="0,00"/></Field>
          <div style={{display:"flex",gap:10,marginTop:8}}>
            <button style={{...gs.btnOutline,flex:1}} onClick={()=>setModalCompra(null)}>Cancelar</button>
            <button style={{...gs.btn(),flex:1}} onClick={addCompra}>Confirmar</button>
          </div>
        </Modal>}
        {modalTransf&&<Modal title="Transferir Cliente" subtitle={modalTransf.nome} onClose={()=>setModalTransf(null)}>
          <Field label="Setor destino"><select style={gs.select} value={tSetor} onChange={e=>setTSetor(e.target.value)}><option>Farm</option><option>1ª Compra</option></select></Field>
          <Field label="Consultor destino"><select style={gs.select} value={tConsultor} onChange={e=>setTConsultor(e.target.value)}>{consultores.filter(c=>c.setor===tSetor).map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select></Field>
          <div style={{display:"flex",gap:10,marginTop:8}}>
            <button style={{...gs.btnOutline,flex:1}} onClick={()=>setModalTransf(null)}>Cancelar</button>
            <button style={{...gs.btn(C.blue,C.white),flex:1}} onClick={transferir}>Transferir</button>
          </div>
        </Modal>}
        {modalObs&&<Modal title="Adicionar Observação" subtitle={modalObs.nome} onClose={()=>setModalObs(null)}>
          <Field label="Mês de referência"><input style={gs.input} type="month" value={obsMes} onChange={e=>setObsMes(e.target.value)}/></Field>
          <Field label="Consultor que relatou o motivo">
            <select style={gs.select} value={obsConsultor} onChange={e=>setObsConsultor(e.target.value)}>
              <option value="">Selecione o consultor...</option>
              {consultores.map(c=><option key={c.id} value={c.id}>{c.nome} ({c.setor})</option>)}
            </select>
          </Field>
          <Field label="Motivo / Observação"><textarea style={{...gs.input,height:80,resize:"vertical"}} value={obsTexto} onChange={e=>setObsTexto(e.target.value)} placeholder="Ex: Estoque cheio, cliente retorna em 15 dias."/></Field>
          <div style={{background:C.panel2,borderRadius:8,padding:"10px 12px",marginBottom:12,fontSize:11,color:C.gray}}>
            Será registrado que você anotou esta observação.
          </div>
          <div style={{display:"flex",gap:10}}>
            <button style={{...gs.btnOutline,flex:1}} onClick={()=>setModalObs(null)}>Cancelar</button>
            <button style={{...gs.btn(),flex:1}} onClick={()=>addObs(user)}>Salvar</button>
          </div>
        </Modal>}
      </div>
    );
  }

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
        <div>
          <div style={{color:C.white,fontSize:22,fontWeight:700,marginBottom:4}}>Clientes</div>
          <div style={{color:C.gray,fontSize:13}}>{filtered.length} de {clientes.length} exibidos</div>
        </div>
        <button style={gs.btn()} onClick={()=>setModalNovoCliente(true)}>+ Novo Cliente</button>
      </div>
      <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap"}}>
        <input style={{...gs.input,width:200}} placeholder="Buscar cliente..." value={busca} onChange={e=>setBusca(e.target.value)}/>
        <select style={{...gs.select,width:130}} value={filtroSetor} onChange={e=>setFiltroSetor(e.target.value)}><option>Todos</option><option>Farm</option><option>1ª Compra</option></select>
        <select style={{...gs.select,width:160}} value={filtroConsultor} onChange={e=>setFiltroConsultor(e.target.value)}>
          <option value="Todos">Todos consultores</option>
          {consultores.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <select style={{...gs.select,width:140}} value={filtroStatus} onChange={e=>setFiltroStatus(e.target.value)}><option>Todos</option><option>Em dia</option><option>Atenção</option><option>Atrasado</option></select>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filtered.map(cl=>(
          <div key={cl.id} style={{...gs.card,display:"flex",alignItems:"center",gap:16,padding:"16px 20px"}}>
            <div style={{flex:1,cursor:"pointer"}} onClick={()=>setDetalhe(cl.id)}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
                <span style={{color:C.white,fontWeight:700,fontSize:14}}>{cl.nome}</span>
                <Badge label={cl.status.label} cor={cl.status.cor}/>
                <span style={{...gs.badge(cl.setor==="Farm"?C.blue:C.lime),fontSize:10}}>{cl.setor}</span>
              </div>
              <div style={{display:"flex",gap:20,fontSize:12,color:C.gray,flexWrap:"wrap"}}>
                <span>{cl.consultor?.nome}</span>
                <span>Ciclo: {cl.ciclo_dias}d</span>
                <span>Última compra: {fmtDate(cl.ultima_compra)}</span>
                <span style={{color:C.lime}}>LTV: {fmtMoney(cl.ltv)}</span>
              </div>
              <ProgressBar pct={cl.status.pct} cor={cl.status.cor}/>
            </div>
            <div style={{display:"flex",gap:8,flexShrink:0}}>
              <button style={{...gs.btnOutline,fontSize:11,padding:"6px 12px"}} onClick={()=>setModalObs(cl)}>Obs</button>
              <button style={{...gs.btn(C.panel2,C.lgray),fontSize:11,padding:"6px 12px",border:`1px solid ${C.border}`}} onClick={()=>{setModalTransf(cl);setTSetor(cl.setor);setTConsultor(String(cl.consultor_id));}}>Transferir</button>
              <button style={{...gs.btn(),padding:"6px 14px",fontSize:11}} onClick={()=>{setModalCompra(cl);setCData(today());}}>+ Compra</button>
            </div>
          </div>
        ))}
      </div>
      {modalNovoCliente&&<Modal title="Novo Cliente" subtitle="Preencha os dados do cliente" onClose={()=>setModalNovoCliente(false)}>
        <Field label="Nome do cliente"><input style={gs.input} value={ncNome} onChange={e=>setNcNome(e.target.value)} placeholder="Ex: Academia FitMax"/></Field>
        <Field label="Consultor responsável"><select style={gs.select} value={ncConsultor} onChange={e=>setNcConsultor(e.target.value)}>{consultores.map(c=><option key={c.id} value={c.id}>{c.nome} ({c.setor})</option>)}</select></Field>
        <Field label="Ciclo de compra"><select style={gs.select} value={ncCiclo} onChange={e=>setNcCiclo(Number(e.target.value))}>{[15,30,45,60].map(d=><option key={d} value={d}>{d} dias</option>)}</select></Field>
        <Field label="Valor da 1ª compra (opcional)"><input style={gs.input} type="number" value={ncValor} onChange={e=>setNcValor(e.target.value)} placeholder="R$ 0,00"/></Field>
        <div style={{display:"flex",gap:10,marginTop:8}}>
          <button style={{...gs.btnOutline,flex:1}} onClick={()=>setModalNovoCliente(false)}>Cancelar</button>
          <button style={{...gs.btn(),flex:1}} onClick={addCliente}>Cadastrar</button>
        </div>
      </Modal>}
      {modalCompra&&<Modal title="Registrar Compra" subtitle={modalCompra.nome} onClose={()=>setModalCompra(null)}>
        <Field label="Data da compra"><input style={gs.input} type="date" value={cData} onChange={e=>setCData(e.target.value)}/></Field>
        <Field label="Valor (R$)"><input style={gs.input} type="number" value={cValor} onChange={e=>setCValor(e.target.value)} placeholder="0,00"/></Field>
        <div style={{display:"flex",gap:10,marginTop:8}}>
          <button style={{...gs.btnOutline,flex:1}} onClick={()=>setModalCompra(null)}>Cancelar</button>
          <button style={{...gs.btn(),flex:1}} onClick={addCompra}>Confirmar</button>
        </div>
      </Modal>}
      {modalTransf&&<Modal title="Transferir Cliente" subtitle={modalTransf.nome} onClose={()=>setModalTransf(null)}>
        <Field label="Setor destino"><select style={gs.select} value={tSetor} onChange={e=>setTSetor(e.target.value)}><option>Farm</option><option>1ª Compra</option></select></Field>
        <Field label="Consultor destino"><select style={gs.select} value={tConsultor} onChange={e=>setTConsultor(e.target.value)}>{consultores.filter(c=>c.setor===tSetor).map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select></Field>
        <div style={{display:"flex",gap:10,marginTop:8}}>
          <button style={{...gs.btnOutline,flex:1}} onClick={()=>setModalTransf(null)}>Cancelar</button>
          <button style={{...gs.btn(C.blue,C.white),flex:1}} onClick={transferir}>Transferir</button>
        </div>
      </Modal>}
      {modalObs&&<Modal title="Adicionar Observação" subtitle={modalObs.nome} onClose={()=>setModalObs(null)}>
        <Field label="Mês de referência"><input style={gs.input} type="month" value={obsMes} onChange={e=>setObsMes(e.target.value)}/></Field>
        <Field label="Consultor que relatou o motivo">
          <select style={gs.select} value={obsConsultor} onChange={e=>setObsConsultor(e.target.value)}>
            <option value="">Selecione o consultor...</option>
            {consultores.map(c=><option key={c.id} value={c.id}>{c.nome} ({c.setor})</option>)}
          </select>
        </Field>
        <Field label="Motivo / Observação"><textarea style={{...gs.input,height:80,resize:"vertical"}} value={obsTexto} onChange={e=>setObsTexto(e.target.value)} placeholder="Ex: Estoque cheio, cliente retorna em 15 dias."/></Field>
        <div style={{background:C.panel2,borderRadius:8,padding:"10px 12px",marginBottom:12,fontSize:11,color:C.gray}}>
          Será registrado que você anotou esta observação.
        </div>
        <div style={{display:"flex",gap:10}}>
          <button style={{...gs.btnOutline,flex:1}} onClick={()=>setModalObs(null)}>Cancelar</button>
          <button style={{...gs.btn(),flex:1}} onClick={()=>addObs(user)}>Salvar</button>
        </div>
      </Modal>}
    </div>
  );
};

// ══════════════════════════════════════════════════════
// CONSULTORES
// ══════════════════════════════════════════════════════
const Consultores=({consultores,clientes,compras})=>{
  const[filtro,setFiltro]=useState("Todos");
  const enriched=consultores.map(con=>{
    const cart=clientes.filter(c=>c.consultor_id===con.id);
    const comStatus=cart.map(c=>({...c,status:calcStatus(c.ultima_compra,c.ciclo_dias)}));
    const emDia=comStatus.filter(c=>c.status.label==="Em dia").length;
    const atencao=comStatus.filter(c=>c.status.label==="Atenção").length;
    const atrasado=comStatus.filter(c=>c.status.label==="Atrasado").length;
    const ids=cart.map(c=>c.id);
    const receita=compras.filter(cp=>ids.includes(cp.cliente_id)).reduce((s,c)=>s+Number(c.valor),0);
    const pct=cart.length?Math.round(emDia/cart.length*100):0;
    return{...con,cart,emDia,atencao,atrasado,receita,pct};
  }).filter(c=>filtro==="Todos"||c.setor===filtro);

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
        <div>
          <div style={{color:C.white,fontSize:22,fontWeight:700,marginBottom:4}}>Consultores</div>
          <div style={{color:C.gray,fontSize:13}}>Desempenho por carteira</div>
        </div>
        <select style={{...gs.select,width:150}} value={filtro} onChange={e=>setFiltro(e.target.value)}>
          <option>Todos</option><option>Farm</option><option>1ª Compra</option>
        </select>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
        {enriched.map(con=>(
          <div key={con.id} style={gs.card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <div>
                <div style={{color:C.white,fontWeight:700,fontSize:15,marginBottom:4}}>{con.nome}</div>
                <span style={gs.badge(con.setor==="Farm"?C.blue:C.lime)}>{con.setor}</span>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{color:C.lime,fontWeight:700,fontSize:18}}>{con.pct}%</div>
                <div style={{color:C.gray,fontSize:10}}>recorrência</div>
              </div>
            </div>
            <div style={{background:C.panel2,borderRadius:8,padding:"10px 14px",marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:6}}>
                <span style={{color:C.gray}}>Carteira</span>
                <span style={{color:C.white,fontWeight:700}}>{con.cart.length} clientes</span>
              </div>
              <div style={{display:"flex",gap:4,height:6,borderRadius:99,overflow:"hidden"}}>
                {con.cart.length>0&&<>
                  <div style={{flex:con.emDia||0.01,background:C.green}}/>
                  <div style={{flex:con.atencao||0.01,background:C.yellow}}/>
                  <div style={{flex:con.atrasado||0.01,background:C.red}}/>
                </>}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
              {[["Em dia",con.emDia,C.green],["Atenção",con.atencao,C.yellow],["Atrasado",con.atrasado,C.red]].map(([l,v,cor])=>(
                <div key={l} style={{textAlign:"center",background:C.panel2,borderRadius:6,padding:"8px 4px"}}>
                  <div style={{color:cor,fontWeight:700,fontSize:16}}>{v}</div>
                  <div style={{color:C.gray,fontSize:10}}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{borderTop:`1px solid ${C.border}`,paddingTop:10,display:"flex",justifyContent:"space-between",fontSize:12}}>
              <span style={{color:C.gray}}>Receita gerada</span>
              <span style={{color:C.lime,fontWeight:700}}>{fmtMoney(con.receita)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════
// COMPRAS
// ══════════════════════════════════════════════════════
const Compras=({compras,clientes,consultores})=>{
  const now=new Date();
  const[filtroMes,setFiltroMes]=useState(String(now.getMonth()+1).padStart(2,"0"));
  const[filtroAno,setFiltroAno]=useState(String(now.getFullYear()));
  const[semFiltro,setSemFiltro]=useState(false);
  const filtroData=semFiltro?"":filtroAno+"-"+filtroMes;

  const meses=[
    {v:"01",l:"Janeiro"},{v:"02",l:"Fevereiro"},{v:"03",l:"Março"},
    {v:"04",l:"Abril"},{v:"05",l:"Maio"},{v:"06",l:"Junho"},
    {v:"07",l:"Julho"},{v:"08",l:"Agosto"},{v:"09",l:"Setembro"},
    {v:"10",l:"Outubro"},{v:"11",l:"Novembro"},{v:"12",l:"Dezembro"},
  ];
  const anos=Array.from({length:4},(_,i)=>String(now.getFullYear()-i));

  const enriched=[...compras].sort((a,b)=>b.data?.localeCompare(a.data)).map(cp=>{
    const cl=clientes.find(c=>c.id===cp.cliente_id);
    const con=cl?consultores.find(c=>c.id===cl.consultor_id):null;
    return{...cp,cliente:cl,consultor:con};
  }).filter(cp=>!filtroData||cp.data?.startsWith(filtroData));
  const total=enriched.reduce((s,c)=>s+Number(c.valor),0);

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28,flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{color:C.white,fontSize:22,fontWeight:700,marginBottom:4}}>Compras</div>
          <div style={{color:C.gray,fontSize:13}}>{enriched.length} registros · {fmtMoney(total)}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <select style={{...gs.select,width:130}} value={filtroMes} onChange={e=>{setFiltroMes(e.target.value);setSemFiltro(false);}} disabled={semFiltro}>
            {meses.map(m=><option key={m.v} value={m.v}>{m.l}</option>)}
          </select>
          <select style={{...gs.select,width:90}} value={filtroAno} onChange={e=>{setFiltroAno(e.target.value);setSemFiltro(false);}} disabled={semFiltro}>
            {anos.map(a=><option key={a} value={a}>{a}</option>)}
          </select>
          <button
            onClick={()=>setSemFiltro(p=>!p)}
            style={{...gs.btn(semFiltro?C.lime:C.panel2, semFiltro?C.dark:C.lgray),
              border:`1px solid ${semFiltro?C.lime:C.border}`,padding:"9px 14px",fontSize:12,whiteSpace:"nowrap"}}>
            {semFiltro?"Filtrando tudo":"Ver todos"}
          </button>
        </div>
      </div>
      <div style={gs.card}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead><tr style={{color:C.gray,fontSize:11,textTransform:"uppercase"}}>
            {["Data","Cliente","Consultor","Setor","Valor"].map(h=><th key={h} style={{textAlign:"left",padding:"8px 14px",borderBottom:`1px solid ${C.border}`}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {enriched.slice(0,100).map(cp=>(
              <tr key={cp.id} style={{borderBottom:`1px solid ${C.border}22`}}>
                <td style={{padding:"11px 14px",color:C.gray}}>{fmtDate(cp.data)}</td>
                <td style={{padding:"11px 14px",color:C.white,fontWeight:600}}>{cp.cliente?.nome||"—"}</td>
                <td style={{padding:"11px 14px",color:C.lgray}}>{cp.consultor?.nome||"—"}</td>
                <td style={{padding:"11px 14px"}}>{cp.cliente&&<span style={gs.badge(cp.cliente.setor==="Farm"?C.blue:C.lime)}>{cp.cliente.setor}</span>}</td>
                <td style={{padding:"11px 14px",color:C.lime,fontWeight:700}}>{fmtMoney(cp.valor)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════
// LTV
// ══════════════════════════════════════════════════════
const LTV=({clientes,compras,consultores})=>{
  const[ordenar,setOrdenar]=useState("ltv");
  const enriched=clientes.map(cl=>{
    const hist=compras.filter(cp=>cp.cliente_id===cl.id);
    const ltv=hist.reduce((s,c)=>s+Number(c.valor),0);
    const con=consultores.find(c=>c.id===cl.consultor_id);
    const ticketMedio=hist.length?ltv/hist.length:0;
    const status=calcStatus(cl.ultima_compra,cl.ciclo_dias);
    return{...cl,ltv,hist,ticketMedio,status,consultor:con};
  }).sort((a,b)=>ordenar==="ltv"?b.ltv-a.ltv:b.ticketMedio-a.ticketMedio);

  const totalLTV=enriched.reduce((s,c)=>s+c.ltv,0);
  const ltvMedio=enriched.length?totalLTV/enriched.length:0;
  const top5=enriched.slice(0,5);
  const ltvConsultor=consultores.map(con=>{
    const ids=clientes.filter(c=>c.consultor_id===con.id).map(c=>c.id);
    const ltv=compras.filter(cp=>ids.includes(cp.cliente_id)).reduce((s,c)=>s+Number(c.valor),0);
    return{nome:con.nome.split(" ")[0],ltv};
  }).sort((a,b)=>b.ltv-a.ltv);

  return(
    <div>
      <div style={{marginBottom:28}}>
        <div style={{color:C.white,fontSize:22,fontWeight:700,marginBottom:4}}>LTV — Lifetime Value</div>
        <div style={{color:C.gray,fontSize:13}}>Valor gerado por cada cliente ao longo do tempo</div>
      </div>
      <div style={{display:"flex",gap:16,marginBottom:24,flexWrap:"wrap"}}>
        <StatCard label="LTV Total" value={fmtMoney(totalLTV)} cor={C.lime}/>
        <StatCard label="LTV Médio" value={fmtMoney(ltvMedio)} cor={C.blue} sub="por cliente"/>
        <StatCard label="Maior LTV" value={fmtMoney(enriched[0]?.ltv||0)} cor={C.green} sub={enriched[0]?.nome}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24}}>
        <div style={gs.card}>
          <div style={{color:C.white,fontWeight:700,marginBottom:16,fontSize:14}}>Top 5 Clientes por LTV</div>
          {top5.map((cl,i)=>(
            <div key={cl.id} style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              <div style={{color:C.gray,fontSize:12,width:20}}>#{i+1}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{color:C.white,fontSize:13,fontWeight:600}}>{cl.nome}</span>
                  <span style={{color:C.lime,fontWeight:700,fontSize:13}}>{fmtMoney(cl.ltv)}</span>
                </div>
                <div style={{background:C.border,borderRadius:99,height:4}}>
                  <div style={{width:`${enriched[0]?.ltv?(cl.ltv/enriched[0].ltv)*100:0}%`,height:4,background:C.lime,borderRadius:99}}/>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={gs.card}>
          <div style={{color:C.white,fontWeight:700,marginBottom:16,fontSize:14}}>LTV por Consultor</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ltvConsultor} layout="vertical">
              <XAxis type="number" tick={{fill:C.gray,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>"R$"+(v/1000).toFixed(0)+"k"}/>
              <YAxis type="category" dataKey="nome" tick={{fill:C.gray,fontSize:10}} axisLine={false} tickLine={false} width={60}/>
              <Tooltip contentStyle={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,fontFamily:"inherit",color:C.white}} wrapperStyle={{outline:"none"}} itemStyle={{color:C.lgray}} cursor={{fill:C.white,fillOpacity:0.05}} formatter={v=>[fmtMoney(v),"LTV"]}/>
              <Bar dataKey="ltv" fill={C.blue} radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={gs.card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{color:C.white,fontWeight:700,fontSize:14}}>Ranking Completo</div>
          <select style={{...gs.select,width:200}} value={ordenar} onChange={e=>setOrdenar(e.target.value)}>
            <option value="ltv">Ordenar por LTV</option>
            <option value="ticket">Ordenar por Ticket Médio</option>
          </select>
        </div>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead><tr style={{color:C.gray,fontSize:11,textTransform:"uppercase"}}>
            {["#","Cliente","Consultor","Compras","Ticket Médio","LTV Total","Status"].map(h=><th key={h} style={{textAlign:"left",padding:"7px 12px",borderBottom:`1px solid ${C.border}`}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {enriched.map((cl,i)=>(
              <tr key={cl.id} style={{borderBottom:`1px solid ${C.border}22`}}>
                <td style={{padding:"10px 12px",color:C.gray}}>{i+1}</td>
                <td style={{padding:"10px 12px",color:C.white,fontWeight:600}}>{cl.nome}</td>
                <td style={{padding:"10px 12px",color:C.lgray}}>{cl.consultor?.nome}</td>
                <td style={{padding:"10px 12px",color:C.lgray}}>{cl.hist.length}</td>
                <td style={{padding:"10px 12px",color:C.blue}}>{fmtMoney(cl.ticketMedio)}</td>
                <td style={{padding:"10px 12px",color:C.lime,fontWeight:700}}>{fmtMoney(cl.ltv)}</td>
                <td style={{padding:"10px 12px"}}><Badge label={cl.status.label} cor={cl.status.cor}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


// ══════════════════════════════════════════════════════
// ALERTAS
// ══════════════════════════════════════════════════════
const Alertas=({clientes,compras,consultores,observacoes})=>{
  const now=new Date();
  const[filtroMes,setFiltroMes]=useState(String(now.getMonth()+1).padStart(2,"0"));
  const[filtroAno,setFiltroAno]=useState(String(now.getFullYear()));
  const[filtroSetor,setFiltroSetor]=useState("Todos");
  const[filtroConsultor,setFiltroConsultor]=useState("Todos");
  const[expandido,setExpandido]=useState(null);

  const meses=[
    {v:"01",l:"Janeiro"},{v:"02",l:"Fevereiro"},{v:"03",l:"Março"},
    {v:"04",l:"Abril"},{v:"05",l:"Maio"},{v:"06",l:"Junho"},
    {v:"07",l:"Julho"},{v:"08",l:"Agosto"},{v:"09",l:"Setembro"},
    {v:"10",l:"Outubro"},{v:"11",l:"Novembro"},{v:"12",l:"Dezembro"},
  ];
  const anos=Array.from({length:4},(_,i)=>String(now.getFullYear()-i));
  const mesRef=filtroAno+"-"+filtroMes;

  // Clientes que NÃO compraram no mês selecionado
  const clientesSemCompra=clientes.map(cl=>{
    const con=consultores.find(c=>c.id===cl.consultor_id);
    const comprasNoMes=compras.filter(cp=>cp.cliente_id===cl.id&&cp.data?.startsWith(mesRef));
    const ultimaCompra=compras.filter(cp=>cp.cliente_id===cl.id).sort((a,b)=>b.data?.localeCompare(a.data))[0];
    const diasAtraso=cl.ultima_compra?Math.max(0,Math.floor((now-new Date(cl.ultima_compra))/86400000)-cl.ciclo_dias):null;
    const obs=(observacoes[cl.id]||[]).filter(o=>o.mes===mesRef.slice(0,7)||o.mes===mesRef);
    const obsAnterior=(observacoes[cl.id]||[]).filter(o=>o.mes!==mesRef).slice(0,2);
    return{...cl,consultor:con,comprasNoMes,ultimaCompra,diasAtraso,obs,obsAnterior};
  }).filter(cl=>{
    if(cl.comprasNoMes.length>0)return false; // comprou no mês, não alerta
    if(filtroSetor!=="Todos"&&cl.setor!==filtroSetor)return false;
    if(filtroConsultor!=="Todos"&&String(cl.consultor_id)!==filtroConsultor)return false;
    return true;
  }).sort((a,b)=>(b.diasAtraso||0)-(a.diasAtraso||0));

  const totalImpacto=clientesSemCompra.reduce((s,cl)=>s+Number(cl.ultimaCompra?.valor||0),0);
  const mesNome=meses.find(m=>m.v===filtroMes)?.l||"";

  return(
    <div>
      <div style={{marginBottom:28}}>
        <div style={{color:C.white,fontSize:22,fontWeight:700,marginBottom:4}}>⚠ Alertas</div>
        <div style={{color:C.gray,fontSize:13}}>Clientes que não compraram em {mesNome} de {filtroAno}</div>
      </div>

      {/* Filtros */}
      <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
        <select style={{...gs.select,width:130}} value={filtroMes} onChange={e=>setFiltroMes(e.target.value)}>
          {meses.map(m=><option key={m.v} value={m.v}>{m.l}</option>)}
        </select>
        <select style={{...gs.select,width:90}} value={filtroAno} onChange={e=>setFiltroAno(e.target.value)}>
          {anos.map(a=><option key={a} value={a}>{a}</option>)}
        </select>
        <select style={{...gs.select,width:130}} value={filtroSetor} onChange={e=>setFiltroSetor(e.target.value)}>
          <option>Todos</option><option>Farm</option><option>1ª Compra</option>
        </select>
        <select style={{...gs.select,width:160}} value={filtroConsultor} onChange={e=>setFiltroConsultor(e.target.value)}>
          <option value="Todos">Todos consultores</option>
          {consultores.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      {/* Resumo */}
      <div style={{display:"flex",gap:16,marginBottom:24,flexWrap:"wrap"}}>
        <StatCard label="Sem compra no mês" value={clientesSemCompra.length} cor={C.red} sub={`de ${clientes.length} clientes totais`}/>
        <StatCard label="Receita em risco" value={fmtMoney(clientesSemCompra.reduce((s,cl)=>{
          const ult=compras.filter(cp=>cp.cliente_id===cl.id).sort((a,b)=>b.data?.localeCompare(a.data))[0];
          return s+Number(ult?.valor||0);
        },0))} cor={C.yellow} sub="Baseado na última compra de cada cliente"/>
        <StatCard label="Mais crítico" value={clientesSemCompra[0]?`${clientesSemCompra[0].diasAtraso||0}d`:"—"} cor={C.red} sub={clientesSemCompra[0]?.nome||"Nenhum alerta"}/>
      </div>

      {/* Lista */}
      {clientesSemCompra.length===0?(
        <div style={{...gs.card,textAlign:"center",padding:48}}>
          <div style={{fontSize:32,marginBottom:12}}>✓</div>
          <div style={{color:C.green,fontWeight:700,fontSize:16,marginBottom:6}}>Tudo em dia!</div>
          <div style={{color:C.gray,fontSize:13}}>Todos os clientes compraram em {mesNome} de {filtroAno}.</div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {clientesSemCompra.map(cl=>{
            const ult=compras.filter(cp=>cp.cliente_id===cl.id).sort((a,b)=>b.data?.localeCompare(a.data))[0];
            const aberto=expandido===cl.id;
            const todasObs=(observacoes[cl.id]||[]);
            return(
              <div key={cl.id} style={{...gs.card,padding:0,overflow:"hidden",border:`1px solid ${cl.diasAtraso>cl.ciclo_dias?C.red+"55":C.yellow+"55"}`}}>
                {/* Linha principal */}
                <div style={{display:"flex",alignItems:"center",gap:16,padding:"16px 20px",cursor:"pointer"}}
                  onClick={()=>setExpandido(aberto?null:cl.id)}>

                  {/* Indicador lateral */}
                  <div style={{width:4,alignSelf:"stretch",borderRadius:99,background:cl.diasAtraso>0?C.red:C.yellow,flexShrink:0}}/>

                  {/* Info principal */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,flexWrap:"wrap"}}>
                      <span style={{color:C.white,fontWeight:700,fontSize:14}}>{cl.nome}</span>
                      <span style={gs.badge(cl.setor==="Farm"?C.blue:C.lime)}>{cl.setor}</span>
                      {todasObs.length>0&&<span style={gs.badge(C.yellow)}>📝 {todasObs.length} obs</span>}
                    </div>
                    <div style={{display:"flex",gap:20,fontSize:12,color:C.gray,flexWrap:"wrap"}}>
                      <span>👤 {cl.consultor?.nome||"—"}</span>
                      <span>Ciclo: {cl.ciclo_dias}d</span>
                      <span>Última compra: {fmtDate(cl.ultima_compra)}</span>
                    </div>
                  </div>

                  {/* Métricas */}
                  <div style={{display:"flex",gap:20,alignItems:"center",flexShrink:0}}>
                    <div style={{textAlign:"center"}}>
                      <div style={{color:C.red,fontWeight:700,fontSize:18}}>{cl.diasAtraso??"-"}d</div>
                      <div style={{color:C.gray,fontSize:10}}>em atraso</div>
                    </div>
                    <div style={{textAlign:"center"}}>
                      <div style={{color:C.yellow,fontWeight:700,fontSize:15}}>{fmtMoney(ult?.valor||0)}</div>
                      <div style={{color:C.gray,fontSize:10}}>última compra</div>
                    </div>
                    <div style={{color:C.gray,fontSize:18,transition:"transform .2s",transform:aberto?"rotate(180deg)":"rotate(0deg)"}}>▾</div>
                  </div>
                </div>

                {/* Painel expandido — observações */}
                {aberto&&(
                  <div style={{borderTop:`1px solid ${C.border}`,background:C.panel2,padding:"16px 24px"}}>
                    <div style={{color:C.white,fontWeight:700,fontSize:13,marginBottom:12}}>
                      Histórico de Observações
                    </div>
                    {todasObs.length===0?(
                      <div style={{color:C.gray,fontSize:12,fontStyle:"italic"}}>
                        Nenhuma observação registrada para este cliente.
                      </div>
                    ):(
                      <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:220,overflowY:"auto",paddingRight:4}}>
                        {todasObs.map((o,i)=>(
                          <div key={i} style={{background:C.panel,borderRadius:8,padding:"10px 14px",border:`1px solid ${C.border}`}}>
                            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                              <span style={{color:C.yellow,fontSize:10,fontWeight:700}}>{o.mes}</span>
                              <span style={{color:C.gray,fontSize:10}}>{fmtDate(o.data)}</span>
                            </div>
                            <div style={{color:C.lgray,fontSize:12,marginBottom:8}}>{o.texto}</div>
                            <div style={{display:"flex",gap:16,borderTop:`1px solid ${C.border}`,paddingTop:6}}>
                              <div style={{fontSize:10}}>
                                <span style={{color:C.gray}}>Consultor: </span>
                                <span style={{color:C.blue,fontWeight:700}}>{o.consultorNome||"—"}</span>
                              </div>
                              <div style={{fontSize:10}}>
                                <span style={{color:C.gray}}>Registrado por: </span>
                                <span style={{color:C.lime,fontWeight:700}}>{o.registradoPor||"—"}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


// ══════════════════════════════════════════════════════
// TICKETS
// ══════════════════════════════════════════════════════
// Configuração de tipos de erro — cada tipo sabe exatamente o que corrigir
const TIPOS_ERRO={
  "Valor da compra incorreto":{
    campoEntidade:"compra", campo:"valor", label:"Valor",
    camposForm:["compra","valorErrado","valorCorreto"],
    descricaoCampo:"Valor da compra",
  },
  "Data da compra incorreta":{
    campoEntidade:"compra", campo:"data", label:"Data",
    camposForm:["compra","dataErrada","dataCorreta"],
    descricaoCampo:"Data da compra",
  },
  "Ciclo de compra incorreto":{
    campoEntidade:"cliente", campo:"ciclo_dias", label:"Ciclo",
    camposForm:["cicloErrado","cicloCorreto"],
    descricaoCampo:"Ciclo de compra (dias)",
  },
  "Consultor errado":{
    campoEntidade:"cliente", campo:"consultor_id", label:"Consultor",
    camposForm:["consultorCorreto"],
    descricaoCampo:"Consultor responsável",
  },
  "Nome do cliente incorreto":{
    campoEntidade:"cliente", campo:"nome", label:"Nome",
    camposForm:["nomeErrado","nomeCorreto"],
    descricaoCampo:"Nome do cliente",
  },
  "Transferência incorreta":{
    campoEntidade:"cliente", campo:"consultor_id", label:"Consultor",
    camposForm:["consultorCorreto"],
    descricaoCampo:"Consultor após transferência",
  },
  "Outro":{
    campoEntidade:null, campo:null, label:"Outro",
    camposForm:[],
    descricaoCampo:null,
  },
};

const STATUS_TICKET={
  aberto:{label:"Aberto",cor:"#FF4455"},
  analise:{label:"Em análise",cor:"#FFB800"},
  corrigido:{label:"Corrigido",cor:"#00C98C"},
  recusado:{label:"Recusado",cor:"#6B7280"},
};

const Tickets=({tickets,setTickets,clientes,compras,setCompras,setClientes,user,consultores})=>{
  const isDono=user?.perfil==="Dono";
  const[modalNovo,setModalNovo]=useState(false);
  const[modalDetalhe,setModalDetalhe]=useState(null);
  const[filtroStatus,setFiltroStatus]=useState("Todos");

  // Form novo ticket
  const tiposLista=Object.keys(TIPOS_ERRO);
  const[tTipo,setTTipo]=useState(tiposLista[0]);
  const[tCliente,setTCliente]=useState("");
  const[tCompra,setTCompra]=useState("");
  const[tDescricao,setTDescricao]=useState("");
  const[tLinkComprovante,setTLinkComprovante]=useState("");
  // Campos dinâmicos por tipo
  const[tValorErrado,setTValorErrado]=useState("");
  const[tValorCorreto,setTValorCorreto]=useState("");
  const[tDataErrada,setTDataErrada]=useState("");
  const[tDataCorreta,setTDataCorreta]=useState("");
  const[tCicloErrado,setTCicloErrado]=useState("");
  const[tCicloCorreto,setTCicloCorreto]=useState("");
  const[tConsultorCorreto,setTConsultorCorreto]=useState("");
  const[tNomeErrado,setTNomeErrado]=useState("");
  const[tNomeCorreto,setTNomeCorreto]=useState("");

  // Form correção (Dono)
  const[tDecisao,setTDecisao]=useState("");
  const[tJustificativa,setTJustificativa]=useState("");

  const tipoConfig=TIPOS_ERRO[tTipo]||{};
  const clienteSelecionado=clientes.find(c=>c.id===Number(tCliente));
  const comprasCliente=compras.filter(cp=>cp.cliente_id===Number(tCliente)).sort((a,b)=>b.data?.localeCompare(a.data));

  const resetForm=()=>{
    setTDescricao("");setTLinkComprovante("");setTCliente("");setTCompra("");
    setTValorErrado("");setTValorCorreto("");setTDataErrada("");setTDataCorreta("");
    setTCicloErrado("");setTCicloCorreto("");setTConsultorCorreto("");
    setTNomeErrado("");setTNomeCorreto("");
  };

  // Monta snapshot dos dados atuais para rastrear o antes/depois
  const buildSnapshot=(clienteId,compraId)=>{
    const cl=clientes.find(c=>c.id===clienteId);
    const cp=compraId?compras.find(c=>c.id===compraId):null;
    const con=cl?consultores.find(c=>c.id===cl.consultor_id):null;
    return{
      clienteNome:cl?.nome,
      clienteCiclo:cl?.ciclo_dias,
      clienteConsultorId:cl?.consultor_id,
      clienteConsultorNome:con?.nome,
      compraValor:cp?.valor,
      compraData:cp?.data,
    };
  };

  const abrirTicket=()=>{
    if(!tDescricao||!tCliente)return;
    const snapshot=buildSnapshot(Number(tCliente),tCompra?Number(tCompra):null);
    const novo={
      id:Date.now(),
      tipo:tTipo,
      clienteId:Number(tCliente),
      compraId:tCompra?Number(tCompra):null,
      descricao:tDescricao,
      linkComprovante:tLinkComprovante,
      // Campos de correção por tipo
      valorErrado:tValorErrado,valorCorreto:tValorCorreto,
      dataErrada:tDataErrada,dataCorreta:tDataCorreta,
      cicloErrado:tCicloErrado,cicloCorreto:tCicloCorreto,
      consultorCorretoId:tConsultorCorreto?Number(tConsultorCorreto):null,
      nomeErrado:tNomeErrado,nomeCorreto:tNomeCorreto,
      // Snapshot dos dados no momento da abertura
      snapshotAntes:snapshot,
      status:"aberto",
      abertoPor:user?.nome,
      abertoPorPerfil:user?.perfil,
      abertoEm:new Date().toISOString(),
      historico:[{
        acao:"Ticket aberto",
        por:user?.nome,
        perfil:user?.perfil,
        em:new Date().toISOString(),
        detalhe:`Tipo: ${tTipo} | Cliente: ${snapshot.clienteNome}`,
      }],
      correcao:null,
    };
    setTickets(p=>[novo,...p]);
    setModalNovo(false);
    resetForm();
  };

  const moverParaAnalise=(ticket)=>{
    setTickets(p=>p.map(t=>t.id===ticket.id?{
      ...t,status:"analise",
      historico:[...t.historico,{
        acao:"Ticket em análise",por:user?.nome,perfil:user?.perfil,
        em:new Date().toISOString(),detalhe:"Diretor iniciou análise do ticket",
      }]
    }:t));
  };

  const aplicarCorrecao=(ticket)=>{
    if(!tJustificativa)return;
    const aprovado=tDecisao==="aprovar";
    const cfg=TIPOS_ERRO[ticket.tipo]||{};
    const agora=new Date().toISOString();
    let resumoCorrecao="";
    let snapshotDepois={};

    if(aprovado){
      // ── Correções em COMPRAS ─────────────────────────
      if(cfg.campoEntidade==="compra"&&ticket.compraId){
        if(cfg.campo==="valor"&&ticket.valorCorreto){
          const valorAntes=compras.find(cp=>cp.id===ticket.compraId)?.valor;
          setCompras(p=>p.map(cp=>cp.id===ticket.compraId?{
            ...cp,valor:Number(ticket.valorCorreto),
            _original:{...cp},corrigidoEm:agora,corrigidoPor:user?.nome,ticketId:ticket.id,
          }:cp));
          resumoCorrecao=`Valor: R$ ${valorAntes} → R$ ${ticket.valorCorreto}`;
          snapshotDepois={compraValor:Number(ticket.valorCorreto)};
        }
        if(cfg.campo==="data"&&ticket.dataCorreta){
          const dataAntes=compras.find(cp=>cp.id===ticket.compraId)?.data;
          setCompras(p=>p.map(cp=>cp.id===ticket.compraId?{
            ...cp,data:ticket.dataCorreta,
            _original:{...cp},corrigidoEm:agora,corrigidoPor:user?.nome,ticketId:ticket.id,
          }:cp));
          // Atualiza ultima_compra do cliente se necessário
          setClientes(p=>p.map(c=>{
            if(c.id!==ticket.clienteId)return c;
            const comprasCliente=compras.filter(cp=>cp.cliente_id===c.id&&cp.id!==ticket.compraId);
            const datas=[ticket.dataCorreta,...comprasCliente.map(cp=>cp.data)].filter(Boolean).sort((a,b)=>b.localeCompare(a));
            return{...c,ultima_compra:datas[0]||c.ultima_compra};
          }));
          resumoCorrecao=`Data: ${fmtDate(dataAntes)} → ${fmtDate(ticket.dataCorreta)}`;
          snapshotDepois={compraData:ticket.dataCorreta};
        }
      }

      // ── Correções em CLIENTES ────────────────────────
      if(cfg.campoEntidade==="cliente"){
        if(cfg.campo==="ciclo_dias"&&ticket.cicloCorreto){
          const cicloAntes=clientes.find(c=>c.id===ticket.clienteId)?.ciclo_dias;
          setClientes(p=>p.map(c=>c.id===ticket.clienteId?{
            ...c,ciclo_dias:Number(ticket.cicloCorreto),
            _cicloOriginal:c._cicloOriginal||c.ciclo_dias,corrigidoEm:agora,corrigidoPor:user?.nome,ticketId:ticket.id,
          }:c));
          resumoCorrecao=`Ciclo: ${cicloAntes}d → ${ticket.cicloCorreto}d`;
          snapshotDepois={clienteCiclo:Number(ticket.cicloCorreto)};
        }
        if(cfg.campo==="consultor_id"&&ticket.consultorCorretoId){
          const conAntes=clientes.find(c=>c.id===ticket.clienteId)?.consultor_id;
          const conAntesNome=consultores.find(c=>c.id===conAntes)?.nome;
          const conDepoisNome=consultores.find(c=>c.id===ticket.consultorCorretoId)?.nome;
          const setorNovo=consultores.find(c=>c.id===ticket.consultorCorretoId)?.setor;
          setClientes(p=>p.map(c=>c.id===ticket.clienteId?{
            ...c,consultor_id:ticket.consultorCorretoId,setor:setorNovo||c.setor,
            _consultorOriginal:c._consultorOriginal||c.consultor_id,corrigidoEm:agora,corrigidoPor:user?.nome,ticketId:ticket.id,
          }:c));
          resumoCorrecao=`Consultor: ${conAntesNome} → ${conDepoisNome}`;
          snapshotDepois={clienteConsultorId:ticket.consultorCorretoId,clienteConsultorNome:conDepoisNome};
        }
        if(cfg.campo==="nome"&&ticket.nomeCorreto){
          const nomeAntes=clientes.find(c=>c.id===ticket.clienteId)?.nome;
          setClientes(p=>p.map(c=>c.id===ticket.clienteId?{
            ...c,nome:ticket.nomeCorreto,
            _nomeOriginal:c._nomeOriginal||c.nome,corrigidoEm:agora,corrigidoPor:user?.nome,ticketId:ticket.id,
          }:c));
          resumoCorrecao=`Nome: "${nomeAntes}" → "${ticket.nomeCorreto}"`;
          snapshotDepois={clienteNome:ticket.nomeCorreto};
        }
      }
    }

    setTickets(p=>p.map(t=>t.id===ticket.id?{
      ...t,
      status:aprovado?"corrigido":"recusado",
      snapshotDepois:aprovado?{...ticket.snapshotAntes,...snapshotDepois}:null,
      correcao:{
        decisao:tDecisao,
        justificativa:tJustificativa,
        resumo:resumoCorrecao,
        por:user?.nome,
        em:agora,
      },
      historico:[...t.historico,{
        acao:aprovado?"Correção aprovada e aplicada":"Ticket recusado",
        por:user?.nome,perfil:user?.perfil,
        em:new Date().toISOString(),
        detalhe:tJustificativa,
      }]
    }:t));
    setModalDetalhe(null);
    setTJustificativa("");setTDecisao("");
  };

  const filtered=tickets.filter(t=>filtroStatus==="Todos"||t.status===filtroStatus);
  const abertos=tickets.filter(t=>t.status==="aberto").length;
  const emAnalise=tickets.filter(t=>t.status==="analise").length;
  const corrigidos=tickets.filter(t=>t.status==="corrigido").length;

  const fmtDt=iso=>iso?new Date(iso).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"—";

  const detalhe=modalDetalhe?tickets.find(t=>t.id===modalDetalhe):null;
  const detalheCliente=detalhe?clientes.find(c=>c.id===detalhe.clienteId):null;
  const detalheCompra=detalhe?.compraId?compras.find(cp=>cp.id===detalhe.compraId):null;
  const detalheConsultor=detalheCliente?consultores.find(c=>c.id===detalheCliente.consultor_id):null;

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:28}}>
        <div>
          <div style={{color:C.white,fontSize:22,fontWeight:700,marginBottom:4}}>Tickets de Correção</div>
          <div style={{color:C.gray,fontSize:13}}>Registro rastreado de erros e correções</div>
        </div>
        {!isDono&&(
          <button style={gs.btn()} onClick={()=>setModalNovo(true)}>+ Abrir Ticket</button>
        )}
      </div>

      {/* Resumo */}
      <div style={{display:"flex",gap:16,marginBottom:24,flexWrap:"wrap"}}>
        <StatCard label="Abertos" value={abertos} cor={C.red} sub="Aguardando análise do Diretor"/>
        <StatCard label="Em análise" value={emAnalise} cor={C.yellow} sub="Diretor revisando"/>
        <StatCard label="Corrigidos" value={corrigidos} cor={C.green} sub="Encerrados com correção"/>
        <StatCard label="Total" value={tickets.length} cor={C.lgray} sub="Histórico completo"/>
      </div>

      {/* Filtro */}
      <div style={{display:"flex",gap:10,marginBottom:20}}>
        {["Todos","aberto","analise","corrigido","recusado"].map(s=>(
          <button key={s} onClick={()=>setFiltroStatus(s)} style={{
            ...gs.btn(filtroStatus===s?C.lime:C.panel2, filtroStatus===s?C.dark:C.lgray),
            border:`1px solid ${filtroStatus===s?C.lime:C.border}`,
            padding:"7px 14px",fontSize:12,
          }}>
            {s==="Todos"?"Todos":STATUS_TICKET[s]?.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length===0?(
        <div style={{...gs.card,textAlign:"center",padding:48}}>
          <div style={{fontSize:32,marginBottom:12}}>✓</div>
          <div style={{color:C.green,fontWeight:700,fontSize:16,marginBottom:6}}>Nenhum ticket encontrado</div>
          <div style={{color:C.gray,fontSize:13}}>Sem registros para o filtro selecionado.</div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map(t=>{
            const cl=clientes.find(c=>c.id===t.clienteId);
            const st=STATUS_TICKET[t.status];
            return(
              <div key={t.id} style={{...gs.card,padding:"16px 20px",cursor:"pointer",borderColor:st.cor+"44"}}
                onClick={()=>setModalDetalhe(t.id)}>
                <div style={{display:"flex",alignItems:"flex-start",gap:16,flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,flexWrap:"wrap"}}>
                      <span style={gs.badge(st.cor)}>{st.label}</span>
                      <span style={{color:C.white,fontWeight:700,fontSize:14}}>{t.tipo}</span>
                    </div>
                    <div style={{color:C.lgray,fontSize:12,marginBottom:8}}>{t.descricao}</div>
                    <div style={{display:"flex",gap:20,fontSize:11,color:C.gray,flexWrap:"wrap"}}>
                      <span>👤 Cliente: <span style={{color:C.lgray}}>{cl?.nome||"—"}</span></span>
                      {t.valorErrado&&<span>Valor errado: <span style={{color:C.red}}>R$ {t.valorErrado}</span></span>}
                      {t.valorCorreto&&<span>Valor correto: <span style={{color:C.green}}>R$ {t.valorCorreto}</span></span>}
                    </div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{color:C.gray,fontSize:11,marginBottom:4}}>Aberto por</div>
                    <div style={{color:C.white,fontSize:12,fontWeight:700}}>{t.abertoPor}</div>
                    <div style={{color:C.gray,fontSize:10,marginTop:4}}>{fmtDt(t.abertoEm)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal novo ticket */}
      {modalNovo&&(
        <Modal title="Abrir Ticket de Correção" subtitle="Descreva o erro e anexe o comprovante" onClose={()=>{setModalNovo(false);resetForm();}}>
          <Field label="Tipo de erro">
            <select style={gs.select} value={tTipo} onChange={e=>{setTTipo(e.target.value);resetForm();}}>
              {tiposLista.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Cliente relacionado">
            <select style={gs.select} value={tCliente} onChange={e=>{setTCliente(e.target.value);setTCompra("");}}>
              <option value="">Selecione o cliente...</option>
              {clientes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </Field>
          {tCliente&&(
            <div style={{background:C.panel2,borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:11}}>
              <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                {clienteSelecionado&&<span style={{color:C.gray}}>Consultor atual: <span style={{color:C.blue}}>{consultores.find(c=>c.id===clienteSelecionado.consultor_id)?.nome}</span></span>}
                {clienteSelecionado&&<span style={{color:C.gray}}>Ciclo atual: <span style={{color:C.lime}}>{clienteSelecionado.ciclo_dias}d</span></span>}
              </div>
            </div>
          )}

          {/* Campos dinâmicos por tipo de erro */}
          {(tTipo==="Valor da compra incorreto"||tTipo==="Data da compra incorreta")&&tCliente&&comprasCliente.length>0&&(
            <Field label="Compra relacionada">
              <select style={gs.select} value={tCompra} onChange={e=>setTCompra(e.target.value)}>
                <option value="">Selecione a compra...</option>
                {comprasCliente.map(cp=><option key={cp.id} value={cp.id}>{fmtDate(cp.data)} — {fmtMoney(cp.valor)}{cp._original?" (corrigida)":""}</option>)}
              </select>
            </Field>
          )}
          {tTipo==="Valor da compra incorreto"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Field label="Valor incorreto (R$)"><input style={gs.input} type="number" value={tValorErrado} onChange={e=>setTValorErrado(e.target.value)} placeholder={compras.find(cp=>cp.id===Number(tCompra))?.valor||"Ex: 5000"}/></Field>
              <Field label="Valor correto (R$)"><input style={gs.input} type="number" value={tValorCorreto} onChange={e=>setTValorCorreto(e.target.value)} placeholder="Ex: 5500"/></Field>
            </div>
          )}
          {tTipo==="Data da compra incorreta"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Field label="Data incorreta"><input style={gs.input} type="date" value={tDataErrada} onChange={e=>setTDataErrada(e.target.value)}/></Field>
              <Field label="Data correta"><input style={gs.input} type="date" value={tDataCorreta} onChange={e=>setTDataCorreta(e.target.value)}/></Field>
            </div>
          )}
          {tTipo==="Ciclo de compra incorreto"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Field label="Ciclo incorreto (dias)">
                <select style={gs.select} value={tCicloErrado} onChange={e=>setTCicloErrado(e.target.value)}>
                  <option value="">Selecione...</option>
                  {[15,30,45,60].map(d=><option key={d} value={d}>{d} dias</option>)}
                </select>
              </Field>
              <Field label="Ciclo correto (dias)">
                <select style={gs.select} value={tCicloCorreto} onChange={e=>setTCicloCorreto(e.target.value)}>
                  <option value="">Selecione...</option>
                  {[15,30,45,60].map(d=><option key={d} value={d}>{d} dias</option>)}
                </select>
              </Field>
            </div>
          )}
          {(tTipo==="Consultor errado"||tTipo==="Transferência incorreta")&&(
            <Field label="Consultor correto">
              <select style={gs.select} value={tConsultorCorreto} onChange={e=>setTConsultorCorreto(e.target.value)}>
                <option value="">Selecione o consultor correto...</option>
                {consultores.map(c=><option key={c.id} value={c.id}>{c.nome} ({c.setor})</option>)}
              </select>
            </Field>
          )}
          {tTipo==="Nome do cliente incorreto"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <Field label="Nome incorreto"><input style={gs.input} value={tNomeErrado} onChange={e=>setTNomeErrado(e.target.value)} placeholder="Nome errado"/></Field>
              <Field label="Nome correto"><input style={gs.input} value={tNomeCorreto} onChange={e=>setTNomeCorreto(e.target.value)} placeholder="Nome correto"/></Field>
            </div>
          )}

          <Field label="Descrição do erro">
            <textarea style={{...gs.input,height:72,resize:"vertical"}} value={tDescricao} onChange={e=>setTDescricao(e.target.value)} placeholder="Descreva o que está errado e o que deveria ser o correto..."/>
          </Field>
          <Field label="Link do comprovante">
            <input style={gs.input} value={tLinkComprovante} onChange={e=>setTLinkComprovante(e.target.value)} placeholder="https://drive.google.com/... ou link do comprovante"/>
          </Field>
          <div style={{background:C.panel2,borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:11,color:C.gray}}>
            ℹ O Diretor será notificado e fará a correção. Snapshot dos dados atuais será salvo automaticamente.
          </div>
          <div style={{display:"flex",gap:10}}>
            <button style={{...gs.btnOutline,flex:1}} onClick={()=>{setModalNovo(false);resetForm();}}>Cancelar</button>
            <button style={{...gs.btn(),flex:1}} onClick={abrirTicket}>Enviar Ticket</button>
          </div>
        </Modal>
      )}

      {/* Modal detalhe / correção */}
      {detalhe&&(
        <div style={{position:"fixed",inset:0,background:"#000000AA",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:16,width:"100%",maxWidth:580,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 32px 80px #000A"}}>
            <div style={{padding:"24px 28px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                  <span style={gs.badge(STATUS_TICKET[detalhe.status].cor)}>{STATUS_TICKET[detalhe.status].label}</span>
                  <span style={{color:C.white,fontWeight:700,fontSize:16}}>Ticket #{detalhe.id}</span>
                </div>
                <div style={{color:C.gray,fontSize:12}}>{detalhe.tipo}</div>
              </div>
              <button onClick={()=>setModalDetalhe(null)} style={{background:"none",border:"none",color:C.gray,cursor:"pointer",fontSize:20}}>×</button>
            </div>

            <div style={{padding:"20px 28px"}}>
              {/* Info do erro */}
              <div style={{background:C.panel2,borderRadius:10,padding:"14px 16px",marginBottom:16}}>
                <div style={{color:C.lgray,fontSize:11,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:0.5}}>Dados do Erro</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,fontSize:12}}>
                  <div><span style={{color:C.gray}}>Cliente: </span><span style={{color:C.white,fontWeight:700}}>{detalheCliente?.nome||"—"}</span></div>
                  <div><span style={{color:C.gray}}>Consultor: </span><span style={{color:C.white}}>{detalheConsultor?.nome||"—"}</span></div>
                  {detalheCompra&&<div><span style={{color:C.gray}}>Compra: </span><span style={{color:C.white}}>{fmtDate(detalheCompra.data)}</span></div>}
                  {detalhe.valorErrado&&<div><span style={{color:C.gray}}>Valor errado: </span><span style={{color:C.red,fontWeight:700}}>R$ {detalhe.valorErrado}</span></div>}
                  {detalhe.valorCorreto&&<div><span style={{color:C.gray}}>Valor correto: </span><span style={{color:C.green,fontWeight:700}}>R$ {detalhe.valorCorreto}</span></div>}
                </div>
                <div style={{marginTop:10,fontSize:12}}>
                  <span style={{color:C.gray}}>Descrição: </span>
                  <span style={{color:C.lgray}}>{detalhe.descricao}</span>
                </div>
                {/* Antes e depois */}
                {detalhe.snapshotAntes&&(
                  <div style={{marginTop:12,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                    <div style={{background:C.red+"11",border:`1px solid ${C.red}33`,borderRadius:6,padding:"8px 10px"}}>
                      <div style={{color:C.red,fontSize:10,fontWeight:700,marginBottom:4}}>ANTES (snapshot)</div>
                      {detalhe.snapshotAntes.compraValor!==undefined&&<div style={{fontSize:11,color:C.lgray}}>Valor: {fmtMoney(detalhe.snapshotAntes.compraValor)}</div>}
                      {detalhe.snapshotAntes.compraData&&<div style={{fontSize:11,color:C.lgray}}>Data: {fmtDate(detalhe.snapshotAntes.compraData)}</div>}
                      {detalhe.snapshotAntes.clienteCiclo&&<div style={{fontSize:11,color:C.lgray}}>Ciclo: {detalhe.snapshotAntes.clienteCiclo}d</div>}
                      {detalhe.snapshotAntes.clienteConsultorNome&&<div style={{fontSize:11,color:C.lgray}}>Consultor: {detalhe.snapshotAntes.clienteConsultorNome}</div>}
                      {detalhe.snapshotAntes.clienteNome&&<div style={{fontSize:11,color:C.lgray}}>Nome: {detalhe.snapshotAntes.clienteNome}</div>}
                    </div>
                    {detalhe.snapshotDepois?(
                      <div style={{background:C.green+"11",border:`1px solid ${C.green}33`,borderRadius:6,padding:"8px 10px"}}>
                        <div style={{color:C.green,fontSize:10,fontWeight:700,marginBottom:4}}>DEPOIS (corrigido)</div>
                        {detalhe.snapshotDepois.compraValor!==undefined&&<div style={{fontSize:11,color:C.lgray}}>Valor: {fmtMoney(detalhe.snapshotDepois.compraValor)}</div>}
                        {detalhe.snapshotDepois.compraData&&<div style={{fontSize:11,color:C.lgray}}>Data: {fmtDate(detalhe.snapshotDepois.compraData)}</div>}
                        {detalhe.snapshotDepois.clienteCiclo&&<div style={{fontSize:11,color:C.lgray}}>Ciclo: {detalhe.snapshotDepois.clienteCiclo}d</div>}
                        {detalhe.snapshotDepois.clienteConsultorNome&&<div style={{fontSize:11,color:C.lgray}}>Consultor: {detalhe.snapshotDepois.clienteConsultorNome}</div>}
                        {detalhe.snapshotDepois.clienteNome&&<div style={{fontSize:11,color:C.lgray}}>Nome: {detalhe.snapshotDepois.clienteNome}</div>}
                      </div>
                    ):(
                      <div style={{background:C.panel2,border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 10px",display:"flex",alignItems:"center",justifyContent:"center"}}>
                        <span style={{color:C.gray,fontSize:11}}>Aguardando correção</span>
                      </div>
                    )}
                  </div>
                )}
                {detalhe.linkComprovante&&(
                  <div style={{marginTop:10}}>
                    <a href={detalhe.linkComprovante} target="_blank" rel="noreferrer"
                      style={{color:C.blue,fontSize:12,textDecoration:"none",display:"flex",alignItems:"center",gap:6}}>
                      🔗 Ver comprovante anexado
                    </a>
                  </div>
                )}
              </div>

              {/* Histórico de auditoria */}
              <div style={{marginBottom:16}}>
                <div style={{color:C.white,fontWeight:700,fontSize:13,marginBottom:10}}>Histórico de Auditoria</div>
                <div style={{display:"flex",flexDirection:"column",gap:0}}>
                  {detalhe.historico.map((h,i)=>(
                    <div key={i} style={{display:"flex",gap:12,paddingBottom:12}}>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                        <div style={{width:10,height:10,borderRadius:99,background:C.lime,flexShrink:0,marginTop:3}}/>
                        {i<detalhe.historico.length-1&&<div style={{width:1,flex:1,background:C.border,marginTop:4}}/>}
                      </div>
                      <div style={{flex:1,paddingBottom:4}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                          <span style={{color:C.white,fontSize:12,fontWeight:700}}>{h.acao}</span>
                          <span style={{color:C.gray,fontSize:10}}>{fmtDt(h.em)}</span>
                        </div>
                        <div style={{color:C.gray,fontSize:11}}>Por: <span style={{color:C.lgray}}>{h.por}</span> · {h.perfil}</div>
                        {h.detalhe&&<div style={{color:C.gray,fontSize:11,marginTop:3}}>{h.detalhe}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ações do Dono */}
              {isDono&&detalhe.status==="aberto"&&(
                <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16}}>
                  <div style={{color:C.white,fontWeight:700,fontSize:13,marginBottom:12}}>Ação do Diretor</div>
                  <button style={{...gs.btn(C.yellow,C.dark),width:"100%",marginBottom:10}} onClick={()=>moverParaAnalise(detalhe)}>
                    Marcar como Em Análise
                  </button>
                </div>
              )}
              {isDono&&(detalhe.status==="aberto"||detalhe.status==="analise")&&(
                <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,marginTop:8}}>
                  <div style={{color:C.white,fontWeight:700,fontSize:13,marginBottom:12}}>Aplicar Decisão</div>
                  <div style={{display:"flex",gap:10,marginBottom:12}}>
                    <button onClick={()=>setTDecisao("aprovar")} style={{
                      ...gs.btn(tDecisao==="aprovar"?C.green:C.panel2, tDecisao==="aprovar"?C.dark:C.lgray),
                      flex:1,border:`1px solid ${tDecisao==="aprovar"?C.green:C.border}`
                    }}>✓ Aprovar e Corrigir</button>
                    <button onClick={()=>setTDecisao("recusar")} style={{
                      ...gs.btn(tDecisao==="recusar"?C.red:C.panel2, tDecisao==="recusar"?C.white:C.lgray),
                      flex:1,border:`1px solid ${tDecisao==="recusar"?C.red:C.border}`
                    }}>✕ Recusar Ticket</button>
                  </div>
                  {tDecisao&&(
                    <>
                      <Field label="Justificativa da decisão">
                        <textarea style={{...gs.input,height:70,resize:"vertical"}} value={tJustificativa}
                          onChange={e=>setTJustificativa(e.target.value)}
                          placeholder={tDecisao==="aprovar"?"Descreva a correção aplicada...":"Justifique o motivo da recusa..."}/>
                      </Field>
                      <button style={{...gs.btn(tDecisao==="aprovar"?C.green:C.red,C.white),width:"100%"}}
                        onClick={()=>aplicarCorrecao(detalhe)}>
                        {tDecisao==="aprovar"?"Confirmar Correção":"Confirmar Recusa"}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Resultado final */}
              {detalhe.correcao&&(
                <div style={{background:detalhe.status==="corrigido"?C.green+"11":C.red+"11",
                  border:`1px solid ${detalhe.status==="corrigido"?C.green+"44":C.red+"44"}`,
                  borderRadius:10,padding:"14px 16px",marginTop:8}}>
                  <div style={{color:detalhe.status==="corrigido"?C.green:C.red,fontWeight:700,fontSize:13,marginBottom:8}}>
                    {detalhe.status==="corrigido"?"✓ Correção Aplicada":"✕ Ticket Recusado"}
                  </div>
                  {detalhe.correcao.resumo&&<div style={{fontSize:12,color:C.white,fontWeight:700,marginBottom:6}}>↳ {detalhe.correcao.resumo}</div>}
                  <div style={{fontSize:12,color:C.lgray,marginBottom:6}}>{detalhe.correcao.justificativa}</div>
                  <div style={{fontSize:11,color:C.gray}}>Por: {detalhe.correcao.por} · {fmtDt(detalhe.correcao.em)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════
// APP ROOT
// ══════════════════════════════════════════════════════
export default function App(){
  const[user,setUser]=useState(null);
  const[aba,setAba]=useState("dashboard");
  const[clientes,setClientes]=useState(CLIENTES_SEED);
  const[compras,setCompras]=useState(COMPRAS_SEED);
  const[consultores]=useState(CONSULTORES_SEED);
  const[observacoes,setObservacoes]=useState({});
  const[tickets,setTickets]=useState([]);

  if(!user)return<Login onLogin={setUser}/>;

  return(
    <div style={gs.page}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
      <Sidebar aba={aba} setAba={setAba} user={user} onLogout={()=>setUser(null)} ticketsAbertos={tickets.filter(t=>t.status==="aberto").length}/>
      <div style={gs.main}>
        {(()=>{
          switch(aba){
            case"dashboard":return<Dashboard clientes={clientes} compras={compras} consultores={consultores}/>;
            case"clientes":return<Clientes clientes={clientes} setClientes={setClientes} consultores={consultores} compras={compras} setCompras={setCompras} user={user} observacoes={observacoes} setObservacoes={setObservacoes}/>;
            case"consultores":return<Consultores consultores={consultores} clientes={clientes} compras={compras}/>;
            case"compras":return<Compras compras={compras} clientes={clientes} consultores={consultores}/>;
            case"ltv":return<LTV clientes={clientes} compras={compras} consultores={consultores}/>;
            case"alertas":return<Alertas clientes={clientes} compras={compras} consultores={consultores} observacoes={observacoes}/>;
            case"tickets":return<Tickets tickets={tickets} setTickets={setTickets} clientes={clientes} compras={compras} setCompras={setCompras} setClientes={setClientes} user={user} consultores={consultores}/>;
            default:return null;
          }
        })()}
      </div>
    </div>
  );
}