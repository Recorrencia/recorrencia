import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase.js";

const fmtMoney = v => {
  const n = Number(v);
  if (n >= 1000000) return "R$ " + (n/1000000).toFixed(2) + " Mi";
  if (n >= 1000) return "R$ " + (n/1000).toFixed(1) + " k";
  return "R$ " + n.toLocaleString("pt-BR");
};

const COLORS = {
  1: { bg:"#F5C500", text:"#1a1a2e", ring:"#F5C500" },
  2: { bg:"#6C3DB1", text:"#fff",    ring:"#9B6FD4" },
  3: { bg:"#6C3DB1", text:"#fff",    ring:"#9B6FD4" },
};

const Avatar = ({ nome, size=80, rank }) => {
  const initials = nome?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
  const colors = [
    ["#4A9EFF","#1a3a5c"],["#C8F135","#2a3a00"],["#A855F7","#2d1a4a"],
    ["#FF4455","#4a0010"],["#00C98C","#003a28"],["#FFB800","#3a2800"],
    ["#FF6B35","#3a1800"],["#00D4FF","#003a4a"],["#FF69B4","#3a001a"],
    ["#7FFF00","#1a3a00"],["#FF4500","#3a1000"],
  ];
  const c = colors[(rank||1)-1] || colors[0];
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%",
      background:`linear-gradient(135deg, ${c[0]}, ${c[1]})`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontWeight:900, fontSize:size*0.35, color:"#fff",
      border:`3px solid ${c[0]}88`, flexShrink:0,
    }}>{initials}</div>
  );
};

const PodiumCard = ({ consultor, rank, height }) => {
  if (!consultor) return <div style={{flex:1}}/>;
  const cfg = COLORS[rank];
  const isFirst = rank === 1;

  return (
    <div style={{
      flex:1, display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"flex-end",
      paddingBottom: 0,
    }}>
      {/* Avatar + info above podium */}
      <div style={{
        display:"flex", flexDirection:"column", alignItems:"center",
        marginBottom:16, position:"relative",
      }}>
        {/* Rank badge */}
        <div style={{
          position:"absolute", top:-8, right:-8, zIndex:2,
          width:28, height:28, borderRadius:"50%",
          background: rank===1?"#F5C500":rank===2?"#C0C0C0":"#CD7F32",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontWeight:900, fontSize:13, color:"#1a1a2e",
          border:"2px solid #fff",
        }}>{rank}</div>

        <Avatar nome={consultor.nome} size={isFirst?100:80} rank={rank}/>

        <div style={{
          marginTop:12, textAlign:"center",
          background:"rgba(255,255,255,0.1)",
          borderRadius:12, padding:"8px 16px",
          backdropFilter:"blur(10px)",
        }}>
          <div style={{
            color:"#fff", fontWeight:800,
            fontSize:isFirst?20:16, marginBottom:4,
            textShadow:"0 2px 4px rgba(0,0,0,0.5)",
          }}>{consultor.nome}</div>
          <div style={{
            color: rank===1?"#F5C500":"#C8F135",
            fontWeight:900, fontSize:isFirst?24:18,
          }}>{fmtMoney(consultor.faturado)}</div>
          {consultor.meta > 0 && (
            <div style={{color:"rgba(255,255,255,0.6)", fontSize:12, marginTop:4}}>
              {consultor.pct.toFixed(0)}% da meta
            </div>
          )}
        </div>
      </div>

      {/* Podium block */}
      <div style={{
        width:"100%", height:height,
        background: rank===1
          ? "linear-gradient(180deg,#F5C500,#D4A800)"
          : "linear-gradient(180deg,#6C3DB1,#4a2580)",
        borderRadius:"16px 16px 0 0",
        display:"flex", alignItems:"center", justifyContent:"center",
        boxShadow:"0 -4px 20px rgba(0,0,0,0.3)",
      }}>
        {rank === 1 && (
          <div style={{fontSize:48}}>🏆</div>
        )}
        {rank === 2 && <div style={{fontSize:36}}>🥈</div>}
        {rank === 3 && <div style={{fontSize:36}}>🥉</div>}
      </div>
    </div>
  );
};

