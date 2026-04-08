'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import Sidebar from '../components/Sidebar'

interface Metricas {
  investimento: number
  leads: number
  leads_respondidos: number
  agendamentos: number
  comparecimentos: number
  fechamentos: number
  faturamento: number
  cpl: number
  taxa_agendamento: number
  taxa_comparecimento: number
  taxa_fechamento: number
  ticket_medio: number
  cac: number
  roi: number
}

interface Versus {
  cpl: { atual: number; meta: number; ok: boolean }
  agendamento: { atual: number; meta: number; ok: boolean }
  comparecimento: { atual: number; meta: number; ok: boolean }
  fechamento: { atual: number; meta: number; ok: boolean }
  ticket_medio: { atual: number; meta: number; ok: boolean }
}

interface Alerta {
  id: string
  tipo: string
  nivel: number
  titulo: string
  descricao: string
}

interface HistoricoDia {
  data: string
  investimento: number
  leads: number
  agendamentos: number
  comparecimentos: number
  fechamentos: number
  faturamento: number
  cpl: number
  taxa_fechamento: number
}

interface DashData {
  metricas: Metricas
  versus: Versus | null
  adocao: { score: number; classificacao: string } | null
  jornada: { etapa: string; dias_na_plataforma: number } | null
  alertas: Alerta[]
  historico: HistoricoDia[]
}

const CLINICA_ID = '21e95ba0-8f06-4062-85f0-1b9da496be52'

const METAS_FUNIL: Array<{ key: keyof Versus; label: string; unidade: string; inverso?: boolean }> = [
  { key: 'cpl', label: 'CPL', unidade: 'R$', inverso: true },
  { key: 'agendamento', label: 'Agendamento', unidade: '%' },
  { key: 'comparecimento', label: 'Comparecimento', unidade: '%' },
  { key: 'fechamento', label: 'Fechamento', unidade: '%' },
  { key: 'ticket_medio', label: 'Ticket Medio', unidade: 'R$' },
]

