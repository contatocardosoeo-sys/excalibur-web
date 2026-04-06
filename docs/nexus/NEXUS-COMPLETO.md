# NEXUS ATEMPORAL — Documentação Completa de Engenharia Reversa
## Capturado em 06/04/2026 — Conta: contato.cardosoeo@gmail.com

---

## ARQUITETURA GERAL

**URL:** https://one.nexusatemporal.com.br
**Stack:** React SPA, sidebar fixa, light mode padrão (tem dark mode toggle)
**Layout:** Sidebar esquerda permanente + área principal + header com busca/notificações/perfil

---

## MAPA COMPLETO DE ROTAS (27 páginas)

### PRINCIPAL
| Rota | Status | Descrição |
|------|--------|-----------|
| `/dashboard` | ATIVO | KPIs + Evolução Financeira + Alertas Leads + Atividades Recentes |

### VENDAS (8 rotas)
| Rota | Status | Descrição |
|------|--------|-----------|
| `/vendas` | ATIVO | Dashboard Vendas — 6 KPIs + gráfico Vendas vs Meta + Funil Conversão |
| `/vendas/pipeline` | ATIVO | **Pipeline de Leads** — Kanban completo com 6 colunas |
| `/vendas/leads` | EM DEV | Módulo em desenvolvimento |
| `/vendas/oportunidades` | ATIVO | Pipeline Oportunidades — Kanban com valor/forecast/conversão |
| `/vendas/propostas` | ATIVO | Propostas & Orçamentos — tabela + KPIs + ações |
| `/vendas/time` | ATIVO | Time Comercial — membros, times, busca |
| `/vendas/comissoes` | ATIVO | Comissões — regras ativas, % por vendedor |
| `/vendas/metas` | ATIVO | Metas & OKRs — meta R$115k, progresso, barra |
| `/vendas/campanhas` | ATIVO | Campanhas de Vendas — Ativas/Rascunhos/Encerradas |

### NEXUS CHAT (1 rota)
| Rota | Status | Descrição |
|------|--------|-----------|
| `/chat` | EM DEV | Módulo em desenvolvimento |

### CLÍNICA (4 rotas)
| Rota | Status | Descrição |
|------|--------|-----------|
| `/agenda` | ATIVO | Agenda — Calendário/Lista/Timeline, Profissional/Sala/Horário, Dia/Semana/Mês |
| `/pacientes` | ATIVO | Pacientes — 79 total, cards com CPF/tel/LTV/tags, filtros Status/Tags/Período |
| `/procedimentos` | ATIVO | Procedimentos & Serviços — Catálogo/Pacotes/Memberships/Cupons/Categorias/Analytics |
| `/lista-espera` | EM DEV | Módulo em desenvolvimento |

### GESTÃO (3 rotas)
| Rota | Status | Descrição |
|------|--------|-----------|
| `/financeiro` | ATIVO | **13 abas**: iBoard/Transações/Contas a Pagar/Receber/Fluxo Caixa/Conciliação/Fornecedores/Recibos-NF/Relatórios/Centro Custos/Contas Bancárias/Categorias/Estrutura DRE + IRIS IA Finance |
| `/estoque` | ATIVO | **8 abas**: Dashboard/Produtos/Movimentações/Ordens Compra/Alertas/Inventário/Relatórios/Configurações |
| `/bi` | EM DEV | Módulo em desenvolvimento |

### COLABORAÇÃO (6 rotas — TODAS EM DEV)
| Rota | Status |
|------|--------|
| `/hub` | EM DEV |
| `/mural` | EM DEV |
| `/eventos` | EM DEV |
| `/wiki` | EM DEV |
| `/kudos` | EM DEV |
| `/insights` | EM DEV |

### MARKETING (9 rotas — TODAS EM DEV)
| Rota | Status |
|------|--------|
| `/marketing/anuncios` | EM DEV |
| `/marketing/assistente` | EM DEV |
| `/marketing/automacoes` | EM DEV |
| `/marketing/reputacao` | EM DEV |
| `/marketing/indicacao` | EM DEV |
| `/marketing/relatorios` | EM DEV |
| `/marketing/instagram` | EM DEV |
| `/marketing/whatsapp` | EM DEV |
| `/marketing/paginas` | EM DEV |

### SISTEMA (2 rotas)
| Rota | Status | Descrição |
|------|--------|-----------|
| `/suporte` | EM DEV | Módulo em desenvolvimento |
| `/configuracoes` | ATIVO | **9 abas**: Equipe/Status Agenda/Escalas e Turnos/Solicitações Troca/Disponibilidade/Sales e Cabines/Bloqueios/Tags de Pacientes |

---

## MÓDULOS ATIVOS — DRILL-DOWN DETALHADO

