import React from 'react'
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer'
import { GeneratedReportSnapshot } from './types'
import { SocialReportPDFDocument } from './PDFDocument'
import { SupportedLanguageCode, PdfMode } from '@/lib/i18n/languages'
import { translateReportSnapshot } from '@/lib/i18n/translator'

export async function generateReportPDFBuffer(
  snapshot: GeneratedReportSnapshot,
  language: SupportedLanguageCode = 'en',
  pdfMode: PdfMode = 'single'
): Promise<Buffer> {
  const translatedSnapshot = translateReportSnapshot(snapshot, language, pdfMode)
  const element = React.createElement(SocialReportPDFDocument, {
    snapshot: translatedSnapshot,
    language,
    pdfMode
  })
  return await renderToBuffer(element as unknown as React.ReactElement<DocumentProps>)
}
