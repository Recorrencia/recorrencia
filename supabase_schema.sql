-- ================================================
-- RecorrênciaOS — Schema Supabase
-- Execute no SQL Editor do seu projeto Supabase
-- ================================================

create table public.perfis (
  id uuid references auth.users on delete cascade primary key,
  nome text not null,
  perfil text not null check (perfil in ('gestor', 'dono')),
  created_at timestamptz default now()
);
alter table public.perfis enable row level security;
create policy "Perfis visiveis" on public.perfis for select using (auth.role() = 'authenticated');
create policy "Perfil proprio" on public.perfis for update using (auth.uid() = id);

create table public.consultores (
  id serial primary key,
  nome text not null,
  setor text not null check (setor in ('Farm', '1ª Compra')),
  ativo boolean default true,
  created_at timestamptz default now()
);
alter table public.consultores enable row level security;
create policy "Consultores auth" on public.consultores for all using (auth.role() = 'authenticated');

create table public.clientes (
  id serial primary key,
  nome text not null,
  consultor_id integer references public.consultores(id),
  setor text not null check (setor in ('Farm', '1ª Compra')),
  ciclo_dias integer not null default 30 check (ciclo_dias in (15, 30, 45, 60)),
  ultima_compra date,
  ativo boolean default true,
  created_at timestamptz default now()
);
alter table public.clientes enable row level security;
create policy "Clientes auth" on public.clientes for all using (auth.role() = 'authenticated');

create table public.compras (
  id serial primary key,
  cliente_id integer references public.clientes(id) on delete cascade,
  data date not null default current_date,
  valor numeric(12,2) not null,
  registrado_por uuid references auth.users(id),
  created_at timestamptz default now()
);
alter table public.compras enable row level security;
create policy "Compras auth" on public.compras for all using (auth.role() = 'authenticated');

create table public.transferencias (
  id serial primary key,
  cliente_id integer references public.clientes(id) on delete cascade,
  consultor_origem_id integer references public.consultores(id),
  consultor_destino_id integer references public.consultores(id),
  setor_origem text,
  setor_destino text,
  feito_por uuid references auth.users(id),
  created_at timestamptz default now()
);
alter table public.transferencias enable row level security;
create policy "Transf auth" on public.transferencias for all using (auth.role() = 'authenticated');

create table public.observacoes (
  id serial primary key,
  cliente_id integer references public.clientes(id) on delete cascade,
  mes_referencia text not null,
  texto text not null,
  criado_por uuid references auth.users(id),
  created_at timestamptz default now()
);
alter table public.observacoes enable row level security;
create policy "Obs auth" on public.observacoes for all using (auth.role() = 'authenticated');

-- Seed consultores
insert into public.consultores (nome, setor) values
  ('Ana Paula', 'Farm'), ('Ricardo Mendes', 'Farm'), ('Carla Souza', 'Farm'),
  ('Bruno Leal', 'Farm'), ('Fernanda Lima', 'Farm'), ('Marcos Vieira', 'Farm'),
  ('Patricia Ramos', 'Farm'), ('Diego Alves', 'Farm'), ('Juliana Costa', 'Farm'),
  ('Thiago Nunes', '1ª Compra'), ('Leticia Barros', '1ª Compra');

-- Trigger: atualiza ultima_compra automaticamente
create or replace function update_ultima_compra()
returns trigger as $$
begin
  update public.clientes
  set ultima_compra = NEW.data
  where id = NEW.cliente_id
    and (ultima_compra is null or NEW.data >= ultima_compra);
  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_update_ultima_compra
  after insert on public.compras
  for each row execute function update_ultima_compra();
