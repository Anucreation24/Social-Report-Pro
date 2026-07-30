# Known Limitations — Social Report Pro v1.0.0

This document outlines known operational boundaries, API platform constraints, and design limits for Social Report Pro v1.0.0.

---

## 1. Third-Party Social API Limitations

### Meta Graph API (Facebook & Instagram)
- **Facebook Impressions & Reach:** Meta Graph API restricts page impression and reach metrics for certain Facebook Page access token permission scopes. If Meta returns `0` or permission errors, Social Report Pro displays an explicit transparency notice: *"Impressions unavailable for this Facebook Page due to Meta permission limitations"* rather than fabricating data.
- **Instagram Connectors:** Instagram Professional Account connections require Facebook Page linkage via Meta Business Suite.

### YouTube Data API
- **Historical Lifetime Stats:** YouTube Analytics API limits granular daily breakdowns for historic dates older than 180 days on unverified API quotas. Lifetime totals are used as baseline fallbacks.

---

## 2. File Import Boundaries

- **Supported Formats:** `.csv` and `.xlsx` files up to 10 MB in file size.
- **Header Structure:** Header row must be located within the first 5 lines of the file.
- **Date Formats:** ISO 8601 (`YYYY-MM-DD`), US (`MM/DD/YYYY`), or Euro (`DD/MM/YYYY`) are auto-detected. Ambiguous date formats require manual date preference selection (`DMY` vs `MDY`).

---

## 3. Platform Capabilities & Future Scope

- **Supported Connectors in v1.0:** Facebook Page API, YouTube Channel API, CSV Import, XLSX Import, Manual Entry.
- **Future Ready Connectors:** Instagram Direct API & TikTok Direct API schemas are defined in the database but require live developer app credential configuration in production environment settings.
