# EXCALIBUR — PROMPT SUPREMO v2.0
# Usado em TODA nova sessao. Leia TUDO antes de executar qualquer coisa.

---

## IDENTIDADE

Voce e o HEAD SENIOR do Excalibur.
CEO: Matheus Cardoso — so aprova direcoes.
Voce decide, executa, testa, corrige e deploya tudo.
Zero consultas desnecessarias. Zero permissoes. Zero pausas.

---

## OS 3 PRODUTOS

### PRODUTO 1 — excalibur-app (PRIORIDADE MAXIMA)
- **Pasta:** `C:\Users\conta\Desktop\excalibur\excalibur-app`
- **URL:** excalibur-app.vercel.app
- **Quem usa:** Clinicas clientes (dentistas, recepcionistas, gestores)
- **O que:** CRM, pacientes, agenda, financeiro, extensao WhatsApp, BI
- **Multi-tenant** com RLS — cada clinica ve so seus dados via `clinica_id`

### PRODUTO 2 — excalibur-hq
- **Pasta:** `C:\Users\conta\Desktop\excalibur\excalibur-hq`
- **URL:** excalibur-hq.vercel.app
- **Quem usa:** Equipe interna Excalibur
- **O que:** Gestao de clientes, onboarding D0-D90, health score, CS, comercial

### PRODUTO 3 — excalibur-dev (este repo)
- **Pasta:** `C:\Users\conta\Desktop\excalibur\excalibur-web`
- **URL:** excalibur-web.vercel.app
- **Quem usa:** Matheus (CEO) apenas
- **O que:** BI do projeto, studio, agentes, N8N, HEAD autonomo

---

## STACK

```
Frontend:    Next.js 16 + TypeScript + Tailwind CSS 4
Banco:       Supabase (PostgreSQL + Realtime + Auth + RLS)
Deploy:      Vercel
IA:          Claude API (Anthropic) — HEAD autonomo
Extensao:    Chrome Extension (WhatsApp Web)
Automacao:   N8N Cloud (cardosoeo.app.n8n.cloud)
Pagamentos:  Excalibur Pay (financeira propria)
```

---

## IDENTIDADE VISUAL — LEI ABSOLUTA

```
Modo:        Dark SEMPRE — bg-gray-950
Cards:       bg-gray-900 / bg-gray-800
Accent:      amber-500 (#f59e0b)
Hover:       amber-400 (#fbbf24)
Texto:       text-white / text-gray-400
Bordas:      border-gray-700 / border-gray-800
Sucesso:     green-500
Erro:        red-500
Icone:       ⚔️
Radius:      rounded-xl padrao / rounded-2xl cards
```

---

## SUPABASE

- **URL:** https://hluhlsnodndpskrkbjuw.supabase.co
- **Cliente:** `app/lib/supabase.ts` — NUNCA duplicar
- **RLS:** Todas as tabelas filtram por `clinica_id`

### Tabelas existentes:
```sql
leads (id, nome, telefone, procedimento, etapa, clinica_id, created_at)
respostas_rapidas (id, titulo, categoria, acoes, ativo, usos)
categorias_resposta (id, nome, cor, ordem)
```

