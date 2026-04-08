'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

const CLINICA_ID = '21e95ba0-8f06-4062-85f0-1b9da496be52'

interface JornadaData {
  etapa: string
  dias_na_plataforma: number
  data_inicio: string
  data_ativacao: string | null
  data_d15: string | null
  data_d30: string | null
  data_d60: string | null
  data_d90: string | null
  notas: string | null
}

const ETAPAS = [
  { key: 'D0_NOVO', label: 'Pagamento', dia: 0, marco: false },
  { key: 'D0_PAGAMENTO', label: 'Pagamento', dia: 0, marco: false },
  { key: 'D1_ONBOARDING', label: 'Onboarding', dia: 1, marco: false },
  { key: 'D2_ACESSOS', label: 'Acessos', dia: 2, marco: false },
  { key: 'D3_CAMPANHA', label: 'Campanha', dia: 3, marco: false },
  { key: 'D5_CONFIGURADO', label: 'Configurado', dia: 5, marco: false },
  { key: 'D7_ATIVADO', label: 'Ativado', dia: 7, marco: true },
  { key: 'D7_LEADS_CHEGANDO', label: 'Leads chegando', dia: 7, marco: false },
  { key: 'D15_MARCO', label: 'Marco D15', dia: 15, marco: true },
  { key: 'D30_CLASSIFICACAO', label: 'Classificacao D30', dia: 30, marco: true },
  { key: 'D30_ESTAVEL', label: 'Estavel', dia: 30, marco: false },
  { key: 'D45_CRESCENDO', label: 'Crescendo', dia: 45, marco: false },
  { key: 'D60_ESCALA', label: 'Em escala', dia: 60, marco: false },
  { key: 'D90_EXPANSAO', label: 'Expansao', dia: 90, marco: true },
]

export default function JornadaPage() {
  const [jornada, setJornada] = useState<JornadaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [clinicaId, setClinicaId] = useState(CLINICA_ID)

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: p } = await supabase.from('usuarios').select('clinica_id').eq('id', user.id).maybeSingle()
        if (p?.clinica_id) setClinicaId(p.clinica_id)
      }
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      const { data } = await supabase
        .from('jornada_clinica')
        .select('*')
        .eq('clinica_id', clinicaId)
        .maybeSingle()
      setJornada(data)
      setLoading(false)
    })()
  }, [clinicaId])

  const etapaAtualIdx = jornada ? ETAPAS.findIndex(e => e.key === jornada.etapa) : -1
  const dias = jornada?.dias_na_plataforma ?? 0

  const proximoMarco = ETAPAS.find((e, i) => i > etapaAtualIdx && e.marco)
  const diasParaProximoMarco = proximoMarco ? Math.max(0, proximoMarco.dia - dias) : 0

  return (
    <div style={{ minHeight: '100vh', background: '#030712', display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Jornada D0-D90</h1>
        <p style={{ color: '#6b7280', fontSize: 13, margin: '0 0 24px' }}>
          Acompanhe o progresso da clinica na plataforma Excalibur
        </p>

        {loading ? (
          <div style={{ color: '#6b7280', textAlign: 'center', padding: 60 }}>Carregando...</div>
        ) : !jornada ? (
          <div style={{ color: '#6b7280', textAlign: 'center', padding: 60 }}>Nenhuma jornada encontrada</div>
        ) : (
          <>
            {/* Resumo no topo */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
              <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase' }}>Dias na plataforma</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>{dias}</div>
              </div>
              <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase' }}>Etapa atual</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginTop: 8 }}>{ETAPAS[etapaAtualIdx]?.label || jornada.etapa}</div>
              </div>
              <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase' }}>Proximo marco</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f59e0b', marginTop: 8 }}>{proximoMarco?.label || 'Concluido'}</div>
              </div>
              <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase' }}>Dias para marco</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: diasParaProximoMarco <= 3 ? '#f59e0b' : '#22c55e', marginTop: 4 }}>{diasParaProximoMarco}</div>
              </div>
            </div>

            {/* Timeline */}
            <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 24 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: '0 0 24px' }}>Timeline</h2>

              <div style={{ position: 'relative', paddingLeft: 24 }}>
                {/* Linha vertical */}
                <div style={{ position: 'absolute', left: 11, top: 0, bottom: 0, width: 2, background: '#1f2937' }} />

                {ETAPAS.map((etapa, i) => {
                  const isConcluido = i < etapaAtualIdx
                  const isAtual = i === etapaAtualIdx
                  const isFuturo = i > etapaAtualIdx
                  const isAtrasado = isFuturo && dias > etapa.dia

                  let dotColor = '#374151'
                  let textColor = '#4b5563'
                  if (isConcluido) { dotColor = '#22c55e'; textColor = '#22c55e' }
                  if (isAtual) { dotColor = '#f59e0b'; textColor = '#f59e0b' }
                  if (isAtrasado) { dotColor = '#ef4444'; textColor = '#ef4444' }

                  return (
                    <div key={etapa.key} style={{ position: 'relative', paddingBottom: 20, paddingLeft: 20 }}>
                      {/* Dot */}
                      <div style={{
                        position: 'absolute', left: -2, top: 2,
                        width: isAtual || etapa.marco ? 18 : 12,
                        height: isAtual || etapa.marco ? 18 : 12,
                        borderRadius: '50%',
                        background: dotColor,
                        border: isAtual ? '3px solid #f59e0b80' : etapa.marco ? `2px solid ${dotColor}60` : 'none',
                        marginLeft: isAtual || etapa.marco ? -3 : 0,
                        marginTop: isAtual || etapa.marco ? -3 : 0,
                      }} />

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 14, fontWeight: isAtual ? 700 : 500, color: isAtual ? '#fff' : textColor }}>
                          {etapa.label}
                        </span>
                        <span style={{ fontSize: 10, color: '#4b5563' }}>D{etapa.dia}</span>
                        {etapa.marco && (
                          <span style={{
                            fontSize: 9, padding: '2px 6px', borderRadius: 4,
                            background: isConcluido ? '#22c55e20' : isAtual ? '#f59e0b20' : '#1f2937',
                            color: isConcluido ? '#22c55e' : isAtual ? '#f59e0b' : '#4b5563',
                            fontWeight: 600,
                          }}>
                            MARCO
                          </span>
                        )}
                        {isAtual && (
                          <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: '#f59e0b', color: '#000', fontWeight: 700 }}>
                            ATUAL
                          </span>
                        )}
                        {isAtrasado && (
                          <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: '#ef444430', color: '#ef4444', fontWeight: 600 }}>
                            ATRASADO
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
