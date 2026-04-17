import { useSettingsStore } from '../../stores/settings-store'
import { useModels } from '../../hooks/use-models'
import { useAuthStore } from '../../stores/auth-store'
import { Select } from '../ui/select'

const modelTypeMap: Record<string, string> = {
  chat: 'text',
  image: 'image',
  audio: 'tts',
  music: 'music',
  video: 'video',
  embeddings: 'embedding',
}

const tabLabels: Record<string, string> = {
  chat: 'Chat',
  image: 'Image',
  audio: 'Audio',
  music: 'Music',
  video: 'Video',
  embeddings: 'Embeddings',
  workflows: 'Workflows',
  playground: 'Playground',
}

const noModelSelector = new Set(['video', 'workflows', 'playground'])

interface Props {
  onOpenApiKey: () => void
  onOpenMobileSidebar?: () => void
}

export function Header({ onOpenApiKey, onOpenMobileSidebar }: Props) {
  const { activeTab, selectedModels, setSelectedModel, toggleSidebar } = useSettingsStore()
  const apiKey = useAuthStore((s) => s.apiKey)
  const hasOwnSelector = noModelSelector.has(activeTab)
  const modelType = modelTypeMap[activeTab] || 'text'
  const { data: models } = useModels(hasOwnSelector ? undefined : modelType)
  const currentModel = hasOwnSelector ? '' : (selectedModels[activeTab] || models?.[0]?.id || '')
  const modelOptions = hasOwnSelector ? [] : (models?.map((m) => ({ value: m.id, label: m.model_spec?.name || m.id })) ?? [])

  return (
    <header className="flex items-center gap-2.5 h-12 px-2.5 border-b border-white/[0.06] bg-[#0a0a0a] shrink-0">
      {/* Mobile menu toggle */}
      <button
        onClick={() => onOpenMobileSidebar?.()}
        aria-label="Open menu"
        className="md:hidden text-white/45 hover:text-white/80 transition-colors p-1.5 -ml-1 rounded-md focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/40"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
          <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>

      {/* Desktop sidebar collapse toggle */}
      <button
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
        className="hidden md:block text-white/45 hover:text-white/80 transition-colors p-1 rounded-md focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/40"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="16" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>

      <span className="text-[13px] font-medium text-white/45 uppercase tracking-[0.08em]">{tabLabels[activeTab]}</span>

      {!hasOwnSelector && (
        <>
          <div className="w-px h-4 bg-white/[0.06]" aria-hidden />
          <Select
            value={currentModel}
            onChange={(v) => setSelectedModel(activeTab, v)}
            options={modelOptions}
            searchable
            placeholder="Select model..."
            className="w-44 sm:w-60"
          />
        </>
      )}

      <div className="flex-1" />

      <button
        onClick={onOpenApiKey}
        aria-label={apiKey ? 'API key connected, manage' : 'Connect API key'}
        className="flex items-center gap-1.5 text-[13px] px-2 py-1 rounded-md border border-white/[0.08] hover:border-white/[0.18] transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/40"
      >
        <span aria-hidden className={`w-1.5 h-1.5 rounded-full transition-colors ${apiKey ? 'bg-green-400/85' : 'bg-white/25'}`} />
        <span className={apiKey ? 'text-white/65' : 'text-white/55'}>
          {apiKey ? 'Connected' : 'API Key'}
        </span>
      </button>
    </header>
  )
}
