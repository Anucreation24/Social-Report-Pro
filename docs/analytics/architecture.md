# Stage 3 — Sync Engine & Analytics Architecture

## Overview
The Social Report Pro Stage 3 Sync Engine provides an isolated, provider-independent pipeline for ingesting, normalizing, aggregating, and displaying historical social media metrics and content performance data across Facebook, YouTube, Instagram, and TikTok.

## Core Architectural Components

```
+-----------------------------------------------------------------------+
|                            Next.js Client                             |
|       (Connections UI / Dashboard / Analytics / Content Performance)   |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                    Server Actions & Query Layer                       |
|           (src/features/sync/actions.ts & queries.ts)                 |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                        Central Sync Engine                            |
|             (src/lib/analytics/sync-engine.ts)                        |
|                                                                       |
|  1. Authenticates & checks company role (Owner/Admin/Manager)         |
|  2. Retrieves encrypted credentials via store_encrypted_credentials   |
|  3. Invokes provider connector (fetchAccountMetrics, fetchContent)    |
|  4. Normalizes raw provider metrics (normalizer.ts)                  |
|  5. Upserts snapshots & items idempotently (idempotency.ts)          |
|  6. Records audit & sync execution logs (sync_jobs, sync_logs)        |
+-----------------------------------------------------------------------+
                                   |
        +--------------------------+--------------------------+
        |                          |                          |
        v                          v                          v
+---------------+          +---------------+          +---------------+
| Facebook Mod  |          |  YouTube Mod  |          | Inst/TikTok   |
| (Graph API)   |          | (Data/Analyt) |          | (Placeholders)|
+---------------+          +---------------+          +---------------+
```

## Key Architectural Principles
1. **Provider-Agnostic Interface**: The central engine orchestrates sync operations without containing provider-specific HTTP calls.
2. **Snapshot Idempotency**: Unique database indexes on `(company_id, social_account_id, provider, snapshot_date, aggregation_level, metric_name)` prevent duplicate snapshot rows across multiple sync runs.
3. **Data Preservation on Disconnection**: Historical analytics snapshots reference `social_account_id` and maintain `company_id`. If a user disconnects a platform connection, `platform_connection_id` becomes `NULL` while historical snapshot records remain preserved for reporting.
4. **Strict RLS Isolation**: All analytics tables (`analytics_snapshots`, `content_items`, `content_metrics`, `sync_jobs`, `sync_logs`) enforce Row Level Security. Viewer roles can view company analytics but cannot trigger manual sync runs.
