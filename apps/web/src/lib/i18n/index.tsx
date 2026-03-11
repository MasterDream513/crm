'use client'
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { ja } from './ja'
import { en } from './en'
import type { Dictionary, Locale } from './types'

const dictionaries: Record<Locale, Dictionary> = { ja, en }
const STORAGE_KEY = 'crm_locale'

type I18nContextType = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: Dictionary
}

const I18nContext = createContext<I18nContextType>({
  locale: 'ja',
  setLocale: () => {},
  t: ja,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ja')

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (stored && dictionaries[stored]) setLocaleState(stored)
  }, [])

  function setLocale(l: Locale) {
    setLocaleState(l)
    localStorage.setItem(STORAGE_KEY, l)
    document.documentElement.lang = l === 'ja' ? 'ja' : 'en'
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: dictionaries[locale] }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}

export type { Locale, Dictionary }
