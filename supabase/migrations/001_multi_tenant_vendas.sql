-- =============================================
-- EXCALIBUR — Migration 001: Multi-Tenant Vendas
-- Baseado na engenharia reversa do Nexus Atemporal
-- Estrutura: clinica_id em TUDO para multi-tenant
-- =============================================

-- 1. CLINICAS (raiz multi-tenant)
CREATE TABLE IF NOT EXISTS clinicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  telefone TEXT,
  email TEXT,
  endereco JSONB DEFAULT '{}',
  logo_url TEXT,
  plano TEXT DEFAULT 'starter',
  ativo BOOLEAN DEFAULT true,
  configuracoes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PIPELINE_ESTAGIOS (estágios configuráveis por clínica)
CREATE TABLE IF NOT EXISTS pipeline_estagios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('leads', 'oportunidades')),
  ordem INTEGER NOT NULL DEFAULT 0,
  probabilidade INTEGER DEFAULT 0 CHECK (probabilidade >= 0 AND probabilidade <= 100),
  cor TEXT DEFAULT '#f59e0b',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. OPORTUNIDADES (pipeline de vendas / deals)
CREATE TABLE IF NOT EXISTS oportunidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  valor DECIMAL(12,2) DEFAULT 0,
  probabilidade INTEGER DEFAULT 0 CHECK (probabilidade >= 0 AND probabilidade <= 100),
  estagio_id UUID REFERENCES pipeline_estagios(id),
  estagio TEXT NOT NULL DEFAULT 'Qualificacao',
  vendedor_id UUID,
  procedimento TEXT,
  origem TEXT DEFAULT 'manual',
  data_previsao_fechamento DATE,
  data_fechamento DATE,
  motivo_perda TEXT,
  observacoes TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ATIVIDADES (follow-ups, tarefas, notas, ligacoes)
CREATE TABLE IF NOT EXISTS atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  oportunidade_id UUID REFERENCES oportunidades(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ligacao', 'email', 'whatsapp', 'reuniao', 'nota', 'tarefa', 'sistema', 'follow_up')),
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluida', 'cancelada', 'atrasada')),
  prioridade TEXT DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  data_agendada TIMESTAMPTZ,
  data_conclusao TIMESTAMPTZ,
  responsavel_id UUID,
  responsavel_nome TEXT,
  duracao_minutos INTEGER,
  resultado TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. PROPOSTAS (sistema completo com simulador de crédito)
CREATE TABLE IF NOT EXISTS propostas_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  oportunidade_id UUID REFERENCES oportunidades(id) ON DELETE SET NULL,
  paciente_nome TEXT NOT NULL,
  paciente_cpf TEXT,
  paciente_telefone TEXT,
  procedimentos JSONB NOT NULL DEFAULT '[]',
  valor_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  desconto_percentual DECIMAL(5,2) DEFAULT 0,
  desconto_valor DECIMAL(12,2) DEFAULT 0,
  valor_final DECIMAL(12,2) NOT NULL DEFAULT 0,
  entrada DECIMAL(12,2) DEFAULT 0,
  parcelas INTEGER DEFAULT 1,
  valor_parcela DECIMAL(12,2) DEFAULT 0,
  forma_pagamento TEXT DEFAULT 'a_vista',
  financeira TEXT,
  taxa_juros DECIMAL(5,2) DEFAULT 0,
  valor_financiado DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'enviada', 'visualizada', 'aceita', 'recusada', 'expirada', 'cancelada')),
  validade DATE,
  vendedor_id UUID,
  vendedor_nome TEXT,
  observacoes TEXT,
  condicoes TEXT,
  assinatura_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. EQUIPE_MEMBROS (time comercial multi-tenant)
CREATE TABLE IF NOT EXISTS equipe_membros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  cargo TEXT DEFAULT 'vendedor',
  role TEXT DEFAULT 'membro' CHECK (role IN ('admin', 'gerente', 'vendedor', 'membro', 'biomedico', 'dentista', 'recepcionista')),
  avatar_url TEXT,
  ativo BOOLEAN DEFAULT true,
  meta_mensal DECIMAL(12,2) DEFAULT 0,
  comissao_percentual DECIMAL(5,2) DEFAULT 0,
  unidades TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. COMISSOES (regras de comissão)
CREATE TABLE IF NOT EXISTS comissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
  membro_id UUID REFERENCES equipe_membros(id) ON DELETE CASCADE,
  proposta_id UUID REFERENCES propostas_v2(id) ON DELETE SET NULL,
  valor_venda DECIMAL(12,2) NOT NULL DEFAULT 0,
  percentual DECIMAL(5,2) NOT NULL DEFAULT 0,
  valor_comissao DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'paga', 'cancelada')),
  data_pagamento DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. METAS (OKRs e metas de vendas)
CREATE TABLE IF NOT EXISTS metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  tipo TEXT DEFAULT 'vendas' CHECK (tipo IN ('vendas', 'leads', 'agendamentos', 'faturamento', 'conversao', 'custom')),
  periodo TEXT DEFAULT 'mensal' CHECK (periodo IN ('diario', 'semanal', 'mensal', 'trimestral', 'anual')),
  valor_meta DECIMAL(12,2) NOT NULL DEFAULT 0,
  valor_atual DECIMAL(12,2) DEFAULT 0,
  unidade TEXT DEFAULT 'reais',
  responsavel_id UUID REFERENCES equipe_membros(id),
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 9. CAMPANHAS_VENDAS
CREATE TABLE IF NOT EXISTS campanhas_vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT DEFAULT 'promocao',
  status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'ativa', 'pausada', 'encerrada')),
  data_inicio DATE,
  data_fim DATE,
  orcamento DECIMAL(12,2) DEFAULT 0,
  receita_gerada DECIMAL(12,2) DEFAULT 0,
  leads_gerados INTEGER DEFAULT 0,
  conversoes INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. HISTORICO_LEADS (timeline de eventos)
