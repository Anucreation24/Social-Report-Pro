# TikTok Connector Integration Guide

This guide explains the TikTok Developer integration and authentication parameters.

---

## 1. App Configuration in TikTok Developer Portal
1. Register at [TikTok Developer Portal](https://developers.tiktok.com/).
2. Create an App and apply for the **Login Kit** and **Video List** features.
3. Configure Redirect URIs:
   * Local: `http://localhost:3000/api/oauth/tiktok/callback`
   * Production: `https://social-report-pro.vercel.app/api/oauth/tiktok/callback`

---

## 2. Environment Variables
Add these keys to `.env.local`:
```bash
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
TIKTOK_REDIRECT_URI=http://localhost:3000/api/oauth/tiktok/callback
```

---

## 3. Scopes Requested
* `user.info.basic`: Reads profile picture, display name, and username.
* `video.list`: Enables reading of video details (shares, likes, views).

---

## 4. Key Limitations
* **App Review Required**: TikTok requires a strict App Review before user accounts can be connected in production.
* **Developer Approval Status**: In sandbox/development state, only pre-configured sandbox test accounts can complete the OAuth callback flow.
