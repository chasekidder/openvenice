import { useMemo, useState } from 'react'
import { cn } from '../../lib/utils'
import { useSettingsStore, type Tab } from '../../stores/settings-store'
import { useChatStore } from '../../stores/chat-store'
import { toast } from '../../stores/toast-store'
import { VeniceLogo, VeniceWordmark } from '../ui/logo'
import type { Conversation } from '../../types/venice'

function ChatIcon() {
  return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>)
}
function ImageIcon() {
  return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>)
}
function AudioIcon() {
  return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>)
}
function VideoIcon() {
  return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>)
}
function MusicIcon() {
  return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="5.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="15.5" r="2.5" /><path d="M8 17.5V5l12-2v12.5" /></svg>)
}
function EmbedIcon() {
  return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>)
}
function WorkflowIcon() {
  return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2" /><circle cx="6" cy="19" r="2" /><circle cx="18" cy="19" r="2" /><path d="M12 7v4M12 11l-6 6M12 11l6 6" /></svg>)
}
function PlaygroundIcon() {
  return (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M4.93 4.93l2.83 2.83M2 12h4M4.93 19.07l2.83-2.83M12 18v4M19.07 19.07l-2.83-2.83M22 12h-4M19.07 4.93l-2.83 2.83" /><circle cx="12" cy="12" r="3" /></svg>)
}

const tabs: Array<{ id: Tab; label: string; Icon: () => React.JSX.Element }> = [
  { id: 'chat', label: 'Chat', Icon: ChatIcon },
  { id: 'image', label: 'Image', Icon: ImageIcon },
  { id: 'audio', label: 'Audio', Icon: AudioIcon },
  { id: 'music', label: 'Music', Icon: MusicIcon },
  { id: 'video', label: 'Video', Icon: VideoIcon },
  { id: 'embeddings', label: 'Embed', Icon: EmbedIcon },
  { id: 'workflows', label: 'Workflows', Icon: WorkflowIcon },
  { id: 'playground', label: 'Playground', Icon: PlaygroundIcon },
]

interface Props {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ mobileOpen, onMobileClose }: Props) {
  const activeTab = useSettingsStore((s) => s.activeTab)
  const setActiveTab = useSettingsStore((s) => s.setActiveTab)
  const sidebarOpen = useSettingsStore((s) => s.sidebarOpen)
  const conversations = useChatStore((s) => s.conversations)
  const activeConversationId = useChatStore((s) => s.activeConversationId)
  const setActiveConversation = useChatStore((s) => s.setActiveConversation)
  const createConversation = useChatStore((s) => s.createConversation)
  const deleteConversation = useChatStore((s) => s.deleteConversation)
  const selectedModel = useSettingsStore((s) => s.selectedModels.chat)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter((c) => c.title.toLowerCase().includes(q))
  }, [conversations, search])

  const handleDelete = (conv: Conversation) => {
    deleteConversation(conv.id)
    toast.info('Conversation deleted', conv.title || 'Untitled', /* action */)
    // Offer undo via toast action
    const snapshot = conv
    const id = toast.error('Conversation deleted', snapshot.title || 'Untitled', {
      label: 'Undo',
      onClick: () => {
        // Re-add at top of list
        useChatStore.setState((s) => ({ conversations: [snapshot, ...s.conversations] }))
      },
    })
    void id
  }

  const exportConversation = (conv: Conversation) => {
    const md = conversationToMarkdown(conv)
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(conv.title || 'conversation').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}.md`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const desktopVisibility = sidebarOpen ? 'md:w-64' : 'md:w-14'

  return (
    <aside
      aria-label="Primary navigation"
      className={cn(
        'flex flex-col h-full bg-[#0a0a0a] border-r border-white/[0.06] transition-all duration-150 ease-out',
        // Mobile: drawer
        'fixed top-0 left-0 z-40 w-72 h-[100dvh] md:static md:h-full md:w-auto',
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        desktopVisibility,
      )}
    >
      <div className={cn('flex items-center gap-2 h-14 shrink-0', sidebarOpen ? 'px-3' : 'md:px-2 md:justify-center px-3')}>
        <VeniceLogo size={18} />
        {(sidebarOpen || mobileOpen) && <VeniceWordmark className="text-[15px]" />}
        <button
          onClick={onMobileClose}
          aria-label="Close menu"
          className="md:hidden ml-auto p-1 text-white/40 hover:text-white/80 rounded focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/40"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>

      <nav aria-label="Sections" className="flex flex-col gap-px px-1.5 pt-0.5">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              onClick={() => { setActiveTab(id); onMobileClose?.() }}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2 rounded-md text-[15px] transition-colors duration-100 focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/40',
                sidebarOpen || mobileOpen ? 'px-2 py-[7px]' : 'md:px-0 md:py-[7px] md:justify-center px-2 py-[7px]',
                isActive
                  ? 'bg-white/[0.07] text-white/90'
                  : 'text-white/45 hover:text-white/75 hover:bg-white/[0.04]',
              )}
            >
              <Icon />
              {(sidebarOpen || mobileOpen) && <span className="font-medium">{label}</span>}
            </button>
          )
        })}
      </nav>

      {(sidebarOpen || mobileOpen) && activeTab === 'chat' && (
        <div className="flex flex-col flex-1 min-h-0 mt-2">
          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-[12px] font-medium text-white/40 uppercase tracking-[0.08em]">History</span>
            <button
              onClick={() => createConversation(selectedModel || 'llama-3.3-70b')}
              aria-label="New chat"
              className="text-white/45 hover:text-white/85 transition-colors p-1 rounded focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/40"
              title="New chat (⌘N)"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            </button>
          </div>
          {conversations.length > 5 && (
            <div className="px-2.5 pb-1.5">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                aria-label="Search conversations"
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded px-2 py-1 text-[13px] text-white/70 outline-none focus:border-white/[0.15] placeholder:text-white/20"
              />
            </div>
          )}
          <div className="flex-1 overflow-y-auto px-1.5 pb-2" role="list">
            {filtered.length === 0 ? (
              <div className="px-2 py-5 text-[13px] text-white/30 text-center">
                {search ? 'No matches' : 'No conversations yet'}
              </div>
            ) : (
              filtered.map((conv) => (
                <ConversationRow
                  key={conv.id}
                  conv={conv}
                  isActive={conv.id === activeConversationId}
                  onSelect={() => setActiveConversation(conv.id)}
                  onDelete={() => handleDelete(conv)}
                  onExport={() => exportConversation(conv)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {!sidebarOpen && !mobileOpen && <div className="hidden md:block flex-1" />}

      {(sidebarOpen || mobileOpen) && (
        <div className="px-3 py-2.5 border-t border-white/[0.04]">
          <div className="text-[12px] text-white/30 space-y-px">
            <div className="flex justify-between"><span>New chat</span><kbd className="font-mono">⌘N</kbd></div>
            <div className="flex justify-between"><span>Switch tab</span><kbd className="font-mono">⌘1-8</kbd></div>
          </div>
        </div>
      )}
    </aside>
  )
}

function ConversationRow({ conv, isActive, onSelect, onDelete, onExport }: {
  conv: Conversation
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
  onExport: () => void
}) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div
      role="listitem"
      className={cn(
        'group relative flex items-center gap-1 px-3 py-[6px] rounded-md text-[14px] cursor-pointer transition-colors',
        isActive
          ? 'bg-white/[0.07] text-white/85'
          : 'text-white/55 hover:text-white/85 hover:bg-white/[0.03]',
      )}
      onClick={onSelect}
    >
      <span className="truncate flex-1">{conv.title || 'Untitled'}</span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onExport() }}
          aria-label={`Export ${conv.title}`}
          title="Export as Markdown"
          className="text-white/40 hover:text-white/85 p-0.5 rounded focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/40"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
        </button>
        {confirming ? (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); setConfirming(false) }}
            aria-label="Confirm delete"
            className="text-red-300/90 hover:text-red-200 px-1 text-[11px] font-medium rounded"
          >
            Delete?
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirming(true); setTimeout(() => setConfirming(false), 2500) }}
            aria-label={`Delete ${conv.title}`}
            title="Delete"
            className="text-white/40 hover:text-red-300 p-0.5 rounded focus-visible:outline focus-visible:outline-1 focus-visible:outline-white/40"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

function conversationToMarkdown(conv: Conversation): string {
  const lines: string[] = [`# ${conv.title}`, '', `_Model: ${conv.model} · Created: ${new Date(conv.createdAt).toISOString()}_`, '']
  for (const m of conv.messages) {
    lines.push(`## ${m.role === 'user' ? 'You' : m.role === 'assistant' ? 'Assistant' : 'System'}`)
    const content = typeof m.content === 'string'
      ? m.content
      : m.content.map((p) => p.type === 'text' ? p.text : p.type === 'image_url' ? `![image](${p.image_url?.url ?? ''})` : '').join('\n')
    lines.push(content)
    lines.push('')
  }
  return lines.join('\n')
}