function fmtMoeda(v: number): string {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtPct(v: number): string {
  return `${v.toFixed(1)}%`
}

function fmtNum(v: number): string {
  return v.toLocaleString('pt-BR')
}

export default function Dashboard() {
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)
  const [clinicaId, setClinicaId] = useState(CLINICA_ID)

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: perfil } = await supabase.from('usuarios').select('clinica_id').eq('id', user.id).maybeSingle()
        if (perfil?.clinica_id) setClinicaId(perfil.clinica_id)
      }
    })()
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/dashboard?clinica_id=${clinicaId}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [clinicaId])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [load])

  if (loading || !data) {
    return (
      <div style={{ minHeight: '100vh', background: '#030712', display: 'flex' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚔️</div>
            <p>Carregando dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  const { metricas, versus, adocao, alertas, historico } = data
  const score = adocao?.score ?? 0
  const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'
  const scoreLabel = score >= 80 ? 'Saudavel' : score >= 60 ? 'Atencao' : 'Risco'

  return (
    <div style={{ minHeight: '100vh', background: '#030712', display: 'flex' }}>
      <Sidebar />

      <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>

        {/* Header + Health Score */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>Dashboard</h1>
            <p style={{ color: '#6b7280', fontSize: 13, margin: '4px 0 0' }}>
              Metricas do mes em tempo real
            </p>
          </div>
          <div style={{ background: '#111827', border: `2px solid ${scoreColor}40`, borderRadius: 12, padding: '12px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: scoreColor }}>{score}</div>
            <div style={{ fontSize: 11, color: scoreColor, fontWeight: 600 }}>{scoreLabel}</div>
            <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>Health Score</div>
          </div>
        </div>

        {/* Alertas */}
        {alertas.length > 0 && (
          <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {alertas.slice(0, 4).map(a => (
              <div key={a.id} style={{
                background: a.nivel === 3 ? '#ef444420' : a.nivel === 2 ? '#f59e0b20' : '#3b82f620',
                border: `1px solid ${a.nivel === 3 ? '#ef4444' : a.nivel === 2 ? '#f59e0b' : '#3b82f6'}40`,
                borderRadius: 8, padding: '8px 14px',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span>{a.nivel === 3 ? '🔴' : a.nivel === 2 ? '🟡' : '🔵'}</span>
                <span style={{ color: '#e5e7eb', fontSize: 13 }}>{a.titulo}</span>
                {a.descricao && <span style={{ color: '#6b7280', fontSize: 11, marginLeft: 'auto' }}>{a.descricao}</span>}
              </div>
            ))}
          </div>
        )}

        {/* KPIs principais */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {([
            { label: 'Investimento', valor: fmtMoeda(metricas.investimento), sub: 'no mes', color: '#f59e0b' },
            { label: 'Leads', valor: fmtNum(metricas.leads), sub: 'chegaram', color: '#3b82f6' },
            { label: 'Fechamentos', valor: fmtNum(metricas.fechamentos), sub: 'contratos', color: '#22c55e' },
            { label: 'Faturamento', valor: fmtMoeda(metricas.faturamento), sub: 'no mes', color: '#f59e0b' },
          ] as const).map(k => (
            <div key={k.label} style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginTop: 4 }}>{k.valor}</div>
              <div style={{ fontSize: 11, color: k.color, marginTop: 2 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Funil vs Metas */}
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: '0 0 16px' }}>Funil vs Metas Excalibur</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
            {METAS_FUNIL.map(cfg => {
              const v = versus?.[cfg.key]
              const atual = v?.atual ?? 0
              const meta = v?.meta ?? 0
              const ok = v?.ok ?? false
              const pct = cfg.inverso
                ? Math.min(100, meta > 0 ? (meta / Math.max(atual, 0.01)) * 100 : 0)
                : Math.min(100, meta > 0 ? (atual / meta) * 100 : 0)

              return (
                <div key={cfg.key} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8 }}>{cfg.label}</div>
                  <div style={{ height: 6, background: '#1f2937', borderRadius: 3, marginBottom: 6, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: ok ? '#22c55e' : '#ef4444', borderRadius: 3, transition: 'width 0.5s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                    <span style={{ color: ok ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                      <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: ok ? '#22c55e' : '#ef4444', marginRight: 4, verticalAlign: 'middle' }} />
                      {cfg.unidade === 'R$' ? `R$${atual.toFixed(2)}` : `${atual.toFixed(1)}%`}
                    </span>
                    <span style={{ color: '#4b5563' }}>
                      meta: {cfg.unidade === 'R$' ? `R$${meta}` : `${meta}%`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Metricas derivadas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {([
            { label: 'CPL', valor: fmtMoeda(metricas.cpl), meta: '≤ R$5', ok: metricas.cpl > 0 && metricas.cpl <= 5 },
            { label: 'Ticket Medio', valor: fmtMoeda(metricas.ticket_medio), meta: '≥ R$4.500', ok: metricas.ticket_medio >= 4500 },
            { label: 'CAC', valor: fmtMoeda(metricas.cac), meta: '≤ R$300', ok: metricas.cac > 0 && metricas.cac <= 300 },
            { label: 'ROI', valor: fmtPct(metricas.roi), meta: '> 0%', ok: metricas.roi > 0 },
          ] as const).map(m => (
            <div key={m.label} style={{
              background: '#111827',
              border: `1px solid ${m.ok ? '#22c55e30' : '#ef444430'}`,
              borderRadius: 12, padding: 16,
            }}>
              <div style={{ fontSize: 11, color: '#6b7280' }}>{m.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: m.ok ? '#22c55e' : '#ef4444', margin: '4px 0' }}>{m.valor}</div>
              <div style={{ fontSize: 10, color: '#4b5563' }}>meta {m.meta}</div>
            </div>
          ))}
        </div>

        {/* Historico diario */}
        {historico && historico.length > 0 && (
          <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#fff', margin: 0 }}>Historico do Mes</h2>
              <span style={{ fontSize: 11, color: '#6b7280' }}>Faturamento diario</span>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 64, marginBottom: 12 }}>
              {historico.slice(-14).map((d, i) => {
                const maxFat = Math.max(...historico.map(x => Number(x.faturamento) || 0), 1)
                const h = Math.max(4, (Number(d.faturamento || 0) / maxFat) * 56)
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: '100%', height: h, background: '#f59e0b', borderRadius: 3, minHeight: 4 }} title={`${d.data}: ${fmtMoeda(Number(d.faturamento))}`} />
                    <div style={{ fontSize: 8, color: '#4b5563' }}>{String(d.data).slice(8)}</div>
                  </div>
                )
              })}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['Data', 'Invest.', 'Leads', 'Agend.', 'Comp.', 'Fecha.', 'Fatura.', 'CPL', 'Tx.Fecha.'].map(h => (
                    <th key={h} style={{ color: '#6b7280', fontWeight: 600, padding: '6px 8px', textAlign: 'right', borderBottom: '1px solid #1f2937' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historico.slice(0, 10).map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #111827' }}>
                    <td style={{ padding: '6px 8px', color: '#9ca3af' }}>{d.data}</td>
                    <td style={{ padding: '6px 8px', color: '#e5e7eb', textAlign: 'right' }}>R${Number(d.investimento).toFixed(0)}</td>
                    <td style={{ padding: '6px 8px', color: '#e5e7eb', textAlign: 'right' }}>{d.leads}</td>
                    <td style={{ padding: '6px 8px', color: '#e5e7eb', textAlign: 'right' }}>{d.agendamentos}</td>
                    <td style={{ padding: '6px 8px', color: '#e5e7eb', textAlign: 'right' }}>{d.comparecimentos}</td>
                    <td style={{ padding: '6px 8px', color: '#22c55e', textAlign: 'right', fontWeight: 600 }}>{d.fechamentos}</td>
                    <td style={{ padding: '6px 8px', color: '#f59e0b', textAlign: 'right', fontWeight: 600 }}>R${Number(d.faturamento).toLocaleString('pt-BR')}</td>
                    <td style={{ padding: '6px 8px', color: Number(d.cpl) <= 5 ? '#22c55e' : '#ef4444', textAlign: 'right' }}>R${Number(d.cpl).toFixed(2)}</td>
                    <td style={{ padding: '6px 8px', color: Number(d.taxa_fechamento) >= 40 ? '#22c55e' : '#ef4444', textAlign: 'right' }}>{Number(d.taxa_fechamento).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
