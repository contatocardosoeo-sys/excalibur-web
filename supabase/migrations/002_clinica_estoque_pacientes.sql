-- =============================================
-- EXCALIBUR Migration 002: Clínica + Estoque + Pacientes
-- 13 tabelas com clinica_id + RLS + Realtime
-- =============================================

-- 1. PROCEDIMENTOS
CREATE TABLE IF NOT EXISTS procedimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT DEFAULT 'geral',
  preco DECIMAL(12,2) NOT NULL DEFAULT 0,
  custo DECIMAL(12,2) DEFAULT 0,
  margem DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN preco > 0 THEN ((preco - custo) / preco) * 100 ELSE 0 END
  ) STORED,
  duracao_minutos INTEGER DEFAULT 60,
  imagem_url TEXT,
  ativo BOOLEAN DEFAULT true,
  requer_anamnese BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PROCEDIMENTOS_PACOTES
CREATE TABLE IF NOT EXISTS procedimentos_pacotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  procedimentos JSONB NOT NULL DEFAULT '[]',
  preco_original DECIMAL(12,2) DEFAULT 0,
  preco_pacote DECIMAL(12,2) NOT NULL DEFAULT 0,
  desconto_percentual DECIMAL(5,2) DEFAULT 0,
  sessoes INTEGER DEFAULT 1,
  validade_dias INTEGER DEFAULT 365,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. MEMBERSHIPS
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco_mensal DECIMAL(12,2) NOT NULL DEFAULT 0,
  beneficios JSONB DEFAULT '[]',
  procedimentos_inclusos JSONB DEFAULT '[]',
  desconto_adicional DECIMAL(5,2) DEFAULT 0,
  periodo_minimo_meses INTEGER DEFAULT 12,
  ativo BOOLEAN DEFAULT true,
  total_assinantes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CUPONS
CREATE TABLE IF NOT EXISTS cupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT DEFAULT 'percentual' CHECK (tipo IN ('percentual', 'valor_fixo', 'procedimento_gratis')),
  valor DECIMAL(12,2) NOT NULL DEFAULT 0,
  uso_maximo INTEGER DEFAULT 100,
  uso_atual INTEGER DEFAULT 0,
  data_inicio DATE,
  data_fim DATE,
  procedimentos_validos TEXT[] DEFAULT '{}',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. SALAS_CABINES
CREATE TABLE IF NOT EXISTS salas_cabines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT DEFAULT 'sala' CHECK (tipo IN ('sala', 'cabine', 'consultorio', 'laboratorio')),
  capacidade INTEGER DEFAULT 1,
  equipamentos JSONB DEFAULT '[]',
  ativo BOOLEAN DEFAULT true,
  cor TEXT DEFAULT '#f59e0b',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. STATUS_AGENDA
CREATE TABLE IF NOT EXISTS status_agenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cor TEXT DEFAULT '#6b7280',
  icone TEXT,
  ordem INTEGER DEFAULT 0,
  permite_reagendar BOOLEAN DEFAULT true,
  conta_como_noshow BOOLEAN DEFAULT false,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. TURNOS
CREATE TABLE IF NOT EXISTS turnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
  profissional_id UUID REFERENCES equipe_membros(id) ON DELETE CASCADE,
  dia_semana INTEGER CHECK (dia_semana >= 0 AND dia_semana <= 6),
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  sala_id UUID REFERENCES salas_cabines(id),
  intervalo_minutos INTEGER DEFAULT 30,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. TAGS_PACIENTES
CREATE TABLE IF NOT EXISTS tags_pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cor TEXT DEFAULT '#f59e0b',
  descricao TEXT,
  auto_aplicar_regra JSONB,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. ESTOQUE
CREATE TABLE IF NOT EXISTS estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  codigo_sku TEXT,
  categoria TEXT DEFAULT 'insumo',
  unidade TEXT DEFAULT 'un',
  quantidade_atual DECIMAL(12,2) DEFAULT 0,
  quantidade_minima DECIMAL(12,2) DEFAULT 0,
  preco_custo DECIMAL(12,2) DEFAULT 0,
  preco_venda DECIMAL(12,2) DEFAULT 0,
  fornecedor TEXT,
  lote TEXT,
  data_validade DATE,
  localizacao TEXT,
  imagem_url TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. ESTOQUE_MOVIMENTACOES
