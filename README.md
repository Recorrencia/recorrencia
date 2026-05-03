# RecorrênciaOS — Guia de Instalação (Windows)

## Pré-requisitos

- Node.js instalado → https://nodejs.org (versão 18+)
- Conta no Supabase → https://supabase.com

---

## PASSO 1 — Configurar o Supabase

1. Acesse https://supabase.com e entre na sua conta
2. Crie um novo projeto (ex: "recorrenciaos")
3. Aguarde o projeto inicializar (~1 min)
4. No menu lateral, clique em **SQL Editor**
5. Cole todo o conteúdo do arquivo `supabase_schema.sql` e clique em **Run**
6. Vá em **Authentication → Users** e crie seu primeiro usuário:
   - Clique em **Add user**
   - Preencha e-mail e senha do gestor
7. Após criar o usuário, vá em **SQL Editor** e rode:

```sql
INSERT INTO public.usuarios (id, nome, perfil)
VALUES ('<ID_DO_USUARIO_AQUI>', 'Carlos Gestor', 'Gestor');
```

(Substitua o ID pelo UUID que aparece na lista de usuários)

---

## PASSO 2 — Pegar as chaves do Supabase

1. No menu lateral, clique em **Settings → API**
2. Copie:
   - **Project URL** (ex: https://xyzxyz.supabase.co)
   - **anon public key** (chave longa começando com eyJ...)

---

## PASSO 3 — Configurar o projeto

1. Abra a pasta `recorrenciaos` no terminal (cmd ou PowerShell)
2. Copie o arquivo de exemplo:

```cmd
copy .env.example .env
```

3. Abra o arquivo `.env` no bloco de notas e preencha:

```
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_AQUI
```

---

## PASSO 4 — Instalar e rodar

```cmd
npm install
npm run dev
```

Acesse http://localhost:5173 no navegador.

---

## PASSO 5 — Build para produção (Vercel)

```cmd
npm run build
```

Para fazer deploy na Vercel:
1. Crie conta em https://vercel.com
2. Instale o CLI: `npm install -g vercel`
3. Rode: `vercel`
4. Configure as variáveis de ambiente no painel da Vercel

---

## Estrutura do Projeto

```
recorrenciaos/
├── src/
│   ├── lib/
│   │   ├── supabase.js      ← cliente Supabase
│   │   └── constants.js     ← cores, estilos, helpers
│   ├── components/
│   │   ├── UI.jsx           ← Badge, Modal, Field, etc
│   │   └── Sidebar.jsx      ← navegação lateral
│   ├── pages/
│   │   ├── Login.jsx        ← tela de login
│   │   ├── Dashboard.jsx    ← dashboard principal
│   │   ├── Clientes.jsx     ← gestão de clientes
│   │   └── Other.jsx        ← Consultores, Compras, LTV
│   ├── App.jsx              ← root + autenticação
│   └── main.jsx             ← entry point
├── supabase_schema.sql      ← script do banco de dados
├── .env.example             ← modelo das variáveis
└── package.json
```

---

## Problemas comuns

**Erro de CORS ou conexão:** Verifique se a URL e a chave no `.env` estão corretas.

**Usuário não encontrado após login:** Certifique-se de ter inserido o registro na tabela `usuarios` com o UUID correto.

**Página em branco:** Rode `npm run dev` e veja o console do navegador (F12) para erros.
