import Link from 'next/link';

const sections = [
  {
    title: 'Current status',
    body: 'Rova is configured as a narrow Arc Mainnet release candidate. The owner must still deploy and verify it. All fund-moving execution remains disabled.',
  },
  {
    title: 'Security model',
    body: 'Server-side sessions, owner-scoped records, explicit execution gates, bounded actions, and separate autonomous authorization protect the current mainnet environment.',
  },
  {
    title: 'Receipts and history',
    body: 'Arc explorer transactions and durable server-side records are evidence. Browser-local History entries are convenience state and are not auditable receipts.',
  },
  {
    title: 'Road to execution',
    body: 'Production custody, money movement, automation, swaps, bridging, and yield require independent security review, venue diligence, operational monitoring, and a separately approved release.',
  },
];

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-text-primary">
      <div className="mx-auto max-w-4xl space-y-10">
        <header className="space-y-4">
          <Link href="/" className="text-sm font-semibold text-accent-primary hover:underline">
            ← Back to Rova
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-primary">Project Documentation</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Rova release posture</h1>
          <p className="max-w-3xl text-lg leading-8 text-text-secondary">
            A truthful overview of the Arc Mainnet release candidate and the gates required before production custody or transaction execution.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <article key={section.title} className="rounded-2xl border border-border bg-surface p-6">
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="mt-3 leading-7 text-text-secondary">{section.body}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-border-strong bg-surface-raised p-6">
          <h2 className="text-xl font-semibold">Safe mainnet release</h2>
          <p className="mt-3 leading-7 text-text-secondary">
            Keep every execution flag disabled for this release. Never place private keys, Circle secrets, database service keys, or WhatsApp credentials in source control or support messages.
          </p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold">
            <a
              href="https://github.com/Eloenk/rova/blob/master/SECURITY_OPERATIONS.md"
              target="_blank"
              rel="noreferrer"
              className="text-accent-primary hover:underline"
            >
              Security and operating gates
            </a>
            <a
              href="https://docs.arc.io"
              target="_blank"
              rel="noreferrer"
              className="text-accent-primary hover:underline"
            >
              Arc network documentation
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
