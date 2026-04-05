// ⚔️ Excalibur HEAD — Claude API como inteligência operacional
// Funções para consultar o HEAD (Claude) sobre métricas, tarefas e mercado

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

interface HeadResponse {
  conteudo: string
  modelo: string
  tokens_usados: number
  timestamp: string
}

async function getApiKey(): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY não configurada no .env.local')
  return key
}

async function chamarClaude(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 1024
): Promise<HeadResponse> {
  const apiKey = await getApiKey()

  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API erro ${res.status}: ${err}`)
  }

  const data = await res.json()
  const texto = data.content?.[0]?.text ?? ''

  return {
    conteudo: texto,
    modelo: data.model ?? 'claude-sonnet-4-20250514',
    tokens_usados: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
    timestamp: new Date().toISOString(),
  }
}

const SYSTEM_HEAD = `Você é o HEAD (CTO + IA) do Excalibur — Sistema Operacional Odontológico.
Seu papel: analisar dados, gerar insights acionáveis, e tomar decisões inteligentes.
Contexto: SaaS para clínicas odontológicas de reabilitação oral.
Funil: Lead → Contato → Agendamento → Comparecimento → Fechamento.
Métricas-chave: CPL, CAC, taxa de agendamento, taxa de comparecimento, taxa de fechamento, ticket médio, ROI.
Responda SEMPRE em português. Seja direto e acionável. Use números quando possível.`

// === FUNÇÕES PÚBLICAS ===

export async function consultarHead(pergunta: string): Promise<HeadResponse> {
  return chamarClaude(SYSTEM_HEAD, pergunta, 1024)
}

export async function headAnalisarMetricas(metricas: {
  totalLeads: number
  agendados: number
  compareceram: number
  fecharam: number
  faturamento: number
  investimentoAds: number
  periodo: string
}): Promise<HeadResponse> {
  const prompt = `Analise estas métricas do período ${metricas.periodo}:

- Total de leads: ${metricas.totalLeads}
- Agendados: ${metricas.agendados} (taxa: ${metricas.totalLeads > 0 ? ((metricas.agendados / metricas.totalLeads) * 100).toFixed(1) : 0}%)
- Compareceram: ${metricas.compareceram} (taxa: ${metricas.agendados > 0 ? ((metricas.compareceram / metricas.agendados) * 100).toFixed(1) : 0}%)
- Fecharam: ${metricas.fecharam} (taxa: ${metricas.compareceram > 0 ? ((metricas.fecharam / metricas.compareceram) * 100).toFixed(1) : 0}%)
- Faturamento: R$ ${metricas.faturamento.toFixed(2)}
- Investimento Ads: R$ ${metricas.investimentoAds.toFixed(2)}
- CPL: R$ ${metricas.totalLeads > 0 ? (metricas.investimentoAds / metricas.totalLeads).toFixed(2) : '0'}
- CAC: R$ ${metricas.fecharam > 0 ? (metricas.investimentoAds / metricas.fecharam).toFixed(2) : 'N/A'}
- ROI: ${metricas.investimentoAds > 0 ? (((metricas.faturamento - metricas.investimentoAds) / metricas.investimentoAds) * 100).toFixed(0) : 0}%

Gere:
1. DIAGNÓSTICO (2-3 linhas): situação atual
2. ALERTAS (bullets): problemas identificados
3. AÇÕES (bullets): o que fazer AGORA para melhorar
4. PREVISÃO: estimativa de faturamento nos próximos 30 dias`

  return chamarClaude(SYSTEM_HEAD, prompt, 1500)
}

export async function headProximaTarefa(contexto: {
  modulosProntos: string[]
  modulosPendentes: string[]
  bugsAbertos: number
  ultimoCommit: string
}): Promise<HeadResponse> {
  const prompt = `Como HEAD/CTO do Excalibur, defina a PRÓXIMA TAREFA prioritária.

Estado atual:
- Módulos prontos: ${contexto.modulosProntos.join(', ')}
- Módulos pendentes: ${contexto.modulosPendentes.join(', ')}
- Bugs abertos: ${contexto.bugsAbertos}
- Último commit: ${contexto.ultimoCommit}

Responda em formato:
TAREFA: [título claro]
PRIORIDADE: [alta/média/baixa]
ESTIMATIVA: [tempo]
JUSTIFICATIVA: [por que essa e não outra]
STEPS: [1. 2. 3. ...]`

  return chamarClaude(SYSTEM_HEAD, prompt, 800)
}

export async function headValidarCodigo(codigo: string, contexto: string): Promise<HeadResponse> {
  return chamarClaude(
    `${SYSTEM_HEAD}\nVocê é um Code Reviewer senior. Analise o código abaixo considerando: TypeScript strict, Next.js 14+, Tailwind, Supabase. Identifique bugs, vulnerabilidades, melhorias de performance.`,
    `Contexto: ${contexto}\n\nCódigo:\n\`\`\`typescript\n${codigo}\n\`\`\`\n\nRevise e dê score 0-10.`,
    1200
  )
}

export async function headEstudoMercado(tema: string): Promise<HeadResponse> {
  return chamarClaude(
    `${SYSTEM_HEAD}\nVocê é um analista de mercado odontológico no Brasil. Considere concorrentes como Nexus Atemporal, Clinicorp, OdontoSystem. O Excalibur é um SaaS integrado (CRM+WhatsApp+Financeira+ERP+BI).`,
    `Analise o tema: "${tema}"\n\nGere:\n1. CENÁRIO ATUAL do mercado\n2. OPORTUNIDADES para o Excalibur\n3. RISCOS a considerar\n4. RECOMENDAÇÃO do HEAD`,
    1500
  )
}
