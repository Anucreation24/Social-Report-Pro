import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { GeneratedReportSnapshot } from './types'

// Register standard fonts
const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1e293b',
    backgroundColor: '#ffffff'
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#2563eb',
    borderBottomStyle: 'solid',
    paddingBottom: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  companyName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a'
  },
  reportTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#2563eb',
    marginTop: 2
  },
  metaText: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    padding: '4 8',
    borderRadius: 4,
    marginTop: 14,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
    borderLeftStyle: 'solid'
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },
  kpiCard: {
    width: '23%',
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#e2e8f0'
  },
  kpiLabel: {
    fontSize: 7.5,
    color: '#64748b',
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold'
  },
  kpiValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginTop: 3
  },
  kpiSub: {
    fontSize: 7,
    color: '#10b981',
    marginTop: 2
  },
  kpiWarning: {
    fontSize: 6.5,
    color: '#d97706',
    marginTop: 2
  },
  table: {
    width: '100%',
    marginVertical: 6,
    borderWidth: 0.5,
    borderColor: '#cbd5e1'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    alignItems: 'center',
    padding: '4 6'
  },
  tableHeader: {
    backgroundColor: '#f1f5f9',
    fontFamily: 'Helvetica-Bold'
  },
  col: {
    flex: 1
  },
  colWide: {
    flex: 2
  },
  colSm: {
    width: 60
  },
  bulletList: {
    marginBottom: 8
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 4
  },
  bulletDot: {
    width: 10,
    fontSize: 10,
    color: '#2563eb'
  },
  bulletText: {
    flex: 1,
    lineHeight: 1.3
  },
  badgeHigh: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#ef4444',
    backgroundColor: '#fef2f2',
    padding: '1 4',
    borderRadius: 2
  },
  badgeMed: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#f59e0b',
    backgroundColor: '#fffbe finished',
    padding: '1 4',
    borderRadius: 2
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    borderTopWidth: 0.5,
    borderTopColor: '#cbd5e1',
    paddingTop: 6,
    flexDirection: 'row',
    justify: 'space-between',
    fontSize: 7.5,
    color: '#94a3b8'
  }
})

interface PDFDocumentProps {
  snapshot: GeneratedReportSnapshot
}

