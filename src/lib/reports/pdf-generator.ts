import React from 'react'
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer'
import { GeneratedReportSnapshot } from './types'
import { SocialReportPDFDocument } from './PDFDocument'

export async function generateReportPDFBuffer(snapshot: GeneratedReportSnapshot): Promise<Buffer> {
  const element = React.createElement(SocialReportPDFDocument, { snapshot })
  return await renderToBuffer(element as unknown as React.ReactElement<DocumentProps>)
}
