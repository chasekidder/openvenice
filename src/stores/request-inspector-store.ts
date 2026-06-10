import { create } from 'zustand'

export interface CapturedRequest {
  path: string
  method: string
  body: string
  timestamp: number
}

interface RequestInspectorState {
  lastRequest: CapturedRequest | null
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
  capture: (path: string, method: string, body: unknown) => void
}

export const useRequestInspectorStore = create<RequestInspectorState>()((set) => ({
  lastRequest: null,
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((s) => ({ open: !s.open })),
  capture: (path, method, body) =>
    set({
      lastRequest: {
        path,
        method,
        body: JSON.stringify(body, null, 2),
        timestamp: Date.now(),
      },
    }),
}))