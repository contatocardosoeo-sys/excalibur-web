#!/usr/bin/env node
// ⚔️ Excalibur HEAD Autônomo — Loop de Monitoramento 24/7
// Roda a cada 5 minutos: coleta métricas → consulta Claude → executa ação → salva resultado

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hluhlsnodndpskrkbjuw.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
const INTERVALO_MS = 5 * 60 * 1000 // 5 minutos

async function supabaseQuery(table, params = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  })
  return res.json()
}

async function supabaseInsert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(data),
  })
  return res.ok
}

async function consultarClaude(contexto) {
  if (!ANTHROPIC_KEY) {
    console.log('[HEAD] ANTHROPIC_API_KEY não configurada, pulando consulta')
    return null
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: `Você é o HEAD do Excalibur, sistema odontológico SaaS.
Analise as métricas e gere UM insight acionável para o CEO.
Responda em JSON: {"titulo": "...", "insight": "...", "prioridade": "alta|media|baixa", "modulo": "..."}`,
      messages: [{ role: 'user', content: contexto }],
    }),
  })

  if (!res.ok) {
    console.error('[HEAD] Erro Claude API:', res.status)
    return null
  }

  const data = await res.json()
  try {
    return JSON.parse(data.content[0].text)
  } catch {
    return { titulo: 'Análise do HEAD', insight: data.content[0].text, prioridade: 'media', modulo: 'geral' }
  }
}

async function ciclo() {
  const agora = new Date().toISOString()
  console.log(`\n[HEAD] Ciclo iniciado — ${agora}`)

  try {
    // 1. Coletar métricas
    const [leads, agendamentos, propostas] = await Promise.all([
      supabaseQuery('leads', 'select=id,etapa,created_at'),
      supabaseQuery('agendamentos', 'select=id,status,data&order=data.desc&limit=50'),
      supabaseQuery('propostas', 'select=id,status,valor_total'),
    ])

    const metricas = {
      total_leads: leads.length,
      leads_por_etapa: {},
      agendamentos_hoje: 0,
      propostas_pendentes: 0,
      faturamento: 0,
    }

    leads.forEach(l => {
      metricas.leads_por_etapa[l.etapa] = (metricas.leads_por_etapa[l.etapa] || 0) + 1
    })

    const hoje = new Date().toISOString().split('T')[0]
    metricas.agendamentos_hoje = agendamentos.filter(a => a.data === hoje).length
    metricas.propostas_pendentes = propostas.filter(p => p.status === 'pendente').length
    metricas.faturamento = propostas
      .filter(p => p.status === 'pago')
      .reduce((s, p) => s + Number(p.valor_total), 0)

    console.log('[HEAD] Métricas:', JSON.stringify(metricas, null, 2))

    // 2. Consultar Claude
    const decisao = await consultarClaude(
      `Métricas atuais do Excalibur (${agora}):\n${JSON.stringify(metricas, null, 2)}\n\nGere um insight acionável.`
    )

    if (!decisao) {
      console.log('[HEAD] Sem decisão da IA, salvando métricas')
      await supabaseInsert('sync_log', {
        origem: 'head-autonomo',
        destino: 'metricas',
        status: 'ok',
        detalhes: JSON.stringify(metricas),
      })
      return
    }

    console.log('[HEAD] Decisão:', JSON.stringify(decisao))

    // 3. Salvar insight
    await supabaseInsert('insights_ia', {
      tipo: 'acao',
      titulo: decisao.titulo || 'HEAD Autônomo',
      conteudo: decisao.insight || decisao.descricao || '',
      prioridade: decisao.prioridade || 'media',
      status: 'ativo',
    })

    // 4. Log
    await supabaseInsert('sync_log', {
      origem: 'head-autonomo',
      destino: decisao.modulo || 'geral',
      status: 'ok',
      detalhes: decisao.titulo || 'Ciclo concluído',
    })

    console.log('[HEAD] Ciclo concluído com sucesso')
  } catch (err) {
    console.error('[HEAD] Erro no ciclo:', err.message || err)
    await supabaseInsert('sync_log', {
      origem: 'head-autonomo',
      destino: 'erro',
      status: 'erro',
      detalhes: String(err.message || err).slice(0, 500),
    }).catch(() => {})
  }
}

// Rodar ciclo imediato + loop
console.log('⚔️ Excalibur HEAD Autônomo iniciado')
console.log(`   Intervalo: ${INTERVALO_MS / 1000}s`)
console.log(`   Supabase: ${SUPABASE_URL}`)
console.log(`   Claude API: ${ANTHROPIC_KEY ? 'configurada' : 'NÃO CONFIGURADA'}`)

ciclo()
setInterval(ciclo, INTERVALO_MS)
