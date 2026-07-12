'use client'

import { DashboardMetrics } from '@/lib/types'
import { TrendingUp, Users, CheckCircle, XCircle, Clock, PhoneCall, UserMinus } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
  type PieLabelRenderProps
} from 'recharts'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants'

interface DashboardProps {
  metrics: DashboardMetrics
}

const RADIAN = Math.PI / 180
const renderCustomizedLabel = (props: PieLabelRenderProps) => {
  const cx = props.cx as number
  const cy = props.cy as number
  const midAngle = props.midAngle as number
  const innerRadius = props.innerRadius as number
  const outerRadius = props.outerRadius as number
  const percent = props.percent as number
  if (!percent || percent < 0.05) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="600">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function Dashboard({ metrics }: DashboardProps) {
  const statCards = [
    {
      label: 'Total de Clientes',
      value: metrics.total,
      icon: Users,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
    {
      label: 'Convertidos',
      value: metrics.convertidos,
      icon: CheckCircle,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    {
      label: 'Não Convertidos',
      value: metrics.nao_convertidos,
      icon: XCircle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
    },
    {
      label: 'Em Negociação',
      value: metrics.em_negociacao,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    {
      label: 'Taxa de Conversão',
      value: `${metrics.taxa_conversao}%`,
      icon: TrendingUp,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/20',
    },
    {
      label: 'Contatados Hoje',
      value: metrics.contatados_hoje,
      icon: PhoneCall,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/20',
    },
    {
      label: 'Cancelaram Hoje',
      value: metrics.cancelados_hoje,
      icon: UserMinus,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
    },
    {
      label: 'Pendentes',
      value: metrics.pendentes,
      icon: Clock,
      color: 'text-gray-400',
      bg: 'bg-gray-500/10',
      border: 'border-gray-500/20',
    },
  ]

  const pieData = metrics.por_status.map(s => ({
    name: STATUS_LABELS[s.status] || s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] || '#6B7280',
  }))

  const barData = metrics.por_checkout
    .filter(c => c.checkout !== 'Não informado')
    .slice(0, 6)
    .map(c => ({
      name: c.checkout.length > 12 ? c.checkout.slice(0, 12) + '...' : c.checkout,
      value: c.count,
    }))

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className={`relative overflow-hidden rounded-xl border ${card.border} ${card.bg} p-4 transition-transform hover:scale-[1.02]`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              {/* Decorative glow */}
              <div className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full ${card.bg} blur-xl opacity-50`} />
            </div>
          )
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pie Chart - Status */}
        <div className="bg-white/3 border border-white/8 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Distribuição por Status</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={85}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1a1a2e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  formatter={(value) => <span style={{ color: '#9CA3AF', fontSize: '11px' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-600 text-sm">
              Sem dados ainda
            </div>
          )}
        </div>

        {/* Bar Chart - Checkout */}
        <div className="bg-white/3 border border-white/8 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Checkouts Mais Usados</h3>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barCategoryGap="30%">
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={20}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1a1a2e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-600 text-sm">
              Sem dados ainda
            </div>
          )}
        </div>
      </div>

      {/* Conversion Bar */}
      <div className="bg-white/3 border border-white/8 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-300">Funil de Reconversão</h3>
          <span className="text-xs text-gray-500">{metrics.total} clientes no total</span>
        </div>
        <div className="space-y-2.5">
          {[
            { label: 'Convertidos', value: metrics.convertidos, color: 'bg-emerald-500' },
            { label: 'Em Negociação', value: metrics.em_negociacao, color: 'bg-amber-500' },
            { label: 'Pendentes', value: metrics.pendentes, color: 'bg-gray-500' },
            { label: 'Não Convertidos', value: metrics.nao_convertidos, color: 'bg-red-500' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-28 flex-shrink-0">{item.label}</span>
              <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.color} transition-all duration-700`}
                  style={{ width: metrics.total > 0 ? `${(item.value / metrics.total) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-400 w-6 text-right">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
