import { NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET() {
  // Default config for the extension
  const config = {
    version: '2.0.0',
    modes: ['INTERNAL', 'EXTERNAL'],
    roles: {
      INTERNAL: ['SDR', 'CLOSER'],
      EXTERNAL: ['CRC', 'RECEPCAO', 'ORCAMENTO'],
    },
    defaults: {
      mode: 'EXTERNAL',
      role: 'CRC',
      delay: 3,
      confirmacao: true,
    },
    etapas_funil: ['Recebido', 'Contato feito', 'Agendado', 'Compareceu', 'Fechou'],
    procedimentos: ['Implante', 'Protocolo', 'Protese', 'Estetica', 'Outro'],
  }

  return NextResponse.json({ success: true, config }, { headers: corsHeaders })
}