export default function RankingTV() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const loadRanking = async () => {
    try {
      const mes = new Date().toISOString().slice(0,7);
      const { data:consultores } = await supabase.from("consultores").select("*").eq("ativo", true);
      const { data:clientes } = await supabase.from("clientes").select("id,consultor_id");
      const { data:compras } = await supabase.from("compras").select("*").gte("data", mes+"-01");
      const { data:metas } = await supabase.from("metas").select("*").eq("mes", mes);

      const rank = (consultores||[]).map(con => {
        const ids = (clientes||[]).filter(c=>c.consultor_id===con.id).map(c=>c.id);
        const faturado = (compras||[]).filter(cp=>ids.includes(cp.cliente_id)).reduce((s,c)=>s+Number(c.valor),0);
        const meta = (metas||[]).find(m=>m.consultor_id===con.id)?.valor||0;
        const pct = meta>0?Math.min((faturado/meta)*100,100):0;
        const bateu = faturado>=meta&&meta>0;
        return {...con, faturado, meta, pct, bateu};
      }).sort((a,b)=>b.faturado-a.faturado);

      setRanking(rank);
      setLastUpdate(new Date());
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRanking();
    const interval = setInterval(loadRanking, 60000);
    return () => clearInterval(interval);
  }, []);

  const mes = new Date().toLocaleDateString("pt-BR", {month:"long", year:"numeric"});
  const top3 = [ranking[1], ranking[0], ranking[2]]; // 2nd, 1st, 3rd for podium shape
  const rest = ranking.slice(3);

  if (loading) return (
    <div style={{minHeight:"100vh", background:"#1a1a2e", display:"flex", alignItems:"center", justifyContent:"center"}}>
      <div style={{color:"#F5C500", fontSize:24, fontFamily:"sans-serif"}}>Carregando ranking...</div>
    </div>
  );

  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)",
      fontFamily:"'DM Sans','Segoe UI',sans-serif",
      display:"flex", flexDirection:"column",
      overflow:"hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;700;900&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={{
        padding:"24px 48px 16px",
        display:"flex", justifyContent:"space-between", alignItems:"center",
        borderBottom:"1px solid rgba(255,255,255,0.1)",
      }}>
        <div style={{display:"flex", alignItems:"center", gap:16}}>
          <div style={{
            width:48, height:48, background:"#F5C500", borderRadius:12,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontWeight:900, color:"#1a1a2e", fontSize:24,
          }}>R</div>
          <div>
            <div style={{color:"#fff", fontWeight:900, fontSize:24}}>Ranking Comercial</div>
            <div style={{color:"rgba(255,255,255,0.5)", fontSize:14, textTransform:"capitalize"}}>{mes}</div>
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{color:"rgba(255,255,255,0.4)", fontSize:12}}>Última atualização</div>
          <div style={{color:"rgba(255,255,255,0.7)", fontSize:14}}>{lastUpdate.toLocaleTimeString("pt-BR")}</div>
        </div>
      </div>

      {/* Main content */}
      <div style={{flex:1, display:"flex", gap:0, overflow:"hidden"}}>

        {/* Podium - left side */}
        <div style={{
          flex:1, display:"flex", flexDirection:"column",
          padding:"32px 48px 0",
        }}>
          {/* Podium */}
          <div style={{
            flex:1, display:"flex", alignItems:"flex-end",
            gap:16, paddingBottom:0,
          }}>
            <PodiumCard consultor={ranking[1]} rank={2} height={120}/>
            <PodiumCard consultor={ranking[0]} rank={1} height={180}/>
            <PodiumCard consultor={ranking[2]} rank={3} height={90}/>
          </div>
        </div>

        {/* Rest of ranking - right side */}
        {rest.length > 0 && (
          <div style={{
            width:380,
            background:"rgba(255,255,255,0.05)",
            borderLeft:"1px solid rgba(255,255,255,0.1)",
            display:"flex", flexDirection:"column",
            padding:"24px",
            overflowY:"auto",
          }}>
            <div style={{
              display:"grid",
              gridTemplateColumns:"40px 1fr auto",
              gap:"8px 12px",
              alignItems:"center",
              marginBottom:8,
              padding:"0 8px 12px",
              borderBottom:"1px solid rgba(255,255,255,0.1)",
            }}>
              <div style={{color:"rgba(255,255,255,0.4)", fontSize:11, textTransform:"uppercase"}}>Rank</div>
              <div style={{color:"rgba(255,255,255,0.4)", fontSize:11, textTransform:"uppercase"}}>Vendedor</div>
              <div style={{color:"rgba(255,255,255,0.4)", fontSize:11, textTransform:"uppercase"}}>Faturamento</div>
            </div>

            {rest.map((con, i) => (
              <div key={con.id} style={{
                display:"grid",
                gridTemplateColumns:"40px 1fr auto",
                gap:"8px 12px",
                alignItems:"center",
                padding:"10px 8px",
                borderRadius:10,
                marginBottom:4,
                background: con.bateu?"rgba(0,201,140,0.1)":"transparent",
                border: con.bateu?"1px solid rgba(0,201,140,0.2)":"1px solid transparent",
              }}>
                <div style={{
                  width:32, height:32, borderRadius:"50%",
                  background:"rgba(255,255,255,0.1)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:"rgba(255,255,255,0.7)", fontWeight:700, fontSize:14,
                }}>{i+4}</div>
                <div style={{display:"flex", alignItems:"center", gap:10}}>
                  <Avatar nome={con.nome} size={36} rank={i+4}/>
                  <div>
                    <div style={{color:"#fff", fontWeight:700, fontSize:14}}>{con.nome}</div>
                    {con.meta > 0 && (
                      <div style={{color:"rgba(255,255,255,0.4)", fontSize:11}}>
                        {con.pct.toFixed(0)}% da meta
                      </div>
                    )}
                  </div>
                </div>
                <div style={{
                  color: con.bateu?"#00C98C":"#C8F135",
                  fontWeight:700, fontSize:15, textAlign:"right",
                }}>{fmtMoney(con.faturado)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}