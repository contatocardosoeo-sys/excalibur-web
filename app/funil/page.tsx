'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

interface FunilDia {
  id?: string
  data?: string
  investimento: number
  leads: number
  leads_respondidos: number
  agendamentos: number
  comparecimentos: number
  fechamentos: number
  faturamento: number
  cpl?: number
  taxa_agendamento?: number
  taxa_comparecimento?: number
  taxa_fechamento?: number
  ticket_medio?: number
  cac?: number
  observacoes?: string
}

const CAMPOS: Array<{ key: string; label: string; placeholder: string; tipo: string }> = [
  { key: 'investimento', label: 'Investimento (R$)', placeholder: '150.00', tipo: 'moeda' },
  { key: 'leads', label: 'Leads recebidos', placeholder: '30', tipo: 'num' },
  { key: 'leads_respondidos', label: 'Leads respondidos', placeholder: '25', tipo: 'num' },
  { key: 'agendamentos', label: 'Agendamentos', placeholder: '12', tipo: 'num' },
  { key: 'comparecimentos', label: 'Comparecimentos', placeholder: '6', tipo: 'num' },
  { key: 'fechamentos', label: 'Fechamentos', placeholder: '2', tipo: 'num' },
  { key: 'faturamento', label: 'Faturamento (R$)', placeholder: '9000', tipo: 'moeda' },
]

const EMPTY: FunilDia = { investimento: 0, leads: 0, leads_respondidos: 0, agendamentos: 0, comparecimentos: 0, fechamentos: 0, faturamento: 0 }
const CLINICA_ID = '21e95ba0-8f06-4062-85f0-1b9da496be52'

