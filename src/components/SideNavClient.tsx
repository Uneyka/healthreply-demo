'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Contact2, BedDouble, Settings, Search, Pill } from 'lucide-react';

function NavItem({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname.startsWith(href);
  return (
    <Link href={href} className={`nav-item ${active ? 'active' : ''}`}>
      {icon}
      <span>{children}</span>
    </Link>
  );
}

export default function SideNavClient() {
  return (
    <>
      <div className="p-6">
        <div className="text-2xl font-bold tracking-tight text-[color:var(--brand-900)]">
          HealthReply
        </div>
        <div className="text-sm text-[color:var(--brand-900)]/70 mt-1">Demo • Light Blue</div>
      </div>
      <nav className="px-3 space-y-1">
        <NavItem href="/dashboard" icon={<Search size={18} />}>Dashboard</NavItem>
        <NavItem href="/patients"  icon={<Users size={18} />}>Patienten</NavItem>
        <NavItem href="/medication" icon={<Pill size={18} />}>Medikamentenplan</NavItem>
        <NavItem href="/relatives" icon={<Contact2 size={18} />}>Angehörige</NavItem>
        <NavItem href="/rooms"     icon={<BedDouble size={18} />}>Zimmer</NavItem>
        <div className="my-2 border-t border-[color:var(--brand-300)]" />
        <NavItem href="/admin"     icon={<Settings size={18} />}>Admin</NavItem>
      </nav>
      <div className="mt-auto p-4 text-xs text-[color:var(--brand-900)]/60">v0.2 • Demo</div>
    </>
  );
}
