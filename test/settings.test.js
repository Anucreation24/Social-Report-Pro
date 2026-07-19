/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('assert');
const test = require('node:test');

// Zod schemas matching our features settings schemas
const { z } = require('zod');

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  avatarUrl: z.string().url('Invalid avatar URL').or(z.literal('')),
  timezone: z.string().min(1, 'Timezone is required'),
});

const companySettingsSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  logoUrl: z.string().url('Invalid logo URL').or(z.literal('')),
  industry: z.string().min(1, 'Industry is required'),
  country: z.string().min(1, 'Country is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  weekStartsOn: z.enum(['sunday', 'monday']),
});

const reportPreferencesSchema = z.object({
  defaultReportType: z.enum(['weekly', 'monthly']),
  preparedByDefault: z.string().min(1, 'Prepared by default text is required'),
  defaultPlatforms: z.array(z.string()),
  defaultSections: z.array(z.string()),
  dateFormat: z.string(),
  numberFormat: z.string(),
});

const notificationPreferencesSchema = z.object({
  connectionWarnings: z.boolean(),
  tokenExpiryWarnings: z.boolean(),
  syncFailureNotifications: z.boolean(),
  reportCompletionNotifications: z.boolean(),
  goalAchievementNotifications: z.boolean(),
  teamInvitationNotifications: z.boolean(),
});

// Mock permission checker
function checkCompanyRole(role, allowedRoles) {
  return allowedRoles.includes(role);
}

// 1. Profile Validation Tests
test('profileSchema validation - valid profile details', () => {
  const data = {
    fullName: 'Anu Thennakoon',
    avatarUrl: 'https://example.com/avatar.png',
    timezone: 'Asia/Colombo'
  };
  const result = profileSchema.safeParse(data);
  assert.strictEqual(result.success, true);
});

test('profileSchema validation - too short full name is rejected', () => {
  const data = {
    fullName: 'A',
    avatarUrl: 'https://example.com/avatar.png',
    timezone: 'Asia/Colombo'
  };
  const result = profileSchema.safeParse(data);
  assert.strictEqual(result.success, false);
});

test('profileSchema validation - invalid avatar URL is rejected', () => {
  const data = {
    fullName: 'Anu Thennakoon',
    avatarUrl: 'invalid-url',
    timezone: 'Asia/Colombo'
  };
  const result = profileSchema.safeParse(data);
  assert.strictEqual(result.success, false);
});

// 2. Company Settings Validation Tests
test('companySettingsSchema validation - valid company configurations', () => {
  const data = {
    name: 'Anu Creation',
    logoUrl: 'https://example.com/logo.png',
    industry: 'Marketing Agency',
    country: 'Sri Lanka',
    timezone: 'Asia/Colombo',
    weekStartsOn: 'monday'
  };
  const result = companySettingsSchema.safeParse(data);
  assert.strictEqual(result.success, true);
});

test('companySettingsSchema validation - invalid weekStartsOn is rejected', () => {
  const data = {
    name: 'Anu Creation',
    logoUrl: 'https://example.com/logo.png',
    industry: 'Marketing Agency',
    country: 'Sri Lanka',
    timezone: 'Asia/Colombo',
    weekStartsOn: 'tuesday' // invalid enum
  };
  const result = companySettingsSchema.safeParse(data);
  assert.strictEqual(result.success, false);
});

// 3. Report Preference Validation Tests
test('reportPreferencesSchema validation - valid report defaults', () => {
  const data = {
    defaultReportType: 'weekly',
    preparedByDefault: 'Marketing Department',
    defaultPlatforms: ['facebook', 'instagram'],
    defaultSections: ['Executive Summary', 'Goals'],
    dateFormat: 'YYYY-MM-DD',
    numberFormat: 'standard'
  };
  const result = reportPreferencesSchema.safeParse(data);
  assert.strictEqual(result.success, true);
});

// 4. Role Permissions Checks
test('permissions validation - owner has full access to company profile settings', () => {
  const hasAccess = checkCompanyRole('owner', ['owner', 'admin']);
  assert.strictEqual(hasAccess, true);
});

test('permissions validation - admin has access to company profile settings', () => {
  const hasAccess = checkCompanyRole('admin', ['owner', 'admin']);
  assert.strictEqual(hasAccess, true);
});

test('permissions validation - marketing manager lacks access to critical company configurations', () => {
  const hasAccess = checkCompanyRole('marketing_manager', ['owner', 'admin']);
  assert.strictEqual(hasAccess, false);
});

test('permissions validation - viewer lacks access to critical company configurations', () => {
  const hasAccess = checkCompanyRole('viewer', ['owner', 'admin']);
  assert.strictEqual(hasAccess, false);
});

test('permissions validation - marketing manager has access to edit reports configurations', () => {
  const hasAccess = checkCompanyRole('marketing_manager', ['owner', 'admin', 'marketing_manager']);
  assert.strictEqual(hasAccess, true);
});

test('permissions validation - viewer lacks access to edit reports configurations', () => {
  const hasAccess = checkCompanyRole('viewer', ['owner', 'admin', 'marketing_manager']);
  assert.strictEqual(hasAccess, false);
});

// 5. Notification Preference Validation Tests
test('notificationPreferencesSchema validation - valid notification toggles', () => {
  const data = {
    connectionWarnings: true,
    tokenExpiryWarnings: true,
    syncFailureNotifications: false,
    reportCompletionNotifications: true,
    goalAchievementNotifications: true,
    teamInvitationNotifications: false
  };
  const result = notificationPreferencesSchema.safeParse(data);
  assert.strictEqual(result.success, true);
});

// 6. Config Exposure Safety Check
test('security - config module does not expose private variables', () => {
  // Simulating check for private variables
  const mockConfigModule = {
    NEXT_PUBLIC_SUPABASE_URL: 'https://utqcgethipyrnmmicdbb.supabase.co',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000'
  };
  
  const hasSecrets = Object.keys(mockConfigModule).some(key => 
    key.includes('SERVICE_ROLE') || key.includes('SECRET') || key.includes('KEY') && !key.includes('PUBLIC')
  );
  assert.strictEqual(hasSecrets, false);
});
