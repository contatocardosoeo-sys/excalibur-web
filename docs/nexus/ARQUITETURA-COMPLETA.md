# 🏛️ Nexus Atemporal — Arquitetura Completa (Cliente Oculto)

**Auth:** Clerk | **URL base:** https://one.nexusatemporal.com.br
**Visão:** "Gestão inteligente para sua clínica — CRM + agenda + financeiro + estoque + BI + IA"
**Paleta:** dark mode + laranja (#ea580c/#f97316) | Sidebar colapsável | Multi-unidade
**Tema:** "Todas as unidades" dropdown global | "Modo Claro/Escuro" | Busca (⌘K)

---

## 📐 HIERARQUIA COMPLETA DE MÓDULOS (mapeada via CDP)

### 🏠 PRINCIPAL
| Módulo | URL | Features |
|--------|-----|----------|
| **Painel** | `/dashboard` | 4 KPI cards c/ sparkline (Receitas, Leads, Propostas, Conversão) + Evolução Financeira (chart área Todos\|Receitas\|Despesas\|Lucro) |

### 💼 VENDAS (CRM)
| Módulo | URL | Observações |
|--------|-----|-------------|
| **Painel de Vendas** | `/vendas` | Dashboard agregado de vendas |
| **Pistas** (Leads) | `/vendas/pipeline` | Pipeline/funil de leads |
| **Oportunidades** | `/vendas/oportunidades` | Deals qualificados |
| **Propostas** | `/vendas/propostas` | Propostas comerciais |
| **Comercial de Tempo** | `/vendas/time` | Time comercial / SDR |
| **Comissões** | `/vendas/comissoes` | Cálculo de comissões |
| **Metas e OKRs** | `/vendas/metas` | Gestão de metas |
| **Campanhas** | `/vendas/campanhas` | Campanhas de vendas |

### 💬 BATE-PAPO NEXUS
| Módulo | URL | Features |
|--------|-----|----------|
| **Bate-papo Nexus** | `/nexus-chat` | Chat interno "NEXUS CHAT — CONECTADO" / "RENOVAR SESSÃO" |

### 🦷 CLÍNICA
| Módulo | URL | Features |
|--------|-----|----------|
| **Agenda** | `/agenda` | Calendário/Lista/Timeline, KPIs (Hoje, Confirmados, Aguardando, Ausências), Novo Agendamento, Importar/Exportar, Filtros unidades+status |
| **Pacientes** | `/pacientes` | Gestão de pacientes |
| **Lista de Espera** | `/waitlist` | Aguardando/Notificados/Agendados/Urgentes + prioridade + filtro por procedimento |

### 📊 GESTÃO
| Módulo | URL | Sub-abas |
|--------|-----|----------|
| **Financeiro** | `/financeiro` | **IBOARD \| Transações \| Contas a Pagar \| Contas a Receber \| Fluxo de Caixa \| Conciliação \| Fornecedores \| Recibos/NF \| Relatórios \| Centro de Alfândega \| Contas Bancárias \| Categorias \| Estrutura DRE \| ÍRIS** — períodos Hoje/Semana/Mês/Ano |
| **Estoque** | `/estoque` | **Painel \| Produtos \| Movimentações \| Ordens de Compra \| Alertas \| Inventário \| Relatórios \| Configurações** — valor total, vencimento 30d, movimentações |
| **BI e Análise** | `/analytics` | Dashboard analítico cross-module |

### 🤝 COLABORAÇÃO
| Módulo | URL | Uso |
|--------|-----|-----|
| **Nexus Hub** | `/colaboracao/hub` | Hub central do time |
| **Mural e Feed** | `/colaboracao/feed` | Feed social interno |
| **Eventos e Cals** | `/colaboracao/calendar` | Calendário de eventos |
| **Wiki Base** | `/colaboracao/wiki` | Base de conhecimento |
| **Parabéns e um brinde!** | `/colaboracao/cheers` | Reconhecimento/gamificação |
| **Insights Engaj.** | `/colaboracao/analytics` | Engajamento do time |

### 📢 MARKETING
| Módulo | URL | Features |
|--------|-----|----------|
| **Gestor de Anúncios** | `/marketing/ads` | Meta Ads + Google Ads |
| **Assistente IA** | `/marketing/ai-content` | Gerador de conteúdo IA (Íris) |
| **Automações** | `/marketing/automation` | Fluxos automatizados |
| **Reputação** | `/marketing/reputation` | Gestão de reviews |
| **Indicação** | `/marketing/referral` | Programa de indicações |
| **Relatórios Mkt** | `/marketing/reports` | ROI campanhas |
| **Instagram** | `/marketing/instagram` | Integração IG |
| **Disparo WhatsApp** | `/marketing/whatsapp` | Broadcast WhatsApp |
| **Páginas/LPs** | `/lp` | Builder de landing pages |

### 🛠️ SISTEMA
| Módulo | URL | Features |
|--------|-----|----------|
| **Suporte** | `/suporte/chamados` | Tickets de suporte |
| **Configurações** | `/configuracoes/equipe` | Equipe, unidades, permissões |

---

## 🎨 DESIGN SYSTEM DO NEXUS

### Paleta
- **Fundo:** `#0a0a0a` (quase preto)
- **Cards:** cinza escuro com borda sutil
- **Accent primário:** laranja `#ea580c` / `#f97316` (gradiente)
- **Texto:** branco / cinza-300
- **Variáveis CSS:** `--text-secondary`, tema dark

### Componentes visíveis
- **KPI Card:** ícone + label CAPS + valor grande + sparkline + badge %
- **Sidebar:** sections em CAPS (PRINCIPAL, VENDAS, CLÍNICA, etc), item ativo destacado, botão "Recolher"
- **Header:** logo + "Todas as unidades" dropdown + search ⌘K + toggle tema + notificações + avatar
- **Chart:** Recharts ou ApexCharts — gradiente laranja, área suave

### UX patterns
- Multi-unidade via dropdown global (afeta todas as queries)
- Sub-abas internas em módulos grandes (Financeiro tem 14 tabs)
- Períodos consistentes: Hoje | Semana | Mês | Ano
- Ações CRUD inline: "Novo X", "Importar", "Exportar"

---

## 🔌 INTEGRAÇÕES IDENTIFICADAS
- **Clerk** (autenticação)
- **WhatsApp** (disparo + automação)
- **Meta Ads** (gestor de anúncios)
- **Google Ads** (gestor de anúncios)
- **Instagram** (marketing)
- **Íris IA** (assistente IA proprietária — geração de conteúdo + insights financeiros)
- **Nexus Chat** (possível integração com IA/suporte)

---

## 🧠 MODELO DE DADOS IMPLÍCITO (inferido)

```
unidades (multi-tenant)
  ├── usuarios (com roles: comercial, clínica, admin)
  ├── pistas (leads)
  │   ├── oportunidades
  │   │   └── propostas
  │   └── comissoes
  ├── pacientes
  │   ├── agendamentos
  │   ├── lista_espera (c/ prioridade)
  │   └── tratamentos/procedimentos
  ├── financeiro
  │   ├── transacoes (entrada/saída)
  │   ├── contas_pagar
  │   ├── contas_receber
  │   ├── fornecedores
  │   ├── categorias_dre
  │   └── contas_bancarias
  ├── estoque
  │   ├── produtos (c/ validade)
  │   ├── movimentacoes
  │   ├── ordens_compra
  │   └── inventario
  ├── marketing
  │   ├── campanhas
  │   ├── anuncios (Meta+Google)
  │   ├── whatsapp_disparos
  │   └── automacoes (fluxos)
  └── colaboracao
      ├── feed_posts
      ├── eventos
      ├── wiki_artigos
      └── cheers (reconhecimentos)
```

---

## ✅ O QUE O NEXUS FAZ BEM (copiar + melhorar)
1. **Multi-unidade nativa** — permite rede de clínicas
2. **Financeiro profundo** — 14 sub-módulos, DRE estruturado
3. **Estoque clínico completo** — controle de validade, ordens de compra
4. **Colaboração interna** — feed/wiki/cheers (gamificação)
5. **IA proprietária (Íris)** — naming forte + integração contextual
6. **Dashboard unificado** — KPIs + gráficos coesos
7. **Sidebar com 7 seções claras** — navegação previsível

## ❌ O QUE O NEXUS FAZ MAL (oportunidade Excalibur)
1. **WhatsApp é só disparo** — não tem extensão Chrome com respostas rápidas no chat real
2. **Sem mesa de crédito/financeira própria** — não tem simulador ou integração com financeiras
3. **Tradução automática ruim** — "Comercial de Tempo" (Time Comercial), "Pistas" (Leads), "Páginas/LPs", "NDO", "% de impostos" (em vez de "do total")
4. **Paleta laranja é comum** — amber do Excalibur é mais premium
5. **Sem módulo Academia** — não tem treinamento integrado
6. **Automação é genérica** — não é vertical odontológica com fluxos prontos

## 🚀 GAPS DE MERCADO = DIFERENCIAIS EXCALIBUR
1. **Extensão Chrome WhatsApp Web nativa** (Nexus só tem disparo)
2. **Excalibur Pay** — mesa de crédito integrada com revenue share
3. **Fluxos verticais odontológicos prontos** (Recepção → Mapeamento → Fechamento)
4. **Academia interna** (trilhas + scripts + playbooks)
5. **UI premium amber** (vs laranja genérico)
6. **UX em português nativo** (sem traduções automáticas quebradas)
7. **Sistema operacional integrado end-to-end** — Lead → Crédito → Agendamento → Faturamento

---

## 📸 Screenshots capturados
- `01-dashboard.png` — Dashboard principal
- `mod-*.png` — 26 módulos individuais
Total: **27 capturas** | Todas em `docs/nexus/`