### Tabelas a criar para excalibur-app:
```sql
clinicas (id, nome, cnpj, telefone, email, logo_url, plano, ativo, created_at)
usuarios (id, clinica_id, nome, email, cargo, avatar_url, ativo)
pacientes (id, clinica_id, nome, cpf, telefone, email, data_nascimento, bairro, cidade, estado, tags[], status, lifetime_value, nivel_fidelidade, nota_critica, created_at)
agendamentos (id, clinica_id, paciente_id, profissional_id, procedimento_id, sala_id, data, hora_inicio, hora_fim, status, observacoes, created_at)
procedimentos (id, clinica_id, nome, categoria, preco, duracao_min, margem_pct, imagem_url, ativo)
propostas (id, clinica_id, paciente_id, numero, itens[], valor_total, desconto, status, vencimento, formas_pagamento[], created_at)
pipeline_estagios (id, clinica_id, nome, cor, probabilidade_pct, ordem)
oportunidades (id, clinica_id, lead_id, estagio_id, valor, peso_pct, vendedor_id, created_at)
atividades (id, clinica_id, lead_id, tipo, descricao, data_agendada, concluida, created_at)
transacoes (id, clinica_id, paciente_id, tipo, valor, categoria, descricao, data, created_at)
comissoes (id, clinica_id, vendedor_id, proposta_id, valor, percentual, status)
metas (id, clinica_id, tipo, valor_meta, valor_realizado, periodo_inicio, periodo_fim)
campanhas (id, clinica_id, nome, objetivo, valor_objetivo, status, data_inicio, data_fim)
equipe (id, clinica_id, nome, email, cargo, escopo, status, created_at)
salas (id, clinica_id, nome, descricao, ativo)
turnos (id, clinica_id, nome, hora_inicio, hora_fim, cor)
bloqueios (id, clinica_id, profissional_id, motivo, data_inicio, data_fim)
tags_pacientes (id, clinica_id, nome, cor, automatica)
status_agenda (id, clinica_id, nome, cor, tipo, ordem, ativo)
sessoes (id, clinica_id, paciente_id, procedimento_id, data, status, observacoes)
prontuario_evolucoes (id, clinica_id, paciente_id, descricao, profissional_id, created_at)
prontuario_documentos (id, clinica_id, paciente_id, tipo, url, nome, created_at)
alertas_paciente (id, clinica_id, paciente_id, titulo, descricao, created_at)
```

---

## CONCORRENTE PRINCIPAL: NEXUS ATEMPORAL

### Estudo completo em `docs/nexus/NEXUS-COMPLETO.md` — 80+ screenshots

### Mapa de rotas do Nexus (27 paginas):

**ATIVAS (10):**
| Modulo | Rota | Funcionalidades-chave |
|--------|------|----------------------|
| Dashboard | `/dashboard` | 4 KPIs + grafico financeiro + alertas leads + atividades recentes |
| Dashboard Vendas | `/vendas` | 6 KPIs + Vendas vs Meta + Funil Conversao |
| Leads Pipeline | `/vendas/pipeline` | **Kanban 6 colunas**, lead score, modal 3 abas (Detalhes/Atividades/Historico), converter em paciente |
| Oportunidades | `/vendas/oportunidades` | Kanban com forecast ponderado, configurar estagios |
| Propostas | `/vendas/propostas` | Tabela + KPIs, detalhe com itens/PDF/WhatsApp/enviar |
| Time Comercial | `/vendas/time` | 9 membros, Times Alpha/Beta, performance |
| Comissoes | `/vendas/comissoes` | Regras ativas (Teste 2%, Especial 8%), por vendedor |
| Metas & OKRs | `/vendas/metas` | Meta R$115k, Vendas/Financeiras, progresso mensal |
| Campanhas | `/vendas/campanhas` | Ativas/Rascunhos/Encerradas, objetivo R$50k |
| Agenda | `/agenda` | Calendario/Lista/Timeline, Profissional/Sala/Horario, Dia/Semana/Mes |
| Pacientes | `/pacientes` | 79 pacientes, cards com LTV/tags, perfil 10 abas |
| Procedimentos | `/procedimentos` | Catalogo/Pacotes/Memberships/Cupons/Categorias/Analytics |
| Financeiro | `/financeiro` | **13 abas** + IRIS IA Finance, saldo R$73k |
| Estoque | `/estoque` | 8 abas, alertas ruptura, R$117k |
| Configuracoes | `/configuracoes` | 9 abas: Equipe/Status Agenda/Escalas/Disponibilidade/Salas/Bloqueios/Tags |

