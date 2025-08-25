// src/app/layout.tsx (oder app/layout.tsx)
import './globals.css'
import Link from 'next/link'
import { Users, Contact2, Map, BedDouble, Settings } from 'lucide-react'

export const metadata = { title: 'HealthReply', description: 'Demo' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <div className="flex min-h-screen">
          <aside className="w-64 bg-white border-r">
            <div className="p-4 font-semibold text-lg">HealthReply</div>
            <nav className="px-2 space-y-1">
              <NavItem href="/patients" icon={<Users size={18}/>}>Patienten</NavItem>
              <NavItem href="/relatives" icon={<Contact2 size={18}/>}>Angehörige</NavItem>
              <NavItem href="/tours" icon={<Map size={18}/>}>Touren</NavItem>
              <NavItem href="/rooms" icon={<BedDouble size={18}/>}>Zimmer</NavItem>
              <div className="pt-2 mt-2 border-t" />
              <NavItem href="/admin" icon={<Settings size={18}/>}>Admin</NavItem>
            </nav>
          </aside>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  )
}

function NavItem({ href, icon, children }:{
  href:string; icon:React.ReactNode; children:React.ReactNode
}) {
  return (
    <Link href={href} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100">
      {icon}<span>{children}</span>
    </Link>
  )
}
