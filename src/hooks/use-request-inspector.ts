import { useRequestInspectorStore } from '../stores/request-inspector-store'

export function useRequestInspector() {
  const lastRequest = useRequestInspectorStore((s) => s.lastRequest)
  const open = useRequestInspectorStore((s) => s.open)
  const setOpen = useRequestInspectorStore((s) => s.setOpen)
  const toggle = useRequestInspectorStore((s) => s.toggle)
  const capture = useRequestInspectorStore((s) => s.capture)

  return { lastRequest, open, setOpen, toggle, capture }
}