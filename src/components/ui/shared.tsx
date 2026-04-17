import { cn } from '../../lib/utils'
import { Spinner } from './spinner'

export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return <label htmlFor={htmlFor} className="block text-[12px] font-medium text-white/45 uppercase tracking-[0.08em] mb-1">{children}</label>
}

export function TextArea({ value, onChange, placeholder, rows = 3, ariaLabel, maxLength }: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  ariaLabel?: string
  maxLength?: number
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      aria-label={ariaLabel ?? placeholder}
      maxLength={maxLength}
      className="w-full bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2 text-[16px] text-white/85 outline-none focus:border-white/[0.18] transition-colors resize-none placeholder:text-white/25"
    />
  )
}

export function PrimaryButton({ onClick, disabled, loading, children, ariaLabel }: {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  children: React.ReactNode
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      className={cn(
        'w-full py-2 rounded-lg text-[15px] font-medium transition-all duration-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40 focus-visible:outline-offset-2',
        !disabled && !loading
          ? 'bg-white text-black hover:bg-white/90 active:scale-[0.995]'
          : 'bg-white/[0.06] text-white/30 cursor-not-allowed',
      )}
    >
      {loading ? <span className="flex items-center justify-center gap-2"><Spinner className="text-white/45" /> Working…</span> : children}
    </button>
  )
}

export function PillGroup({ options, value, onChange, ariaLabel }: {
  options: Array<{ value: string; label: string }>
  value: string
  onChange: (v: string) => void
  ariaLabel?: string
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            'text-[14px] font-medium px-2 py-[3px] rounded-md border transition-colors duration-100 focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/40',
            o.value === value
              ? 'border-white/15 bg-white/[0.08] text-white/90'
              : 'border-white/[0.06] text-white/45 hover:text-white/70 hover:border-white/[0.12]',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  return <p role="alert" className="text-[14px] text-red-300/85">{children}</p>
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-center flex-1 text-white/30 text-[15px]">{children}</div>
}

export function ExamplePrompts({ items, onPick, title = 'Try one of these' }: {
  items: string[]
  onPick: (text: string) => void
  title?: string
}) {
  return (
    <div className="w-full max-w-md flex flex-col gap-2">
      <div className="text-[12px] uppercase tracking-[0.08em] text-white/35 font-medium">{title}</div>
      <div className="flex flex-col gap-1.5">
        {items.map((text) => (
          <button
            key={text}
            type="button"
            onClick={() => onPick(text)}
            className="text-left px-3 py-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04] transition-all text-[14px] text-white/65 focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/40"
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  )
}
