import { NextResponse } from 'next/server'

export async function GET() {
  const config = {
    facebook: !!(process.env.META_APP_ID && process.env.META_APP_SECRET && process.env.META_REDIRECT_URI),
    instagram: !!(process.env.META_APP_ID && process.env.META_APP_SECRET && process.env.META_REDIRECT_URI),
    youtube: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REDIRECT_URI),
    tiktok: !!(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET && process.env.TIKTOK_REDIRECT_URI)
  }

  return NextResponse.json(config)
}
