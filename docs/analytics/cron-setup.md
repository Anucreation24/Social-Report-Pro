# Daily Sync Cron Configuration

## Endpoint Details
- **Path**: `/api/cron/daily-sync`
- **Method**: `GET`
- **Authentication**: `Bearer <CRON_SECRET>` or `x-cron-secret: <CRON_SECRET>` header.

## Vercel Cron Configuration (`vercel.json`)
To enable automated daily background sync in production on Vercel, add the following configuration to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-sync",
      "schedule": "0 2 * * *"
    }
  ]
}
```

## Security Requirements
- In production, set the `CRON_SECRET` environment variable in Vercel settings.
- Requests without a matching `CRON_SECRET` header will be rejected with HTTP 401 Unauthorized.
- Local development works seamlessly without triggering cron endpoints unless called manually with the secret.