### 1. DASHBOARD (`/dashboard`)
**KPIs (4 cards):**
- Receitas do Mês (R$, % variação, sparkline)
- Novos Leads (número, % variação)
- Propostas (número, % variação)
- Taxa Conversão (%, variação)

**Gráfico Evolução Financeira:**
- Filtros: Todos | Receitas | Despesas | Lucro
- Área chart com 5 meses (Dez-Abr)
- Cards: Total Receitas, Total Despesas, Lucro Líquido (com % vs mês anterior)

**Alertas de Leads:**
- Lista de leads sem resposta há +24h
- Cada alerta: avatar, nome, tempo (horas), botão "Abrir lead"
- Botão "Ver Todos os Alertas"

**Atividades Recentes:**
- Timeline: Lead criado, Observação via nexus-chat-copilot, Estágio alterado
- Timestamp relativo (1h, 1dia, 3dias)

**Header:**
- Busca global "Buscar por pacientes, agendamentos..."
- Toggle tema (Modo Escuro)
- Notificações (dropdown com lista ou "Tudo limpo!")
- Perfil: Minha Conta | Configurações | Sair da Sessão
- Seletor "Todas unidades" (multi-unidade)

### 2. LEADS PIPELINE (`/vendas/pipeline`)
**KPIs superiores (6 cards):**
- Total no Pipeline: 18
- Valor Potencial: R$2k
- Taxa Conversão: 91.7%
- Tempo Médio: 10.1 dias
- Leads Hot: 0
- Sem Atividade: 18

**Visualizações:** Kanban | Lista | Timeline | Ajustes | Filtros
**Busca:** "Buscar por nome, email ou telefone... (Ctrl+K)"
**Filtro período:** "Todas as datas"
**Ações:** Exportar (download), Import, + Novo Lead

**Colunas Kanban:**
1. NOVO LEAD (12) — Total R$0, 5% prob.
2. QUALIFICAÇÃO (2) — Total R$0, 40% prob.
3. CONTATO INICIAL (2) — Total R$2.000, 15% prob.
4. EM NEGOCIAÇÃO (1) — Total R$0, 85% prob.
5. PAGAMENTO PENDENTE (1) — Total R$0, 90% prob.
6. FECHADO/GANHO — Total R$0

**Card do Lead:**
- Avatar com iniciais + cor
- Nome + cidade
- Valor (R$ ou "Sem valor")
- Lead Score badge (ex: 28/100, 37/100) com cor (vermelho=frio, verde=quente)
- Procedimento tag (RINOMODELAÇÃO, PEELING, etc.)
- Origem: Outros, WhatsApp, Instagram
- Vendedor atribuído (ou "Não atribuído")
- Status: PENDENTE
- Ícones: email, telefone, chat
- Botão deletar (lixeira)

**Modal "Editar Lead" (slide-in lateral):**
- **Header:** WhatsApp button, Telefone, Email, + Atividade, X fechar
- **ID:** UUID visível
- **3 abas:** Detalhes | Atividades | Histórico

**Aba Detalhes:**
- INFORMAÇÕES BÁSICAS:
  - Nome do Lead* (text)
  - Email (email)
  - Celular (text)
  - WhatsApp* (text)
  - CPF (masked: 000.000.000-00)
  - Bairro (text)
  - Estado (dropdown)
  - Cidade (text)
- INFORMAÇÕES DO LEAD:
  - Estágio* (dropdown: Novo Lead, Qualificação, Contato Inicial, Em Negociação, etc.)
  - Lead Score (badge: 28/100 FRIO)
  - Procedimento(s) de Interesse (multi-select)
- **Botões:** Cancelar | Converter em Paciente | Atualizar Lead

**Aba Atividades:**
- ATIVIDADES & FOLLOW-UPS (contagem)
- Botão "+ Nova Atividade"
- Registrar: ligações, envios de orçamento, notas internas

**Aba Histórico:**
- Timeline com data agrupada
- Cada evento: badge (SISTEMA/USER), tipo, descrição, timestamp relativo
- "FIM DE HISTÓRICO"

### 3. OPORTUNIDADES (`/vendas/oportunidades`)
**KPIs (3 cards):**
- Valor Bruto Pipeline: R$19.680
- Valor Ponderado (Forecast): R$13.402
- Taxa de Conversão: 85.7% dos deals, 90.2% do valor (6 ganhas de 7 fechadas)

**Ações:** Configurar Estágios | + Criar Proposta
**Busca:** "Buscar por cliente, procedimento, vendedor..."
**Filtro + Export**

**Colunas Pipeline:**
1. QUALIFICAÇÃO (1) — Total R$1.000, 20% prob.
2. PROPOSTA ENVIADA (0) — Total R$0, 40% prob.
3. NEGOCIAÇÃO (0) — Total R$0, 70% prob.
4. FECHAMENTO (0) — Total R$0, 90% prob.
5. GANHO (0) — Total R$14.680, 100% prob.
6. PERDIDO — Total R$1.000

