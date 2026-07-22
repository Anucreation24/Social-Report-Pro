# Metric Normalization Guidelines & Mapping Reference

## Standard Normalized Metrics
Social Report Pro translates platform-specific metric names into standard normalized metrics across all channels:

| Normalized Metric Name | Description | Facebook Source Metric | YouTube Source Metric |
| :--- | :--- | :--- | :--- |
| `audience_total` | Total follower/subscriber count | `page_fans`, `followers_count` | `subscriberCount` |
| `audience_gained` | New followers/subscribers | `page_fan_adds` | `subscribersGained` |
| `audience_lost` | Unfollowed/unsubscribed | `page_fan_removes` | `subscribersLost` |
| `reach` | Unique users who saw content | `page_impressions_unique` | N/A (Channel level) |
| `impressions` | Total times content displayed | `page_impressions` | N/A |
| `views` | Total video/post views | `page_video_views` | `viewCount`, `views` |
| `engagements` | Sum of interactions | `page_post_engagements` | `likes` + `comments` + `shares` |
| `likes` | Total reactions/likes | `reactions` | `likeCount`, `likes` |
| `comments` | Total comments | `comments` | `commentCount`, `comments` |
| `shares` | Total shares | `shares` | `shares` |
| `watch_time_seconds` | Total watch time (seconds) | N/A | `estimatedMinutesWatched` (* 60) |
| `average_view_duration_seconds` | Avg watch duration | N/A | `averageViewDuration` |

## Point-in-Time vs Cumulative Aggregation
- **Point-in-Time Metrics** (e.g. `audience_total`): When calculating range summaries, the engine takes the **latest** snapshot value within the date range rather than summing daily values.
- **Cumulative Metrics** (e.g. `views`, `engagements`, `impressions`): When calculating range summaries, daily snapshot values are **summed** over the selected range.
