'use client'

import { Calendar, CalendarRange, X, ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface DateFilter { dateField: string; dateFrom: string; dateTo: string }
interface DateFilterBarProps { value: DateFilter; onChange: (f: DateFilter) => void }

const DATE_FIELD_OPTIONS = [
  { value: 'cancelamento', label: 'Data Cancelamento' },
  { value: 'contato', label: 'Data de Contato' },
]
const PRESETS = [
  { key: 'hoje', label: 'Hoje' },
  { key: '7d', label: 'Últimos 7 dias' },
  { key: '30d', label: 'Últimos 30 dias' },
  { key: 'mes', label: 'Este mês' },
  { key: 'mes_ant', label: 'Mês anterior' },
]

function getPresetRange(preset: string): { from: string; to: string } {
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  if (preset === 'hoje') return { from: fmt(today), to: fmt(today) }
  if (preset === '7d') { const f = new Date(today); f.setDate(f.getDate() - 6); return { from: fmt(f), to: fmt(today) } }
  if (preset === '30d') { const f = new Date(today); f.setDate(f.getDate() - 29); return { from: fmt(f), to: fmt(today) } }
  if (preset === 'mes') return { from: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), to: fmt(today) }
  if (preset === 'mes_ant') return { from: fmt(new Date(today.getFullYear(), today.getMonth() - 1, 1)), to: fmt(new Date(today.getFullYear(), today.getMonth(), 0)) }
  return { from: '', to: '' }
}

function fmtDate(iso: string) { return iso ? iso.split('-').reverse().join('/') : '' }

export default function DateFilterBar({ value, onChange }: DateFilterBarProps) {
  const [open, setOpen] = useState(false)
  const [activePreset, setActivePreset] = useState('')
  const hasFilter = value.dateFrom || value.dateTo

  const applyPreset = (key: string) => {
    const r = getPresetRange(key)
    setActivePreset(key)
    onChange({ ...value, dateFrom: r.from, dateTo: r.to })
  }

  const clearDates = () => { setActivePreset(''); onChange({ ...value, dateFrom: '', dateTo: '' }) }

  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setOpen(o => !o)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
            open || hasFilter
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <CalendarRange className="w-3.5 h-3.5" />
          Filtrar por Período
          {hasFilter && (
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold bg-white text-slate-900">1</span>
          )}
          <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {hasFilter && !open && (
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded border border-amber-200 bg-amber-50 text-amber-800">
            <Calendar className="w-3 h-3" />
            <span>
              {value.dateField === 'contato' ? 'Contato' : 'Cancelamento'}
              {value.dateFrom && ` de ${fmtDate(value.dateFrom)}`}
              {value.dateTo && ` até ${fmtDate(value.dateTo)}`}
            </span>
            <button onClick={clearDates} className="ml-1 hover:opacity-70"><X className="w-3 h-3" /></button>
          </div>
        )}
      </div>

      {open && (
        <div className="mt-3 p-4 rounded-lg bg-white border border-slate-200 shadow-xs space-y-3.5 animate-fade-in text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarRange className="w-3.5 h-3.5 text-slate-700" />
              <span className="font-semibold text-slate-900">Seletor de Período</span>
            </div>
            {hasFilter && (
              <button onClick={clearDates} className="font-semibold text-red-600 hover:underline flex items-center gap-1">
                <X className="w-3 h-3" /> Limpar
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {DATE_FIELD_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => onChange({ ...value, dateField: opt.value })}
                className={`px-2.5 py-1 rounded font-semibold transition-all border ${
                  value.dateField === opt.value
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(p => (
              <button
                key={p.key}
                onClick={() => applyPreset(p.key)}
                className={`px-2.5 py-1 rounded font-semibold transition-all border ${
                  activePreset === p.key
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-xs">
            <div>
              <label className="form-label">De</label>
              <input type="date" className="form-input" style={{ fontSize: '12px' }} value={value.dateFrom} onChange={e => { onChange({ ...value, dateFrom: e.target.value }); setActivePreset('') }} />
            </div>
            <div>
              <label className="form-label">Até</label>
              <input type="date" className="form-input" style={{ fontSize: '12px' }} value={value.dateTo} onChange={e => { onChange({ ...value, dateTo: e.target.value }); setActivePreset('') }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
