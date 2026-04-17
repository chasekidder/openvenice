import { useState, useRef, useEffect } from 'react'
import { cn } from '../../lib/utils'

interface ChatInputProps {
  onSend: (message: string, images?: string[]) => void
  onStop: () => void
  isStreaming: boolean
  disabled?: boolean
}

export function ChatInput({ onSend, onStop, isStreaming, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { textareaRef.current?.focus() }, [])

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed, images.length > 0 ? images : undefined)
    setValue('')
    setImages([])
    // Reset textarea height after clearing
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleImageUpload = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        setImages((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  return (
    <div className="px-4 sm:px-5 pb-4 pt-1.5">
      <div className="w-full max-w-[960px] mx-auto">
        {/* Image previews */}
        {images.length > 0 && (
          <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <div key={i} className="relative group shrink-0">
                <img src={img} alt={`Attachment ${i + 1}`} className="h-16 rounded-lg border border-white/[0.08]" />
                <button
                  onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                  aria-label={`Remove attachment ${i + 1}`}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-black/80 hover:bg-black border border-white/[0.15] rounded-full flex items-center justify-center text-white/70 hover:text-white transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/50"
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div
          className={cn(
            'relative bg-white/[0.02] border rounded-xl overflow-hidden focus-within:border-white/[0.18] transition-colors',
            dragOver ? 'border-white/30 bg-white/[0.04]' : 'border-white/[0.08]',
          )}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true) }}
          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false) }}
          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); handleImageUpload(e.dataTransfer.files) }}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
            }}
            onPaste={(e) => {
              const items = e.clipboardData?.items
              if (!items) return
              for (const item of items) {
                if (item.type.startsWith('image/')) {
                  const file = item.getAsFile()
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = () => setImages((prev) => [...prev, reader.result as string])
                    reader.readAsDataURL(file)
                  }
                }
              }
            }}
            placeholder={disabled ? 'Connect an API key to start…' : dragOver ? 'Drop image to attach' : 'Message — Enter to send, Shift+Enter for newline'}
            rows={1}
            aria-label="Message input"
            className="w-full bg-transparent px-5 pt-4 pb-2 text-[17px] text-white/90 outline-none resize-none max-h-40 placeholder:text-white/30"
            disabled={disabled}
          />
          <div className="flex items-center justify-between px-2.5 pb-2">
            <div className="flex items-center">
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(e.target.files)} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={disabled}
                aria-label="Attach image"
                className="p-1.5 text-white/40 hover:text-white/75 transition-colors rounded-md hover:bg-white/[0.05] disabled:opacity-50 focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/40"
                title="Attach image"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
              </button>
            </div>
            {isStreaming ? (
              <button
                onClick={onStop}
                aria-label="Stop generating"
                className="flex items-center gap-1.5 px-2.5 py-1 text-[14px] font-medium text-white/65 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] rounded-md transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/40"
              >
                <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor"><rect width="8" height="8" rx="1" /></svg>
                Stop
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!value.trim() || disabled}
                aria-label="Send message"
                className={cn(
                  'w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40 focus-visible:outline-offset-2',
                  value.trim() && !disabled
                    ? 'bg-white text-black hover:bg-white/90 active:scale-95'
                    : 'bg-white/[0.06] text-white/30',
                )}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
