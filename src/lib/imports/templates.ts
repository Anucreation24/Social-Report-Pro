import ExcelJS from 'exceljs'
import { PlatformType } from '@/lib/reports/types'

export type TemplateType = 'account_summary' | 'content_performance'

export interface TemplateDefinition {
  platform: PlatformType
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
    headers: ['date', 'followers', 'followers_gained', 'reach', 'impressions', 'views', 'engagements', 'profile_views'],
    sampleRow: {
      date: '2026-07-01',
      followers: 12500,
      followers_gained: 150,
      reach: 45000,
      impressions: 62000,
      views: 18000,
      engagements: 3400,
      profile_views: 450
    }
  },
  'facebook_content_performance': {
    platform: 'facebook',
    templateType: 'content_performance',
    filename: 'Facebook_Content_Performance_Template',
    headers: ['content_id', 'title', 'caption', 'published_at', 'content_type', 'permalink', 'views', 'reach', 'impressions', 'likes', 'comments', 'shares', 'saves', 'engagements'],
    sampleRow: {
      content_id: 'fb_post_101',
      title: 'Summer Campaign Announcement',
      caption: 'Check out our latest product release for the summer season!',
      published_at: '2026-07-05T14:30:00Z',
      content_type: 'post',
      permalink: 'https://facebook.com/posts/101',
      views: 4200,
      reach: 3800,
      impressions: 5100,
      likes: 340,
      comments: 42,
      shares: 18,
      saves: 12,
      engagements: 412
    }
  },
  'instagram_account_summary': {
    platform: 'instagram',
    templateType: 'account_summary',
    filename: 'Instagram_Account_Summary_Template',
    headers: ['date', 'followers', 'followers_gained', 'reach', 'impressions', 'views', 'engagements', 'profile_views'],
    sampleRow: {
      date: '2026-07-01',
      followers: 8900,
      followers_gained: 210,
      reach: 32000,
      impressions: 48000,
      views: 14500,
      engagements: 2900,
      profile_views: 620
    }
  },
  'instagram_content_performance': {
    platform: 'instagram',
    templateType: 'content_performance',
    filename: 'Instagram_Content_Performance_Template',
    headers: ['content_id', 'title', 'caption', 'published_at', 'content_type', 'permalink', 'views', 'reach', 'impressions', 'likes', 'comments', 'shares', 'saves', 'engagements'],
    sampleRow: {
      content_id: 'ig_reel_202',
      title: 'Behind the Scenes Reel',
      caption: 'Here is a quick look at how our design team works!',
      published_at: '2026-07-10T10:00:00Z',
      content_type: 'reel',
      permalink: 'https://instagram.com/reel/202',
      views: 9800,
      reach: 8400,
      impressions: 11200,
      likes: 850,
      comments: 76,
      shares: 45,
      saves: 130,
      engagements: 1101
    }
  },
  'youtube_channel_summary': {
    platform: 'youtube',
    templateType: 'account_summary',
    filename: 'YouTube_Channel_Summary_Template',
    headers: ['date', 'subscribers', 'subscribers_gained', 'views', 'watch_time_minutes', 'engagements', 'profile_views'],
    sampleRow: {
      date: '2026-07-01',
      subscribers: 24500,
      subscribers_gained: 480,
      views: 65000,
      watch_time_minutes: 240000,
      engagements: 5200,
      profile_views: 1200
    }
  },
  'youtube_video_performance': {
    platform: 'youtube',
    templateType: 'content_performance',
    filename: 'YouTube_Video_Performance_Template',
    headers: ['content_id', 'title', 'caption', 'published_at', 'content_type', 'permalink', 'views', 'impressions', 'likes', 'comments', 'shares', 'watch_time_seconds'],
    sampleRow: {
      content_id: 'yt_video_303',
      title: 'Complete Product Walkthrough Tutorial',
      caption: 'Full 10-minute guide to getting started with Social Report Pro.',
      published_at: '2026-07-12T16:00:00Z',
      content_type: 'video',
      permalink: 'https://youtube.com/watch?v=303',
      views: 14200,
      impressions: 48000,
      likes: 920,
      comments: 115,
      shares: 64,
      watch_time_seconds: 511200
    }
  },
  'tiktok_account_summary': {
    platform: 'tiktok',
    templateType: 'account_summary',
    filename: 'TikTok_Account_Summary_Template',
    headers: ['date', 'followers', 'followers_gained', 'views', 'engagements', 'profile_views'],
    sampleRow: {
      date: '2026-07-01',
      followers: 18400,
      followers_gained: 620,
      views: 110000,
      engagements: 9800,
      profile_views: 1450
    }
  },
  'tiktok_video_performance': {
    platform: 'tiktok',
    templateType: 'content_performance',
    filename: 'TikTok_Video_Performance_Template',
    headers: ['content_id', 'title', 'caption', 'published_at', 'content_type', 'permalink', 'views', 'likes', 'comments', 'shares', 'saves', 'engagements'],
    sampleRow: {
      content_id: 'tt_video_404',
      title: 'Top 5 Marketing Tips for 2026',
      caption: 'Boost your social engagement with these 5 strategies! #marketing',
      published_at: '2026-07-15T18:00:00Z',
      content_type: 'video',
      permalink: 'https://tiktok.com/@user/video/404',
      views: 35000,
      likes: 3100,
      comments: 240,
      shares: 180,
      saves: 420,
      engagements: 3940
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

  // Style header row
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
