import ExcelJS from 'exceljs'
import { PlatformType } from '@/lib/reports/types'

export type TemplateType = 'account_summary' | 'daily_overview' | 'content_performance' | 'video_performance' | 'generic_metrics'

export interface TemplateDefinition {
  platform: PlatformType | 'generic'
  templateType: TemplateType
  filename: string
  headers: string[]
  sampleRow: Record<string, string | number>
}

export const TEMPLATE_DEFINITIONS: Record<string, TemplateDefinition> = {
  'facebook_account_summary': {
    platform: 'facebook',
    templateType: 'account_summary',
    filename: 'Facebook_Account_Summary_Template',
    headers: ['Date', 'Followers', 'Followers Gained', 'Reach', 'Impressions', 'Video Views', 'Engagements', 'Profile Views'],
    sampleRow: {
      Date: '2026-07-01',
      Followers: 12500,
      'Followers Gained': 150,
      Reach: 45000,
      Impressions: 62000,
      'Video Views': 18000,
      Engagements: 3400,
      'Profile Views': 450
    }
  },
  'facebook_content_performance': {
    platform: 'facebook',
    templateType: 'content_performance',
    filename: 'Facebook_Content_Performance_Template',
    headers: ['Content ID', 'Title', 'Caption', 'Published At', 'Content Type', 'Permalink', 'Views', 'Reach', 'Impressions', 'Likes', 'Comments', 'Shares', 'Saves', 'Engagements'],
    sampleRow: {
      'Content ID': 'fb_post_101',
      Title: 'Summer Campaign Announcement',
      Caption: 'Check out our latest product release for the summer season!',
      'Published At': '2026-07-05T14:30:00Z',
      'Content Type': 'post',
      Permalink: 'https://facebook.com/posts/101',
      Views: 4200,
      Reach: 3800,
      Impressions: 5100,
      Likes: 340,
      Comments: 42,
      Shares: 18,
      Saves: 12,
      Engagements: 412
    }
  },
  'instagram_account_summary': {
    platform: 'instagram',
    templateType: 'account_summary',
    filename: 'Instagram_Account_Summary_Template',
    headers: ['Date', 'Followers', 'Followers Gained', 'Reach', 'Impressions', 'Views', 'Engagements', 'Profile Views'],
    sampleRow: {
      Date: '2026-07-01',
      Followers: 8900,
      'Followers Gained': 210,
      Reach: 32000,
      Impressions: 48000,
      Views: 14500,
      Engagements: 2900,
      'Profile Views': 620
    }
  },
  'instagram_content_performance': {
    platform: 'instagram',
    templateType: 'content_performance',
    filename: 'Instagram_Content_Performance_Template',
    headers: ['Content ID', 'Title', 'Caption', 'Published At', 'Content Type', 'Permalink', 'Views', 'Reach', 'Impressions', 'Likes', 'Comments', 'Shares', 'Saves', 'Engagements'],
    sampleRow: {
      'Content ID': 'ig_reel_202',
      Title: 'Behind the Scenes Reel',
      Caption: 'Here is a quick look at how our design team works!',
      'Published At': '2026-07-10T10:00:00Z',
      'Content Type': 'reel',
      Permalink: 'https://instagram.com/reel/202',
      Views: 9800,
      Reach: 8400,
      Impressions: 11200,
      Likes: 850,
      Comments: 76,
      Shares: 45,
      Saves: 130,
      Engagements: 1101
    }
  },
  'youtube_channel_summary': {
    platform: 'youtube',
    templateType: 'account_summary',
    filename: 'YouTube_Channel_Summary_Template',
    headers: ['Date', 'Subscribers', 'Subscribers Gained', 'Views', 'Watch Time (Minutes)', 'Engagements', 'Profile Views'],
    sampleRow: {
      Date: '2026-07-01',
      Subscribers: 24500,
      'Subscribers Gained': 480,
      Views: 65000,
      'Watch Time (Minutes)': 240000,
      Engagements: 5200,
      'Profile Views': 1200
    }
  },
  'youtube_video_performance': {
    platform: 'youtube',
    templateType: 'video_performance',
    filename: 'YouTube_Video_Performance_Template',
    headers: ['Content ID', 'Title', 'Caption', 'Published At', 'Content Type', 'Permalink', 'Views', 'Impressions', 'Likes', 'Comments', 'Shares', 'Watch Time (Seconds)'],
    sampleRow: {
      'Content ID': 'yt_video_303',
      Title: 'Complete Product Walkthrough Tutorial',
      Caption: 'Full 10-minute guide to getting started with Social Report Pro.',
      'Published At': '2026-07-12T16:00:00Z',
      'Content Type': 'video',
      Permalink: 'https://youtube.com/watch?v=303',
      Views: 14200,
      Impressions: 48000,
      Likes: 920,
      Comments: 115,
      Shares: 64,
      'Watch Time (Seconds)': 511200
    }
  },
  'tiktok_daily_overview': {
    platform: 'tiktok',
    templateType: 'daily_overview',
    filename: 'TikTok_Daily_Overview_Template',
    headers: ['Date', 'Video Views', 'Profile Views', 'Likes', 'Comments', 'Shares'],
    sampleRow: {
      Date: 'October 1',
      'Video Views': 1250,
      'Profile Views': 45,
      Likes: 180,
      Comments: 14,
      Shares: 8
    }
  },
  'tiktok_video_performance': {
    platform: 'tiktok',
    templateType: 'video_performance',
    filename: 'TikTok_Video_Performance_Template',
    headers: ['Content ID', 'Title', 'Caption', 'Published At', 'Content Type', 'Permalink', 'Views', 'Likes', 'Comments', 'Shares', 'Saves', 'Engagements'],
    sampleRow: {
      'Content ID': 'tt_video_404',
      Title: 'Top 5 Marketing Tips for 2026',
      Caption: 'Boost your social engagement with these 5 strategies! #marketing',
      'Published At': '2026-07-15T18:00:00Z',
      'Content Type': 'video',
      Permalink: 'https://tiktok.com/@user/video/404',
      Views: 35000,
      Likes: 3100,
      Comments: 240,
      Shares: 180,
      Saves: 420,
      Engagements: 3940
    }
  },
  'generic_account_metrics': {
    platform: 'generic',
    templateType: 'account_summary',
    filename: 'Generic_Account_Metrics_Template',
    headers: ['Date', 'Followers', 'Reach', 'Impressions', 'Views', 'Engagements'],
    sampleRow: {
      Date: '2026-07-01',
      Followers: 10000,
      Reach: 30000,
      Impressions: 45000,
      Views: 12000,
      Engagements: 2500
    }
  },
  'generic_content_metrics': {
    platform: 'generic',
    templateType: 'content_performance',
    filename: 'Generic_Content_Metrics_Template',
    headers: ['Content ID', 'Title', 'Published At', 'Views', 'Likes', 'Comments', 'Shares', 'Engagements'],
    sampleRow: {
      'Content ID': 'post_001',
      Title: 'Sample Content Post',
      'Published At': '2026-07-01T12:00:00Z',
      Views: 5000,
      Likes: 400,
      Comments: 30,
      Shares: 15,
      Engagements: 445
    }
  }
}

export function generateCSVTemplate(templateKey: string, includeSample = false): string {
  const def = TEMPLATE_DEFINITIONS[templateKey]
  if (!def) throw new Error(`Unknown template key: ${templateKey}`)

  const headerLine = def.headers.join(',')
  if (!includeSample) return headerLine

  const sampleLine = def.headers.map(h => {
    const val = def.sampleRow[h] ?? ''
    if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
      return `"${val.replace(/"/g, '""')}"`
    }
    return String(val)
  }).join(',')

  return `${headerLine}\n${sampleLine}`
}

export async function generateXLSXTemplateBuffer(templateKey: string, includeSample = false): Promise<Buffer> {
  const def = TEMPLATE_DEFINITIONS[templateKey]
  if (!def) throw new Error(`Unknown template key: ${templateKey}`)

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Import Data')

  sheet.columns = def.headers.map(h => ({
    header: h,
    key: h,
    width: Math.max(h.length + 5, 18)
  }))

  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1E293B' }
  }

  if (includeSample) {
    sheet.addRow(def.sampleRow)
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}