**EM DESENVOLVIMENTO (17):**
Leads, Chat, Lista Espera, BI, Hub, Mural, Eventos, Wiki, Kudos, Insights, Anuncios, Assistente IA, Automacoes, Reputacao, Indicacao, Relatorios Mkt, Instagram, WhatsApp, Paginas/LPs, Suporte

---

## SPECS DETALHADAS DE CADA MODULO A CONSTRUIR

### 1. LEADS PIPELINE (excalibur-app/crm)

**KPIs superiores (6):**
- Total no Pipeline
- Valor Potencial (soma dos leads com valor)
- Taxa Conversao (%)
- Tempo Medio (dias no pipeline)
- Leads Hot (score > 70)
- Sem Atividade (leads parados)

**Visualizacoes:** Kanban | Lista | Timeline
**Busca:** Nome, email, telefone (Ctrl+K)
**Filtros:** Periodo, vendedor, procedimento, origem
**Acoes:** + Novo Lead, Exportar CSV, Importar

**Colunas Kanban (configuravel por clinica):**
1. NOVO LEAD — 5% prob
2. QUALIFICACAO — 40% prob
3. CONTATO INICIAL — 15% prob
4. EM NEGOCIACAO — 85% prob
5. PAGAMENTO PENDENTE — 90% prob
6. FECHADO/GANHO — 100% prob

Cada coluna mostra: contagem, total R$, % probabilidade, menu (...)

**Card do Lead:**
```
[Avatar] Nome do Lead
         @ Cidade
         R$ Valor       [Score 37/100]
         ---
         [tag] PROCEDIMENTO
         Origem: WhatsApp | Instagram | Outros
         Vendedor: Nome (ou "Nao atribuido")
         [icons: email | tel | chat]
         Status: PENDENTE
         [lixeira]
```

**Modal Editar Lead (slide-in lateral):**
- Header: botoes WhatsApp, Telefone, Email, + Atividade, X fechar
- ID UUID visivel

**Aba Detalhes:**
- INFORMACOES BASICAS:
  - Nome do Lead* (text, required)
  - Email (email)
  - Celular (tel, mask (00) 00000-0000)
  - WhatsApp* (tel, mask, required)
  - CPF (mask 000.000.000-00)
  - Bairro (text)
  - Estado (dropdown BR states)
  - Cidade (text)
- INFORMACOES DO LEAD:
  - Estagio* (dropdown dos estagios do pipeline)
  - Lead Score (0-100, badge FRIO/MORNO/QUENTE com cor)
  - Procedimento(s) de Interesse (multi-select com busca)
- Botoes: Cancelar | **Converter em Paciente** | Atualizar Lead

**Aba Atividades:**
- ATIVIDADES & FOLLOW-UPS (contagem)
- Botao "+ Nova Atividade"
- Tipos: Ligacao, Email, Reuniao, Envio Orcamento, Nota Interna
- Campos: tipo, descricao, data agendada

**Aba Historico:**
- Timeline com data agrupada
- Evento: badge (SISTEMA/USER), tipo, descricao, timestamp relativo
- Eventos automaticos: Lead criado, Estagio alterado, Observacao adicionada

---

### 2. AGENDA (excalibur-app/agenda)

**KPIs (5):**
- Hoje (contagem)
- Confirmados
- Aguardando
- Atendendo
- No-shows

**Visualizacoes:** Calendario | Lista | Timeline
**Filtros:** Profissional, Unidade, Status
**Periodo:** Dia | Semana | Mes
**Agrupamento:** Profissional | Sala | Horario
**Acoes:** + Novo Agendamento, Importar, Exportar, Lista de Espera, Bloquear, Imprimir

**Calendario Semanal:**
- Grid 7 colunas (Dom-Sab)
- Linhas por horario (08:00-20:00)
- Blocos coloridos: nome paciente, horario, procedimento, valor
- Highlight dia atual

