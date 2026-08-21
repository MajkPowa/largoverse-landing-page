import { useCallback } from 'react'
import { translate, type Dict, type Lang } from '../i18n'
import { useApp } from '../store/useApp'

export function useT() {
  const lang = useApp((s) => s.lang) as Lang
  const t = useCallback(
    (key: keyof Dict, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  )
  return { t, lang }
}