CREATE TABLE IF NOT EXISTS historico_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('estagio_alterado', 'nota', 'atividade', 'proposta', 'sistema', 'whatsapp', 'email', 'ligacao')),
  titulo TEXT NOT NULL,
  descricao TEXT,
  autor TEXT DEFAULT 'sistema',
  dados_anteriores JSONB,
  dados_novos JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- INDEXES para performance multi-tenant
-- =============================================
CREATE INDEX IF NOT EXISTS idx_oportunidades_clinica ON oportunidades(clinica_id);
CREATE INDEX IF NOT EXISTS idx_oportunidades_estagio ON oportunidades(estagio);
CREATE INDEX IF NOT EXISTS idx_oportunidades_lead ON oportunidades(lead_id);
CREATE INDEX IF NOT EXISTS idx_oportunidades_vendedor ON oportunidades(vendedor_id);

CREATE INDEX IF NOT EXISTS idx_atividades_clinica ON atividades(clinica_id);
CREATE INDEX IF NOT EXISTS idx_atividades_lead ON atividades(lead_id);
CREATE INDEX IF NOT EXISTS idx_atividades_oportunidade ON atividades(oportunidade_id);
CREATE INDEX IF NOT EXISTS idx_atividades_status ON atividades(status);
CREATE INDEX IF NOT EXISTS idx_atividades_data ON atividades(data_agendada);

CREATE INDEX IF NOT EXISTS idx_propostas_v2_clinica ON propostas_v2(clinica_id);
CREATE INDEX IF NOT EXISTS idx_propostas_v2_lead ON propostas_v2(lead_id);
CREATE INDEX IF NOT EXISTS idx_propostas_v2_status ON propostas_v2(status);
CREATE INDEX IF NOT EXISTS idx_propostas_v2_numero ON propostas_v2(numero);

CREATE INDEX IF NOT EXISTS idx_equipe_clinica ON equipe_membros(clinica_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_clinica ON comissoes(clinica_id);
CREATE INDEX IF NOT EXISTS idx_comissoes_membro ON comissoes(membro_id);
CREATE INDEX IF NOT EXISTS idx_metas_clinica ON metas(clinica_id);
CREATE INDEX IF NOT EXISTS idx_campanhas_clinica ON campanhas_vendas(clinica_id);
CREATE INDEX IF NOT EXISTS idx_historico_lead ON historico_leads(lead_id);
CREATE INDEX IF NOT EXISTS idx_historico_clinica ON historico_leads(clinica_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_estagios_clinica ON pipeline_estagios(clinica_id);

-- =============================================
-- RLS (Row Level Security) preparado
-- =============================================
ALTER TABLE clinicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_estagios ENABLE ROW LEVEL SECURITY;
ALTER TABLE oportunidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE propostas_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipe_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE comissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanhas_vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_leads ENABLE ROW LEVEL SECURITY;

-- Policy temporária: permite tudo para anon (dev mode)
-- Em produção trocar por policies baseadas em auth.uid()
CREATE POLICY "allow_all_clinicas" ON clinicas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_pipeline_estagios" ON pipeline_estagios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_oportunidades" ON oportunidades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_atividades" ON atividades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_propostas_v2" ON propostas_v2 FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_equipe_membros" ON equipe_membros FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_comissoes" ON comissoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_metas" ON metas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_campanhas_vendas" ON campanhas_vendas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_historico_leads" ON historico_leads FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- SEED: Clínica padrão + estágios padrão
-- =============================================
INSERT INTO clinicas (id, nome, cnpj, email, plano) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Clínica Demo Excalibur', '00.000.000/0001-00', 'demo@excalibur.com', 'premium')
ON CONFLICT (id) DO NOTHING;

-- Estágios padrão de Leads (baseado no Nexus)
INSERT INTO pipeline_estagios (clinica_id, nome, tipo, ordem, probabilidade, cor) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Novo Lead', 'leads', 1, 5, '#6b7280'),
  ('00000000-0000-0000-0000-000000000001', 'Qualificacao', 'leads', 2, 15, '#3b82f6'),
  ('00000000-0000-0000-0000-000000000001', 'Contato Inicial', 'leads', 3, 25, '#8b5cf6'),
  ('00000000-0000-0000-0000-000000000001', 'Em Negociacao', 'leads', 4, 50, '#f59e0b'),
  ('00000000-0000-0000-0000-000000000001', 'Pagamento Pendente', 'leads', 5, 85, '#ef4444'),
  ('00000000-0000-0000-0000-000000000001', 'Fechado/Ganho', 'leads', 6, 100, '#22c55e')
ON CONFLICT DO NOTHING;

-- Estágios padrão de Oportunidades (baseado no Nexus)
INSERT INTO pipeline_estagios (clinica_id, nome, tipo, ordem, probabilidade, cor) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Qualificacao', 'oportunidades', 1, 20, '#6b7280'),
  ('00000000-0000-0000-0000-000000000001', 'Proposta Enviada', 'oportunidades', 2, 40, '#3b82f6'),
  ('00000000-0000-0000-0000-000000000001', 'Negociacao', 'oportunidades', 3, 70, '#f59e0b'),
  ('00000000-0000-0000-0000-000000000001', 'Fechamento', 'oportunidades', 4, 90, '#ef4444'),
  ('00000000-0000-0000-0000-000000000001', 'Ganho', 'oportunidades', 5, 100, '#22c55e'),
  ('00000000-0000-0000-0000-000000000001', 'Perdido', 'oportunidades', 6, 0, '#dc2626')
ON CONFLICT DO NOTHING;