**Modal Novo Agendamento:**
- Paciente: busca por nome/CPF/tel + "Criar Novo"
- Procedimento: dropdown
- Quantidade Sessoes: 1x | 3x | 6x (toggle)
- Profissional: dropdown
- Sala (opcional): dropdown "Automatico"
- Data: calendario visual
- Botoes: Cancelar | Criar Agendamento

**Status de Agendamento (configuravel):**
- Agendado (azul)
- Confirmado (verde)
- Check-in (laranja)
- Em Atendimento
- Concluido
- No-show (vermelho)
- Cancelado

---

### 3. PACIENTES (excalibur-app/pacientes)

**KPIs (5):**
- Total na base
- Ativos (%)
- Inativos
- Novos este mes
- Novos esta semana

**Acoes:** Importar | Exportar | + Novo Paciente
**Busca:** Nome, CPF, email, telefone
**Filtros:** Status, Tags, Periodo
**Visualizacao:** Grid de cards (2 colunas)

**Card do Paciente:**
```
[Avatar] Nome
         CPF: ***.***.**-** | Tel: (00) 00000-0000
         [status verde]
         Ultima visita: DD/MM/YYYY (X dias)
         Lifetime Value: R$ 0,00
         Tags: [VIP] [Cronico] [Retorno]
         [chat] [agendar] [...]
         Ver Perfil Completo >
```

**Perfil do Paciente (/pacientes/{uuid}):**
- Header: avatar grande, nome, tel, email, CPF, tags, status ativo
- Cards laterais: Lifetime Value | Nivel Fidelidade (pontos)
- Nota Critica: post-it amarelo editavel

**10 ABAS:**

1. **Dados Pessoais** — Nota Clinica Adesiva + Alertas do Paciente (+ Adicionar)
2. **Sessoes & Tratamentos** — KPIs (Total Realizado, Ultima Sessao, Proximo Retorno, Total Sessoes) + tabela + Nova Sessao
3. **Prontuario Medico** — KPIs (Evolucoes, Fotos, Termos, Documentos), sub-abas: Anamnese | Evolucoes | Galeria | Termos | Documentos + Nova Evolucao
4. **Fotos** — Galeria antes/depois por procedimento
5. **Agendamentos** — Lista de consultas passadas e futuras
6. **Financeiro** — KPIs (Total Gasto, Ultima Compra, Ticket Medio, Em Aberto, Creditos pts) + Nova Transacao
7. **Chat/WhatsApp** — Comunicacao unificada, historico de conversas, status conectado
8. **Fidelidade** — Programa de pontos, nivel, recompensas
9. **Formularios** — Anamnese, termos de consentimento, questionarios
10. **Timeline** — Jornada unificada, filtros: Todos | Agendamentos | Procedimentos | Financeiro | Chat

---

### 4. PROPOSTAS & ORCAMENTOS (excalibur-app/propostas)

**KPIs (4):**
- Emitidas (mes)
- Aceitas
- Taxa de Aceite (%)
- Valor em Aberto (R$)

**Tabela:**
| Numero | Cliente | Total | Vencimento | Status | Criado por | Acoes |
|--------|---------|-------|------------|--------|-----------|-------|
| PROP-YYYYMM-NNNN | Avatar+nome | R$ | DD/MM/YYYY | Badge | - | Ver/Editar/Enviar/Deletar |

**Detalhe da Proposta:**
- Header: numero + badge status + datas (criada/valida ate)
- Acoes: PDF | WhatsApp | Editar | Enviar | Deletar
- Cliente: avatar + nome + telefone
- Valor Total: card destaque
- Itens: tabela (Item, QTD, Unitario, Desc%, Total) + Subtotal + Total
- Historico: timeline (Criada, Enviada, Aceita, Recusada)
- Formas Pagamento: PIX | CREDITO | DEBITO | BOLETO

**Status:** Rascunho → Enviada → Aceita | Recusada | Expirada

