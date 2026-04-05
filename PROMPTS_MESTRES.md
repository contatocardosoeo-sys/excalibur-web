# ⚔️ EXCALIBUR — PROMPT MESTRE
# Cole este prompt no início de cada sessão do Claude Code

---

## PROMPT DE INÍCIO DE SESSÃO

```
Leia o CLAUDE.md e o AGENTS.md completos antes de começar.

Você é o CTO + equipe completa do Excalibur.
Eu sou o CEO. Não me consulte em cada passo — execute com autonomia total.

ESTADO ATUAL DO PROJETO:
- Login + Auth: ✅ funcionando
- Dashboard + Kanban: ✅ funcionando
- CRM Leads: ✅ funcionando
- Extensão Chrome: 🔄 em andamento (styles.css concluído, content.js incompleto)
- Demais módulos: ⬜ aguardando

SUA MISSÃO AGORA:
1. Verifique o estado atual rodando: npm run build
2. Se houver erros, corrija automaticamente
3. Me reporte o status completo
4. Aguarde minha ordem para próxima tarefa

REGRAS DA SESSÃO:
- Execute tudo sem pedir permissão
- Mostre progresso etapa por etapa
- Use MCP Playwright para validar no browser
- Corrija erros sozinho
- Reporte no formato: ✅ CONCLUÍDO / 🧪 TESTE / 📁 ARQUIVOS / ➡️ PRÓXIMO
```

---

## PROMPT — CONTINUAR EXTENSÃO CHROME

```
[DEVOPS + AUTOMAÇÃO] Continue a extensão Chrome do ponto onde parou.

Estado: styles.css ✅ concluído | content.js 🔄 incompleto

Finalize o content.js com:
- Injeção do painel lateral no WhatsApp Web
- Sistema de abas com contadores (Recepção, Mapeamento, Explicação, 
  Agendamento, Agendando, Confirmação, Reagendamento, Lista Fria)
- Respostas rápidas por categoria com cores
- Fluxos com delay de digitação simulada
- Variável #primeiroNome
- Integração Supabase para salvar leads
- Busca e filtros de respostas

Depois finalize o popup.html.

Ao terminar cada arquivo:
- Instrua como recarregar a extensão em chrome://extensions
- Teste no WhatsApp Web e reporte o resultado

Execute sem pedir permissão. Corrija erros sozinho.
```

---

## PROMPT — MÓDULO PACIENTES

```
[ARCHITECT + FRONTEND + BACKEND] Construa o módulo de Pacientes completo.

ETAPA 1 — ARCHITECT:
Crie a tabela no Supabase:
CREATE TABLE pacientes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  cpf text,
  telefone text,
  email text,
  data_nascimento date,
  procedimento text,
  status text DEFAULT 'ativo',
  observacoes text,
  created_at timestamp DEFAULT now()
);

ETAPA 2 — FRONTEND:
Crie app/pacientes/page.tsx com:
- Listagem de pacientes com busca
- Card de cada paciente (nome, telefone, procedimento, status)
- Botão adicionar novo paciente
- Modal para cadastro/edição
- Dark mode + amber obrigatório
- Sidebar existente

ETAPA 3 — QA:
- npm run build deve passar
- Testar em localhost:3000/pacientes
- Validar CRUD completo

Reporte etapa por etapa. Execute sem pedir permissão.
```

---

## PROMPT — MÓDULO AGENDA

```
[ARCHITECT + FRONTEND] Construa o módulo de Agenda completo.

ETAPA 1 — Criar tabela agendamentos no Supabase:
CREATE TABLE agendamentos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id uuid REFERENCES pacientes(id),
  paciente_nome text,
  data date NOT NULL,
  hora time NOT NULL,
  procedimento text,
  status text DEFAULT 'agendado',
  observacoes text,
  created_at timestamp DEFAULT now()
);

ETAPA 2 — Criar app/agenda/page.tsx com:
- Visão de calendário semanal
- Lista de agendamentos do dia
- Status: agendado | confirmado | compareceu | cancelado | no-show
- Botão novo agendamento
- Integração com módulo de pacientes
- Dark mode + amber

ETAPA 3 — QA e validação

Execute sem pedir permissão. Reporte etapa por etapa.
```

---

## PROMPT — MÓDULO FINANCEIRO (EXCALIBUR PAY)

```
[ARCHITECT + BACKEND + FRONTEND] Construa o Excalibur Pay.

ETAPA 1 — Criar tabela propostas no Supabase:
CREATE TABLE propostas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id uuid,
  paciente_nome text,
  procedimento text,
  valor_total decimal,
  entrada decimal,
  parcelas int,
  valor_parcela decimal,
  status text DEFAULT 'pendente',
  financeira text,
  observacoes text,
  created_at timestamp DEFAULT now()
);

ETAPA 2 — Criar app/financeiro/page.tsx com:
- Simulador de parcelamento
- Lista de propostas (pendente | aprovado | negado)
- Cálculo automático de parcelas
- Status de aprovação
- Dark mode + amber

ETAPA 3 — Lógica de simulação:
- Entrada mínima 20%
- Parcelamento 3x a 60x
- Taxa de juros configurável
- Geração de proposta PDF (futuro)

Execute sem pedir permissão. Reporte etapa por etapa.
```

---

## PROMPT — BI E MÉTRICAS

```
[DATA/BI] Construa o dashboard executivo completo.

Crie app/bi/page.tsx com KPIs calculados da tabela leads:

MÉTRICAS PRINCIPAIS:
- Total de leads (período selecionável)
- Taxa de agendamento = Agendado / Total leads
- Taxa de comparecimento = Compareceu / Agendado  
- Taxa de fechamento = Fechou / Compareceu
- CAC estimado (custo por lead configurável)
- ROI estimado

GRÁFICOS:
- Funil de conversão (barras horizontais)
- Leads por dia (linha temporal)
- Leads por procedimento (pizza)
- Leads por etapa atual (kanban resumido)

VISUAL:
- Cards KPI com ícones e variação (↑↓)
- Gráficos com cores amber
- Período: hoje | semana | mês | trimestre
- Dark mode obrigatório

Execute sem pedir permissão. Valide em localhost:3000/bi.
```

---

## PROMPT — DEPLOY VERCEL

```
[DEVOPS] Faça o deploy completo do Excalibur na Vercel.

1. Verificar npm run build passa sem erros
2. Verificar todas as variáveis de ambiente necessárias
3. Criar arquivo .env.example com todas as variáveis
4. Fazer deploy via: npx vercel --prod
5. Configurar variáveis na Vercel dashboard
6. Testar todas as páginas em produção
7. Reportar URL de produção

Variáveis necessárias:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

Execute sem pedir permissão.
```
