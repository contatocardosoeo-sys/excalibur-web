'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface LeadsData {
  data: string
  leads: number
}

export default function LeadsChart({ data }: { data: LeadsData[] }) {
  if (data.length === 0) {
    return <p className="text-gray-500 text-xs text-center py-8">Sem dados no período</p>
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="data"
          tick={{ fill: '#6b7280', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: '#6b7280', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          width={25}
        />
        <Tooltip
          contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8, fontSize: 12, color: '#fff' }}
          formatter={(value) => [`${value} leads`, '']}
        />
        <Area
          type="monotone"
          dataKey="leads"
          stroke="#f59e0b"
          strokeWidth={2}
          fill="url(#amberGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
