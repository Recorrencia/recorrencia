import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase.js";

const C = {
  dark:"#08090C", panel:"#111318", panel2:"#181B22", border:"#232731",
  lime:"#C8F135", white:"#F0F2F8", gray:"#6B7280",
  red:"#FF4455", yellow:"#FFB800", green:"#00C98C", blue:"#4A9EFF",
};

const fmtMoney = v => "R$ " + Number(v).toLocaleString("pt-BR", { minimumFractionDigits:0 });
const mesAtual = () => new Date().toISOString().slice(0,7);

const MEDAL = ["👑","🥈","🥉"];
const CORES_RANK = [C.lime, "#C0C0C0", "#CD7F32"];

export default function RankingTV() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const loadRanking = async () => {
    const m = mesAtual();
    const [{ data:consultores }, { data:compras }, { data:metas }] = await Promise.all([
      supabase.from("consultores").select("*").eq("ativo", true),
      supabase.from("compras").select("*").gte("data", m + "-01"),
      supabase.from("metas").select("*").eq("mes", m),
    ]);

    const rank = (consultores || []).map(con => {
      const comprasCon = (compras || []).filter(cp => {
        // needs client info - simplified for now
        return true;
      });
      const faturado = (compras || [])
        .filter(cp => cp.consultor_id === con.id)
        .reduce((s, c) => s + Number(c.valor), 0);
      const meta = (metas || []).find(m => m.consultor_id === con.id)?.valor || 0;
      const pct = meta > 0 ? Math.min((faturado / meta) * 100, 100) : 0;
      const bateu = faturado >= meta && meta > 0;
      return { ...con, faturado, meta, pct, bateu };
    }).sort((a, b) => b.faturado - a.faturado);

    setRanking(rank);
    setLastUpdate(new Date());
    setLoading(false);
  };

  useEffect(() => {
    loadRanking();
    const interval = setInterval(loadRanking, 60000); // atualiza a cada 60s
    return () => clearInterval(interval);
  }, []);

  const mes = new Date().toLocaleDateString("pt-BR", { month:"long", year:"numeric" });

  if (loading) return (
    <div style={{ minHeight:"100vh", background:C.dark, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ color:C.lime, fontSize:24, fontFamily:"'DM Mono',monospace" }}>Carregando ranking...</div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:C.dark, fontFamily:"'DM Mono','Fira Mono',monospace", padding:"40px 60px" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:48 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:8 }}>
            <div style={{ width:48, height:48, background:C.lime, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, color:C.dark, fontSize:24 }}>R</div>
            <div style={{ color:C.white, fontSize:36, fontWeight:700 }}>Ranking Comercial</div>
          </div>
          <div style={{ color:C.gray, fontSize:18, textTransform:"capitalize" }}>{mes}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ color:C.gray, fontSize:13, marginBottom:4 }}>Última atualização</div>
          <div style={{ color:C.lgray, fontSize:15 }}>{lastUpdate.toLocaleTimeString("pt-BR")}</div>
          <div style={{ color:C.gray, fontSize:11, marginTop:4 }}>Atualiza automaticamente a cada 60s</div>
        </div>
      </div>

      {/* Ranking */}
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {ranking.map((con, i) => (
          <div key={con.id} style={{
            background: i === 0 ? `linear-gradient(135deg,${C.panel} 60%,${C.lime}18)` : C.panel,
            border:`2px solid ${i < 3 ? CORES_RANK[i]+"88" : C.border}`,
            borderRadius:16, padding:"24px 32px",
            display:"flex", alignItems:"center", gap:32,
            transition:"all .3s",
          }}>
            {/* Posição */}
            <div style={{ width:80, textAlign:"center", flexShrink:0 }}>
              {i < 3 ? (
                <div style={{ fontSize:42 }}>{MEDAL[i]}</div>
              ) : (
                <div style={{ color:C.gray, fontSize:32, fontWeight:700 }}>#{i+1}</div>
              )}
            </div>

            {/* Nome e setor */}
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
                <span style={{ color:C.white, fontSize:26, fontWeight:700 }}>{con.nome}</span>
                <span style={{
                  background: con.setor==="Farm" ? C.blue+"22" : C.lime+"22",
                  color: con.setor==="Farm" ? C.blue : C.lime,
                  border:`1px solid ${con.setor==="Farm" ? C.blue+"55" : C.lime+"55"}`,
                  borderRadius:6, padding:"3px 12px", fontSize:13, fontWeight:700
                }}>{con.setor}</span>
                {con.bateu && (
                  <span style={{ background:C.green+"22", color:C.green, border:`1px solid ${C.green}55`, borderRadius:6, padding:"3px 12px", fontSize:13, fontWeight:700 }}>
                    ✓ Meta batida!
                  </span>
                )}
              </div>

              {/* Barra de progresso */}
              <div style={{ background:C.border, borderRadius:99, height:12, marginBottom:8 }}>
                <div style={{
                  width:`${con.pct}%`, height:12, borderRadius:99,
                  background: con.bateu ? C.green : con.pct > 75 ? C.yellow : con.pct > 40 ? C.blue : C.red,
                  transition:"width .5s"
                }}/>
              </div>
              <div style={{ color:C.gray, fontSize:13 }}>
                {con.pct.toFixed(1)}% da meta
                {con.meta > 0 && !con.bateu && ` · Faltam ${fmtMoney(con.meta - con.faturado)}`}
              </div>
            </div>

            {/* Valores */}
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ color:i===0?C.lime:C.white, fontSize:32, fontWeight:700, marginBottom:4 }}>
                {fmtMoney(con.faturado)}
              </div>
              {con.meta > 0 && (
                <div style={{ color:C.gray, fontSize:14 }}>Meta: {fmtMoney(con.meta)}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ marginTop:40, textAlign:"center", color:C.gray, fontSize:12 }}>
        RecorrênciaOS · Ranking em tempo real
      </div>
    </div>
  );
}