function fmtMoeda(v: number): string {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

function fmtPct(v: number): string {
  return `${v.toFixed(1)}%`
}

export default function FunilPage() {
  const [clinicaId, setClinicaId] = useState(CLINICA_ID)
  const [hoje, setHoje] = useState<FunilDia>(EMPTY)
  const [historico, setHistorico] = useState<FunilDia[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: p } = await supabase.from('usuarios').select('clinica_id').eq('id', user.id).maybeSingle()
        if (p?.clinica_id) setClinicaId(p.clinica_id)
      }
    })()
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/funil?clinica_id=${clinicaId}&periodo=30`)
    const json = await res.json()
    setHistorico(json.data || [])
    const dataHoje = new Date().toISOString().split('T')[0]
    const diaHoje = (json.data as FunilDia[])?.find(d => d.data === dataHoje)
    if (diaHoje) setHoje(diaHoje)
    setLoading(false)
  }, [clinicaId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleChange = (key: string, value: string) => {
    setHoje(prev => ({ ...prev, [key]: parseFloat(value) || 0 }))
    setSalvo(false)
  }

  const salvar = async () => {
    setSalvando(true)
    await fetch('/api/funil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clinica_id: clinicaId, ...hoje }),
    })
    setSalvando(false)
    setSalvo(true)
    setTimeout(() => setSalvo(false), 3000)
    loadData()
  }

  const exportarCSV = () => {
    window.location.href = `/api/funil?clinica_id=${clinicaId}&periodo=30&formato=csv`
  }

  const calc = {
    cpl: hoje.leads > 0 ? hoje.investimento / hoje.leads : 0,
    taxa_resp: hoje.leads > 0 ? (hoje.leads_respondidos / hoje.leads) * 100 : 0,
    taxa_agend: hoje.leads_respondidos > 0 ? (hoje.agendamentos / hoje.leads_respondidos) * 100 : 0,
    taxa_comp: hoje.agendamentos > 0 ? (hoje.comparecimentos / hoje.agendamentos) * 100 : 0,
    taxa_fecha: hoje.comparecimentos > 0 ? (hoje.fechamentos / hoje.comparecimentos) * 100 : 0,
    ticket: hoje.fechamentos > 0 ? hoje.faturamento / hoje.fechamentos : 0,
    roi: hoje.investimento > 0 ? ((hoje.faturamento - hoje.investimento) / hoje.investimento) * 100 : 0,
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#030712', border: '1px solid #1f2937',
    color: '#fff', borderRadius: 8, padding: '8px 12px', fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#030712', display: 'flex' }}>
      <Sidebar />

      <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>Funil Diario</h1>
            <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>
              Preencha todo dia — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={exportarCSV} style={{ background: 'transparent', border: '1px solid #1f2937', color: '#9ca3af', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13 }}>
              Exportar CSV
            </button>
            <button onClick={salvar} disabled={salvando} style={{
              background: salvo ? '#22c55e' : '#f59e0b', color: '#000', border: 'none',
              borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 700,
            }}>
              {salvando ? 'Salvando...' : salvo ? 'Salvo!' : 'Salvar Hoje'}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ color: '#6b7280', textAlign: 'center', padding: 60 }}>Carregando...</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

              {/* Formulario */}
              <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}>
                <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: '0 0 16px' }}>Dados de Hoje</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {CAMPOS.map(c => (
                    <div key={c.key}>
                      <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{c.label}</label>
                      <input
                        type="number"
                        value={hoje[c.key as keyof FunilDia] as number || ''}
                        onChange={e => handleChange(c.key, e.target.value)}
                        placeholder={c.placeholder}
                        step={c.tipo === 'moeda' ? '0.01' : '1'}
                        style={inputStyle}
                      />
                    </div>
                  ))}
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#6b7280', marginBottom: 4 }}>Observacoes</label>
                    <textarea
                      value={hoje.observacoes || ''}
                      onChange={e => setHoje(prev => ({ ...prev, observacoes: e.target.value }))}
                      placeholder="Algo importante do dia..."
                      rows={2}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>
                </div>
              </div>

              {/* Metricas ao vivo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 16 }}>
                  <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Metricas ao Vivo</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {([
                      { label: 'CPL', valor: fmtMoeda(calc.cpl), ok: calc.cpl > 0 && calc.cpl <= 5, meta: '≤ R$5' },
                      { label: 'Taxa Resposta', valor: fmtPct(calc.taxa_resp), ok: calc.taxa_resp >= 85, meta: '≥ 85%' },
                      { label: 'Taxa Agendamento', valor: fmtPct(calc.taxa_agend), ok: calc.taxa_agend >= 40, meta: '≥ 40%' },
                      { label: 'Taxa Comparecimento', valor: fmtPct(calc.taxa_comp), ok: calc.taxa_comp >= 50, meta: '≥ 50%' },
                      { label: 'Taxa Fechamento', valor: fmtPct(calc.taxa_fecha), ok: calc.taxa_fecha >= 40, meta: '≥ 40%' },
                      { label: 'Ticket Medio', valor: fmtMoeda(calc.ticket), ok: calc.ticket >= 4500, meta: '≥ R$4.500' },
                      { label: 'ROI', valor: fmtPct(calc.roi), ok: calc.roi > 0, meta: '> 0%' },
                    ] as const).map(m => (
                      <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #1f2937' }}>
                        <span style={{ fontSize: 12, color: '#9ca3af' }}>{m.label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, color: '#4b5563' }}>{m.meta}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: m.ok ? '#22c55e' : '#6b7280' }}>{m.valor}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#111827', border: '1px solid #f59e0b40', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 11, color: '#f59e0b', marginBottom: 4 }}>Faturamento hoje</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>{fmtMoeda(hoje.faturamento)}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{hoje.fechamentos} contrato{hoje.fechamentos !== 1 ? 's' : ''} fechado{hoje.fechamentos !== 1 ? 's' : ''}</div>
                </div>
              </div>
            </div>

            {/* Historico */}
            {historico.length > 0 && (
              <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20, marginTop: 20 }}>
                <h3 style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Historico — Ultimos 30 dias</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr>
                        {['Data', 'Invest.', 'Leads', 'Resp.', 'Agend.', 'Comp.', 'Fecha.', 'Fatura.', 'CPL', 'Tx.Fecha.'].map(h => (
                          <th key={h} style={{ color: '#6b7280', fontWeight: 600, padding: '6px 8px', textAlign: 'right', borderBottom: '1px solid #1f2937' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {historico.map((d, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #111827' }}>
                          <td style={{ padding: '6px 8px', color: '#9ca3af' }}>{d.data}</td>
                          <td style={{ padding: '6px 8px', color: '#e5e7eb', textAlign: 'right' }}>R${Number(d.investimento).toFixed(0)}</td>
                          <td style={{ padding: '6px 8px', color: '#e5e7eb', textAlign: 'right' }}>{d.leads}</td>
                          <td style={{ padding: '6px 8px', color: '#e5e7eb', textAlign: 'right' }}>{d.leads_respondidos}</td>
                          <td style={{ padding: '6px 8px', color: '#e5e7eb', textAlign: 'right' }}>{d.agendamentos}</td>
                          <td style={{ padding: '6px 8px', color: '#e5e7eb', textAlign: 'right' }}>{d.comparecimentos}</td>
                          <td style={{ padding: '6px 8px', color: '#22c55e', textAlign: 'right', fontWeight: 600 }}>{d.fechamentos}</td>
                          <td style={{ padding: '6px 8px', color: '#f59e0b', textAlign: 'right', fontWeight: 600 }}>R${Number(d.faturamento).toLocaleString('pt-BR')}</td>
                          <td style={{ padding: '6px 8px', color: Number(d.cpl || 0) <= 5 ? '#22c55e' : '#ef4444', textAlign: 'right' }}>R${Number(d.cpl || 0).toFixed(2)}</td>
                          <td style={{ padding: '6px 8px', color: Number(d.taxa_fechamento || 0) >= 40 ? '#22c55e' : '#ef4444', textAlign: 'right' }}>{Number(d.taxa_fechamento || 0).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
