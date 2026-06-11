import { useState, useCallback } from 'react'
import { useEndpointSchema, type OpenAPISchemaEntry } from '../../hooks/use-openapi-spec'
import { cn } from '../../lib/utils'

interface Props {
  endpoint: string
  primaryFields: string[]
  onChange: (params: Record<string, unknown>) => void
}

export function AdvancedControls({ endpoint, primaryFields, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const { entries, isLoading, error } = useEndpointSchema(endpoint, primaryFields)
  const [values, setValues] = useState<Record<string, unknown>>({})

  const update = useCallback((name: string, value: unknown) => {
    setValues((prev) => {
      const next = { ...prev, [name]: value }
      onChange(next)
      return next
    })
  }, [onChange])

  if (isLoading) return null
  if (error) return null

  return (
    <div className="border-t border-white/[0.04] pt-3 mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-[13px] text-white/35 hover:text-white/60 transition-colors w-full py-1"
      >
        <svg
          className={cn('transition-transform duration-150 shrink-0', open && 'rotate-90')}
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
        <span className="font-medium">Advanced</span>
        {entries.length > 0 && (
          <span className="text-white/20">({entries.length} parameter{entries.length !== 1 ? 's' : ''})</span>
        )}
      </button>

      {open && entries.length > 0 && (
        <div className="mt-3 flex flex-col gap-3">
          {entries.map((entry) => (
            <Control key={entry.name} entry={entry} value={values[entry.name]} onChange={(v) => update(entry.name, v)} />
          ))}
        </div>
      )}

      {open && entries.length === 0 && (
        <div className="mt-2 text-[12px] text-white/20 italic">
          No additional parameters detected for this endpoint.
        </div>
      )}
    </div>
  )
}

function Control({ entry, value, onChange }: { entry: OpenAPISchemaEntry; value: unknown; onChange: (v: unknown) => void }) {
  const label = entry.name.replace(/_/g, ' ')
  const currentValue = value ?? entry.default

  if (entry.type === 'boolean') {
    const boolVal = currentValue === true || currentValue === 'true'
    return (
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-white/55 capitalize">{label}</span>
        <button
          onClick={() => onChange(!boolVal)}
          className={cn(
            'w-8 h-[18px] rounded-full transition-colors relative',
            boolVal ? 'bg-white' : 'bg-white/[0.08]',
          )}
        >
          <div className={cn(
            'absolute top-[2px] w-[14px] h-[14px] rounded-full transition-all',
            boolVal ? 'left-[16px] bg-black' : 'left-[2px] bg-white/30',
          )} />
        </button>
      </div>
    )
  }

  if (entry.enum && entry.enum.length > 0) {
    const opts = entry.enum.map((e) => ({ value: e, label: e }))
    return (
      <div>
        <label className="text-[12px] text-white/20 uppercase tracking-[0.08em] font-medium block mb-1 capitalize">{label}</label>
        <select
          value={String(currentValue ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-[14px] text-white/70 outline-none focus:border-white/[0.15] transition-colors"
        >
          <option value="">Default</option>
          {opts.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    )
  }

  if ((entry.type === 'number' || entry.type === 'integer') && entry.minimum !== undefined && entry.maximum !== undefined) {
    const numVal = typeof currentValue === 'number' ? currentValue : Number(entry.default ?? entry.minimum)
    const step = entry.type === 'integer' ? 1 : 0.1
    const range = entry.maximum - entry.minimum
    const useSlider = range <= 1000
    if (useSlider) {
      return (
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="text-[12px] text-white/20 uppercase tracking-[0.08em] font-medium capitalize">{label}</label>
            <span className="text-[12px] text-white/35 font-mono">{numVal}</span>
          </div>
          <input type="range" min={entry.minimum} max={entry.maximum} step={step} value={numVal} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
        </div>
      )
    }
  }

  if (entry.type === 'integer') {
    return (
      <div>
        <label className="text-[12px] text-white/20 uppercase tracking-[0.08em] font-medium block mb-1 capitalize">{label}</label>
        <input type="number" value={String(currentValue ?? '')} onChange={(e) => onChange(Number(e.target.value))} min={entry.minimum} max={entry.maximum} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-[14px] text-white/70 outline-none focus:border-white/[0.15] transition-colors" />
      </div>
    )
  }

  return (
    <div>
      <label className="text-[12px] text-white/20 uppercase tracking-[0.08em] font-medium block mb-1 capitalize">{label}</label>
      <input type="text" value={String(currentValue ?? '')} onChange={(e) => onChange(e.target.value || undefined)} placeholder={entry.description ? entry.description.slice(0, 60) : `Set ${entry.name}`} className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-[14px] text-white/70 outline-none placeholder:text-white/10 focus:border-white/[0.15] transition-colors" />
    </div>
  )
}