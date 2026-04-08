# ⚔️ EXCALIBUR OS — DOCUMENTO BASE DO PROJETO
**Versao:** 2.0 | **Data:** 08/04/2026
**Status:** DOCUMENTO VIVO — atualizar sempre antes de implementar

---

## 🎯 OBJETIVO CENTRAL

Construir o Excalibur OS — sistema operacional completo para:
- Excalibur vender para clinicas (INTERNO)
- Clinicas venderem para pacientes (EXTERNO)

Usando 1 unica engine comercial:
- Extensao CRC (clone Aceler/WaSeller)
- CRM integrado (HQ + APP)
- BI + Automacoes + IA por cima

---

## 🏗️ ARQUITETURA (NAO MUDAR)

```
EXTENSAO = EXECUCAO (onde a venda acontece)
CRM      = ORGANIZACAO (onde os dados vivem)
BI + IA  = INTELIGENCIA (onde as decisoes sao tomadas)
N8N      = AUTOMACAO (onde as rotinas rodam)
```

### 3 produtos. 1 core.
```
excalibur-hq  → equipe interna Excalibur
excalibur-app → clinicas clientes
excalibur-ext → extensao Chrome (os dois usam)
```

### Stack (nao mudar sem decisao documentada):
- Next.js 16 + TypeScript + Tailwind
- shadcn/ui dark amber (INVIOLAVEL)
- Supabase (PostgreSQL + Auth + RLS + Realtime)
- Vercel (deploy automatico)
- N8N Cloud
- Claude API
- Asaas (cobranca)

---

## 🔄 DUPLA OPERACAO

| | INTERNO | EXTERNO |
|--|---------|---------|
| Quem usa | SDR Trindade + Closer | CRC + Recepcao + Orcamento |
| Lead e | Clinica | Paciente |
| Ticket | R$ 297-997/mes | R$ 500-50k |
| Funil | B2B | B2C |
| CRM | excalibur-hq | excalibur-app |
| Score | Faturamento + Urgencia + Decisao | Dor + Urgencia + Financeiro |

---

## 📊 FONTE 1 — JORNADA DO CLIENTE (D0-D90)

### Pipeline obrigatorio:

**ONBOARDING (D0-D7):**
- D0: Pagamento confirmado + boas-vindas
- D1-D2: Onboarding iniciado + acessos
- D3-D5: Campanha configurada
- D6-D7: Campanha ativa (ATIVADO)

**ADOCAO (D7-D30):**
- Leads chegando
- Cliente respondendo leads
- Taxa de resposta >= 85%
- Marco D15 (health score inicial)
- Classificacao D30 (saudavel/atencao/risco)

**ESCALA (D30-D90):**
- Estavel → Crescendo → Expansao
- NPS D30
- Check-up D60
- Indicacao D90

### Health Score:
```
score = adocao(40) + operacao(30) + resultado(30)
>=80 = saudavel | 60-79 = atencao | <60 = risco
```

### SLA por fase:
- Onboarding: max D3 para ativar
- Adocao: responder lead em < 1h
- Escala: reuniao mensal obrigatoria

---

## 📊 FONTE 2 — COMERCIAL + MARKETING (DADOS REAIS)

### Operacao atual:
- 2 closers x 5 reunioes/dia = 10 reunioes/dia
- 220 reunioes/mes (capacidade maxima)
- Ticket medio: R$ 2.000

### Baseline (meta ideal):
| Metrica | Meta | Regra |
|---------|------|-------|
| CPL | R$ 10,68 | <=12 verde / 13-15 amarelo / >15 vermelho |
| Agendamento | 35,25% | >=35% verde / 30-34% amarelo / <30% vermelho |
| Comparecimento | 71,30% | >=70% verde / 65-69% amarelo / <65% vermelho |
| Qualificacao | 82,56% | >=75% verde / 65-74% amarelo / <65% vermelho |
| Conversao | 24,09% | >=24% verde / 20-23% amarelo / <20% vermelho |
| CAC | R$ 188,94 | <=200 verde / 201-300 amarelo / >300 vermelho |

