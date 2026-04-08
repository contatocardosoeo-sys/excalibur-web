'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

const CLINICA_ID = '21e95ba0-8f06-4062-85f0-1b9da496be52'

interface AdocaoData {
  assistiu_onboarding: boolean
  participa_aulas_ao_vivo: boolean
  assiste_gravado: boolean
  usa_crm: boolean
  responde_leads: boolean
  usa_script: boolean
  preenche_funil_diario: boolean
  campanha_ativa: boolean
  leads_chegando: boolean
  taxa_resposta_boa: boolean
  segue_processo: boolean
  realizou_vendas: boolean
  vendas_recorrentes: boolean
  roi_positivo: boolean
}

const SECOES = [
  {
    titulo: 'Treinamento',
    subtitulo: '40 pts',
    color: '#3b82f6',
    items: [
      { key: 'assistiu_onboarding', label: 'Assistiu onboarding', pts: 5 },
      { key: 'participa_aulas_ao_vivo', label: 'Participa aulas ao vivo', pts: 5 },
      { key: 'assiste_gravado', label: 'Assiste gravado', pts: 5 },
      { key: 'usa_crm', label: 'Usa CRM', pts: 5 },
      { key: 'responde_leads', label: 'Responde leads', pts: 10 },
      { key: 'usa_script', label: 'Usa script', pts: 5 },
      { key: 'preenche_funil_diario', label: 'Preenche funil diario', pts: 5 },
    ],
  },
  {
    titulo: 'Operacao',
    subtitulo: '30 pts',
    color: '#f59e0b',
    items: [
      { key: 'campanha_ativa', label: 'Campanha ativa', pts: 5 },
      { key: 'leads_chegando', label: 'Leads chegando', pts: 5 },
      { key: 'taxa_resposta_boa', label: 'Taxa resposta >= 85%', pts: 10 },
      { key: 'segue_processo', label: 'Segue processo', pts: 10 },
    ],
  },
  {
    titulo: 'Resultado',
    subtitulo: '30 pts',
    color: '#22c55e',
    items: [
      { key: 'realizou_vendas', label: 'Realizou vendas', pts: 10 },
      { key: 'vendas_recorrentes', label: 'Vendas recorrentes', pts: 10 },
      { key: 'roi_positivo', label: 'ROI positivo', pts: 10 },
    ],
  },
]

const EMPTY: AdocaoData = {
  assistiu_onboarding: false, participa_aulas_ao_vivo: false, assiste_gravado: false,
  usa_crm: false, responde_leads: false, usa_script: false, preenche_funil_diario: false,
  campanha_ativa: false, leads_chegando: false, taxa_resposta_boa: false, segue_processo: false,
  realizou_vendas: false, vendas_recorrentes: false, roi_positivo: false,
}

