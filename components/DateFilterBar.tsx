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
    <div className="mb-4">
      {/* Toggle button */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <button
          onClick={() => setOpen(o => !o)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            open || hasFilter
              ? 'border-zinc-700 bg-zinc-800 text-zinc-100 shadow-sm'
              : 'border-zinc-800 bg-[#121316] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
          }`}
        >
          <CalendarRange className="w-3.5 h-3.5" />
          Filtrar por Período
          {hasFilter && (
            <span className="bg-zinc-100 text-zinc-950 font-mono text-[10px] font-bold px-1.5 rounded-full">
              1
            </span>
          )}
          <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Active badge (shown when panel is closed) */}
        {hasFilter && !open && (
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-md">
            <Calendar className="w-3.5 h-3.5" />
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
        <div className="mt-2 bg-[#121316] border border-zinc-800 rounded-xl p-4 animate-fade-in space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-zinc-400" />
              <span className="text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">Seletor de Período</span>
            </div>
            {hasFilter && (
              <button
                onClick={clearDates}
                className="text-xs font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Limpar
              </button>
            )}
          </div>

          {/* Campo */}
          <div className="flex flex-wrap gap-1.5">
            {DATE_FIELD_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => onChange({ ...value, dateField: opt.value })}
                className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-md border transition-all ${
                  value.dateField === opt.value
                    ? 'border-zinc-600 bg-zinc-800 text-zinc-100 font-medium'
                    : 'border-zinc-800 bg-zinc-900/60 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Calendar className="w-3 h-3" />
                {opt.label}
              </button>
            ))}
          </div>

          {/* Presets */}
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(p => (
              <button
                key={p.key}
                onClick={() => applyPreset(p.key)}
                className={`text-xs font-mono px-2.5 py-1 rounded-md border transition-all ${
                  activePreset === p.key
                    ? 'border-zinc-600 bg-zinc-800 text-zinc-100 font-medium'
                    : 'border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Date pickers */}
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <div>
              <label className="form-label">De</label>
              <input
                type="date"
                className="form-input text-xs"
                value={value.dateFrom}
                onChange={e => { onChange({ ...value, dateFrom: e.target.value }); setActivePreset('') }}
              />
            </div>
            <div>
              <label className="form-label">Até</label>
              <input
                type="date"
                className="form-input text-xs"
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