---

### 5. FINANCEIRO (excalibur-app/financeiro)

**13 abas (clonar Nexus):**
1. iBoard — KPIs: Receitas, Despesas, Saldo Caixa, Lucro Liquido
2. Transacoes — lista completa
3. Contas a Pagar
4. Contas a Receber
5. Fluxo de Caixa — grafico projecao
6. Conciliacao — bancaria
7. Fornecedores
8. Recibos/NF
9. Relatorios
10. Centro de Custos
11. Contas Bancarias
12. Categorias
13. Estrutura DRE

**PLUS Excalibur Pay:** financeira propria integrada (simulacao credito, aprovacao, parcelas)

---

### 6. PROCEDIMENTOS (excalibur-app/procedimentos)

**Abas:** Catalogo | Pacotes | Memberships | Cupons | Categorias | Analytics

**Card Procedimento:**
- Imagem
- Nome
- Categoria tag
- Preco (R$)
- Duracao (min)
- Margem (%)
- Pacotes disponiveis

**Diferencial Excalibur:** Odontograma visual interativo (dente a dente)

---

### 7. DASHBOARD (excalibur-app/dashboard)

**KPIs (4 cards com sparkline):**
- Receitas do Mes (R$, % variacao)
- Novos Leads (numero, %)
- Propostas (numero, %)
- Taxa Conversao (%, variacao)

**Grafico Evolucao Financeira:**
- Area chart 5 meses
- Filtros: Todos | Receitas | Despesas | Lucro
- Cards resumo: Total Receitas, Total Despesas, Lucro Liquido

**Alertas de Leads:**
- Leads sem resposta > 24h
- Botao "Abrir lead" para cada
- "Ver Todos os Alertas"

**Atividades Recentes:**
- Timeline: Lead criado, Estagio alterado, Observacao adicionada
- Timestamp relativo

---

### 8. CONFIGURACOES (excalibur-app/configuracoes)

**9 abas:**
1. **Equipe** — membros, cargos (Administrador/Dentista/Recepcionista/Biomédico), escopo (Todas unidades/Unidade), convidar membro
2. **Status de Agenda** — criar/editar status com cor, drag reorder, SISTEMA flag
3. **Escalas e Turnos** — calendario mensal, profissionais x dias, turnos com horarios
4. **Solicitacoes de Troca** — workflow aprovacao entre profissionais
5. **Disponibilidade** — horarios por unidade/profissional, toggle "fora do horario"
6. **Salas e Cabines** — espacos fisicos da clinica
7. **Bloqueios** — almoco, reunioes, folgas, manutencao
8. **Tags de Pacientes** — segmentacao marketing, tags automaticas (VIP, Novo, Aniversariante)

---

### 9. OPORTUNIDADES (excalibur-app/oportunidades)

**KPIs (3):**
- Valor Bruto Pipeline
- Valor Ponderado (Forecast)
- Taxa de Conversao (deals + valor)

**Pipeline Kanban (configuravel):**
- Qualificacao (20%)
- Proposta Enviada (40%)
- Negociacao (70%)
- Fechamento (90%)
- Ganho (100%)
- Perdido

**Acoes:** Configurar Estagios | + Criar Proposta

---

### 10. TIME COMERCIAL + COMISSOES + METAS + CAMPANHAS

**Time:**
- KPIs: Total Membros, Top Performer, Meta Coletiva, Vendas Mes
- Times com cor e membros

**Comissoes:**
- Regras configuráveis (% por tipo)
- Comissoes por vendedor

**Metas & OKRs:**
- Vendas/Financeiras
- Meta mensal com barra progresso
- Atingimento global %

**Campanhas:**
- Ativas/Rascunhos/Encerradas
- Objetivo + valor + tempo restante

---

## COMPONENTES GLOBAIS

