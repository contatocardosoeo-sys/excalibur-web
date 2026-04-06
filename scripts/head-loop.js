#!/usr/bin/env node
// ⚔️ Excalibur HEAD Loop — Analisa métricas a cada 5 min e salva insights
// Uso: node scripts/head-loop.js   (ou: npm run head)

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hluhlsnodndpskrkbjuw.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
const INTERVALO = 5 * 60 * 1000 // 5 minutos

if (!ANTHROPIC_KEY) {
  console.error('❌ ANTHROPIC_API_KEY não encontrada. Configure no .env.local')
  process.exit(1)
}

async function supaFetch(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: opts.prefer || '',
      ...opts.headers,
    },
    method: opts.method || 'GET',
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  if (!res.ok && opts.method !== 'POST') console.warn(`⚠️ Supabase ${path}: ${res.status}`)
  return res.json().catch(() => null)
}

async function coletarMetricas() {
  const leads = await supaFetch('leads?select=etapa,created_at')
  if (!Array.isArray(leads)) return null

  const agora = new Date()
  const inicio30d = new Date(agora)
  inicio30d.setDate(agora.getDate() - 30)

  const recentes = leads.filter((l) => new Date(l.created_at) >= inicio30d)
  const agendados = leads.filter((l) => ['Agendado', 'Compareceu', 'Fechou'].includes(l.etapa))
  const compareceram = leads.filter((l) => ['Compareceu', 'Fechou'].includes(l.etapa))
  const fecharam = leads.filter((l) => l.etapa === 'Fechou')

  return {
    totalLeads: recentes.length,
    agendados: agendados.length,
    compareceram: compareceram.length,
    fecharam: fecharam.length,
    faturamento: 0,
    investimentoAds: 5000,
    periodo: 'últimos 30 dias',
  }
}

async function consultarClaude(metricas) {
  const prompt = `Analise estas métricas do Excalibur (últimos 30 dias):
- Leads: ${metricas.totalLeads}
- Agendados: ${metricas.agendados} (${metricas.totalLeads > 0 ? ((metricas.agendados / metricas.totalLeads) * 100).toFixed(0) : 0}%)
- Compareceram: ${metricas.compareceram}
- Fecharam: ${metricas.fecharam}
- Investimento: R$ ${metricas.investimentoAds}

Responda EXATAMENTE neste JSON (sem markdown):
{"diagnostico":"...", "alertas":["..."], "acoes":["..."], "previsao":"...", "score": 0-10}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: 'Você é o HEAD do Excalibur SaaS odontológico. Responda APENAS o JSON pedido, sem markdown.',
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude ${res.status}: ${err.slice(0, 200)}`)
  }

  const data = await res.json()
  const texto = data.content?.[0]?.text ?? '{}'
  const tokens = (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0)

  let parsed
  try {
    parsed = JSON.parse(texto)
  } catch {
    parsed = { diagnostico: texto, alertas: [], acoes: [], previsao: '', score: 5 }
  }

  return { ...parsed, tokens }
}

async function salvarInsight(insight) {
  // Salvar no head_log
  await supaFetch('head_log', {
    method: 'POST',
    body: {
      acao: 'analise_automatica',
      pergunta: 'Análise de métricas 30d',
      resposta: insight.diagnostico,
      modelo: 'claude-sonnet-4-20250514',
      tokens: insight.tokens || 0,
    },
    prefer: 'return=minimal',
  })

  // Salvar insights individuais
  if (insight.alertas?.length > 0) {
    for (const alerta of insight.alertas) {
      await supaFetch('insights_ia', {
        method: 'POST',
        body: { tipo: 'alerta', titulo: alerta.slice(0, 80), conteudo: alerta, prioridade: 'alta' },
        prefer: 'return=minimal',
      })
    }
  }

  if (insight.acoes?.length > 0) {
    for (const acao of insight.acoes) {
      await supaFetch('insights_ia', {
        method: 'POST',
        body: { tipo: 'acao', titulo: acao.slice(0, 80), conteudo: acao, prioridade: 'media' },
        prefer: 'return=minimal',
      })
    }
  }

  if (insight.previsao) {
    await supaFetch('insights_ia', {
      method: 'POST',
      body: { tipo: 'previsao', titulo: 'Previsão 30d', conteudo: insight.previsao, prioridade: 'media' },
      prefer: 'return=minimal',
    })
  }

  // Atualizar sistema_status
  await supaFetch('sistema_status?on_conflict=chave', {
    method: 'POST',
    body: { chave: 'head_ultima_analise', valor: new Date().toISOString() },
    prefer: 'return=minimal,resolution=merge-duplicates',
  })
  await supaFetch('sistema_status?on_conflict=chave', {
    method: 'POST',
    body: { chave: 'head_score', valor: String(insight.score ?? 5) },
    prefer: 'return=minimal,resolution=merge-duplicates',
  })
}

async function ciclo() {
  const hora = new Date().toLocaleTimeString('pt-BR')
  console.log(`\n⚔️ [${hora}] HEAD analisando métricas...`)

  try {
    const metricas = await coletarMetricas()
    if (!metricas) {
      console.log('⚠️ Sem métricas disponíveis')
      return
    }
    console.log(`📊 Leads: ${metricas.totalLeads} | Agendados: ${metricas.agendados} | Fecharam: ${metricas.fecharam}`)

    const insight = await consultarClaude(metricas)
    console.log(`🧠 Diagnóstico: ${insight.diagnostico?.slice(0, 120)}...`)
    console.log(`📈 Score: ${insight.score}/10`)
    console.log(`🚨 Alertas: ${insight.alertas?.length ?? 0}`)
    console.log(`✅ Ações: ${insight.acoes?.length ?? 0}`)

    await salvarInsight(insight)
    console.log(`💾 Insights salvos no Supabase`)
  } catch (e) {
    console.error(`❌ Erro: ${e.message}`)
  }
}

// Execução
console.log('⚔️ Excalibur HEAD Loop iniciado')
console.log(`🔄 Intervalo: ${INTERVALO / 1000}s (${INTERVALO / 60000} min)`)
console.log(`🔗 Supabase: ${SUPABASE_URL}`)

// Rodar imediatamente + loop
ciclo()
setInterval(ciclo, INTERVALO)
