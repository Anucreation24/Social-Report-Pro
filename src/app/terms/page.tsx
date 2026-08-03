import React from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { siteConfig } from '@/lib/site-config'
import { LegalPageLayout, TocItem } from '@/components/legal/legal-page-layout'
import { Scale, FileText, AlertTriangle, ShieldAlert } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service | Social Report Pro',
  description: `Terms of Service for ${siteConfig.name} (${siteConfig.productName}). Terms governing account eligibility, connected platform APIs, prohibited conduct, analytics accuracy, and Sri Lankan governing law.`,
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: '/terms'
  },
  openGraph: {
    title: 'Terms of Service | Social Report Pro',
    description: `Terms of Service for ${siteConfig.name}. Platform terms, API rules, user responsibilities, and legal disclaimers.`,
    url: `${siteConfig.url}/terms`,
    siteName: siteConfig.productName,
    type: 'website'
  },
  robots: {
    index: true,
    follow: true
  }
}

const TERMS_TOC: TocItem[] = [
  { id: 'sec-1', title: 'Acceptance of Terms' },
  { id: 'sec-2', title: 'Description of the Service' },
  { id: 'sec-3', title: 'Eligibility' },
  { id: 'sec-4', title: 'User Accounts' },
  { id: 'sec-5', title: 'Connected Social Media Accounts' },
  { id: 'sec-6', title: 'OAuth Authorization' },
  { id: 'sec-7', title: 'User Responsibilities' },
  { id: 'sec-8', title: 'Permitted Use' },
  { id: 'sec-9', title: 'Prohibited Use' },
  { id: 'sec-10', title: 'Social Media Platform Rules' },
  { id: 'sec-11', title: 'Content Ownership' },
  { id: 'sec-12', title: 'User-Submitted Content' },
  { id: 'sec-13', title: 'Publishing and Scheduling' },
  { id: 'sec-14', title: 'Analytics Accuracy' },
  { id: 'sec-15', title: 'Third-Party APIs' },
  { id: 'sec-16', title: 'API Availability and Changes' },
  { id: 'sec-17', title: 'Rate Limits and Platform Restrictions' },
  { id: 'sec-18', title: 'Account Suspension and Termination' },
  { id: 'sec-19', title: 'Data Removal' },
  { id: 'sec-20', title: 'Intellectual Property' },
  { id: 'sec-21', title: 'Disclaimer of Warranties' },
  { id: 'sec-22', title: 'Limitation of Liability' },
  { id: 'sec-23', title: 'Indemnification' },
  { id: 'sec-24', title: 'Service Modifications' },
  { id: 'sec-25', title: 'Governing Law' },
  { id: 'sec-26', title: 'Changes to the Terms' },
  { id: 'sec-27', title: 'Contact Information' }
]

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      description={`These Terms of Service ("Terms") constitute a legally binding agreement between you and ${siteConfig.companyName} ("Company", "we", "us", or "our") governing your access to and use of ${siteConfig.productName} (${siteConfig.name}).`}
      toc={TERMS_TOC}
    >
      {/* Executive Terms Banner */}
      <section className="bg-card border border-border/60 rounded-xl p-6 space-y-3 not-prose">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <Scale className="w-5 h-5" />
          <span>Important Operational & Platform Declarations</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-muted-foreground">
          <div className="flex items-start gap-2 bg-muted/20 p-2.5 rounded-lg border border-border/30">
            <FileText className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span><strong>Authority to Connect:</strong> Users must hold legitimate administrative authority to connect and analyze every social media account added to the application.</span>
          </div>
          <div className="flex items-start gap-2 bg-muted/20 p-2.5 rounded-lg border border-border/30">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span><strong>Analytics Disclaimers:</strong> API metrics may differ from native platform dashboards due to API sync intervals, attribution windows, aggregation, or privacy thresholds.</span>
          </div>
          <div className="flex items-start gap-2 bg-muted/20 p-2.5 rounded-lg border border-border/30">
            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span><strong>Strict Zero Spam:</strong> Misinformation, credential theft, scraping, harassment, or platform API policy violations result in immediate account termination.</span>
          </div>
          <div className="flex items-start gap-2 bg-muted/20 p-2.5 rounded-lg border border-border/30">
            <Scale className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span><strong>Governing Law:</strong> Governed by the laws of Sri Lanka without regard to conflict of law principles.</span>
          </div>
        </div>
      </section>

      {/* Section 1 */}
      <section id="sec-1" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">1. Acceptance of Terms</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          By accessing or using {siteConfig.productName} ({siteConfig.name}), registering an account, or linking a social media channel, you agree to be bound by these Terms of Service and our <Link href="/privacy" className="text-primary hover:underline font-semibold">Privacy Policy</Link>. If you do not agree to all terms, you must not access or use the service.
        </p>
      </section>

      {/* Section 2 */}
      <section id="sec-2" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">2. Description of the Service</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {siteConfig.productName} is a web-based social media management, historical analytics aggregation, executive intelligence reporting, and workflow platform. The platform enables multi-company workspace isolation, API connectors for Meta (Facebook/Instagram), YouTube, and TikTok, CSV/XLSX manual data imports, and report exports.
        </p>
      </section>

      {/* Section 3 */}
      <section id="sec-3" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">3. Eligibility</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          You must be at least 18 years old (or the legal age of majority in your jurisdiction) to register an account and use the service. By using the platform, you represent and warrant that you have full power and authority to enter into this agreement.
        </p>
      </section>

      {/* Section 4 */}
      <section id="sec-4" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">4. User Accounts</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          You are responsible for maintaining the confidentiality of your account credentials and for all activities conducted under your account. You agree to notify us immediately of any unauthorized access or security breach.
        </p>
      </section>

      {/* Section 5 */}
      <section id="sec-5" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">5. Connected Social Media Accounts</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          When connecting a Facebook Page, Instagram account, YouTube channel, or TikTok profile, you affirm that you are the owner or an authorized administrator of that social media property with explicit permission to access its analytics and content.
        </p>
      </section>

      {/* Section 6 */}
      <section id="sec-6" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">6. OAuth Authorization</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Authorization is completed through official third-party OAuth dialogs. We store encrypted access tokens to fetch statistics on your behalf. You may revoke access at any time through the platform settings or directly inside Meta, Google, or TikTok account security dashboards.
        </p>
      </section>

      {/* Section 7 */}
      <section id="sec-7" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">7. User Responsibilities</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          You remain solely responsible for all content, metrics, notes, images, titles, and text uploaded, imported, published, or analyzed using {siteConfig.productName}.
        </p>
      </section>

      {/* Section 8 */}
      <section id="sec-8" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">8. Permitted Use</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          You may use the service for lawful business operations, social media analytics monitoring, client reporting, target tracking, and executive performance visualization in accordance with these Terms.
        </p>
      </section>

      {/* Section 9 */}
      <section id="sec-9" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">9. Prohibited Use</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          You agree not to engage in any of the following prohibited activities:
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>Using the service for spam, unauthorized surveillance, scraping, credential theft, or phishing.</li>
          <li>Uploading or analyzing illegal, defamatory, harassing, hateful, or infringing content.</li>
          <li>Attempting to bypass authentication guards, role-level security (RLS), encryption vaults, or tenant isolation.</li>
          <li>Abusing API endpoints, overloading infrastructure, or violating platform rate limits.</li>
          <li>Reselling, sublicensing, or reverse engineering the software without written authorization.</li>
        </ul>
      </section>

      {/* Section 10 */}
      <section id="sec-10" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">10. Social Media Platform Rules</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          You agree to comply fully with all applicable developer policies and terms of service, including:
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>Meta Platform Terms & Developer Policies (Facebook and Instagram)</li>
          <li>YouTube Terms of Service & Google API Services User Data Policy</li>
          <li>TikTok Developer Terms & Community Guidelines</li>
        </ul>
      </section>

      {/* Section 11 */}
      <section id="sec-11" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">11. Content Ownership</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We claim no ownership over your social media posts, graphics, text, videos, or raw performance data. You retain full ownership and intellectual property rights to your content.
        </p>
      </section>

      {/* Section 12 */}
      <section id="sec-12" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">12. User-Submitted Content</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          By uploading or importing content into {siteConfig.productName}, you grant us a worldwide, non-exclusive, royalty-free license to store, process, format, and display the content solely as necessary to provide service functionality to your team.
        </p>
      </section>

      {/* Section 13 */}
      <section id="sec-13" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">13. Publishing and Scheduling</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Where publishing or scheduling features are enabled, you acknowledge that publishing timing is subject to third-party network availability, queue processing times, and platform API status. We are not liable for delayed or failed social media posts caused by network outages.
        </p>
      </section>

      {/* Section 14 */}
      <section id="sec-14" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">14. Analytics Accuracy</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Metrics displayed in {siteConfig.productName} are retrieved from third-party APIs or imported files. <strong>Metrics may differ from native platform dashboards</strong> due to API sync delays, timezone offsets, attribution windows, privacy thresholds, or platform aggregation rules. We do not guarantee follower growth, reach, engagement rate, or viral post outcomes.
        </p>
      </section>

      {/* Section 15 */}
      <section id="sec-15" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">15. Third-Party APIs</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {siteConfig.productName} relies on APIs operated by third parties (Meta, Google, TikTok). We have no control over third-party API downtime, policy changes, endpoint deprecations, or account suspensions imposed by social networks.
        </p>
      </section>

      {/* Section 16 */}
      <section id="sec-16" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">16. API Availability and Changes</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Third-party platforms may modify, restrict, rate-limit, or discontinue API endpoints at any time. We are not responsible for service interruptions or loss of metric access resulting from changes implemented by third-party API providers.
        </p>
      </section>

      {/* Section 17 */}
      <section id="sec-17" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">17. Rate Limits and Platform Restrictions</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We enforce rate limits and request queues to protect API quotas. If a social media platform restricts your account due to external policy violations, metric syncing for that channel may pause until resolved.
        </p>
      </section>

      {/* Section 18 */}
      <section id="sec-18" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">18. Account Suspension and Termination</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We reserve the right to suspend or terminate your access to the service immediately, without prior notice, if you breach these Terms, engage in fraudulent activity, or violate social media developer policies.
        </p>
      </section>

      {/* Section 19 */}
      <section id="sec-19" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">19. Data Removal</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Upon termination or account deletion, your access tokens are revoked and stored metrics are queued for deletion in accordance with our <Link href="/privacy" className="text-primary hover:underline font-semibold">Privacy Policy</Link> and <Link href="/data-deletion" className="text-primary hover:underline font-semibold">Data Deletion Instructions</Link>.
        </p>
      </section>

      {/* Section 20 */}
      <section id="sec-20" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">20. Intellectual Property</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The software, source code, UI designs, brand assets, logos, and documentation of {siteConfig.productName} are the exclusive property of {siteConfig.companyName}.
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          <em>Third-party trademarks disclaimer:</em> Facebook, Instagram, Meta, YouTube, Google, and TikTok are registered trademarks of their respective owners. {siteConfig.productName} is an independent application and is not endorsed by or affiliated with Meta, Google, or TikTok.
        </p>
      </section>

      {/* Section 21 */}
      <section id="sec-21" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">21. Disclaimer of Warranties</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
        </p>
      </section>

      {/* Section 22 */}
      <section id="sec-22" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">22. Limitation of Liability</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL {siteConfig.companyName.toUpperCase()}, ITS DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, LOSS OF PROFITS, DATA LOSS, OR BUSINESS INTERRUPTION ARISING FROM YOUR USE OF THE SERVICE.
        </p>
      </section>

      {/* Section 23 */}
      <section id="sec-23" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">23. Indemnification</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          You agree to defend, indemnify, and hold harmless {siteConfig.companyName} and its officers from any claims, damages, liabilities, costs, or attorney fees arising out of your content, unauthorized account connection, or violation of these Terms or third-party API policies.
        </p>
      </section>

      {/* Section 24 */}
      <section id="sec-24" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">24. Service Modifications</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We reserve the right to modify, update, or discontinue features of the service at any time. We will endeavor to provide notice of significant changes where feasible.
        </p>
      </section>

      {/* Section 25 */}
      <section id="sec-25" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">25. Governing Law</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          These Terms shall be governed by and construed in accordance with the laws of <strong>{siteConfig.country}</strong>, without giving effect to any principles of conflicts of law. Any legal action or proceeding arising under these Terms shall be brought exclusively in the competent courts of Sri Lanka.
        </p>
      </section>

      {/* Section 26 */}
      <section id="sec-26" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">26. Changes to the Terms</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          We may revise these Terms from time to time. Revised Terms will be posted on this page with an updated &quot;Last Updated&quot; timestamp. Continued use of the service after changes constitutes acceptance of the new Terms.
        </p>
      </section>

      {/* Section 27 */}
      <section id="sec-27" className="space-y-3 pt-4">
        <h2 className="text-xl font-bold text-foreground">27. Contact Information</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          For questions or legal notices regarding these Terms of Service, please contact:
        </p>
        <div className="p-4 bg-muted/20 border border-border/40 rounded-xl space-y-1 text-xs text-muted-foreground not-prose">
          <p className="font-bold text-sm text-foreground">{siteConfig.companyName}</p>
          <p>Product: {siteConfig.productName} ({siteConfig.name})</p>
          <p>Jurisdiction: {siteConfig.country}</p>
          <p>Email: <a href={`mailto:${siteConfig.supportEmail}`} className="text-primary hover:underline font-semibold">{siteConfig.supportEmail}</a></p>
          <p>URL: <a href={siteConfig.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{siteConfig.url}</a></p>
        </div>
      </section>
    </LegalPageLayout>
  )
}
