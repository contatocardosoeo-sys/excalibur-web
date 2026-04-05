'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface FunilData {
  etapa: string
  valor: number
}

const CORES = ['#6b7280', '#3b82f6', '#f59e0b', '#a855f7', '#22c55e']

export default function FunilChart({ data }: { data: FunilData[] }) {
  if (data.length === 0) return null

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="etapa"
          width={100}
          tick={{ fill: '#9ca3af', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12, color: '#fff' }}
          cursor={{ fill: 'rgba(245, 158, 11, 0.1)' }}
          formatter={(value) => [`${value} leads`, '']}
        />
        <Bar dataKey="valor" radius={[0, 6, 6, 0]} barSize={24}>
          {data.map((_, i) => (
            <Cell key={i} fill={CORES[i % CORES.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
