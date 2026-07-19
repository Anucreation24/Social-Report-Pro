# Instagram Connector Integration Guide

Instagram professional account access utilizes Meta App architecture. This guide covers setup parameters and prerequisites.

---

## 1. Prerequisites (Professional Accounts)
Instagram Insights API requires:
1. An **Instagram Business** or **Instagram Creator** account. Personal Instagram accounts are **not** supported by the official Meta Graph API.
2. The Instagram account must be **linked to a Facebook Page** that you administer.

---

## 2. Environment Variables
Instagram uses the same App ID and Secret as Facebook:
```bash
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_REDIRECT_URI=http://localhost:3000/api/oauth/instagram/callback
META_GRAPH_API_VERSION=v21.0
```

---

## 3. Scopes & Permissions Requested
* `instagram_basic`: Discovers linked Instagram business accounts and reads basic profiles.
* `instagram_manage_insights`: Reads media performance metrics (reach, impressions, stories analytics).
* `pages_show_list`: Essential to locate the parent Facebook Page the Instagram account is attached to.
* `pages_read_engagement`: Required to read Page assets linking the accounts.

---

## 4. Account Selection Mechanics
1. User logs in with Meta OAuth.
2. We query `/me/accounts` to retrieve administrated Facebook Pages.
3. For each Facebook Page, we call `/{page_id}?fields=instagram_business_account` to find linked business nodes.
4. The discovered Instagram business account is returned for linkage selection.