**Card da Oportunidade:**
- Avatar + nome
- Badge procedimento
- Valor total + peso (%)
- Ícones: configuração

### 4. PROPOSTAS (`/vendas/propostas`)
**KPIs (4 cards):**
- Emitidas (Mês): 14
- Aceitas: 9
- Taxa de Aceite: 64%
- Valor em Aberto: R$3.400,00

**Ações:** + Nova Proposta
**Busca:** "Buscar por número ou cliente..."
**Filtro status:** Todos os status

**Tabela:**
| Coluna | Tipo |
|--------|------|
| Número | PROP-YYYYMM-NNNN |
| Cliente | Avatar + nome |
| Total | R$ valor |
| Vencimento | DD/MM/YYYY |
| Status | Badge: RASCUNHO, ACEITA |
| Criado por | - |
| Ações | Ver / Editar / Enviar / Deletar |

### 5. AGENDA (`/agenda`)
**KPIs (5 cards):**
- Hoje: contagem
- Confirmados: contagem
- Aguardando: contagem
- Atendendo: contagem
- No-shows: contagem

**Visualizações:** Calendário | Lista | Timeline
**Filtros:** Todos os Profissionais | Todas as Unidades | Status
**Período:** Dia | Semana | Mês
**Agrupamento:** Profissional | Sala | Horário
**Ações:** + Novo Agendamento, Importar, Exportar, Lista de Espera, Bloquear, Imprimir

**Calendário semanal:**
- Grid com dias da semana
- Blocos coloridos: nome paciente, horário, procedimento, valor
- Highlight do dia atual

### 6. PACIENTES (`/pacientes`)
**KPIs (5 cards):**
- Total: 79 pacientes na base
- Ativos: 74 (93.7% da base)
- Inativos: 5 pacientes inativos
- Novos: 0 este mês
- Semana: 0 novos esta semana

**Ações:** Importar | Exportar | + Novo Paciente
**Busca:** "Buscar por nome, CPF, email ou telefone..."
**Filtros:** Todos os Status | Todas as Tags | Todos os Períodos

**Card do Paciente:**
- Avatar com iniciais + cor
- Nome
- CPF (masked)
- Telefone
- Status indicator (verde = ativo)
- Última visita (data + dias atrás)
- Lifetime Value: R$ valor
- Tags: VIP, Crônico, Retorno
- Ações: Chat, Agendar, Menu (...)
- "Ver Perfil Completo" link

### 7. PROCEDIMENTOS (`/procedimentos`)
**Abas:** Catálogo | Pacotes | Memberships | Cupons | Categorias | Analytics
**KPIs:**
- Total: 4 procedimentos
- Ativos: 4 no catálogo
- Com Pacotes: 4 procedimentos
- Top Preço: BOTOX DO NAR...
- Categorias: 1

**Ação:** + Novo Procedimento
**Visualização:** Grid | Lista
**Filtro:** Todas Categorias

**Card Procedimento:**
- Imagem
- Nome (BOTOX, BOTOX DO NARIZ, CRIOLIPÓLISE, DEPILAÇÃO A LASER)
- Categoria tag
- Preço (R$3.000, R$350)
- Duração (45 min)
- Margem (43%)
- "PACOTES DISPONÍVEIS"

### 8. FINANCEIRO (`/financeiro`)
**13 abas:** iBoard | Transações | Contas a Pagar | Contas a Receber | Fluxo de Caixa | Conciliação | Fornecedores | Recibos/NF | Relatórios | Centro de Custos | Contas Bancárias | Categorias | Estrutura DRE | IRIS (IA)

**Filtro período:** Hoje | Esta Semana | Este Mês | Este Ano

**KPIs iBoard (4):**
- Receitas: R$0,00
- Despesas: R$0,00
- Saldo em Caixa: R$73.476,23
- Lucro Líquido: R$0,00

**IRIS Finance AI Assistant:**
- Chatbot integrado para insights financeiros
- Botão "Conversar com IRIS"

**Alertas Críticos:**
- Finanças saudáveis / Sem alertas

### 9. ESTOQUE (`/estoque`)
**8 abas:** Dashboard | Produtos | Movimentações | Ordens de Compra | Alertas | Inventário | Relatórios | Configurações

**KPIs Dashboard (4):**
- Valor Total Estoque: R$117.786,00
- Produtos Cadastrados: 5 itens
- Movimentações Hoje: 0
- Vencendo (30 dias): 2

**Alertas Críticos de Inventário:**
- Sem Estoque: 1
- Estoque Mínimo: 1
- Vence Breve: 0
- Vencidos: 2

