import { NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET() {
  // Return empty backup structure — extension has built-in CATEGORIAS
  // In future: merge global + empresa + usuario backups from Supabase
  return NextResponse.json({
    success: true,
    backup: {
      versao: '2.0',
      categorias: [],
      respostas: [],
      fonte: 'api',
    },
  }, { headers: corsHeaders })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // In future: save backup to Supabase per clinica/user
    return NextResponse.json({
      success: true,
      message: 'Backup recebido',
      size: JSON.stringify(body).length,
    }, { headers: corsHeaders })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ success: false, error: msg }, { status: 500, headers: corsHeaders })
  }
}
