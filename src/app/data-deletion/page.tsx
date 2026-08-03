import React from 'react'
import { Metadata } from 'next'
import { siteConfig } from '@/lib/site-config'
import { LegalPageLayout, TocItem } from '@/components/legal/legal-page-layout'
import { Trash2, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Data Deletion Instructions | Social Report Pro',
  description: `Step-by-step instructions for disconnecting connected social media accounts and requesting complete data deletion in ${siteConfig.productName} (${siteConfig.name}). Meta & TikTok callback compliant.`,
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: '/data-deletion'
  },
  openGraph: {
    title: 'Data Deletion Instructions | Social Report Pro',
    description: `User data deletion policy and Meta User Data Deletion Callback instructions for ${siteConfig.productName}.`,
    url: `${siteConfig.url}/data-deletion`,
    siteName: siteConfig.productName,
    type: 'website'
  },
  robots: {
    index: true,
    follow: true
  }
}

const DELETION_TOC: TocItem[] = [
  { id: 'sec-1', title: 'Data Deletion Overview' },
  { id: 'sec-2', title: 'Option 1: Self-Service Account Disconnection' },
  { id: 'sec-3', title: 'Option 2: Meta / Facebook Data Deletion' },
  { id: 'sec-4', title: 'Option 3: Google & YouTube Permission Revocation' },
  { id: 'sec-5', title: 'Option 4: Email Deletion Request' },
  { id: 'sec-6', title: 'Information Required in Deletion Requests' },
  { id: 'sec-7', title: 'Processing Timeline & Confirmation' },
  { id: 'sec-8', title: 'Data Retention in Security Backups' },
  { id: 'sec-9', title: 'Contact Information' }
]

