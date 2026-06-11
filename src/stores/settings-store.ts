import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createSafeStorage } from '../lib/safe-storage'

export type Tab = 'chat' | 'image' | 'audio' | 'music' | 'video' | 'embeddings' | 'workflows' | 'playground'

interface SettingsState {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  selectedModels: Record<string, string>
  setSelectedModel: (tab: string, modelId: string) => void
  playgroundAgentModel: string
  setPlaygroundAgentModel: (modelId: string) => void
  tabFormState: Record<string, Record<string, unknown>>
  setTabFormField: (tab: string, key: string, value: unknown) => void
  clearTabFormState: (tab: string) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      activeTab: 'chat',
      setActiveTab: (tab) => set({ activeTab: tab }),
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      selectedModels: {},
      setSelectedModel: (tab, modelId) =>
        set((s) => ({ selectedModels: { ...s.selectedModels, [tab]: modelId } })),
      playgroundAgentModel: '',
      setPlaygroundAgentModel: (modelId) => set({ playgroundAgentModel: modelId }),
      tabFormState: {},
      setTabFormField: (tab, key, value) =>
        set((s) => ({
          tabFormState: {
            ...s.tabFormState,
            [tab]: { ...(s.tabFormState[tab] || {}), [key]: value },
          },
        })),
      clearTabFormState: (tab) =>
        set((s) => {
          const next = { ...s.tabFormState }
          delete next[tab]
          return { tabFormState: next }
        }),
    }),
    {
      name: 'venice-settings',
      version: 1,
      storage: createJSONStorage(() => createSafeStorage()),
    },
  ),
)
