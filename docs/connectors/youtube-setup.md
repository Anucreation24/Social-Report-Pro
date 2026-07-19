# YouTube Connector Integration Guide

This guide explains the Google API configuration required to integrate read-only YouTube Analytics.

---

## 1. App Configuration in Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a Project and enable:
   * **YouTube Data API v3**
   * **YouTube Analytics API**
3. Configure the **OAuth Consent Screen** (internal or external).
4. Create **Credentials** -> **OAuth Client ID**:
   * Application Type: Web Application.
   * **Authorized Redirect URIs**:
     * Local: `http://localhost:3000/api/oauth/youtube/callback`
     * Production: `https://social-report-pro.vercel.app/api/oauth/youtube/callback`

---

## 2. Environment Variables
Add these keys to `.env.local`:
```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/oauth/youtube/callback
```

---

## 3. Scopes Requested
* `https://www.googleapis.com/auth/youtube.readonly`: Reads channel identity, titles, handles, and assets.
* `https://www.googleapis.com/auth/yt-analytics.readonly`: Retrieves analytics reports (views, watch time, subscribers).
* `openid`, `email`: Identity validation.

---

## 4. Offline Access and Refreshing Tokens
To ensure background sync operations function correctly, the authorization url forces:
* `access_type=offline`
* `prompt=consent`

This instructs Google to provide a **Refresh Token** alongside the Access Token. We encrypt both tokens and store them inside `platform_credentials`. The connector uses the refresh token to get a new access token whenever it expires (~1 hour validity).
