import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { C, gs } from '../lib/constants'
import { Field } from '../components/UI'

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState("")
  const [pass, setPass]         = useState("")
  const [loading, setLoading]   = useState(false)
  const [erro, setErro]         = useState("")

  const handle = async () => {
    setLoading(true)
    setErro("")
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (error) {
      setErro("E-mail ou senha inválidos.")
      setLoading(false)
      return
    }
    // busca perfil do usuario
    const { data: perfil } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", data.user.id)
      .single()
    onLogin({ ...data.user, ...perfil })
    setLoading(false)
  }

  return (
    <div style={{ minHeight: "100vh", background: C.dark, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Mono', monospace" }}>
      <div style={{ width: 380 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
          <div style={{ width: 40, height: 40, background: C.lime, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: C.dark, fontSize: 20 }}>R</div>
          <div>
            <div style={{ color: C.white, fontWeight: 700, fontSize: 18 }}>RecorrênciaOS</div>
            <div style={{ color: C.gray, fontSize: 11 }}>Gestão de Carteiras</div>
          </div>
        </div>

        <div style={{ ...gs.card, padding: 32 }}>
          <div style={{ color: C.white, fontWeight: 700, fontSize: 20, marginBottom: 4 }}>Entrar</div>
          <div style={{ color: C.gray, fontSize: 12, marginBottom: 28 }}>Acesso restrito ao gestor e dono</div>

          <Field label="E-mail">
            <input style={gs.input} value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com" type="email" />
          </Field>
          <Field label="Senha">
            <input style={gs.input} value={pass} onChange={e => setPass(e.target.value)}
              placeholder="••••••••" type="password"
              onKeyDown={e => e.key === "Enter" && handle()} />
          </Field>

          {erro && <div style={{ color: C.red, fontSize: 12, marginBottom: 12 }}>{erro}</div>}

          <button style={{ ...gs.btn(), width: "100%", padding: "11px 18px", marginTop: 8 }}
            onClick={handle} disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </div>
    </div>
  )
}
