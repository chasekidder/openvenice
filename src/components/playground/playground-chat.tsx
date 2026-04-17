import { useState, useRef, useEffect } from 'react'
import { usePlaygroundStore } from '../../stores/playground-store'
import { useAuthStore } from '../../stores/auth-store'
import { useModelCatalog } from '../../hooks/use-model-catalog'
import { callAgent } from '../../lib/playground-agent'
import { generateId } from '../../lib/utils'
import { cn } from '../../lib/utils'

const STARTER_PROMPTS = [
  'Build a pipeline that writes a poem and narrates it aloud',
  'Research a topic with web search, then summarize into bullet points',
  'Turn a concept into a rich image prompt, then generate the image',
  'Create a short video from a scene description',
]

export function PlaygroundChat() {
  const { messages, draft, isThinking, addMessage, updateMessage, setThinking, applyAgentPatches } = usePlaygroundStore()
  const hasKey = useAuthStore((s) => s.apiKey !== null)
  const { catalog } = useModelCatalog()
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isThinking])

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isThinking) return
    if (!hasKey) {
      setError('Connect your Venice API key first.')
      return
    }
    setError(null)
    setInput('')

    const userMsg = { id: generateId(), role: 'user' as const, content: trimmed }
    const pendingMsg = { id: generateId(), role: 'assistant' as const, content: '', pending: true }
    addMessage(userMsg)
    addMessage(pendingMsg)
    setThinking(true)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const history = messages
        .filter((m) => !m.pending && !m.error)
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }))

      const response = await callAgent({
        userMessage: trimmed,
        draft,
        history,
        catalog,
        signal: controller.signal,
      })

      let patchError: string | undefined
      try {
        if (response.patches.length > 0) applyAgentPatches(response.patches)
      } catch (e) {
        patchError = e instanceof Error ? e.message : 'Failed to apply patches'
      }

      const invalidNote = response.invalidPatches > 0
        ? ` (${response.invalidPatches} invalid patch${response.invalidPatches === 1 ? '' : 'es'} ignored)`
        : ''

      const fallbackSay = response.patches.length === 0 && !response.say
        ? 'I couldn\'t parse a response. Try rephrasing or simplifying your request.'
        : response.say || (response.patches.length > 0 ? 'Updated the workflow.' : '')

      updateMessage(pendingMsg.id, {
        content: fallbackSay + invalidNote,
        patches: response.patches,
        error: patchError,
        pending: false,
      })
    } catch (e) {
      if (controller.signal.aborted) {
        updateMessage(pendingMsg.id, { content: '', error: 'Cancelled', pending: false })
      } else {
        const message = e instanceof Error ? e.message : 'Agent request failed'
        updateMessage(pendingMsg.id, { content: '', error: message, pending: false })
      }
    } finally {
      setThinking(false)
      abortRef.current = null
    }
  }

  const cancel = () => {
    abortRef.current?.abort()
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col gap-3 pt-8">
            <div className="text-[15px] text-white/50 font-medium mb-1">What should I build?</div>
            <div className="text-[13px] text-white/20 mb-4">Describe a workflow in plain language. I&apos;ll assemble it on the canvas in real time.</div>
            <div className="flex flex-col gap-2">
              {STARTER_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="text-left px-3 py-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all text-[13.5px] text-white/45"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  'flex flex-col gap-1',
                  m.role === 'user' ? 'items-end' : 'items-start',
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] px-3 py-2 rounded-xl text-[14px] leading-relaxed whitespace-pre-wrap',
                    m.role === 'user'
                      ? 'bg-white/[0.08] text-white/80'
                      : 'bg-white/[0.03] border border-white/[0.06] text-white/60',
                    m.pending && 'animate-pulse',
                  )}
                >
                  {m.pending ? (
                    <span className="text-white/30">Thinking…</span>
                  ) : m.error ? (
                    <span className="text-red-400/70">{m.error}</span>
                  ) : (
                    m.content || <span className="text-white/20 italic">(no message)</span>
                  )}
                </div>
                {m.patches && m.patches.length > 0 && (
                  <div className="max-w-[85%] px-3 py-1 text-[11.5px] text-white/25 font-mono tracking-wide">
                    {m.patches.length} patch{m.patches.length === 1 ? '' : 'es'} applied
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-white/[0.06] p-3">
        {error && <div className="mb-2 text-[13px] text-red-400/80">{error}</div>}
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send(input)
              }
            }}
            placeholder={isThinking ? 'Agent is thinking…' : 'Describe a workflow or a change…'}
            rows={2}
            disabled={isThinking}
            className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-[14px] text-white/70 outline-none resize-none placeholder:text-white/15 focus:border-white/[0.12] disabled:opacity-60"
          />
          {isThinking ? (
            <button
              onClick={cancel}
              className="shrink-0 px-3 py-2 text-[13px] text-white/40 hover:text-white/70 border border-white/[0.08] rounded-lg transition-colors"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={() => send(input)}
              disabled={!input.trim()}
              className="shrink-0 px-4 py-2 text-[14px] font-medium bg-white text-black rounded-lg hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