CREATE TABLE IF NOT EXISTS estoque_movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES estoque(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste', 'devolucao', 'perda')),
  quantidade DECIMAL(12,2) NOT NULL,
  quantidade_anterior DECIMAL(12,2) DEFAULT 0,
  quantidade_posterior DECIMAL(12,2) DEFAULT 0,
  motivo TEXT,
  documento TEXT,
  responsavel_id UUID REFERENCES equipe_membros(id),
  responsavel_nome TEXT,
  custo_unitario DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. PACIENTES_SESSOES
CREATE TABLE IF NOT EXISTS pacientes_sessoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
  pacote_id UUID REFERENCES procedimentos_pacotes(id),
  procedimento_id UUID REFERENCES procedimentos(id),
  sessao_numero INTEGER NOT NULL DEFAULT 1,
  total_sessoes INTEGER NOT NULL DEFAULT 1,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'realizada', 'faltou', 'cancelada', 'reagendada')),
  data_sessao DATE,
  hora_sessao TIME,
  profissional_id UUID REFERENCES equipe_membros(id),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 12. PACIENTES_FIDELIDADE
CREATE TABLE IF NOT EXISTS pacientes_fidelidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
  pontos_total INTEGER DEFAULT 0,
  pontos_disponiveis INTEGER DEFAULT 0,
  pontos_utilizados INTEGER DEFAULT 0,
  nivel TEXT DEFAULT 'bronze' CHECK (nivel IN ('bronze', 'prata', 'ouro', 'diamante', 'vip')),
  historico JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 13. PACIENTES_FORMULARIOS
