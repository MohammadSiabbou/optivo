import en from './messages/en.json'

type Messages = typeof en

const messages: Record<string, Messages> = { en }

export function getMessage(locale: string, keyPath: string, params?: Record<string, string | number>): string {
  const lang = (locale.split('-')[0] || 'en') as keyof typeof messages
  const msgs = messages[lang] || messages.en

  let value: any = msgs
  for (const segment of keyPath.split('.')) {
    value = value?.[segment]
  }

  if (typeof value !== 'string') {
    console.warn(`[i18n] Missing translation: ${keyPath}`)
    return keyPath
  }

  if (params) {
    let result = value
    for (const [key, val] of Object.entries(params)) {
      result = result.replace(`{${key}}`, String(val))
    }
    return result
  }

  return value
}
