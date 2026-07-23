'use client'

import React, { useState } from 'react'
import { GeneratedReportSnapshot } from '@/lib/reports/types'
import { FileText, Info, ZoomIn, ZoomOut } from 'lucide-react'

interface ReportPreviewProps {
  snapshot: GeneratedReportSnapshot
  className?: string
}

export function ReportPreview({ snapshot, className }: ReportPreviewProps) {
  const [zoom, setZoom] = useState<number>(100)
  const { company, report, overall, platforms, topContent, executiveSummary, recommendations, dataAvailability } = snapshot

  return (
    <div className={`space-y-4 ${className || ''}`}>
      {/* Control bar */}
      <div className="flex items-center justify-between bg-card border border-border/60 rounded-xl p-3 px-4 shadow-sm text-xs">
        <div className="flex items-center gap-2 font-bold text-foreground">
          <FileText className="w-4 h-4 text-primary" />
          <span>Report Document Preview (A4 Format)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(z => Math.max(70, z - 10))}
            className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="font-semibold text-muted-foreground w-12 text-center">{zoom}%</span>
          <button
            onClick={() => setZoom(z => Math.min(130, z + 10))}
            className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* A4 Sheet Container */}
      <div className="overflow-auto max-h-[850px] p-4 bg-muted/30 border border-border/40 rounded-2xl flex justify-center">
        <div
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          className="w-[794px] min-h-[1123px] bg-white text-slate-900 shadow-2xl rounded-sm p-10 space-y-6 font-sans border border-slate-200 transition-all"
        >
          {/* Header */}
          <div className="border-b-2 border-blue-600 pb-4 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{company.name}</h1>
              <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wide mt-0.5">{report.title}</h2>
              <p className="text-xs text-slate-500 mt-1">
                Period: <span className="font-semibold text-slate-700">{report.periodStart} to {report.periodEnd}</span>{' '}
                (Comparison: {report.comparisonStart} to {report.comparisonEnd})
              </p>
            </div>

            <div className="text-right text-xs text-slate-500 space-y-0.5">
              <p><span className="font-medium text-slate-700">Prepared By:</span> {report.preparedBy}</p>
              <p><span className="font-medium text-slate-700">Date:</span> {new Date(report.generatedAt).toLocaleDateString()}</p>
              <p className="text-[10px] text-slate-400">Timezone: {company.timezone}</p>
            </div>
          </div>

          {/* Overall Performance KPI Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-3 py-1.5 rounded border-l-4 border-blue-600 mb-3">
              Overall Performance Summary
            </h3>

            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Total Audience</span>
                <div className="text-lg font-black text-slate-900 mt-1">{overall.audienceTotal.currentValue.toLocaleString()}</div>
                <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                  {overall.audienceTotal.isUnavailable ? 'No baseline' : `${overall.audienceTotal.percentageChange}% vs prev`}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Total Views</span>
                <div className="text-lg font-black text-slate-900 mt-1">{overall.views.currentValue.toLocaleString()}</div>
                <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                  {overall.views.isUnavailable ? 'No baseline' : `${overall.views.percentageChange}% vs prev`}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Engagements</span>
                <div className="text-lg font-black text-slate-900 mt-1">{overall.engagements.currentValue.toLocaleString()}</div>
                <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                  {overall.engagements.isUnavailable ? 'No baseline' : `${overall.engagements.percentageChange}% vs prev`}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Total Impressions</span>
                <div className="text-lg font-black text-slate-900 mt-1">{overall.impressions.currentValue.toLocaleString()}</div>
                {overall.impressions.isUnavailable ? (
                  <div className="text-[9px] text-amber-600 font-semibold mt-0.5">Meta permission notice</div>
                ) : (
                  <div className="text-[10px] text-emerald-600 font-bold mt-0.5">{overall.impressions.percentageChange}% vs prev</div>
                )}
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-3 py-1.5 rounded border-l-4 border-blue-600 mb-3">
              Executive Summary
            </h3>
            <ul className="space-y-2 text-xs text-slate-700">
              {executiveSummary.map(item => (
                <li key={item.id} className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5">•</span>
                  <span>{item.statement}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform Comparison */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-3 py-1.5 rounded border-l-4 border-blue-600 mb-3">
              Platform Breakdown & Comparison
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-2.5">Platform</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Audience</th>
                    <th className="p-2.5">Views</th>
                    <th className="p-2.5">Engagements</th>
                    <th className="p-2.5">Published</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {Object.entries(platforms).map(([pKey, pData]) => (
                    <tr key={pKey} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold capitalize">{pKey}</td>
                      <td className="p-2.5 text-slate-600">
                        {pData?.isConnected ? (pData.metrics.impressions.isUnavailable ? 'Permission Notice' : 'Connected') : 'Not Connected'}
                      </td>
                      <td className="p-2.5 font-semibold">{pData?.metrics.audienceTotal.currentValue.toLocaleString() || '0'}</td>
                      <td className="p-2.5">{pData?.metrics.views.currentValue.toLocaleString() || '0'}</td>
                      <td className="p-2.5 font-semibold">{pData?.metrics.engagements.currentValue.toLocaleString() || '0'}</td>
                      <td className="p-2.5">{pData?.metrics.contentPublished.currentValue || '0'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Content */}
          {topContent.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-3 py-1.5 rounded border-l-4 border-blue-600 mb-3">
                Top Performing Content
              </h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-2">Content Title</th>
                      <th className="p-2">Platform</th>
                      <th className="p-2">Views</th>
                      <th className="p-2">Likes</th>
                      <th className="p-2">Comments</th>
                      <th className="p-2">Engagements</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {topContent.slice(0, 5).map(item => (
                      <tr key={item.providerContentId}>
                        <td className="p-2 font-medium max-w-[240px] truncate">{item.title}</td>
                        <td className="p-2 font-bold uppercase text-[10px]">{item.platform}</td>
                        <td className="p-2">{item.views.toLocaleString()}</td>
                        <td className="p-2">{item.likes.toLocaleString()}</td>
                        <td className="p-2">{item.comments.toLocaleString()}</td>
                        <td className="p-2 font-bold text-blue-600">{item.engagements.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Strategic Recommendations */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-3 py-1.5 rounded border-l-4 border-blue-600 mb-3">
              Strategic Recommendations
            </h3>
            <div className="space-y-2 text-xs">
              {recommendations.map(rec => (
                <div key={rec.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {rec.priority}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900">{rec.title}</h4>
                    <p className="text-slate-600 mt-0.5">{rec.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data Availability Notes */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-3 py-1.5 rounded border-l-4 border-blue-600 mb-2">
              Data Availability & Disclaimers
            </h3>
            <ul className="space-y-1 text-[11px] text-slate-500">
              {dataAvailability.map(item => (
                <li key={item.key} className="flex items-center gap-1.5">
                  <Info className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{item.message}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200 flex justify-between text-[10px] text-slate-400">
            <span>Social Report Pro — Confidential Performance Report</span>
            <span>Page 1 of 1</span>
          </div>
        </div>
      </div>
    </div>
  )
}
