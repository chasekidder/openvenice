import { useState, useCallback } from 'react'
import { useRequestInspector } from '../../hooks/use-request-inspector'
import { venice } from '../../lib/venice-client'

export function RequestInspector() {
  const { lastRequest, open, setOpen } = useRequestInspector()
  const [editedBody, setEditedBody] = useState('')
  const [sending, setSending] = useState(false)

  const body = lastRequest?.body ?? ''

  const handleCopyCurl = useCallback(() => {
    if (!lastRequest) return
    const stub = '/tmp/venice-payload.json'
    const curl = `cat > ${stub} <<'JSONEOF'\n${body}\nJSONEOF\ncurl -X ${lastRequest.method} https://api.venice.ai/api/v1${lastRequest.path} \\\n  -H "Authorization: Bearer $VENICE_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d @${stub}`
    navigator.clipboard.writeText(curl)
  }, [lastRequest, body])

  const handleApplyAndRetry = useCallback(async () => {
    if (!lastRequest) return
    setSending(true)
    try {
      let parsed: unknown
      try { parsed = JSON.parse(editedBody || body) } catch { return }
      await venice(lastRequest.path, {
        method: lastRequest.method,
        body: typeof parsed === 'string' ? parsed : JSON.stringify(parsed),
      })
    } catch {
    } finally {
      setSending(false)
    }
  }, [lastRequest, editedBody, body])

  const isStreamingEndpoint = lastRequest?.path === '/chat/completions'

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
      <div className="relative w-[520px] max-w-full h-full bg-[#0a0a0c] border-l border-white/[0.08] flex flex-col animate-slide-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-white/85">Request Inspector</span>
            {lastRequest && (
              <span className="text-[12px] font-mono text-white/30 bg-white/[0.03] rounded px-1.5 py-0.5">
                {lastRequest.method} {lastRequest.path}
              </span>
            )}
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-white/30 hover:text-white/70 transition-colors p-1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {!lastRequest ? (
          <div className="flex-1 flex items-center justify-center text-white/20 text-[14px] px-6 text-center">
            Make an API request to see its payload here
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-4 py-2 border-b border-white/[0.04] flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyCurl}
                className="text-[12px] text-white/30 hover:text-white/60 transition-colors px-2 py-1 rounded border border-white/[0.06] hover:border-white/[0.12]"
              >
                Copy as cURL
              </button>
              <button
                onClick={handleApplyAndRetry}
                disabled={sending || isStreamingEndpoint}
                title={isStreamingEndpoint ? 'Not available for streaming endpoints' : 'Resend the edited payload'}
                className="text-[12px] text-white/30 hover:text-white/60 transition-colors px-2 py-1 rounded border border-white/[0.06] hover:border-white/[0.12] disabled:opacity-30"
              >
                {sending ? 'Sending...' : 'Apply & Retry'}
              </button>
            </div>
            <textarea
              key={lastRequest.timestamp}
              defaultValue={body}
              onChange={(e) => setEditedBody(e.target.value)}
              className="flex-1 w-full bg-transparent text-[13px] font-mono text-white/70 p-4 outline-none resize-none whitespace-pre overflow-auto"
              spellCheck={false}
            />
          </div>
        )}
      </div>
    </div>
  )
}