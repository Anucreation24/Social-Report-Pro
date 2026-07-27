import { NextResponse } from 'next/server'
import { generateCSVTemplate, generateXLSXTemplateBuffer, TEMPLATE_DEFINITIONS } from '@/lib/imports/templates'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const templateKey = searchParams.get('template')
  const format = searchParams.get('format') || 'csv'
  const includeSample = searchParams.get('sample') === 'true'

  if (!templateKey || !TEMPLATE_DEFINITIONS[templateKey]) {
    return NextResponse.json({ error: 'Invalid or missing template parameter' }, { status: 400 })
  }

  const def = TEMPLATE_DEFINITIONS[templateKey]

  try {
    if (format === 'xlsx') {
      const buffer = await generateXLSXTemplateBuffer(templateKey, includeSample)
      return new NextResponse(buffer as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${def.filename}.xlsx"`
        }
      })
    } else {
      const csvString = generateCSVTemplate(templateKey, includeSample)
      return new NextResponse(csvString, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${def.filename}.csv"`
        }
      })
    }
  } catch (err: unknown) {
    console.error('Template download error:', err)
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 })
  }
}
