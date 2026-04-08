-- ERP EXCALIBUR — TABELAS CORE

CREATE TABLE IF NOT EXISTS public.funil_diario (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clinica_id uuid NOT NULL,
  data date NOT NULL DEFAULT CURRENT_DATE,
  investimento numeric(10,2) DEFAULT 0,
  leads integer DEFAULT 0,
  leads_respondidos integer DEFAULT 0,
  agendamentos integer DEFAULT 0,
  confirmados integer DEFAULT 0,
  comparecimentos integer DEFAULT 0,
  avaliacoes integer DEFAULT 0,
  orcamentos integer DEFAULT 0,
  fechamentos integer DEFAULT 0,
  faturamento numeric(10,2) DEFAULT 0,
  cpl numeric(10,2) GENERATED ALWAYS AS (CASE WHEN leads > 0 THEN investimento / leads ELSE 0 END) STORED,
  taxa_resposta numeric(5,2) GENERATED ALWAYS AS (CASE WHEN leads > 0 THEN (leads_respondidos::numeric / leads) * 100 ELSE 0 END) STORED,
  taxa_agendamento numeric(5,2) GENERATED ALWAYS AS (CASE WHEN leads_respondidos > 0 THEN (agendamentos::numeric / leads_respondidos) * 100 ELSE 0 END) STORED,
  taxa_comparecimento numeric(5,2) GENERATED ALWAYS AS (CASE WHEN agendamentos > 0 THEN (comparecimentos::numeric / agendamentos) * 100 ELSE 0 END) STORED,
  taxa_fechamento numeric(5,2) GENERATED ALWAYS AS (CASE WHEN comparecimentos > 0 THEN (fechamentos::numeric / comparecimentos) * 100 ELSE 0 END) STORED,
  ticket_medio numeric(10,2) GENERATED ALWAYS AS (CASE WHEN fechamentos > 0 THEN faturamento / fechamentos ELSE 0 END) STORED,
  cac numeric(10,2) GENERATED ALWAYS AS (CASE WHEN fechamentos > 0 THEN investimento / fechamentos ELSE 0 END) STORED,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(clinica_id, data)
);

CREATE TABLE IF NOT EXISTS public.jornada_clinica (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clinica_id uuid NOT NULL UNIQUE,
  etapa text NOT NULL DEFAULT 'D0_NOVO',
  data_inicio date DEFAULT CURRENT_DATE,
  data_ativacao date,
  data_d15 date,
  data_d30 date,
  data_d60 date,
  data_d90 date,
  dias_na_plataforma integer DEFAULT 0,
  cs_responsavel text,
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.adocao_clinica (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clinica_id uuid NOT NULL,
  semana text NOT NULL,
  assistiu_onboarding boolean DEFAULT false,
  participa_aulas_ao_vivo boolean DEFAULT false,
  assiste_gravado boolean DEFAULT false,
  usa_crm boolean DEFAULT false,
  responde_leads boolean DEFAULT false,
  usa_script boolean DEFAULT false,
  preenche_funil_diario boolean DEFAULT false,
  campanha_ativa boolean DEFAULT false,
  leads_chegando boolean DEFAULT false,
  taxa_resposta_boa boolean DEFAULT false,
  segue_processo boolean DEFAULT false,
  realizou_vendas boolean DEFAULT false,
  vendas_recorrentes boolean DEFAULT false,
  roi_positivo boolean DEFAULT false,
  score integer GENERATED ALWAYS AS (
    (CASE WHEN assistiu_onboarding THEN 5 ELSE 0 END) +
    (CASE WHEN participa_aulas_ao_vivo THEN 5 ELSE 0 END) +
    (CASE WHEN assiste_gravado THEN 5 ELSE 0 END) +
    (CASE WHEN usa_crm THEN 5 ELSE 0 END) +
    (CASE WHEN responde_leads THEN 10 ELSE 0 END) +
    (CASE WHEN usa_script THEN 5 ELSE 0 END) +
    (CASE WHEN preenche_funil_diario THEN 5 ELSE 0 END) +
    (CASE WHEN campanha_ativa THEN 5 ELSE 0 END) +
    (CASE WHEN leads_chegando THEN 5 ELSE 0 END) +
    (CASE WHEN taxa_resposta_boa THEN 10 ELSE 0 END) +
    (CASE WHEN segue_processo THEN 10 ELSE 0 END) +
    (CASE WHEN realizou_vendas THEN 10 ELSE 0 END) +
    (CASE WHEN vendas_recorrentes THEN 10 ELSE 0 END) +
    (CASE WHEN roi_positivo THEN 10 ELSE 0 END)
  ) STORED,
  created_at timestamptz DEFAULT now(),
  UNIQUE(clinica_id, semana)
);

CREATE TABLE IF NOT EXISTS public.alertas_clinica (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clinica_id uuid NOT NULL,
  tipo text NOT NULL,
  nivel integer DEFAULT 1,
  titulo text NOT NULL,
  descricao text,
  resolvido boolean DEFAULT false,
  resolvido_em timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.metas_contrato (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clinica_id uuid NOT NULL UNIQUE,
  meta_cpl numeric(10,2) DEFAULT 5.00,
  meta_agendamento numeric(5,2) DEFAULT 40.00,
  meta_comparecimento numeric(5,2) DEFAULT 50.00,
  meta_fechamento numeric(5,2) DEFAULT 40.00,
  meta_ticket_medio numeric(10,2) DEFAULT 4500.00,
  meta_investimento_mes numeric(10,2) DEFAULT 1500.00,
  data_inicio date DEFAULT CURRENT_DATE,
  data_fim date DEFAULT (CURRENT_DATE + interval '90 days'),
  valor_contrato numeric(10,2) DEFAULT 1500.00,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.funil_diario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jornada_clinica ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adocao_clinica ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas_clinica ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas_contrato ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='funil_diario' AND policyname='acesso_total') THEN
    CREATE POLICY acesso_total ON public.funil_diario FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='jornada_clinica' AND policyname='acesso_total') THEN
    CREATE POLICY acesso_total ON public.jornada_clinica FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='adocao_clinica' AND policyname='acesso_total') THEN
    CREATE POLICY acesso_total ON public.adocao_clinica FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='alertas_clinica' AND policyname='acesso_total') THEN
    CREATE POLICY acesso_total ON public.alertas_clinica FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='metas_contrato' AND policyname='acesso_total') THEN
    CREATE POLICY acesso_total ON public.metas_contrato FOR ALL USING (true);
  END IF;