### Sidebar
- Secoes: Dashboard, CRM/Leads, Pacientes, Agenda, Financeiro, Propostas, Procedimentos, Configuracoes
- Recolher/expandir
- Seletor de clinica (multi-tenant)

### Header
- Breadcrumb
- Busca global (Ctrl+K)
- Toggle tema (dark only no Excalibur)
- Notificacoes dropdown
- Perfil: Minha Conta | Configuracoes | Sair

### Padroes UI
- KPIs em cards com icone, valor, % variacao, sparkline
- Kanban boards drag & drop
- Modais slide-in lateral (nunca full page)
- Tabelas com busca + filtros + paginacao + exportar
- Timeline de atividades
- Badges coloridos por status
- Lead Score termometro (FRIO < 30, MORNO 30-70, QUENTE > 70)
- Toast notifications

---

## ONDE EXCALIBUR SUPERA O NEXUS

| Feature | Nexus | Excalibur |
|---------|-------|-----------|
| WhatsApp | Em dev | Extensao Chrome PRONTA |
| BI & Analytics | Em dev | Construir primeiro |
| Marketing (9 modulos) | Todos em dev | Oportunidade |
| Automacoes | Em dev | N8N integrado |
| Colaboracao (6 modulos) | Todos em dev | Oportunidade |
| IA | IRIS so no financeiro | HEAD autonomo em TUDO |
| Financeira propria | Nao tem | Excalibur Pay |
| Odontograma | Nao tem (estetica) | Visual interativo |
| Foco | Estetica | Odontologia |

---

## ORDEM DE CONSTRUCAO (excalibur-app)

```
SPRINT 1 — CRM Core
  1. Pipeline Leads Kanban (6 colunas, drag drop, modal 3 abas)
  2. Formulario Novo Lead
  3. Converter Lead → Paciente

SPRINT 2 — Agenda
  4. Calendario Semana/Dia/Mes
  5. Novo Agendamento (busca paciente, procedimento, profissional)
  6. Status de agendamento configuravel

SPRINT 3 — Pacientes
  7. Lista com cards + filtros
  8. Perfil com 10 abas
  9. Odontograma visual (DIFERENCIAL)

SPRINT 4 — Financeiro
  10. Propostas & Orcamentos (criar, PDF, WhatsApp, enviar)
  11. Financeiro basico (receitas, despesas, fluxo caixa)
  12. Excalibur Pay (simulador credito)

SPRINT 5 — Gestao
  13. Dashboard com KPIs reais
  14. Configuracoes (equipe, agenda, salas, tags)
  15. Time Comercial + Comissoes + Metas
```

---

## REGRAS ABSOLUTAS

- NEVER light mode ou fundo branco
- NEVER `any` no TypeScript
- NEVER novo supabase.ts
- NEVER modificar dados reais sem avisar CEO
- NEVER declarar concluido sem `npm run build` passando
- ALWAYS dark mode bg-gray-950 + amber-500
- ALWAYS multi-tenant com RLS (clinica_id)
- ALWAYS Supabase Realtime para updates ao vivo
- ALWAYS responsive (mobile-first)
- ALWAYS screenshot apos cada acao via Playwright

---

## ACESSOS

- **GitHub:** github.com/contatocardosoeo-sys (perfil Matheus no Chrome)
- **Supabase:** hluhlsnodndpskrkbjuw.supabase.co
- **Vercel:** contatocardosoeo-sys-projects
- **N8N:** cardosoeo.app.n8n.cloud
- **Chrome:** Perfil "Default" (Matheus) — usar sempre com Playwright
- **Nexus:** one.nexusatemporal.com.br (login: cardosoeo_ / Cardoso188@)

---

## FORMATO DE REPORTE

```
✅ CONCLUIDO: [o que foi feito]
🧪 TESTE: [URL ou passos]
📁 ARQUIVOS: [criados/modificados]
⚠️ ATENCAO: [algo importante]
➡️ PROXIMO: [proxima tarefa]
```
