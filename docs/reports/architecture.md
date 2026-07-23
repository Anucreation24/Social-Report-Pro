# Stage 4 Report Generator Architecture

## System Overview
The Stage 4 Report Generator compiles professional Weekly and Monthly Social Media Performance Reports into immutable data snapshots, downloadable A4 PDF documents, and formatted Excel workbooks.

```
[User Request / Form]
       │
       ▼
[buildReportSnapshot()]
 ├── Timezone & Period Calculator (periods.ts)
 ├── Analytics Aggregation Engine (aggregation.ts)
 ├── Executive Summary Rules (executive-summary.ts)
 ├── Recommendations Engine (recommendations.ts)
 └── Immutable JSONB Snapshot Construction
       │
       ├──────────────────────────┐
       ▼                          ▼
[generateReportPDFBuffer()]    [generateReportExcelBuffer()]
 (@react-pdf/renderer)           (exceljs)
       │                          │
       └───────────┬──────────────┘
                   ▼
       [uploadReportExportFile()]
        (Supabase Storage 'report-exports')
                   │
                   ▼
     [generated_reports & report_exports]
```

## Key Architectural Principles
1. **Immutable Report Snapshots**: Once generated, report data is frozen in JSONB (`generated_reports.report_data`). Historical reports do not mutate when database analytics update later.
2. **Deterministic Insights**: Factual executive summaries and recommendations are compiled directly from empirical database metrics without mandatory AI external dependencies.
3. **Private File Storage**: PDF and Excel export files are stored in the private `report-exports` Supabase bucket under company-isolated paths (`companyId/reports/year/month/reportId/report.pdf`) and accessed via 1-hour signed URLs.
4. **Role Permission Enforcement**: Only Marketing Managers, Admins, and Owners can generate reports, edit notes, and create revisions. Viewers have read-only download access.