### 10. CONFIGURAÇÕES (`/configuracoes`)
**9 abas:** Equipe | Status de Agenda | Escalas e Turnos | Solicitações de Troca | Disponibilidade | Sales e Cabines | Bloqueios | Tags de Pacientes

**Equipe:**
- 17 membros na organização
- Botão "+ Convidar Membro"
- Busca por nome ou email
- Filtros: Todos os cargos | Todos

**Tabela membros:**
| Coluna | Dados |
|--------|-------|
| Membro | Email + avatar |
| Cargo | Badge: Administrador, Biomédico |
| Escopo | Todas unidades / Unidade |
| Status | Ativo/Inativo |
| Desde | Data |
| Ações | Ver, Editar, Deletar |

---

## MÓDULOS EM DESENVOLVIMENTO (17 de 27)
Leads, Chat, Lista Espera, BI, Hub, Mural, Eventos, Wiki, Kudos, Insights, Anúncios, Assistente IA, Automações, Reputação, Indicação, Relatórios Mkt, Instagram, WhatsApp, Páginas/LPs, Suporte

---

## COMPONENTES GLOBAIS

### Sidebar
- Seções: Principal, Vendas, Nexus Chat, Clínica, Gestão, Colaboração, Marketing, Sistema
- Botão "Recolher" (minimiza)
- Seletor "Todas unidades" (multi-tenant)

### Header
- Breadcrumb: NEXUS > Nome da Página
- Busca global (Ctrl+K)
- Toggle tema
- Notificações
- Perfil dropdown

### Padrões de UI
- KPIs em cards com ícone, valor, % variação, sparkline
- Kanban boards drag & drop
- Modais slide-in lateral
- Tabelas com busca + filtros + paginação + exportar
- Timeline de atividades
- Badges coloridos por status
- Lead Score com termômetro (FRIO/MORNO/QUENTE)

---

## O QUE O EXCALIBUR DEVE CLONAR + SUPERAR

### 11. PERFIL DO PACIENTE (`/pacientes/{uuid}`)
**Header:**
- Avatar grande com iniciais + cor
- Nome completo
- Telefone, Email, CPF
- Tags: VIP, Crônico
- Status ativo (badge verde)
- Botão deletar

**Cards laterais:**
- Lifetime Value: R$ valor (link para detalhes)
- Nível Fidelidade: pontos acumulados (estrela)

**Nota Crítica:** Post-it amarelo editável (markdown)

**10 abas:**
1. Dados Pessoais — formulário completo
2. Sessões & Tratamentos — histórico de procedimentos
3. Prontuário — notas clínicas
4. Fotos — galeria antes/depois
5. Agendamentos — lista de consultas
6. Financeiro — contas, pagamentos, inadimplência
7. Chat/WhatsApp — histórico de conversas
8. Fidelidade — programa de pontos
9. Formulários — anamnese, termos
10. Timeline — jornada unificada com filtros (Todos/Agendamentos/Procedimentos/Financeiro/Chat)

### 12. DETALHE DA PROPOSTA (`/vendas/propostas/{uuid}`)
**Header:** Número PROP-YYYYMM-NNNN + badge status + datas
**Ações:** PDF | WhatsApp | Editar | Enviar | Deletar

**Seções:**
- Cliente: avatar + nome + telefone
- Valor Total: card destaque (R$ valor)
- Itens: tabela (Item, QTD, Unitário, Desc.%, Total) + Subtotal + Total
- Histórico: timeline de eventos (Criada, Enviada, Aceita, etc.)
- Formas de Pagamento: badges (PIX, CREDIT, etc.)

---

### CLONAR (Nexus já tem):
1. Dashboard com KPIs + gráficos + alertas
2. Pipeline Leads Kanban (6 colunas, drag & drop)
3. Oportunidades Kanban com forecast ponderado
4. Propostas com status + ações
5. Agenda Calendário/Lista/Timeline
6. Pacientes com LTV + tags + filtros
7. Procedimentos com catálogo + preços + margem
8. Financeiro com 13 sub-módulos + IA
9. Estoque com alertas de ruptura
10. Time Comercial com times + performance
11. Comissões com regras configuráveis
12. Metas & OKRs com progresso
13. Campanhas de vendas
14. Configurações multi-tenant

### SUPERAR (Nexus não tem ou é fraco):
1. **WhatsApp nativo** — Nexus Chat em desenvolvimento, Excalibur tem extensão Chrome
2. **BI & Analytics** — Nexus em desenvolvimento, Excalibur pode lançar primeiro
3. **Marketing completo** — 9 módulos todos em dev no Nexus
4. **Automações** — Em dev no Nexus
5. **Colaboração** — 6 módulos todos em dev
6. **Financeira própria (Excalibur Pay)** — Nexus não tem
7. **Odontograma visual** — Nexus é estética, Excalibur é odonto
8. **HEAD IA autônomo** — Nexus tem IRIS só para financeiro