export default function AdocaoPage() {
  const [dados, setDados] = useState<AdocaoData>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
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
      const res = await fetch(`/api/health-score?clinica_id=${clinicaId}`)
      const json = await res.json()
      if (json.detalhes) {
        setDados({
          assistiu_onboarding: json.detalhes.assistiu_onboarding ?? false,
          participa_aulas_ao_vivo: json.detalhes.participa_aulas_ao_vivo ?? false,
          assiste_gravado: json.detalhes.assiste_gravado ?? false,
          usa_crm: json.detalhes.usa_crm ?? false,
          responde_leads: json.detalhes.responde_leads ?? false,
          usa_script: json.detalhes.usa_script ?? false,
          preenche_funil_diario: json.detalhes.preenche_funil_diario ?? false,
          campanha_ativa: json.detalhes.campanha_ativa ?? false,
          leads_chegando: json.detalhes.leads_chegando ?? false,
          taxa_resposta_boa: json.detalhes.taxa_resposta_boa ?? false,
          segue_processo: json.detalhes.segue_processo ?? false,
          realizou_vendas: json.detalhes.realizou_vendas ?? false,
          vendas_recorrentes: json.detalhes.vendas_recorrentes ?? false,
          roi_positivo: json.detalhes.roi_positivo ?? false,
        })
      }
      setLoading(false)
    })()
  }, [clinicaId])

  const toggle = (key: string) => {
    setDados(prev => ({ ...prev, [key]: !prev[key as keyof AdocaoData] }))
    setSalvo(false)
  }

  const score = useMemo(() => {
    let s = 0
    for (const secao of SECOES) {
      for (const item of secao.items) {
        if (dados[item.key as keyof AdocaoData]) s += item.pts
      }
    }
    return s
  }, [dados])

  const classificacao = score >= 80 ? 'SAUDAVEL' : score >= 60 ? 'ATENCAO' : 'RISCO'
  const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'

  const salvar = async () => {
    setSalvando(true)
    await fetch('/api/health-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clinica_id: clinicaId, ...dados }),
    })
    setSalvando(false)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 3000)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#030712', display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>Adocao & Health Score</h1>
            <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>Checklist semanal de adocao da clinica</p>
          </div>
          <button onClick={salvar} disabled={salvando} style={{
            background: salvo ? '#22c55e' : '#f59e0b', color: '#000', border: 'none',
            borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 700,
          }}>
            {salvando ? 'Salvando...' : salvo ? 'Salvo!' : 'Salvar'}
          </button>
        </div>

        {loading ? (
          <div style={{ color: '#6b7280', textAlign: 'center', padding: 60 }}>Carregando...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

            {/* Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {SECOES.map(secao => (
                <div key={secao.titulo} style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{ width: 4, height: 20, borderRadius: 2, background: secao.color }} />
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: 0 }}>{secao.titulo}</h3>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>{secao.subtitulo}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {secao.items.map(item => {
                      const checked = dados[item.key as keyof AdocaoData]
                      return (
                        <label key={item.key} style={{
                          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                          padding: '6px 8px', borderRadius: 8,
                          background: checked ? `${secao.color}10` : 'transparent',
                        }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: 4,
                            border: `2px solid ${checked ? secao.color : '#374151'}`,
                            background: checked ? secao.color : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}
                            onClick={() => toggle(item.key)}>
                            {checked && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
                          </div>
                          <span style={{ fontSize: 13, color: checked ? '#e5e7eb' : '#9ca3af', flex: 1 }}
                            onClick={() => toggle(item.key)}>
                            {item.label}
                          </span>
                          <span style={{ fontSize: 11, color: checked ? secao.color : '#4b5563', fontWeight: 600 }}>
                            {item.pts}pts
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Health Score */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: '#111827', border: `2px solid ${scoreColor}30`, borderRadius: 12, padding: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', marginBottom: 8 }}>Health Score</div>
                <div style={{ fontSize: 56, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score}</div>
                <div style={{ fontSize: 13, color: scoreColor, fontWeight: 600, marginTop: 8 }}>{classificacao}</div>

                {/* Barra progresso */}
                <div style={{ height: 8, background: '#1f2937', borderRadius: 4, marginTop: 16, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${score}%`, background: scoreColor, borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: '#4b5563' }}>
                  <span>0</span>
                  <span>100</span>
                </div>
              </div>

              {/* Breakdown por secao */}
              {SECOES.map(secao => {
                const maxPts = secao.items.reduce((s, i) => s + i.pts, 0)
                const atualPts = secao.items.reduce((s, i) => s + (dados[i.key as keyof AdocaoData] ? i.pts : 0), 0)
                return (
                  <div key={secao.titulo} style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>{secao.titulo}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: secao.color }}>{atualPts}/{maxPts}</span>
                    </div>
                    <div style={{ height: 4, background: '#1f2937', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${maxPts > 0 ? (atualPts / maxPts) * 100 : 0}%`, background: secao.color, borderRadius: 2, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                )
              })}

              {/* Legenda */}
              <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 14, fontSize: 11, color: '#6b7280' }}>
                <div style={{ marginBottom: 6 }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#22c55e', marginRight: 6, verticalAlign: 'middle' }} />
                  80-100: Saudavel
                </div>
                <div style={{ marginBottom: 6 }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', marginRight: 6, verticalAlign: 'middle' }} />
                  60-79: Atencao
                </div>
                <div>
                  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#ef4444', marginRight: 6, verticalAlign: 'middle' }} />
                  0-59: Risco
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
