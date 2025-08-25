import './globals.css';
import Link from 'next/link';
import SideNavClient from '@/components/SideNavClient';

export const metadata = { title: 'HealthReply', description: 'Demo' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body>
        <div className="min-h-screen flex">
          <aside className="sidebar">
            <SideNavClient />
          </aside>

          <main className="flex-1">
            <div className="topbar">
              <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
                <div className="h2">Pflege-Dashboard</div>
                <div className="flex items-center gap-2">
                  <input placeholder="Suchen…" className="input" />
                  <Link href="/patients/new" className="btn btn-primary">Neuer Patient</Link>
                </div>
              </div>
            </div>
            <div className="mx-auto max-w-6xl p-6">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