export default function DataDeletionPage() {
  return (
    <LegalPageLayout
      title="Data Deletion Instructions"
      description={`Clear, step-by-step guidance on how to disconnect social media channels, revoke API permissions, and request complete erasure of your stored personal and analytics data from ${siteConfig.productName} (${siteConfig.name}).`}
      toc={DELETION_TOC}
    >
      {/* High-Level Overview Box */}
      <section className="bg-card border border-border/60 rounded-xl p-6 space-y-3 not-prose">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <Trash2 className="w-5 h-5" />
          <span>User Rights & Immediate Disconnection</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          In compliance with the Meta Platform Terms, Google API Services User Data Policy, and TikTok Developer Rules, users may disconnect linked accounts or request full deletion of stored social media metrics and user profile details at any time.
        </p>
      </section>

      {/* Section 1 */}
      <section id="sec-1" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">1. Data Deletion Overview</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          When you connect a social media account (Facebook, Instagram, YouTube, TikTok) to {siteConfig.productName}, we store encrypted OAuth access tokens, account metadata, and aggregated performance metrics to generate reports. If you choose to stop using the application or wish to remove your stored metrics, you can do so immediately through self-service disconnection or by submitting a formal deletion request.
        </p>
      </section>

      {/* Section 2 */}
      <section id="sec-2" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">2. Option 1: Self-Service Account Disconnection</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          You can immediately stop metric syncing and delete your active social connection inside the application:
        </p>
        <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-2">
          <li>Log in to your <strong>{siteConfig.productName}</strong> dashboard at <a href={`${siteConfig.url}/login`} className="text-primary hover:underline font-semibold">{siteConfig.url}/login</a>.</li>
          <li>Navigate to the <strong>Connections</strong> page (`/connections`) from the main sidebar.</li>
          <li>Locate the connected Facebook Page, Instagram account, YouTube channel, or TikTok profile.</li>
          <li>Click <strong>Disconnect Account</strong> and confirm the prompt.</li>
        </ol>
        <p className="text-sm leading-relaxed text-muted-foreground">
          <em>Result:</em> The encrypted access token is immediately purged from our database, preventing any future API calls to the social network.
        </p>
      </section>

      {/* Section 3 */}
      <section id="sec-3" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">3. Option 2: Meta / Facebook Data Deletion</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          If you connected via Facebook OAuth and wish to remove {siteConfig.name} from your Meta account:
        </p>
        <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
          <li>Go to your Facebook profile <strong>Settings &amp; Privacy &gt; Settings</strong>.</li>
          <li>Select <strong>Apps and Websites</strong> from the left menu.</li>
          <li>Search for <strong>{siteConfig.name}</strong> ({siteConfig.productName}).</li>
          <li>Click <strong>Remove</strong> to revoke access permissions.</li>
        </ol>
      </section>

      {/* Section 4 */}
      <section id="sec-4" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">4. Option 3: Google &amp; YouTube Permission Revocation</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          To revoke {siteConfig.productName}&apos;s access to your YouTube channel:
        </p>
        <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
          <li>Visit your <a href="https://security.google.com/settings/security/permissions" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Google Account Security Permissions</a> page.</li>
          <li>Find <strong>{siteConfig.productName}</strong> under Third-party apps with account access.</li>
          <li>Click <strong>Remove Access</strong>.</li>
        </ol>
      </section>

      {/* Section 5 */}
      <section id="sec-5" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">5. Option 4: Email Deletion Request</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          To request the complete erasure of your user account, workspace history, and all stored analytics metrics from our servers, send an email to our data privacy team:
        </p>
        <div className="p-4 bg-card border border-border/60 rounded-xl space-y-2 not-prose">
          <p className="text-xs text-muted-foreground">Data Privacy Contact:</p>
          <a
            href={`mailto:${siteConfig.supportEmail}?subject=Data%20Deletion%20Request`}
            className="text-sm font-bold text-primary hover:underline flex items-center gap-1.5"
          >
            <Mail className="w-4 h-4" />
            <span>{siteConfig.supportEmail}</span>
          </a>
        </div>
      </section>

      {/* Section 6 */}
      <section id="sec-6" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">6. Information Required in Deletion Requests</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          To ensure security and verify account ownership, please include the following details in your deletion email:
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>Registered Account Email Address.</li>
          <li>Company / Workspace Name in {siteConfig.productName}.</li>
          <li>Specific platform connection IDs or Page names to be erased (or state &quot;Full Account Erasure&quot;).</li>
        </ul>
      </section>

      {/* Section 7 */}
      <section id="sec-7" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">7. Processing Timeline & Confirmation</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Upon receiving your deletion request:
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>We will send an acknowledgment receipt within <strong>48 hours</strong>.</li>
          <li>Active connection rows, encrypted tokens, and analytics snapshots will be permanently deleted from primary databases within <strong>30 calendar days</strong>.</li>
          <li>A final confirmation email will be sent once processing is complete.</li>
        </ul>
      </section>

      {/* Section 8 */}
      <section id="sec-8" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">8. Data Retention in Security Backups</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Please note that encrypted database backups maintained for disaster recovery and security auditing are overwritten on a rolling 30-day retention schedule. Once deleted from primary systems, data automatically expires from backups at the end of the backup cycle.
        </p>
      </section>

      {/* Section 9 */}
      <section id="sec-9" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">9. Contact Information</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          If you have any questions regarding our data deletion policies, please contact:
        </p>
        <div className="p-4 bg-muted/20 border border-border/40 rounded-xl space-y-1 text-xs text-muted-foreground not-prose">
          <p className="font-bold text-sm text-foreground">{siteConfig.companyName}</p>
          <p>Product: {siteConfig.productName} ({siteConfig.name})</p>
          <p>Email: <a href={`mailto:${siteConfig.supportEmail}`} className="text-primary hover:underline font-semibold">{siteConfig.supportEmail}</a></p>
          <p>URL: <a href={siteConfig.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{siteConfig.url}</a></p>
        </div>
      </section>
    </LegalPageLayout>
  )
}
