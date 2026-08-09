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
      <div className="flex items-center gap-2.5 flex-wrap">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{
            border: `1.5px solid ${open || hasFilter ? 'var(--primary)' : 'var(--border-color)'}`,
            background: open || hasFilter ? 'var(--primary-muted)' : 'white',
            color: open || hasFilter ? 'var(--primary)' : 'var(--text-secondary)',
          }}
        >
          <CalendarRange className="w-4 h-4" />
          Filtrar por Período
          {hasFilter && (
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white" style={{ background: 'var(--primary)' }}>1</span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {hasFilter && !open && (
          <div className="flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-full" style={{ background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' }}>
            <Calendar className="w-3.5 h-3.5" />
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
        <div className="mt-3 p-5 rounded-2xl animate-fade-in space-y-4" style={{ background: 'white', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarRange className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              <span className="text-sm font-bold" style={{ color: 'var(--text-heading)', fontFamily: "'Poppins', sans-serif" }}>Seletor de Período</span>
            </div>
            {hasFilter && (
              <button onClick={clearDates} className="text-xs font-bold flex items-center gap-1" style={{ color: '#dc2626' }}>
                <X className="w-3 h-3" /> Limpar
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {DATE_FIELD_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => onChange({ ...value, dateField: opt.value })}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                style={{
                  border: `1.5px solid ${value.dateField === opt.value ? 'var(--primary)' : 'var(--border-color)'}`,
                  background: value.dateField === opt.value ? 'var(--primary-muted)' : '#f8fafc',
                  color: value.dateField === opt.value ? 'var(--primary)' : 'var(--text-secondary)',
                }}
              >
                <Calendar className="w-3 h-3" />
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(p => (
              <button
                key={p.key}
                onClick={() => applyPreset(p.key)}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                style={{
                  border: `1.5px solid ${activePreset === p.key ? 'var(--primary)' : 'var(--border-color)'}`,
                  background: activePreset === p.key ? 'var(--primary-muted)' : '#f8fafc',
                  color: activePreset === p.key ? 'var(--primary)' : 'var(--text-secondary)',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-sm">
            <div>
              <label className="form-label">De</label>
              <input type="date" className="form-input" style={{ fontSize: '13px' }} value={value.dateFrom} onChange={e => { onChange({ ...value, dateFrom: e.target.value }); setActivePreset('') }} />
            </div>
            <div>
              <label className="form-label">Até</label>
              <input type="date" className="form-input" style={{ fontSize: '13px' }} value={value.dateTo} onChange={e => { onChange({ ...value, dateTo: e.target.value }); setActivePreset('') }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