CREATE TABLE IF NOT EXISTS pacientes_formularios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID REFERENCES clinicas(id) ON DELETE CASCADE,
  paciente_id UUID REFERENCES pacientes(id) ON DELETE CASCADE,
  tipo TEXT DEFAULT 'anamnese' CHECK (tipo IN ('anamnese', 'consentimento', 'avaliacao', 'feedback', 'custom')),
  titulo TEXT NOT NULL,
  campos JSONB NOT NULL DEFAULT '[]',
  respostas JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'preenchido', 'revisado')),
  preenchido_em TIMESTAMPTZ,
  revisado_por UUID REFERENCES equipe_membros(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_procedimentos_clinica ON procedimentos(clinica_id);
CREATE INDEX IF NOT EXISTS idx_procedimentos_categoria ON procedimentos(categoria);
CREATE INDEX IF NOT EXISTS idx_procedimentos_pacotes_clinica ON procedimentos_pacotes(clinica_id);
CREATE INDEX IF NOT EXISTS idx_memberships_clinica ON memberships(clinica_id);
CREATE INDEX IF NOT EXISTS idx_cupons_clinica ON cupons(clinica_id);
CREATE INDEX IF NOT EXISTS idx_cupons_codigo ON cupons(codigo);
CREATE INDEX IF NOT EXISTS idx_salas_clinica ON salas_cabines(clinica_id);
CREATE INDEX IF NOT EXISTS idx_status_agenda_clinica ON status_agenda(clinica_id);
CREATE INDEX IF NOT EXISTS idx_turnos_clinica ON turnos(clinica_id);
CREATE INDEX IF NOT EXISTS idx_turnos_profissional ON turnos(profissional_id);
CREATE INDEX IF NOT EXISTS idx_tags_pacientes_clinica ON tags_pacientes(clinica_id);
CREATE INDEX IF NOT EXISTS idx_estoque_clinica ON estoque(clinica_id);
CREATE INDEX IF NOT EXISTS idx_estoque_validade ON estoque(data_validade);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_clinica ON estoque_movimentacoes(clinica_id);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_produto ON estoque_movimentacoes(produto_id);
CREATE INDEX IF NOT EXISTS idx_pac_sessoes_clinica ON pacientes_sessoes(clinica_id);
CREATE INDEX IF NOT EXISTS idx_pac_sessoes_paciente ON pacientes_sessoes(paciente_id);
CREATE INDEX IF NOT EXISTS idx_pac_fidelidade_clinica ON pacientes_fidelidade(clinica_id);
CREATE INDEX IF NOT EXISTS idx_pac_fidelidade_paciente ON pacientes_fidelidade(paciente_id);
CREATE INDEX IF NOT EXISTS idx_pac_formularios_clinica ON pacientes_formularios(clinica_id);
CREATE INDEX IF NOT EXISTS idx_pac_formularios_paciente ON pacientes_formularios(paciente_id);

-- =============================================
-- RLS + Policies (dev mode)
-- =============================================
ALTER TABLE procedimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedimentos_pacotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE cupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE salas_cabines ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags_pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque_movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes_sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes_fidelidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes_formularios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_procedimentos" ON procedimentos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_procedimentos_pacotes" ON procedimentos_pacotes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_memberships" ON memberships FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_cupons" ON cupons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_salas_cabines" ON salas_cabines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_status_agenda" ON status_agenda FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_turnos" ON turnos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_tags_pacientes" ON tags_pacientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_estoque" ON estoque FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_estoque_movimentacoes" ON estoque_movimentacoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_pacientes_sessoes" ON pacientes_sessoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_pacientes_fidelidade" ON pacientes_fidelidade FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_pacientes_formularios" ON pacientes_formularios FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- REALTIME em TODAS as tabelas
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE procedimentos;
ALTER PUBLICATION supabase_realtime ADD TABLE procedimentos_pacotes;
ALTER PUBLICATION supabase_realtime ADD TABLE memberships;
ALTER PUBLICATION supabase_realtime ADD TABLE cupons;
ALTER PUBLICATION supabase_realtime ADD TABLE salas_cabines;
ALTER PUBLICATION supabase_realtime ADD TABLE status_agenda;
ALTER PUBLICATION supabase_realtime ADD TABLE turnos;
ALTER PUBLICATION supabase_realtime ADD TABLE tags_pacientes;
ALTER PUBLICATION supabase_realtime ADD TABLE estoque;
ALTER PUBLICATION supabase_realtime ADD TABLE estoque_movimentacoes;
ALTER PUBLICATION supabase_realtime ADD TABLE pacientes_sessoes;
ALTER PUBLICATION supabase_realtime ADD TABLE pacientes_fidelidade;
ALTER PUBLICATION supabase_realtime ADD TABLE pacientes_formularios;
ALTER PUBLICATION supabase_realtime ADD TABLE oportunidades;
ALTER PUBLICATION supabase_realtime ADD TABLE atividades;
ALTER PUBLICATION supabase_realtime ADD TABLE propostas_v2;
ALTER PUBLICATION supabase_realtime ADD TABLE pipeline_estagios;
ALTER PUBLICATION supabase_realtime ADD TABLE equipe_membros;
ALTER PUBLICATION supabase_realtime ADD TABLE comissoes;
ALTER PUBLICATION supabase_realtime ADD TABLE metas;
ALTER PUBLICATION supabase_realtime ADD TABLE campanhas_vendas;
ALTER PUBLICATION supabase_realtime ADD TABLE historico_leads;
ALTER PUBLICATION supabase_realtime ADD TABLE leads;

-- =============================================
-- SEED DATA
-- =============================================
INSERT INTO status_agenda (clinica_id, nome, cor, ordem, conta_como_noshow) VALUES
  ((SELECT id FROM clinicas LIMIT 1), 'Confirmado', '#22c55e', 1, false),
  ((SELECT id FROM clinicas LIMIT 1), 'Aguardando', '#f59e0b', 2, false),
  ((SELECT id FROM clinicas LIMIT 1), 'Atendendo', '#3b82f6', 3, false),
  ((SELECT id FROM clinicas LIMIT 1), 'Finalizado', '#6b7280', 4, false),
  ((SELECT id FROM clinicas LIMIT 1), 'No-show', '#ef4444', 5, true),
  ((SELECT id FROM clinicas LIMIT 1), 'Cancelado', '#dc2626', 6, false);

INSERT INTO tags_pacientes (clinica_id, nome, cor) VALUES
  ((SELECT id FROM clinicas LIMIT 1), 'VIP', '#f59e0b'),
  ((SELECT id FROM clinicas LIMIT 1), 'Retorno', '#3b82f6'),
  ((SELECT id FROM clinicas LIMIT 1), 'Inadimplente', '#ef4444'),
  ((SELECT id FROM clinicas LIMIT 1), 'Indicou', '#22c55e'),
  ((SELECT id FROM clinicas LIMIT 1), 'Primeira Vez', '#8b5cf6');