### 3 niveis de meta:
| Meta | Faturamento | Vendas | Reunioes/mes |
|------|-------------|--------|--------------|
| Minima | R$ 74.000 | 37 | 153 |
| Normal | R$ 90.000 | 45 | 187 |
| Super | R$ 106.000 | 53 | 220 |

### Alertas automaticos:
- Agendamento < 30% → GARGALO
- Comparecimento < 65% → GARGALO
- CAC > R$ 300 → GARGALO
- Conversao < 20% → GARGALO

---

## 📊 FONTE 3 — EXTENSAO (BACKUPS OPERACIONAIS)

### Estrutura:
- 89 respostas reais (extraidas do WaSeller)
- 15 categorias com fluxos reais
- Backup hierarquico: Global → Empresa → Usuario

### Roles:
- SDR: prospeccao B2B
- CLOSER: fechamento B2B
- CRC: atendimento B2C
- RECEPCAO: agendamento B2C
- ORCAMENTO: fechamento B2C

### Fluxo de envio:
1. Selecionar resposta
2. Substituir variaveis (#primeiroNome, #procedimento, etc)
3. Confirmar envio
4. Simular digitacao com delay
5. Registrar no CRM automaticamente

---

## 🤖 CAMADA DE INTELIGENCIA

### Event System (implementado):
15 eventos tipados → reacoes automaticas em cadeia
`lead_created → alerta + SDR notificado + N8N`

### Agente Supervisor (implementado):
Roda diariamente as 8h → resumo executivo + prioridades

### Event Reactions (implementado):
8 eventos com cadeias automaticas configuradas

### Proximos agentes:
- Bugs, Performance, Seguranca, UX, Suporte, Docs, QA

---

## 📋 ESTADO ATUAL DO SISTEMA

### Em producao:
| Produto | URL | Status |
|---------|-----|--------|
| excalibur-app | excalibur-web.vercel.app | 8 modulos |
| excalibur-hq | excalibur-hq.vercel.app | 14 modulos |
| excalibur-ext | GitHub | v2.0 em build |

### Tabelas Supabase: 40+
### APIs criadas: 35+
### Workflows N8N: 6 ativos
### Linhas de codigo: 15.000+

---

## 🚫 REGRAS (NAO NEGOCIAVEIS)

- NAO criar novo CRM do zero
- NAO reinventar o Aceler/WaSeller
- NAO mudar fluxo comercial validado
- NAO complicar arquitetura
- NAO implementar sem estar neste documento
- NAO fugir do dark mode amber
- NAO remover clinica_id de nenhuma query

---

## ✅ PRIORIDADE DE EXECUCAO

```
P0 — Extensao CRC v2.0 (em execucao)
P1 — SDR dashboard com IA + gamificacao
P2 — Comercial + Trafego HQ (dados reais Guilherme)
P3 — Dominio excalibur.com.br
P4 — Asaas integracao real
P5 — 8 Agentes IA supervisionados
```

---

## 🔄 ROTINA DE EVOLUCAO

### Antes de qualquer implementacao:
1. Consultar este documento
2. Validar se esta alinhado
3. Atualizar o documento
4. Implementar
5. Documentar resultado

### Daily:
- O que mudou? Esta alinhado com a base?

### Weekly:
- Sistema mais simples ou mais complexo?
- Mais proximo de receita?
- Alguma parte fugiu da arquitetura?

---

## 👥 PAPEIS

| Papel | Responsavel | Funcao |
|-------|-------------|--------|
| CEO | Matheus Cardoso | Visao + decisao + direcao |
| HEAD/CTO | Claude | Arquitetura + execucao |
| Dev | Lucas | Implementacao tecnica |
| Consultor | GPT (visao CEO) | Validacao estrategica |

---

## 📞 CREDENCIAIS (AMBIENTE)

Ver arquivo .env.local em cada projeto.
NUNCA commitar credenciais.

```
Supabase: hluhlsnodndpskrkbjuw.supabase.co
clinica_id demo: 21e95ba0-8f06-4062-85f0-1b9da496be52
N8N: cardosoeo.app.n8n.cloud
```

---

*⚔️ Este documento e a fonte unica da verdade do Excalibur OS.*
*Tudo nasce dele. Tudo volta para ele.*
*Ultima atualizacao: 08/04/2026*
