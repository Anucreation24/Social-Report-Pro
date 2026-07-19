# Facebook Connector Integration Guide

This guide explains the developer account setup and authorization parameters required to integrate **Facebook Page** read-only analytics.

---

## 1. App Configuration in Meta Developer Portal
1. Go to [Meta Developers Console](https://developers.facebook.com/).
2. Click **Create App** and choose **Other** -> **Business** app type.
3. Configure App Settings:
   * **App Domain**: `localhost` (local), `social-report-pro.vercel.app` (production).
   * **Redirect URI**: 
     * Local: `http://localhost:3000/api/oauth/facebook/callback`
     * Production: `https://social-report-pro.vercel.app/api/oauth/facebook/callback`

---

## 2. Environment Variables
Add these keys to your `.env.local`:
```bash
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_REDIRECT_URI=http://localhost:3000/api/oauth/facebook/callback
META_GRAPH_API_VERSION=v21.0
```

---

## 3. Scopes & Permissions Requested
We request **read-only permissions** solely for fetching identity, Page list, and insights. We **never** ask for publishing scopes.
* `public_profile`: Basic user profile mapping.
* `email`: User identity confirmation.
* `pages_show_list`: Discovers Pages administered by the user.
* `pages_read_engagement`: Reads page posts, engagement stats, and metrics.
* `pages_read_user_content`: Inspects post content to associate metrics.

---

## 4. Token Lifetime & Non-Expiring Page Tokens
1. The OAuth flow exchanges the authorization code for a **Short-Lived User Access Token** (valid for 1-2 hours).
2. The connector automatically exchanges this for a **Long-Lived User Access Token** (valid for ~60 days).
3. When fetching available accounts, we extract the **Page Access Token** associated with the selected Page.
4. **Important**: Under Meta architecture, Page Access Tokens derived from long-lived user tokens do not have an expiration time (infinite validity) unless the user changes their Facebook password or revokes app permissions.
