import { openCookieSettings } from "@/components/CookieConsentBanner";
import { Footer, Header } from "@/pages/Home";

const updatedAt = "June 19, 2026";
const contactEmail = "info@italianbuilders.co";

function LegalShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="dark-technical-theme min-h-screen bg-zinc-950">
      <Header />
      <main>
        <section className="border-b border-zinc-900 bg-zinc-950 pt-20 pb-12 md:pt-28 md:pb-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="max-w-3xl">
              <div className="mb-4 text-xs font-mono font-semibold uppercase tracking-wider text-blue-400">
                {eyebrow}
              </div>
              <h1 className="mb-5 text-4xl font-bold tracking-tight text-zinc-50 md:text-5xl">
                {title}
              </h1>
              <p className="text-base leading-7 text-zinc-400">{intro}</p>
              <p className="mt-4 text-xs font-mono uppercase tracking-wider text-zinc-600">
                Last updated: {updatedAt}
              </p>
            </div>
          </div>
        </section>
        <section className="bg-zinc-950 py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-6">
            <article className="max-w-3xl space-y-10 text-sm leading-7 text-zinc-400 md:text-base md:leading-8">
              {children}
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-xl font-semibold tracking-tight text-zinc-100">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

export function PrivacyPolicyPage() {
  return (
    <LegalShell
      eyebrow="Privacy"
      title="Privacy Policy"
      intro="This policy explains what Italian Builders collects, why we collect it, and how we use the services that power the community."
    >
      <Section title="Who we are">
        <p>
          Italian Builders is a community for people who build products,
          companies, software, creative work, and technology in or connected to
          Italy. In this policy, "Italian Builders", "we", "us", and "our" mean
          the operators of the Italian Builders website and community.
        </p>
      </Section>

      <Section title="Information we collect">
        <BulletList
          items={[
            "Waitlist and invite information, such as name, email address, role, what you are building, website or project links, and social handles you choose to provide.",
            "Account information, such as email address, authentication data, username, profile details, profile visibility settings, and invite status.",
            "Community content, such as builder profiles, project listings, community project details, links, images, videos, and collaboration notes that you choose to submit.",
            "Technical information, such as IP address, browser type, device information, log events, security events, page URLs, and error diagnostics.",
            "Preference data stored in your browser, such as label mode, session state, cookie notice status, and interface preferences.",
          ]}
        />
      </Section>

      <Section title="How we use information">
        <BulletList
          items={[
            "To run the community, review access requests, create invites, authenticate members, and display public or member-visible profiles and projects.",
            "To store and serve media uploaded by authenticated members.",
            "To keep the website reliable, secure, and maintainable.",
            "To contact you about your access request, account, invite, or important community updates.",
            "To comply with legal obligations and enforce the Terms of Service.",
          ]}
        />
      </Section>

      <Section title="Legal bases">
        <p>
          When GDPR or similar laws apply, we rely on the following legal bases:
          performance of a contract or pre-contractual steps when you request
          access or use the community, legitimate interests in operating and
          securing the service, consent where we ask for it, and legal
          obligations where applicable.
        </p>
      </Section>

      <Section title="Service providers">
        <p>
          We use trusted providers to operate the service. They process data
          only as needed to provide their services to us.
        </p>
        <BulletList
          items={[
            "Vercel for hosting, deployment, serverless API routes, and Open Graph image generation.",
            "Supabase for authentication, database records, member sessions, invite flows, and related backend services.",
            "Cloudflare R2 for member-uploaded media storage and public media delivery.",
            "Sentry for error monitoring, performance diagnostics, and issue investigation when configured.",
            "Google Fonts for loading web fonts used by the interface.",
            "LinkedIn and X when you click our social links or choose to publish those links on your profile.",
          ]}
        />
      </Section>

      <Section title="Cookies and local storage">
        <p>
          We currently use only strictly necessary cookies and local storage.
          These support login sessions, account security, upload access,
          interface preferences, and remembering that you have seen the cookie
          notice. When you save your cookie preference, we also keep a consent
          record in our Supabase database with the consent version, selected
          categories, timestamp, page path, IP address, user agent, and your
          account id if you are signed in. We do not currently use advertising
          cookies or analytics cookies.
        </p>
        <p>
          If we add optional analytics, marketing, or similar tracking later, we
          will update this policy and ask for consent before enabling those
          categories where required.
        </p>
        <button
          type="button"
          onClick={openCookieSettings}
          className="inline-flex h-9 items-center justify-center rounded-sm border border-zinc-800 px-3 text-xs font-semibold text-zinc-300 transition-colors hover:border-blue-500/60 hover:text-white"
        >
          Open cookie settings
        </button>
      </Section>

      <Section title="Public content">
        <p>
          Some profile and project information may be public depending on the
          visibility settings you choose and the product area you use. Do not
          add private or sensitive information to public profile fields, project
          pages, links, images, or videos.
        </p>
      </Section>

      <Section title="Retention">
        <p>
          We keep information for as long as needed to operate the community,
          maintain security, resolve disputes, comply with legal obligations,
          and preserve legitimate community records. You can ask us to delete or
          update personal information, subject to legal, security, and abuse
          prevention limits.
        </p>
      </Section>

      <Section title="International transfers">
        <p>
          Our providers may process information in countries other than where
          you live. Where required, we rely on appropriate safeguards such as
          data processing agreements, standard contractual clauses, and provider
          compliance programs.
        </p>
      </Section>

      <Section title="Your rights">
        <p>
          Depending on where you live, you may have rights to access, correct,
          delete, restrict, object to, or export your personal information. You
          may also have the right to withdraw consent where processing is based
          on consent.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          For privacy requests, contact us at{" "}
          <a
            className="text-blue-300 hover:text-blue-200"
            href={`mailto:${contactEmail}`}
          >
            {contactEmail}
          </a>
          .
        </p>
      </Section>
    </LegalShell>
  );
}

