import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase.js";

const C = {
  dark:"#08090C",panel:"#111318",panel2:"#181B22",border:"#232731",
  lime:"#C8F135",white:"#F0F2F8",gray:"#6B7280",lgray:"#9CA3AF",
  red:"#FF4455",yellow:"#FFB800",green:"#00C98C",blue:"#4A9EFF",purple:"#A855F7",
};

const gs = {
  card:{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:12, padding:"20px 24px" },
  input:{ background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", color:C.white, fontSize:13, outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit" },
  select:{ background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", color:C.white, fontSize:13, outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit", cursor:"pointer" },
  btn:(bg=C.lime,fg="#08090C")=>({ background:bg, color:fg, border:"none", borderRadius:8, padding:"9px 18px", fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:"inherit" }),
  btnOutline:{ background:"transparent", color:C.lgray, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 18px", cursor:"pointer", fontSize:13, fontFamily:"inherit" },
  label:{ color:C.gray, fontSize:11, letterSpacing:1, marginBottom:6, display:"block", textTransform:"uppercase" },
  badge:(cor)=>({ background:cor+"22", color:cor, border:`1px solid ${cor}55`, borderRadius:6, padding:"3px 10px", fontSize:11, fontWeight:700, display:"inline-block" }),
};

const Field = ({ label, children }) => (
  <div style={{ marginBottom:16 }}>
    <label style={gs.label}>{label}</label>
    {children}
  </div>
);

const Modal = ({ title, subtitle, onClose, children }) => (
  <div style={{ position:"fixed", inset:0, background:"#000000AA", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
    <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:16, padding:32, width:"100%", maxWidth:480, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 32px 80px #000A" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <div style={{ color:C.white, fontWeight:700, fontSize:18 }}>{title}</div>
          {subtitle && <div style={{ color:C.gray, fontSize:12, marginTop:4 }}>{subtitle}</div>}
        </div>
        <button onClick={onClose} style={{ background:"none", border:"none", color:C.gray, cursor:"pointer", fontSize:20 }}>×</button>
      </div>
      {children}
    </div>
  </div>
);

export default function Marcas() {
  const [marcas, setMarcas] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [marcaSelecionada, setMarcaSelecionada] = useState(null);
  const [modalProduto, setModalProduto] = useState(false);
  const [busca, setBusca] = useState("");
  const [pNome, setPNome] = useState("");
  const [pUnidade, setPUnidade] = useState("un");
  const [loading, setLoading] = useState(false);

  const UNIDADES = ["un","cx","pote","sachê","kg","g","L","ml","par","fardo"];

  useEffect(() => {
    supabase.from("marcas").select("*").eq("ativo", true).order("nome")
      .then(({ data }) => setMarcas(data||[]));
  }, []);

  useEffect(() => {
    if (!marcaSelecionada) return;
    supabase.from("produtos").select("*").eq("marca_id", marcaSelecionada.id).eq("ativo", true).order("nome")
      .then(({ data }) => setProdutos(data||[]));
  }, [marcaSelecionada]);

  const addProduto = async () => {
    if (!pNome || !marcaSelecionada) return;
    setLoading(true);
    const { data } = await supabase.from("produtos").insert({
      marca_id: marcaSelecionada.id, nome:pNome, unidade:pUnidade
    }).select().single();
    if (data) setProdutos(p => [...p, data]);
    setModalProduto(false); setPNome(""); setLoading(false);
  };

  const desativarProduto = async (id) => {
    await supabase.from("produtos").update({ ativo:false }).eq("id", id);
    setProdutos(p => p.filter(pr => pr.id !== id));
  };

  const marcasFiltradas = marcas.filter(m =>
    !busca || m.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
        <div>
          <div style={{ color:C.white, fontSize:22, fontWeight:700, marginBottom:4 }}>Marcas & Produtos</div>
          <div style={{ color:C.gray, fontSize:13 }}>{marcas.length} marcas cadastradas</div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"280px 1fr", gap:20 }}>
        {/* Lista de marcas */}
        <div>
          <input style={{ ...gs.input, marginBottom:12 }} placeholder="Buscar marca..." value={busca} onChange={e => setBusca(e.target.value)}/>
          <div style={{ display:"flex", flexDirection:"column", gap:6, maxHeight:"70vh", overflowY:"auto", paddingRight:4 }}>
            {marcasFiltradas.map(m => (
              <button key={m.id} onClick={() => setMarcaSelecionada(m)} style={{
                width:"100%", textAlign:"left", background:marcaSelecionada?.id===m.id?C.lime+"18":C.panel,
                border:`1px solid ${marcaSelecionada?.id===m.id?C.lime+"44":C.border}`,
                borderRadius:8, padding:"10px 14px", color:marcaSelecionada?.id===m.id?C.lime:C.white,
                cursor:"pointer", fontSize:13, fontFamily:"inherit", fontWeight:marcaSelecionada?.id===m.id?700:400,
              }}>{m.nome}</button>
            ))}
          </div>
        </div>

        {/* Produtos da marca selecionada */}
        <div>
          {!marcaSelecionada ? (
            <div style={{ ...gs.card, textAlign:"center", padding:48 }}>
              <div style={{ fontSize:32, marginBottom:12 }}>←</div>
              <div style={{ color:C.gray, fontSize:14 }}>Selecione uma marca para ver e gerenciar seus produtos</div>
            </div>
          ) : (
            <div style={gs.card}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
                <div>
                  <div style={{ color:C.white, fontSize:18, fontWeight:700 }}>{marcaSelecionada.nome}</div>
                  <div style={{ color:C.gray, fontSize:12 }}>{produtos.length} produtos cadastrados</div>
                </div>
                <button style={gs.btn()} onClick={() => setModalProduto(true)}>+ Produto</button>
              </div>

              {produtos.length === 0 ? (
                <div style={{ textAlign:"center", padding:32, color:C.gray }}>
                  Nenhum produto cadastrado. Clique em "+ Produto" para adicionar.
                </div>
              ) : (
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead>
                    <tr style={{ color:C.gray, fontSize:11, textTransform:"uppercase" }}>
                      {["Produto","Unidade","Ação"].map(h => (
                        <th key={h} style={{ textAlign:"left", padding:"6px 12px", borderBottom:`1px solid ${C.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {produtos.map(p => (
                      <tr key={p.id} style={{ borderBottom:`1px solid ${C.border}22` }}>
                        <td style={{ padding:"10px 12px", color:C.white, fontWeight:500 }}>{p.nome}</td>
                        <td style={{ padding:"10px 12px" }}><span style={gs.badge(C.blue)}>{p.unidade}</span></td>
                        <td style={{ padding:"10px 12px" }}>
                          <button onClick={() => desativarProduto(p.id)} style={{ ...gs.btn(C.panel2, C.red), border:`1px solid ${C.red}44`, fontSize:11, padding:"4px 10px" }}>
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {modalProduto && (
        <Modal title="Novo Produto" subtitle={marcaSelecionada?.nome} onClose={() => setModalProduto(false)}>
          <Field label="Nome do produto">
            <input style={gs.input} value={pNome} onChange={e => setPNome(e.target.value)} placeholder="Ex: Whey Protein 900g"/>
          </Field>
          <Field label="Unidade">
            <select style={gs.select} value={pUnidade} onChange={e => setPUnidade(e.target.value)}>
              {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </Field>
          <div style={{ display:"flex", gap:10, marginTop:8 }}>
            <button style={{ ...gs.btnOutline, flex:1 }} onClick={() => setModalProduto(false)}>Cancelar</button>
            <button style={{ ...gs.btn(), flex:1, opacity:loading?0.6:1 }} onClick={addProduto} disabled={loading}>
              {loading ? "Salvando..." : "Cadastrar"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
