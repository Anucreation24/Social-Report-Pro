'use client'

import React from 'react'
import { SupportedLanguageCode, PdfMode, SUPPORTED_LANGUAGES, getLanguageOption } from '@/lib/i18n/languages'
import { Globe, Check } from 'lucide-react'

export interface LanguageSelectorProps {
  selectedLanguage: SupportedLanguageCode
  onChangeLanguage: (lang: SupportedLanguageCode) => void
  pdfMode?: PdfMode
  onChangePdfMode?: (mode: PdfMode) => void
  showBilingualOption?: boolean
  className?: string
}

export function LanguageSelector({
  selectedLanguage,
  onChangeLanguage,
  pdfMode = 'single',
  onChangePdfMode,
  showBilingualOption = true,
  className = ''
}: LanguageSelectorProps) {
  const currentOption = getLanguageOption(selectedLanguage)

  return (
    <div className={`p-4 bg-card border border-border/80 rounded-2xl shadow-sm space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <Globe className="w-4 h-4 text-primary" />
          <span>Report Language & Translation</span>
        </div>
        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          AI Multi-Lingual Engine
        </span>
      </div>

      {/* Language Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {SUPPORTED_LANGUAGES.map(lang => {
          const isSelected = selectedLanguage === lang.code
          const isDisabled = !lang.isSupported

          return (
            <button
              key={lang.code}
              type="button"
              disabled={isDisabled}
              onClick={() => onChangeLanguage(lang.code)}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/20'
                  : isDisabled
                  ? 'bg-muted/40 text-muted-foreground/50 border-border/30 cursor-not-allowed opacity-60'
                  : 'bg-background hover:bg-muted/50 text-foreground border-border/60'
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-base leading-none">{lang.flagEmoji}</span>
                <div className="text-left truncate">
                  <div className="truncate font-bold leading-tight">{lang.name}</div>
                  <div className="text-[10px] opacity-80 truncate">{lang.nativeName}</div>
                </div>
              </div>
              {isSelected && <Check className="w-4 h-4 shrink-0" />}
            </button>
          )
        })}
      </div>

      {/* Optional Bilingual PDF Export Mode Toggle */}
      {showBilingualOption && onChangePdfMode && (
        <div className="pt-2 border-t border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-muted-foreground">PDF Export Layout Mode:</span>
          <div className="flex items-center gap-1.5 bg-muted/40 p-1 border border-border/50 rounded-xl">
            <button
              type="button"
              onClick={() => onChangePdfMode('single')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                pdfMode === 'single'
                  ? 'bg-background text-foreground shadow-xs border border-border/40'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Standard ({currentOption.name})
            </button>

            <button
              type="button"
              onClick={() => onChangePdfMode('bilingual')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                pdfMode === 'bilingual'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Bilingual (English + {currentOption.name})
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
