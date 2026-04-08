import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (!body.conversa) {
      return NextResponse.json({ success: false, error: 'conversa obrigatoria' }, { status: 400, headers: corsHeaders })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'ANTHROPIC_API_KEY nao configurada' }, { status: 500, headers: corsHeaders })
    }

    const anthropic = new Anthropic({ apiKey })

    const prompt = `Voce e um analista de vendas de clinica odontologica.
Analise a conversa abaixo entre o atendente e o lead.

Contexto:
- Mode: ${body.mode || 'EXTERNAL'}
- Role: ${body.role || 'CRC'}

Conversa:
${body.conversa}

Responda APENAS com JSON valido (sem markdown):
{
  "score": 0-100 (chance de fechar),
  "urgencia": "alta" | "media" | "baixa",
  "objecao": "preco" | "medo" | "tempo" | "confianca" | "sem_objecao",
  "sentimento": "positivo" | "neutro" | "negativo",
  "resposta_sugerida": "mensagem ideal para enviar agora",
  "proxima_acao": "o que o atendente deve fazer em seguida",
  "resumo": "resumo em 1 frase da situacao"
}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    })

    const outputText = response.content[0].type === 'text' ? response.content[0].text : '{}'

    interface AnaliseIA {
      score: number
      urgencia: string
      objecao: string
      sentimento: string
      resposta_sugerida: string
      proxima_acao: string
      resumo: string
    }

    let analise: AnaliseIA = { score: 50, urgencia: 'media', objecao: 'sem_objecao', sentimento: 'neutro', resposta_sugerida: '', proxima_acao: '', resumo: '' }

    try {
      const jsonMatch = outputText.match(/\{[\s\S]*\}/)
      if (jsonMatch) analise = JSON.parse(jsonMatch[0])
    } catch {
      analise.resumo = outputText
    }

    return NextResponse.json({
      success: true,
      analise,
      tokens: response.usage.input_tokens + response.usage.output_tokens,
    }, { headers: corsHeaders })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ success: false, error: msg }, { status: 500, headers: corsHeaders })
  }
}
