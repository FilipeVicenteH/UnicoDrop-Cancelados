'use client'

import { Calendar, CalendarRange, X, ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface DateFilter {
  dateField: string
  dateFrom: string
  dateTo: string
}

interface DateFilterBarProps {
  value: DateFilter
  onChange: (f: DateFilter) => void
}

const DATE_FIELD_OPTIONS = [
  { value: 'cancelamento', label: 'Data Cancelamento' },
  { value: 'contato', label: 'Data de Contato' },
]

const PRESETS = [
  { key: 'hoje', label: 'Hoje' },
  { key: '7d', label: 'Últ. 7 dias' },
  { key: '30d', label: 'Últ. 30 dias' },
  { key: 'mes', label: 'Este mês' },
  { key: 'mes_ant', label: 'Mês anterior' },
]

function getPresetRange(preset: string): { from: string; to: string } {
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  if (preset === 'hoje') return { from: fmt(today), to: fmt(today) }
  if (preset === '7d') {
    const from = new Date(today); from.setDate(from.getDate() - 6)
    return { from: fmt(from), to: fmt(today) }
  }
  if (preset === '30d') {
    const from = new Date(today); from.setDate(from.getDate() - 29)
    return { from: fmt(from), to: fmt(today) }
  }
  if (preset === 'mes') {
    return { from: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), to: fmt(today) }
  }
  if (preset === 'mes_ant') {
    const from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const to = new Date(today.getFullYear(), today.getMonth(), 0)
    return { from: fmt(from), to: fmt(to) }
  }
  return { from: '', to: '' }
}

function fmtDate(iso: string) {
  return iso ? iso.split('-').reverse().join('/') : ''
}

export default function DateFilterBar({ value, onChange }: DateFilterBarProps) {
  const [open, setOpen] = useState(false)
  const [activePreset, setActivePreset] = useState('')
  const hasFilter = value.dateFrom || value.dateTo

  const applyPreset = (key: string) => {
    const range = getPresetRange(key)
    setActivePreset(key)
    onChange({ ...value, dateFrom: range.from, dateTo: range.to })
  }

  const clearDates = () => {
    setActivePreset('')
    onChange({ ...value, dateFrom: '', dateTo: '' })
  }

  return (
    <div className="mb-5">
      {/* Toggle button */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setOpen(o => !o)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
            open || hasFilter
              ? 'border-purple-500/40 bg-purple-500/10 text-purple-300'
              : 'border-white/10 bg-white/5 text-gray-400 hover:text-gray-200 hover:border-white/20'
          }`}
        >
          <CalendarRange className="w-4 h-4" />
          Filtrar por Período
          {hasFilter && (
            <span className="bg-purple-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              1
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Active badge (shown when panel is closed) */}
        {hasFilter && !open && (
          <div className="flex items-center gap-2 text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-full">
            <Calendar className="w-3 h-3" />
            <span>
              {value.dateField === 'contato' ? 'Contato' : 'Cancelamento'}
              {value.dateFrom && ` de ${fmtDate(value.dateFrom)}`}
              {value.dateTo && ` até ${fmtDate(value.dateTo)}`}
            </span>
            <button onClick={clearDates} className="ml-1 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Panel */}
      {open && (
        <div className="mt-3 glass-card p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Filtro por Período</span>
            </div>
            {hasFilter && (
              <button
                onClick={clearDates}
                className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Limpar
              </button>
            )}
          </div>

          {/* Campo */}
          <div className="flex flex-wrap gap-2 mb-4">
            {DATE_FIELD_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => onChange({ ...value, dateField: opt.value })}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
                  value.dateField === opt.value
                    ? 'border-purple-500/50 bg-purple-500/15 text-purple-300'
                    : 'border-white/10 bg-white/5 text-gray-500 hover:text-gray-300 hover:border-white/20'
                }`}
              >
                <Calendar className="w-3 h-3" />
                {opt.label}
              </button>
            ))}
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {PRESETS.map(p => (
              <button
                key={p.key}
                onClick={() => applyPreset(p.key)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${
                  activePreset === p.key
                    ? 'border-violet-500/50 bg-violet-500/15 text-violet-300'
                    : 'border-white/8 bg-white/4 text-gray-500 hover:text-gray-300 hover:border-white/20'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Date pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">De</label>
              <input
                type="date"
                className="form-input"
                value={value.dateFrom}
                onChange={e => { onChange({ ...value, dateFrom: e.target.value }); setActivePreset('') }}
              />
            </div>
            <div>
              <label className="form-label">Até</label>
              <input
                type="date"
                className="form-input"
                value={value.dateTo}
                onChange={e => { onChange({ ...value, dateTo: e.target.value }); setActivePreset('') }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