export function SocialReportPDFDocument({ snapshot }: PDFDocumentProps) {
  const { company, report, overall, platforms, topContent, executiveSummary, recommendations, dataAvailability } = snapshot

  return (
    <Document title={`${company.name} - ${report.title}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{company.name}</Text>
            <Text style={styles.reportTitle}>{report.title}</Text>
            <Text style={styles.metaText}>
              Period: {report.periodStart} to {report.periodEnd} (Comparison: {report.comparisonStart} to {report.comparisonEnd})
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.metaText}>Prepared By: {report.preparedBy}</Text>
            <Text style={styles.metaText}>Generated Date: {new Date(report.generatedAt).toLocaleDateString()}</Text>
            <Text style={styles.metaText}>Timezone: {company.timezone}</Text>
          </View>
        </View>

        {/* Overall KPI Summary Cards */}
        <Text style={styles.sectionTitle}>Overall Performance Summary</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total Audience</Text>
            <Text style={styles.kpiValue}>{overall.audienceTotal.currentValue.toLocaleString()}</Text>
            <Text style={styles.kpiSub}>
              {overall.audienceTotal.isUnavailable ? 'No baseline' : `${overall.audienceTotal.percentageChange}% vs prev`}
            </Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total Views</Text>
            <Text style={styles.kpiValue}>{overall.views.currentValue.toLocaleString()}</Text>
            <Text style={styles.kpiSub}>
              {overall.views.isUnavailable ? 'No baseline' : `${overall.views.percentageChange}% vs prev`}
            </Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Engagements</Text>
            <Text style={styles.kpiValue}>{overall.engagements.currentValue.toLocaleString()}</Text>
            <Text style={styles.kpiSub}>
              {overall.engagements.isUnavailable ? 'No baseline' : `${overall.engagements.percentageChange}% vs prev`}
            </Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Total Impressions</Text>
            <Text style={styles.kpiValue}>{overall.impressions.currentValue.toLocaleString()}</Text>
            {overall.impressions.isUnavailable ? (
              <Text style={styles.kpiWarning}>Meta permissions notice</Text>
            ) : (
              <Text style={styles.kpiSub}>{overall.impressions.percentageChange}% vs prev</Text>
            )}
          </View>
        </View>

        {/* Executive Summary */}
        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <View style={styles.bulletList}>
          {executiveSummary.map(item => (
            <View key={item.id} style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{item.statement}</Text>
            </View>
          ))}
        </View>

        {/* Platform Comparison Table */}
        <Text style={styles.sectionTitle}>Platform Overview & Comparison</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.col, { fontFamily: 'Helvetica-Bold' }]}>Platform</Text>
            <Text style={[styles.col, { fontFamily: 'Helvetica-Bold' }]}>Status</Text>
            <Text style={[styles.col, { fontFamily: 'Helvetica-Bold' }]}>Audience</Text>
            <Text style={[styles.col, { fontFamily: 'Helvetica-Bold' }]}>Views</Text>
            <Text style={[styles.col, { fontFamily: 'Helvetica-Bold' }]}>Engagements</Text>
            <Text style={[styles.col, { fontFamily: 'Helvetica-Bold' }]}>Published</Text>
          </View>
          {Object.entries(platforms).map(([pKey, pData]) => (
            <View key={pKey} style={styles.tableRow}>
              <Text style={[styles.col, { textTransform: 'capitalize', fontFamily: 'Helvetica-Bold' }]}>{pKey}</Text>
              <Text style={styles.col}>
                {pData?.isConnected ? (pData.metrics.impressions.isUnavailable ? 'Permission Notice' : 'Connected') : 'Not Connected'}
              </Text>
              <Text style={styles.col}>{pData?.metrics.audienceTotal.currentValue.toLocaleString() || '0'}</Text>
              <Text style={styles.col}>{pData?.metrics.views.currentValue.toLocaleString() || '0'}</Text>
              <Text style={styles.col}>{pData?.metrics.engagements.currentValue.toLocaleString() || '0'}</Text>
              <Text style={styles.col}>{pData?.metrics.contentPublished.currentValue || '0'}</Text>
            </View>
          ))}
        </View>

        {/* Top Performing Content */}
        {topContent.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Top Performing Content</Text>
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.colWide, { fontFamily: 'Helvetica-Bold' }]}>Title / Excerpt</Text>
                <Text style={[styles.colSm, { fontFamily: 'Helvetica-Bold' }]}>Platform</Text>
                <Text style={[styles.colSm, { fontFamily: 'Helvetica-Bold' }]}>Views</Text>
                <Text style={[styles.colSm, { fontFamily: 'Helvetica-Bold' }]}>Likes</Text>
                <Text style={[styles.colSm, { fontFamily: 'Helvetica-Bold' }]}>Comments</Text>
                <Text style={[styles.colSm, { fontFamily: 'Helvetica-Bold' }]}>Total Eng.</Text>
              </View>
              {topContent.slice(0, 5).map(item => (
                <View key={item.providerContentId} style={styles.tableRow}>
                  <Text style={styles.colWide}>{item.title}</Text>
                  <Text style={[styles.colSm, { textTransform: 'uppercase' }]}>{item.platform}</Text>
                  <Text style={styles.colSm}>{item.views.toLocaleString()}</Text>
                  <Text style={styles.colSm}>{item.likes.toLocaleString()}</Text>
                  <Text style={styles.colSm}>{item.comments.toLocaleString()}</Text>
                  <Text style={[styles.colSm, { fontFamily: 'Helvetica-Bold' }]}>{item.engagements.toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Recommendations */}
        <Text style={styles.sectionTitle}>Strategic Recommendations</Text>
        <View style={styles.bulletList}>
          {recommendations.map(rec => (
            <View key={rec.id} style={styles.bulletItem}>
              <Text style={styles.bulletDot}>•</Text>
              <View style={styles.bulletText}>
                <Text style={{ fontFamily: 'Helvetica-Bold', color: '#0f172a' }}>
                  [{rec.priority.toUpperCase()}] {rec.title}:
                </Text>
                <Text style={{ marginTop: 2, color: '#334155' }}>{rec.recommendation}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Data Availability Notes */}
        <Text style={styles.sectionTitle}>Data Availability & Disclaimers</Text>
        <View style={styles.bulletList}>
          {dataAvailability.map(item => (
            <View key={item.key} style={styles.bulletItem}>
              <Text style={styles.bulletDot}>-</Text>
              <Text style={[styles.bulletText, { color: '#64748b', fontSize: 8 }]}>{item.message}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Social Report Pro — Confidential Marketing Performance Report</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
