import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase.js";

const C = {
  dark:"#08090C",panel:"#111318",panel2:"#181B22",border:"#232731",
  lime:"#C8F135",white:"#F0F2F8",gray:"#6B7280",lgray:"#9CA3AF",
  red:"#FF4455",yellow:"#FFB800",green:"#00C98C",blue:"#4A9EFF",purple:"#A855F7",
};

const gs = {
  input:{ background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", color:C.white, fontSize:13, outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit" },
  select:{ background:C.panel2, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", color:C.white, fontSize:13, outline:"none", width:"100%", boxSizing:"border-box", fontFamily:"inherit", cursor:"pointer" },
  btn:(bg=C.lime,fg="#08090C")=>({ background:bg, color:fg, border:"none", borderRadius:8, padding:"9px 18px", fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:"inherit" }),
  btnOutline:{ background:"transparent", color:C.lgray, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 18px", cursor:"pointer", fontSize:13, fontFamily:"inherit" },
  label:{ color:C.gray, fontSize:11, letterSpacing:1, marginBottom:6, display:"block", textTransform:"uppercase" },
};

const fmtMoney = v => "R$ " + Number(v).toLocaleString("pt-BR", { minimumFractionDigits:2 });
const today = () => new Date().toISOString().split("T")[0];

export default function VendaModal({ cliente, onClose, onSaved, userId }) {
  const [marcas, setMarcas] = useState([]);
  const [produtosPorMarca, setProdutosPorMarca] = useState({});
  const [data, setData] = useState(today());
  const [itens, setItens] = useState([{ id:1, marcaId:"", produtoId:"", quantidade:"", valorUnitario:"" }]);
  const [loading, setLoading] = useState(false);
  const [loadingProd, setLoadingProd] = useState(false);

  useEffect(() => {
    supabase.from("marcas").select("*").eq("ativo", true).order("nome")
      .then(({ data }) => setMarcas(data||[]));
  }, []);

  const loadProdutos = async (marcaId) => {
    if (!marcaId || produtosPorMarca[marcaId]) return;
    setLoadingProd(true);
    const { data } = await supabase.from("produtos").select("*").eq("marca_id", marcaId).eq("ativo", true).order("nome");
    setProdutosPorMarca(p => ({ ...p, [marcaId]: data||[] }));
    setLoadingProd(false);
  };

  const updateItem = (id, field, value) => {
    setItens(prev => prev.map(it => {
      if (it.id !== id) return it;
      const updated = { ...it, [field]: value };
      if (field === "marcaId") { updated.produtoId = ""; loadProdutos(value); }
      return updated;
    }));
  };

  const addItem = () => setItens(p => [...p, { id:Date.now(), marcaId:"", produtoId:"", quantidade:"", valorUnitario:"" }]);
  const removeItem = (id) => { if (itens.length > 1) setItens(p => p.filter(it => it.id !== id)); };

  const totalVenda = itens.reduce((s, it) => s + (Number(it.quantidade)||0) * (Number(it.valorUnitario)||0), 0);

  const itenValidos = itens.filter(it => it.marcaId && it.produtoId && it.quantidade && it.valorUnitario);

  const salvar = async () => {
    if (itenValidos.length === 0) { alert("Adicione pelo menos um item válido."); return; }
    setLoading(true);
    try {
      // 1. Create compra
      const { data:compra, error } = await supabase.from("compras").insert({
        cliente_id: cliente.id,
        data,
        valor: totalVenda,
        registrado_por: userId,
      }).select().single();
      if (error) throw error;

      // 2. Create compra_itens
      const itensData = itenValidos.map(it => ({
        compra_id: compra.id,
        produto_id: Number(it.produtoId),
        quantidade: Number(it.quantidade),
        valor_unitario: Number(it.valorUnitario),
      }));
      await supabase.from("compra_itens").insert(itensData);

      onSaved(compra);
    } catch(e) {
      alert("Erro ao salvar: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"#000000BB", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:16, width:"100%", maxWidth:640, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 32px 80px #000A" }}>
        {/* Header */}
        <div style={{ padding:"24px 28px 16px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ color:C.white, fontWeight:700, fontSize:18 }}>Registrar Venda</div>
            <div style={{ color:C.gray, fontSize:12, marginTop:4 }}>{cliente.nome}</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:C.gray, cursor:"pointer", fontSize:22 }}>×</button>
        </div>

        <div style={{ padding:"20px 28px" }}>
          {/* Data */}
          <div style={{ marginBottom:20 }}>
            <label style={gs.label}>Data da venda</label>
            <input style={{ ...gs.input, width:180 }} type="date" value={data} onChange={e => setData(e.target.value)}/>
          </div>

          {/* Itens */}
          <div style={{ marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <label style={gs.label}>Produtos vendidos</label>
              <button onClick={addItem} style={{ ...gs.btn(C.panel2, C.lime), border:`1px solid ${C.lime}44`, fontSize:12, padding:"5px 12px" }}>+ Adicionar item</button>
            </div>

            {itens.map((it, idx) => (
              <div key={it.id} style={{ background:C.panel2, borderRadius:10, padding:"14px 16px", marginBottom:10, border:`1px solid ${C.border}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div style={{ color:C.gray, fontSize:11 }}>Item {idx+1}</div>
                  {itens.length > 1 && (
                    <button onClick={() => removeItem(it.id)} style={{ background:"none", border:"none", color:C.red, cursor:"pointer", fontSize:16 }}>×</button>
                  )}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
                  <div>
                    <label style={gs.label}>Marca</label>
                    <select style={gs.select} value={it.marcaId} onChange={e => updateItem(it.id, "marcaId", e.target.value)}>
                      <option value="">Selecione...</option>
                      {marcas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={gs.label}>Produto</label>
                    <select style={gs.select} value={it.produtoId} onChange={e => updateItem(it.id, "produtoId", e.target.value)} disabled={!it.marcaId}>
                      <option value="">{it.marcaId ? "Selecione..." : "Selecione a marca"}</option>
                      {(produtosPorMarca[it.marcaId]||[]).map(p => <option key={p.id} value={p.id}>{p.nome} ({p.unidade})</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                  <div>
                    <label style={gs.label}>Quantidade</label>
                    <input style={gs.input} type="number" min="1" value={it.quantidade} onChange={e => updateItem(it.id, "quantidade", e.target.value)} placeholder="0"/>
                  </div>
                  <div>
                    <label style={gs.label}>Valor unitário (R$)</label>
                    <input style={gs.input} type="number" min="0" step="0.01" value={it.valorUnitario} onChange={e => updateItem(it.id, "valorUnitario", e.target.value)} placeholder="0,00"/>
                  </div>
                  <div>
                    <label style={gs.label}>Subtotal</label>
                    <div style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:8, padding:"9px 12px", color:C.lime, fontSize:13, fontWeight:700 }}>
                      {fmtMoney((Number(it.quantidade)||0)*(Number(it.valorUnitario)||0))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div style={{ background:`linear-gradient(135deg,${C.panel2},${C.lime}11)`, border:`1px solid ${C.lime}44`, borderRadius:10, padding:"16px 20px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ color:C.gray, fontSize:11, textTransform:"uppercase", letterSpacing:0.5, marginBottom:4 }}>Total da Venda</div>
              <div style={{ color:C.lime, fontSize:28, fontWeight:700 }}>{fmtMoney(totalVenda)}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ color:C.gray, fontSize:11 }}>{itenValidos.length} iten{itenValidos.length!==1?"s":""} válido{itenValidos.length!==1?"s":""}</div>
              <div style={{ color:C.gray, fontSize:11 }}>{itens.length - itenValidos.length > 0 && `${itens.length-itenValidos.length} pendente${itens.length-itenValidos.length!==1?"s":""}`}</div>
            </div>
          </div>

          <div style={{ display:"flex", gap:10 }}>
            <button style={{ ...gs.btnOutline, flex:1 }} onClick={onClose}>Cancelar</button>
            <button style={{ ...gs.btn(), flex:2, opacity:loading?0.6:1 }} onClick={salvar} disabled={loading||itenValidos.length===0}>
              {loading ? "Salvando..." : `Confirmar Venda — ${fmtMoney(totalVenda)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
