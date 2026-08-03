import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/lib/site-config'
import { LegalPageLayout, TocItem } from '@/components/legal/legal-page-layout'
import { ShieldCheck, Lock, Mail, ExternalLink, Database, Key } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy | Social Report Pro',
  description: `Privacy Policy for ${siteConfig.name} (${siteConfig.productName}). Explains how we collect, process, encrypt, and delete data received via official Meta, YouTube, and TikTok APIs.`,
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: '/privacy'
  },
  openGraph: {
    title: 'Privacy Policy | Social Report Pro',
    description: `Privacy Policy for ${siteConfig.name}. Developer-compliant data processing rules for Meta, Google, YouTube, and TikTok integrations.`,
    url: `${siteConfig.url}/privacy`,
    siteName: siteConfig.productName,
    type: 'website'
  },
  robots: {
    index: true,
    follow: true
  }
}

const PRIVACY_TOC: TocItem[] = [
  { id: 'sec-1', title: 'Introduction' },
  { id: 'sec-2', title: 'Information We Collect' },
  { id: 'sec-3', title: 'Information Received from Connected Platforms' },
  { id: 'sec-4', title: 'Facebook and Instagram Data' },
  { id: 'sec-5', title: 'YouTube and Google Data' },
  { id: 'sec-6', title: 'TikTok Data' },
  { id: 'sec-7', title: 'OAuth Tokens and Credentials' },
  { id: 'sec-8', title: 'How We Use Information' },
  { id: 'sec-9', title: 'Analytics and Reporting' },
  { id: 'sec-10', title: 'Data Storage and Security' },
  { id: 'sec-11', title: 'Token Encryption' },
  { id: 'sec-12', title: 'Cookies and Local Storage' },
  { id: 'sec-13', title: 'Third-Party Services' },
  { id: 'sec-14', title: 'Data Sharing and Disclosure' },
  { id: 'sec-15', title: 'Data Retention' },
  { id: 'sec-16', title: 'User Rights' },
  { id: 'sec-17', title: 'Account Disconnection' },
  { id: 'sec-18', title: 'Data Deletion Requests' },
  { id: 'sec-19', title: 'Facebook User Data Deletion Instructions' },
  { id: 'sec-20', title: 'Google API Services User Data Policy' },
  { id: 'sec-21', title: 'TikTok Data Handling' },
  { id: 'sec-22', title: 'Children’s Privacy' },
  { id: 'sec-23', title: 'International Data Processing' },
  { id: 'sec-24', title: 'Changes to This Privacy Policy' },
  { id: 'sec-25', title: 'Contact Information' }
]

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description={`This Privacy Policy describes how ${siteConfig.companyName} ("Company", "we", "us", or "our") collects, uses, encrypts, stores, and protects personal data and social media API data when you use ${siteConfig.productName} (${siteConfig.name}).`}
      toc={PRIVACY_TOC}
    >
      {/* High-Level Developer Compliance Banner */}
      <section className="bg-card border border-border/60 rounded-xl p-6 space-y-3 not-prose">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <ShieldCheck className="w-5 h-5" />
          <span>Core Developer & API Data Commitments</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-muted-foreground">
          <div className="flex items-start gap-2 bg-muted/20 p-2.5 rounded-lg border border-border/30">
            <Lock className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span><strong>No Password Storage:</strong> We never request or store your Facebook, Google, YouTube, Instagram, or TikTok passwords. Authentication is handled exclusively through official OAuth dialogs.</span>
          </div>
          <div className="flex items-start gap-2 bg-muted/20 p-2.5 rounded-lg border border-border/30">
            <Key className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span><strong>Token Encryption:</strong> OAuth access tokens and refresh tokens are stored in AES-256 encrypted form and utilized only for user-authorized tasks.</span>
          </div>
          <div className="flex items-start gap-2 bg-muted/20 p-2.5 rounded-lg border border-border/30">
            <Database className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <span><strong>Data Never Sold:</strong> We do not sell, rent, or trade your personal data or connected social media API data to third parties, advertisers, or data brokers.</span>
          </div>
          <div className="flex items-start gap-2 bg-muted/20 p-2.5 rounded-lg border border-border/30">
            <ShieldCheck className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
            <span><strong>Limited Use Compliance:</strong> We strictly adhere to the Google API Services User Data Policy, Meta Platform Terms, and TikTok Developer Rules.</span>
          </div>
        </div>
      </section>

      {/* Section 1 */}
      <section id="sec-1" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">1. Introduction</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {siteConfig.companyName} (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates {siteConfig.productName} ({siteConfig.name}), accessible via {siteConfig.url}. This Privacy Policy explains our practices regarding the collection, use, disclosure, storage, encryption, and deletion of information gathered through our web application and official social media integrations.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          By registering for an account, connecting a social media account, or using our services, you acknowledge that you have read and understood this Privacy Policy.
        </p>
      </section>

      {/* Section 2 */}
      <section id="sec-2" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">2. Information We Collect</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We collect information required to provide multi-company social media analytics, reporting, and management services. This includes:
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li><strong>Account Registration Data:</strong> Email address, full name, company name, workspace settings, and password hash (managed securely via Supabase Authentication).</li>
          <li><strong>Workspace & Team Configurations:</strong> Team member invitations, role assignments (Owner, Admin, Marketing Manager, Viewer), branding assets, and custom report settings.</li>
          <li><strong>Technical & Usage Log Data:</strong> IP address, browser user-agent, access timestamps, HTTP request logs, and error diagnostic logs required for service stability and security auditing.</li>
        </ul>
      </section>

      {/* Section 3 */}
      <section id="sec-3" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">3. Information Received from Connected Social Media Platforms</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          When you authorize {siteConfig.productName} to connect with a third-party social media platform, we receive data through official platform APIs based on the specific scopes and permissions you approve.
        </p>
      </section>

      {/* Section 4 */}
      <section id="sec-4" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">4. Facebook and Instagram Data</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Via the Meta Graph API (v21.0+), we collect read-only metadata and performance statistics for connected Facebook Pages and Instagram Professional accounts:
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>Page/Account name, profile image URL, category, and Page ID.</li>
          <li>Aggregated performance metrics: follower count (<code>followers_count</code>, <code>fan_count</code>), impressions (<code>page_impressions</code>), reach (<code>page_impressions_unique</code>), video views, and total page post engagements.</li>
          <li>Published post metadata: post text captions, publish timestamps, permalinks, post type, photo/video media URLs, likes/reactions count, comments count, and shares count.</li>
        </ul>
      </section>

      {/* Section 5 */}
      <section id="sec-5" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">5. YouTube and Google Data</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Via the Google OAuth 2.0 and YouTube Data API v3, we collect:
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>Channel title, description, thumbnail URL, channel ID, and custom URL.</li>
          <li>Channel statistics: subscriber count, lifetime view count, total published video count.</li>
          <li>Published video details: video title, description, publish timestamp, duration, view count, like count, and comment count.</li>
        </ul>
      </section>

      {/* Section 6 */}
      <section id="sec-6" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">6. TikTok Data</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Via the official TikTok Content Posting API and Display API, we collect:
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>Display name, avatar URL, open_id, and account verification status.</li>
          <li>Overview analytics: profile views, video views, likes, comments, and shares count.</li>
        </ul>
      </section>

      {/* Section 7 */}
      <section id="sec-7" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">7. OAuth Tokens and Account Credentials</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          <strong>We never ask for, collect, or store your passwords for any third-party social media service.</strong> All account connections take place using official OAuth authorization dialogs provided by Meta, Google, or TikTok.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Upon authorization, the platform issues OAuth access tokens and refresh tokens. These tokens are stored securely in encrypted databases and are used solely to perform actions authorized by you (e.g. syncing daily performance stats or building PDF reports).
        </p>
      </section>

      {/* Section 8 */}
      <section id="sec-8" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">8. How We Use Information</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We use the information we collect strictly to deliver, maintain, and improve our services:
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>To generate multi-company social media performance dashboards and historical analytics trends.</li>
          <li>To compile automated weekly, monthly, and custom PDF & Excel reports.</li>
          <li>To calculate deterministic performance grades, growth rates, and AI executive intelligence summaries.</li>
          <li>To manage user authentication, authorization roles, and account security.</li>
          <li>To provide customer support and respond to user inquiries.</li>
        </ul>
      </section>

      {/* Section 9 */}
      <section id="sec-9" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">9. Analytics and Reporting</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Aggregated analytics snapshots (`analytics_snapshots`) and content performance metrics (`content_metrics`) are processed and formatted into user-facing reporting widgets. We do not use API data to build consumer ad profiles, sell data to third parties, or perform automated credit scoring.
        </p>
      </section>

      {/* Section 10 */}
      <section id="sec-10" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">10. Data Storage and Security</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your data is stored in enterprise-grade infrastructure managed by Supabase and Vercel, utilizing PostgreSQL databases with multi-tenant Row Level Security (RLS). RLS policies strictly enforce company-level data isolation so that users in Company A cannot access or view data belonging to Company B.
        </p>
      </section>

      {/* Section 11 */}
      <section id="sec-11" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">11. Token Encryption</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          OAuth access tokens and refresh tokens are encrypted at rest using AES-256-GCM authenticated encryption. Encryption keys are stored securely in environment secret vaults and are never exposed to browser client-side code or public API responses.
        </p>
      </section>

      {/* Section 12 */}
      <section id="sec-12" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">12. Cookies and Local Storage</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We use essential HTTP-only cookies and browser storage strictly required for user session management, authentication state preservation, and active company context selection. We do not use cross-site tracking cookies or third-party ad retargeting scripts.
        </p>
      </section>

      {/* Section 13 */}
      <section id="sec-13" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">13. Third-Party Services</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Our application connects with official third-party APIs:
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li><strong>Meta Graph API & Instagram Platform API:</strong> Provided by Meta Platforms, Inc.</li>
          <li><strong>YouTube Data API & Google Services:</strong> Provided by Google LLC.</li>
          <li><strong>TikTok Content Posting & Display API:</strong> Provided by TikTok Technology Limited.</li>
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Your interaction with these APIs is governed by the respective terms of service and privacy policies of Meta, Google, and TikTok.
        </p>
      </section>

      {/* Section 14 */}
      <section id="sec-14" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">14. Data Sharing and Disclosure</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          <strong>We do not sell, rent, trade, or share your personal data or connected social media API metrics with third parties or data brokers.</strong>
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We disclose information only under the following limited circumstances:
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li><strong>With Authorized Service Providers:</strong> Secure cloud hosting, database, and infrastructure providers (Vercel, Supabase) bound by strict confidentiality obligations.</li>
          <li><strong>For Legal Compliance:</strong> If required by valid law, subpoena, court order, or government regulation.</li>
          <li><strong>To Protect Rights and Safety:</strong> To enforce our Terms of Service, prevent fraud, or address security threats.</li>
        </ul>
      </section>

      {/* Section 15 */}
      <section id="sec-15" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">15. Data Retention</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We retain your account data and connected social media metrics for as long as your account remains active or as needed to provide you services. When you disconnect a social media account or request account deletion, associated OAuth tokens and raw metrics are deleted from active databases within 30 days.
        </p>
      </section>

      {/* Section 16 */}
      <section id="sec-16" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">16. User Rights</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Depending on your jurisdiction, you have rights regarding your personal data:
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li><strong>Access & Export:</strong> Request a copy of your stored workspace analytics in PDF or Excel format.</li>
          <li><strong>Correction:</strong> Update inaccurate account or branding details via Settings.</li>
          <li><strong>Disconnection & Revocation:</strong> Disconnect connected social accounts at any time via the Connections dashboard.</li>
          <li><strong>Deletion:</strong> Submit a data deletion request to erase stored personal and platform data.</li>
        </ul>
      </section>

      {/* Section 17 */}
      <section id="sec-17" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">17. Account Disconnection</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          You can disconnect any linked Facebook Page, Instagram account, YouTube channel, or TikTok profile at any time in the <code>/connections</code> page. Disconnecting revokes our access token and stops future metric syncing.
        </p>
      </section>

      {/* Section 18 */}
      <section id="sec-18" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">18. Data Deletion Requests</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          To request the deletion of all data associated with your user account or connected social media pages, you can submit a deletion request by emailing:
        </p>
        <div className="p-4 bg-card border border-border/60 rounded-xl space-y-2 not-prose">
          <p className="text-xs text-muted-foreground">Data Deletion Support Email:</p>
          <a
            href={`mailto:${siteConfig.supportEmail}?subject=Data%20Deletion%20Request`}
            className="text-sm font-bold text-primary hover:underline flex items-center gap-1.5"
          >
            <Mail className="w-4 h-4" />
            <span>{siteConfig.supportEmail}</span>
          </a>
          <p className="text-xs text-muted-foreground">
            You can also view detailed step-by-step instructions on our dedicated <Link href="/data-deletion" className="text-primary hover:underline font-semibold">Data Deletion Instructions</Link> page.
          </p>
        </div>
      </section>

      {/* Section 19 */}
      <section id="sec-19" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">19. Facebook User Data Deletion Instructions</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          In accordance with Meta Platform Terms, if you wish to remove your user data or Facebook Page connections associated with {siteConfig.productName}, follow these steps:
        </p>
        <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
          <li>Log in to your Facebook Account and go to <strong>Settings & Privacy &gt; Settings</strong>.</li>
          <li>Navigate to <strong>Apps and Websites</strong> and find <strong>{siteConfig.name}</strong> ({siteConfig.productName}).</li>
          <li>Click <strong>Remove</strong> to revoke all platform permissions.</li>
          <li>Alternatively, navigate to our <Link href="/data-deletion" className="text-primary hover:underline font-semibold">Data Deletion Callback & Status Check Page</Link> to initiate automated deletion.</li>
        </ol>
      </section>

      {/* Section 20 */}
      <section id="sec-20" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">20. Google API Services User Data Policy</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {siteConfig.productName}&apos;s use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 font-semibold">Google API Services User Data Policy <ExternalLink className="w-3 h-3" /></a>, including the Limited Use requirements.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We do not use YouTube API data for serving advertisements or sharing with third-party data brokers. You may revoke access to your Google/YouTube data at any time via the <a href="https://security.google.com/settings/security/permissions" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 font-semibold">Google Security Settings Page <ExternalLink className="w-3 h-3" /></a>.
        </p>
      </section>

      {/* Section 21 */}
      <section id="sec-21" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">21. TikTok Data Handling</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Data received from TikTok APIs is used exclusively for features requested by you, such as displaying account overview statistics and content engagement metrics. We adhere strictly to TikTok Developer Terms and do not attempt to re-identify anonymous users or build cross-app tracking profiles.
        </p>
      </section>

      {/* Section 22 */}
      <section id="sec-22" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">22. Children’s Privacy</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Our service is intended for business professionals, companies, and creators aged 18 and older (or the applicable age of majority). We do not knowingly collect personal information from children under 13 (or under 16 in certain jurisdictions). If you become aware that a child has provided us with personal data, please contact us immediately for deletion.
        </p>
      </section>

      {/* Section 23 */}
      <section id="sec-23" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">23. International Data Processing</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {siteConfig.productName} is operated by {siteConfig.companyName}, located in {siteConfig.country}. Information collected may be processed and stored in cloud servers located in the United States and other global infrastructure regions maintained by our hosting providers (Vercel, Supabase).
        </p>
      </section>

      {/* Section 24 */}
      <section id="sec-24" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">24. Changes to This Privacy Policy</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We may update this Privacy Policy from time to time to reflect changes in legal requirements, platform policies, or our application features. We will notify users of material updates by revising the &quot;Last Updated&quot; date at the top of this page.
        </p>
      </section>

      {/* Section 25 */}
      <section id="sec-25" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">25. Contact Information</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          If you have questions, concerns, or privacy requests regarding this Privacy Policy, please contact our privacy compliance team at:
        </p>
        <div className="p-4 bg-muted/20 border border-border/40 rounded-xl space-y-1 text-xs text-muted-foreground not-prose">
          <p className="font-bold text-sm text-foreground">{siteConfig.companyName}</p>
          <p>Product: {siteConfig.productName} ({siteConfig.name})</p>
          <p>Country: {siteConfig.country}</p>
          <p>Email: <a href={`mailto:${siteConfig.supportEmail}`} className="text-primary hover:underline font-semibold">{siteConfig.supportEmail}</a></p>
          <p>URL: <a href={siteConfig.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{siteConfig.url}</a></p>
        </div>
      </section>
    </LegalPageLayout>
  )
}
