import { useState } from 'react'
import { useAuthStore } from '../../stores/auth-store'
import { VeniceLogo } from '../ui/logo'

export function ApiKeyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { apiKey, hasEncrypted, setApiKey, unlock, clearApiKey } = useAuthStore()
  const [value, setValue] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [remember, setRemember] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forceConnect, setForceConnect] = useState(false)

  if (!open) return null

  const isUnlockMode = hasEncrypted && !apiKey && !forceConnect

  const handleConnect = async () => {
    if (!value.trim()) return
    if (remember && !passphrase) {
      setError('Passphrase required to remember key')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await setApiKey(value.trim(), remember ? { passphrase } : undefined)
      onClose()
    } catch {
      setError('Failed to save key')
    } finally {
      setBusy(false)
    }
  }

  const handleUnlock = async () => {
    if (!passphrase) return
    setBusy(true)
    setError(null)
    const ok = await unlock(passphrase)
    setBusy(false)
    if (ok) onClose()
    else setError('Wrong passphrase')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-[#0e0e0e] border border-white/[0.08] rounded-xl p-6 w-full max-w-sm mx-4 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6">
          <VeniceLogo size={26} />
          <div>
            <h2 className="text-[17px] font-semibold text-white/90">
              {isUnlockMode ? 'Unlock saved key' : 'Connect to Venice'}
            </h2>
            <p className="text-[14px] text-white/25">
              {isUnlockMode
                ? 'Enter your passphrase to decrypt.'
                : 'Stored in this tab only. Encrypt to persist.'}
            </p>
          </div>
        </div>

        {isUnlockMode ? (
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Passphrase"
            className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[16px] text-white outline-none focus:border-white/[0.15] transition-colors placeholder:text-white/10"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUnlock()
              if (e.key === 'Escape') onClose()
            }}
          />
        ) : (
          <>
            <input
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[16px] text-white outline-none focus:border-white/[0.15] transition-colors font-mono placeholder:text-white/10"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !remember) handleConnect()
                if (e.key === 'Escape') onClose()
              }}
            />
            <p className="text-[14px] text-white/15 mt-2">
              Get a key at{' '}
              <a href="https://venice.ai/settings/api" target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-white/50 underline underline-offset-2 transition-colors">
                venice.ai/settings/api
              </a>
            </p>

            <label className="flex items-center gap-2 mt-4 text-[14px] text-white/40 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="accent-white/80"
              />
              Remember across sessions (encrypted)
            </label>

            {remember && (
              <input
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Passphrase"
                className="w-full mt-2 bg-[#0a0a0a] border border-white/[0.08] rounded-lg px-3.5 py-2.5 text-[16px] text-white outline-none focus:border-white/[0.15] transition-colors placeholder:text-white/10"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConnect()
                  if (e.key === 'Escape') onClose()
                }}
              />
            )}
          </>
        )}

        {isUnlockMode && (
          <button
            onClick={() => { setForceConnect(true); setError(null); setPassphrase('') }}
            className="mt-3 text-[13px] text-white/30 hover:text-white/50 transition-colors"
          >
            Use a different key
          </button>
        )}

        {error && <p className="text-[13px] text-red-400/80 mt-3">{error}</p>}

        <div className="flex gap-2 mt-6 justify-end">
          {(apiKey || hasEncrypted) && (
            <button onClick={() => { clearApiKey(); setValue(''); setPassphrase(''); setRemember(false) }} className="px-3 py-1.5 text-[15px] text-white/20 hover:text-white/40 transition-colors">
              Disconnect
            </button>
          )}
          <button onClick={onClose} className="px-3 py-1.5 text-[15px] text-white/30 hover:text-white/50 transition-colors">
            Cancel
          </button>
          <button
            onClick={isUnlockMode ? handleUnlock : handleConnect}
            disabled={busy || (isUnlockMode ? !passphrase : !value.trim())}
            className="px-4 py-1.5 text-[15px] font-medium bg-white text-black rounded-md hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {busy ? '...' : isUnlockMode ? 'Unlock' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  )
}