export function TermsOfServicePage() {
  return (
    <LegalShell
      eyebrow="Terms"
      title="Terms of Service"
      intro="These terms set the basic rules for using Italian Builders. They are intentionally simple while the community is still early."
    >
      <Section title="Using Italian Builders">
        <p>
          By accessing or using Italian Builders, you agree to these terms. If
          you do not agree, do not use the website or community features.
        </p>
      </Section>

      <Section title="Accounts and access">
        <BulletList
          items={[
            "Access may require an invite, account, or approval from an admin.",
            "You are responsible for keeping your account and login credentials secure.",
            "You must provide accurate information and keep it reasonably up to date.",
            "We may accept, reject, suspend, or remove access to protect the community or operate the service.",
          ]}
        />
      </Section>

      <Section title="Community rules">
        <BulletList
          items={[
            "Be respectful and do not harass, threaten, impersonate, or mislead others.",
            "Do not upload malware, spam, illegal content, or content that violates someone else's rights.",
            "Do not scrape, abuse, overload, reverse engineer, or interfere with the service.",
            "Do not use the community to send unsolicited commercial messages or deceptive promotions.",
          ]}
        />
      </Section>

      <Section title="Your content">
        <p>
          You keep ownership of content you submit, such as profiles, project
          descriptions, links, images, and videos. You give us permission to
          host, store, display, resize, transmit, and otherwise use that content
          as needed to operate and promote Italian Builders.
        </p>
        <p>
          You are responsible for the content you submit and for having the
          rights needed to share it.
        </p>
      </Section>

      <Section title="Public profiles and projects">
        <p>
          Some areas are designed to be visible publicly or to other members. If
          you publish profile or project information, it may be viewed, indexed,
          shared, or copied by others. Visibility settings help control display
          inside the product but are not a guarantee that already-published
          information cannot be seen elsewhere.
        </p>
      </Section>

      <Section title="Third-party services">
        <p>
          The service relies on third-party providers including Vercel,
          Supabase, Cloudflare, Sentry, Google Fonts, LinkedIn, and X. Their own
          terms and policies may apply when you interact with their services or
          when they process data to provide infrastructure to us.
        </p>
      </Section>

      <Section title="Availability">
        <p>
          Italian Builders is provided as an early-stage community service. We
          may change, pause, remove, or discontinue features at any time. We do
          not promise uninterrupted availability or that every feature will
          remain available.
        </p>
      </Section>

      <Section title="No warranties">
        <p>
          The service is provided "as is" and "as available". To the maximum
          extent allowed by law, we disclaim warranties of merchantability,
          fitness for a particular purpose, non-infringement, and uninterrupted
          or error-free operation.
        </p>
      </Section>

      <Section title="Limitation of liability">
        <p>
          To the maximum extent allowed by law, Italian Builders and its
          operators will not be liable for indirect, incidental, special,
          consequential, or punitive damages, or for lost profits, lost data, or
          business interruption arising from your use of the service.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          We may update these terms as the community and product evolve. The
          updated date at the top of this page shows when the latest version was
          published.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about these terms can be sent to{" "}
          <a
            className="text-blue-300 hover:text-blue-200"
            href={`mailto:${contactEmail}`}
          >
            {contactEmail}
          </a>
          .
        </p>
      </Section>
    </LegalShell>
  );
}
