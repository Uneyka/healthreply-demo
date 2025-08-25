// src/app/layout.tsx
import './globals.css'
import Link from 'next/link'
import { Users, Contact2, Map, BedDouble, Settings } from 'lucide-react'

export const metadata = {
  title: 'HealthReply',
  description: 'Demo'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-red-600 text-white">
            <div className="p-5 text-xl font-bold tracking-tight">HealthReply</div>
            <nav className="px-2 pb-4 space-y-1">
              <NavItem href="/patients" icon={<Users size={18} />}>Patienten</NavItem>
              <NavItem href="/relatives" icon={<Contact2 size={18} />}>Angehörige</NavItem>
              <NavItem href="/tours" icon={<Map size={18} />}>Touren</NavItem>
              <NavItem href="/rooms" icon={<BedDouble size={18} />}>Zimmer</NavItem>

              <div className="mt-3 border-t border-red-500/40" />

              <NavItem href="/admin" icon={<Settings size={18} />}>Admin</NavItem>
            </nav>
          </aside>

          {/* Inhalt */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}

function NavItem({
  href,
  icon,
  children
}: {
  href: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-white/90 hover:bg-red-700 hover:text-white transition-colors"
    >
      {icon}
      <span>{children}</span>
    </Link>
  )
}
