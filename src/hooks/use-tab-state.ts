import { useCallback } from 'react'
import { useSettingsStore } from '../stores/settings-store'

export function useTabState<T>(tab: string, key: string, defaultValue: T): [T, (value: T) => void] {
  const value = useSettingsStore((s) => {
    const tabState = s.tabFormState[tab]
    if (tabState && key in tabState) return tabState[key] as T
    return defaultValue
  })
  const setField = useSettingsStore((s) => s.setTabFormField)
  const setValue = useCallback((v: T) => setField(tab, key, v as unknown), [tab, key, setField])
  return [value, setValue]
}