END $$;

INSERT INTO public.metas_contrato (clinica_id, meta_cpl, meta_agendamento, meta_comparecimento, meta_fechamento, meta_ticket_medio, meta_investimento_mes, valor_contrato)
VALUES ('21e95ba0-8f06-4062-85f0-1b9da496be52', 5.00, 40.00, 50.00, 40.00, 4500.00, 1500.00, 1500.00)
ON CONFLICT (clinica_id) DO NOTHING;

INSERT INTO public.jornada_clinica (clinica_id, etapa, data_inicio)
VALUES ('21e95ba0-8f06-4062-85f0-1b9da496be52', 'D7_ATIVADO', CURRENT_DATE - interval '7 days')
ON CONFLICT (clinica_id) DO UPDATE SET etapa = 'D7_ATIVADO';

INSERT INTO public.funil_diario (clinica_id, data, investimento, leads, leads_respondidos, agendamentos, comparecimentos, fechamentos, faturamento)
SELECT '21e95ba0-8f06-4062-85f0-1b9da496be52', CURRENT_DATE - (n || ' days')::interval,
  floor(random() * 100 + 50), floor(random() * 20 + 10), floor(random() * 15 + 8),
  floor(random() * 8 + 3), floor(random() * 5 + 2), floor(random() * 3 + 1), floor(random() * 10000 + 4500)
FROM generate_series(0, 6) AS n
ON CONFLICT (clinica_id, data) DO NOTHING;

INSERT INTO public.adocao_clinica (clinica_id, semana, assistiu_onboarding, participa_aulas_ao_vivo, assiste_gravado, usa_crm, responde_leads, usa_script, preenche_funil_diario, campanha_ativa, leads_chegando, taxa_resposta_boa, segue_processo, realizou_vendas, vendas_recorrentes, roi_positivo)
VALUES ('21e95ba0-8f06-4062-85f0-1b9da496be52', to_char(CURRENT_DATE, 'IYYY-"W"IW'), true, true, true, true, true, false, true, true, true, true, false, true, false, false)
ON CONFLICT (clinica_id, semana) DO NOTHING;

SELECT 'ERP tables created' as status;
