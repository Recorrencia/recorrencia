# RecorrênciaOS — Guia de Setup (Windows)

## PRÉ-REQUISITOS
Instale antes de começar:
- Node.js 18+: https://nodejs.org (baixe o instalador LTS)
- Git: https://git-scm.com

---

## PASSO 1 — Configurar o Supabase

1. Acesse https://supabase.com e faça login
2. Clique em "New Project", dê um nome (ex: recorrenciaos)
3. Aguarde o projeto iniciar (~2 minutos)
4. Vá em **SQL Editor** (menu lateral esquerdo)
5. Cole TODO o conteúdo do arquivo `supabase_schema.sql` e clique em **Run**
6. Vá em **Authentication > Users** e clique em **Add user**
   - Crie o usuário do gestor (ex: gestor@suadistribuidora.com)
   - Crie o usuário do dono
7. Para cada usuário criado, vá em **SQL Editor** e execute:
   ```sql
   INSERT INTO public.perfis (id, nome, perfil)
   VALUES ('ID_DO_USUARIO_AQUI', 'Nome do Gestor', 'gestor');
   ```
   (O ID aparece na lista de usuários em Authentication)

8. Copie as chaves do projeto:
   - Vá em **Settings > API**
   - Copie: **Project URL** e **anon public key**

---

## PASSO 2 — Configurar o projeto local

Abra o **PowerShell** ou **Terminal** na pasta do projeto e execute:

```powershell
# Instalar dependências
npm install

# Criar arquivo de variáveis de ambiente
copy .env.example .env
```

Abra o arquivo `.env` em qualquer editor de texto e preencha:
```
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY_AQUI
```

---

## PASSO 3 — Rodar o sistema

```powershell
npm run dev
```

Acesse no navegador: **http://localhost:5173**

---

## PASSO 4 — Fazer alterações e testar

Enquanto o `npm run dev` estiver rodando, qualquer alteração
no código é refletida instantaneamente no navegador.

Para parar o servidor: **Ctrl+C** no terminal

---

## ESTRUTURA DO PROJETO

```
recorrenciaos/
├── src/
│   ├── App.jsx          ← Sistema completo (edite aqui)
│   ├── main.jsx         ← Entry point
│   └── lib/
│       └── supabase.js  ← Conexão com banco
├── .env                 ← Suas chaves (NÃO commitar)
├── supabase_schema.sql  ← SQL do banco de dados
├── index.html
├── vite.config.js
└── package.json
```

---

## COMANDOS ÚTEIS

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Gera build de produção (pasta dist/) |
| `npm run preview` | Visualiza o build de produção |

---

## PROBLEMAS COMUNS

**"npm não é reconhecido"**
→ Reinstale o Node.js e reinicie o PowerShell

**Tela em branco após login**
→ Verifique se o .env está preenchido corretamente

**Erro de CORS**
→ No Supabase, vá em Authentication > URL Configuration
  e adicione http://localhost:5173 em "Site URL"
