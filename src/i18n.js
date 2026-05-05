import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import pl from './locales/pl.json'

export const SUPPORTED_LOCALES = ['en', 'pl']
export const DEFAULT_LOCALE = 'pl'
const STORAGE_KEY = 'wgc.locale'

function getInitialLocale() {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
  if (stored && SUPPORTED_LOCALES.includes(stored)) return stored
  return DEFAULT_LOCALE
}

// Polish has 4 plural forms: 0 | 1 | few (2-4, excluding 12-14) | many (everything else)
// Locale strings must provide all 4 forms in that order.
function polishPluralRule(choice) {
  if (choice === 0) return 0
  if (choice === 1) return 1
  const teen = choice % 100 >= 12 && choice % 100 <= 14
  if (!teen && choice % 10 >= 2 && choice % 10 <= 4) return 2
  return 3
}

export const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages: { en, pl },
  pluralRules: {
    pl: polishPluralRule,
  },
})

export function setLocale(locale) {
  if (!SUPPORTED_LOCALES.includes(locale)) return
  i18n.global.locale.value = locale
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, locale)
  if (typeof document !== 'undefined') document.documentElement.lang = locale
}
