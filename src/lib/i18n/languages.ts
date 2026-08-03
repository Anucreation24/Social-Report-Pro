export type SupportedLanguageCode = 
  | 'en' 
  | 'si' 
  | 'ta' 
  | 'hi' 
  | 'fr' 
  | 'de' 
  | 'es' 
  | 'ar' 
  | 'ja' 
  | 'zh'

export type PdfMode = 'single' | 'bilingual'

export interface LanguageOption {
  code: SupportedLanguageCode
  name: string
  nativeName: string
  flagEmoji: string
  isRtl?: boolean
  isSupported: boolean
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flagEmoji: '🇺🇸', isSupported: true },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', flagEmoji: '🇱🇰', isSupported: true },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flagEmoji: '🇱🇰', isSupported: false },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flagEmoji: '🇮🇳', isSupported: false },
  { code: 'fr', name: 'French', nativeName: 'Français', flagEmoji: '🇫🇷', isSupported: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flagEmoji: '🇩🇪', isSupported: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flagEmoji: '🇪🇸', isSupported: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flagEmoji: '🇸🇦', isRtl: true, isSupported: false },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flagEmoji: '🇯🇵', isSupported: false },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flagEmoji: '🇨🇳', isSupported: false }
]

export function getLanguageOption(code: SupportedLanguageCode): LanguageOption {
  return (
    SUPPORTED_LANGUAGES.find(l => l.code === code) || {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flagEmoji: '🇺🇸',
      isSupported: true
    }
  )
}
