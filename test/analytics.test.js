/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const { test } = require('node:test');

// Date Range Utility Implementation
function formatDateToYYYYMMDD(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateRange(preset, customStart, customEnd, now = new Date()) {
  const utcNow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  if (preset === 'custom' && customStart && customEnd) {
    return { startDate: customStart, endDate: customEnd, preset: 'custom' };
  }

  const endDateStr = formatDateToYYYYMMDD(utcNow);

  switch (preset) {
    case 'today':
      return { startDate: endDateStr, endDate: endDateStr, preset: 'today' };
    case 'yesterday': {
      const yesterday = new Date(utcNow);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const yStr = formatDateToYYYYMMDD(yesterday);
      return { startDate: yStr, endDate: yStr, preset: 'yesterday' };
    }
    case 'last_7_days': {
      const start = new Date(utcNow);
      start.setUTCDate(start.getUTCDate() - 6);
      return { startDate: formatDateToYYYYMMDD(start), endDate: endDateStr, preset: 'last_7_days' };
    }
    case 'last_30_days': {
      const start = new Date(utcNow);
      start.setUTCDate(start.getUTCDate() - 29);
      return { startDate: formatDateToYYYYMMDD(start), endDate: endDateStr, preset: 'last_30_days' };
    }
    default: {
      const start = new Date(utcNow);
      start.setUTCDate(start.getUTCDate() - 29);
      return { startDate: formatDateToYYYYMMDD(start), endDate: endDateStr, preset: 'last_30_days' };
    }
  }
}

function getPreviousEquivalentPeriod(range) {
  const startMs = Date.parse(range.startDate);
  const endMs = Date.parse(range.endDate);

  if (isNaN(startMs) || isNaN(endMs)) {
    return { startDate: range.startDate, endDate: range.endDate };
  }

  const durationDays = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1);

  const prevEnd = new Date(startMs);
  prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);

  const prevStart = new Date(prevEnd);
  prevStart.setUTCDate(prevStart.getUTCDate() - durationDays + 1);

  return {
    startDate: formatDateToYYYYMMDD(prevStart),
    endDate: formatDateToYYYYMMDD(prevEnd)
  };
}

// Normalizer
function normalizeProviderMetricName(provider, rawMetricName) {
  const cleanName = rawMetricName.trim();
  const facebookMap = {
    page_fans: 'audience_total',
    followers_count: 'audience_total',
    page_impressions_unique: 'reach',
    page_impressions: 'impressions',
    page_post_engagements: 'engagements'
  };
  const youtubeMap = {
    subscriberCount: 'audience_total',
    views: 'views',
    subscribersGained: 'audience_gained'
  };

  if (provider === 'facebook') return facebookMap[cleanName] || null;
  if (provider === 'youtube') return youtubeMap[cleanName] || null;
  return null;
}

// Growth calculation
function calculateGrowth(currentVal, prevVal) {
  const current = currentVal === null || currentVal === undefined || isNaN(currentVal) ? 0 : currentVal;
  const previous = prevVal === null || prevVal === undefined || isNaN(prevVal) ? null : prevVal;

  if (previous === null) {
    return {
      currentValue: current,
      previousValue: 0,
      absoluteChange: current,
      percentageChange: 0,
      isPositive: current >= 0,
      isZeroBaseline: true,
      isUnavailable: true
    };
  }

  const absoluteChange = current - previous;

  if (previous === 0) {
    return {
      currentValue: current,
      previousValue: 0,
      absoluteChange: current,
      percentageChange: current > 0 ? 100 : 0,
      isPositive: current >= 0,
      isZeroBaseline: true,
      isUnavailable: false
    };
  }

  const percentageChange = parseFloat(((absoluteChange / Math.abs(previous)) * 100).toFixed(1));

  return {
    currentValue: current,
    previousValue: previous,
    absoluteChange,
    percentageChange,
    isPositive: absoluteChange >= 0,
    isZeroBaseline: false,
    isUnavailable: false
  };
}

// Aggregation
function aggregateMetricSnapshots(rows, metricName) {
  const pointInTimeMetrics = new Set(['audience_total']);
  const filtered = rows.filter(r => r.metric_name === metricName);
  if (filtered.length === 0) return 0;

  if (pointInTimeMetrics.has(metricName)) {
    const sorted = [...filtered].sort((a, b) => b.snapshot_date.localeCompare(a.snapshot_date));
    return sorted[0].metric_value;
  }

  return filtered.reduce((sum, r) => sum + (r.metric_value || 0), 0);
}

// Tests
test('analytics - computes last_7_days correctly', () => {
  const refDate = new Date('2026-07-22T12:00:00Z');
  const range = getDateRange('last_7_days', undefined, undefined, refDate);
  assert.equal(range.startDate, '2026-07-16');
  assert.equal(range.endDate, '2026-07-22');
});

test('analytics - computes previous equivalent period', () => {
  const range = { startDate: '2026-07-16', endDate: '2026-07-22' };
  const prev = getPreviousEquivalentPeriod(range);
  assert.equal(prev.startDate, '2026-07-09');
  assert.equal(prev.endDate, '2026-07-15');
});

test('analytics - maps Facebook raw metric names', () => {
  assert.equal(normalizeProviderMetricName('facebook', 'page_fans'), 'audience_total');
  assert.equal(normalizeProviderMetricName('facebook', 'page_impressions_unique'), 'reach');
  assert.equal(normalizeProviderMetricName('facebook', 'page_post_engagements'), 'engagements');
});

test('analytics - maps YouTube raw metric names', () => {
  assert.equal(normalizeProviderMetricName('youtube', 'subscriberCount'), 'audience_total');
  assert.equal(normalizeProviderMetricName('youtube', 'views'), 'views');
  assert.equal(normalizeProviderMetricName('youtube', 'subscribersGained'), 'audience_gained');
});

test('analytics - growth calculation normal percentage', () => {
  const growth = calculateGrowth(150, 100);
  assert.equal(growth.absoluteChange, 50);
  assert.equal(growth.percentageChange, 50);
  assert.equal(growth.isPositive, true);
  assert.equal(growth.isZeroBaseline, false);
});

test('analytics - growth calculation zero baseline handling', () => {
  const growth = calculateGrowth(50, 0);
  assert.equal(growth.absoluteChange, 50);
  assert.equal(growth.percentageChange, 100);
  assert.equal(growth.isZeroBaseline, true);
});

test('analytics - growth calculation unavailable previous period protection', () => {
  const growth = calculateGrowth(100, null);
  assert.equal(growth.isUnavailable, true);
  assert.equal(growth.percentageChange, 0);
  assert.equal(isNaN(growth.percentageChange), false);
});

test('analytics - aggregation point in time metrics use latest snapshot value', () => {
  const rows = [
    { snapshot_date: '2026-07-20', metric_name: 'audience_total', metric_value: 100 },
    { snapshot_date: '2026-07-22', metric_name: 'audience_total', metric_value: 120 },
    { snapshot_date: '2026-07-21', metric_name: 'audience_total', metric_value: 110 }
  ];
  const aggregated = aggregateMetricSnapshots(rows, 'audience_total');
  assert.equal(aggregated, 120);
});

test('analytics - aggregation cumulative metrics sum daily values', () => {
  const rows = [
    { snapshot_date: '2026-07-20', metric_name: 'impressions', metric_value: 50 },
    { snapshot_date: '2026-07-21', metric_name: 'impressions', metric_value: 70 }
  ];
  const aggregated = aggregateMetricSnapshots(rows, 'impressions');
  assert.equal(aggregated, 120);
});
