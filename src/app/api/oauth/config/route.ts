import { NextResponse } from 'next/server'

export async function GET() {
  const config = {
    facebook: {
      isConfigured: !!(process.env.META_APP_ID && process.env.META_APP_SECRET && process.env.META_REDIRECT_URI),
      keys: {
        META_APP_ID: !!process.env.META_APP_ID,
        META_APP_SECRET: !!process.env.META_APP_SECRET,
        META_REDIRECT_URI: !!process.env.META_REDIRECT_URI,
      }
    },
    instagram: {
      isConfigured: !!(process.env.META_APP_ID && process.env.META_APP_SECRET && process.env.META_REDIRECT_URI),
      keys: {
        META_APP_ID: !!process.env.META_APP_ID,
        META_APP_SECRET: !!process.env.META_APP_SECRET,
        META_REDIRECT_URI: !!process.env.META_REDIRECT_URI,
      }
    },
    youtube: {
      isConfigured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI),
      keys: {
        GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI: !!process.env.GOOGLE_REDIRECT_URI,
      }
    },
    tiktok: {
      isConfigured: !!(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET && process.env.TIKTOK_REDIRECT_URI),
      keys: {
        TIKTOK_CLIENT_KEY: !!process.env.TIKTOK_CLIENT_KEY,
        TIKTOK_CLIENT_SECRET: !!process.env.TIKTOK_CLIENT_SECRET,
        TIKTOK_REDIRECT_URI: !!process.env.TIKTOK_REDIRECT_URI,
      }
    }
  }

  return NextResponse.json(config)
}
