import Link from 'next/link';

const sections = [
  {
    title: 'Current status',
    body: 'Rova is a testnet prototype. Manual custody actions and autonomous execution are disabled by default, and no mainnet release is authorized.',
  },
  {
    title: 'Security model',
    body: 'Server-side sessions, owner-scoped records, explicit execution gates, bounded actions, and separate autonomous authorization protect the current testnet environment.',
  },
  {
    title: 'Receipts and history',
    body: 'ArcScan transactions and durable server-side execution records are evidence. Browser-local History entries are convenience state and are not auditable receipts.',
  },
  {
    title: 'Road to mainnet',
    body: 'Identity and custody, a shared policy schema, durable receipts, monitoring, a reviewed yield venue, independent security review, and a controlled deployment must be completed first.',
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
            A truthful overview of what is available today and the gates required before production custody or Arc mainnet deployment.
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
          <h2 className="text-xl font-semibold">Safe testnet use</h2>
          <p className="mt-3 leading-7 text-text-secondary">
            Keep execution flags disabled except during an approved, bounded rehearsal. Never place private keys, Circle secrets, database service keys, or WhatsApp credentials in source control or support messages.
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
              href="https://docs.arc.network"
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
