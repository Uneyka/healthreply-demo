"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Pill, BedDouble, Calendar, Mail, MessageCircle, Settings, Briefcase } from "lucide-react";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-4 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{children}</div>;
}

function NavItem({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 mx-2 px-3 py-2 rounded-lg text-sm transition-colors ${
        active ? "bg-sky-200/70 text-sky-900 font-semibold" : "text-slate-700 hover:bg-sky-100"
      }`}
    >
      <span className="w-5 h-5 shrink-0">{icon}</span>
      <span className="truncate">{children}</span>
    </Link>
  );
}

export default function SideNavClient() {
  return (
    <aside className="w-64 bg-sky-100 h-screen flex flex-col rounded-r-3xl shadow-md border-r border-sky-200">
      <div className="px-4 py-4 border-b border-sky-200">
        <div className="font-bold text-lg text-sky-800 leading-tight">PflegeNetz</div>
        <div className="text-[11px] text-slate-600">Demo • Light Blue</div>
      </div>

      <nav className="flex-1 py-2">
        <SectionLabel>Übersicht</SectionLabel>
        <NavItem href="/" icon={<LayoutDashboard size={16} />}>Dashboard</NavItem>

        <SectionLabel>Bewohner</SectionLabel>
        <NavItem href="/patients" icon={<Users size={16} />}>Patienten</NavItem>
        <NavItem href="/relatives" icon={<Users size={16} />}>Angehörige</NavItem>
        <NavItem href="/medication" icon={<Pill size={16} />}>Medikamentenplan</NavItem>
        <NavItem href="/rooms" icon={<BedDouble size={16} />}>Zimmer</NavItem>

        <SectionLabel>Planung</SectionLabel>
        <NavItem href="/calendar" icon={<Calendar size={16} />}>Kalender</NavItem>
        <NavItem href="/roster" icon={<Briefcase size={16} />}>Dienstplan</NavItem>

        <SectionLabel>Kommunikation</SectionLabel>
        <NavItem href="/mail" icon={<Mail size={16} />}>E-Mail</NavItem>
        <NavItem href="/whatsapp" icon={<MessageCircle size={16} />}>WhatsApp</NavItem>

        <div className="my-3 mx-4 border-t border-sky-200" />

        <SectionLabel>Verwaltung</SectionLabel>
        <NavItem href="/admin" icon={<Settings size={16} />}>Admin</NavItem>
      </nav>

      <div className="px-4 py-3 text-[11px] text-slate-600 border-t border-sky-200">v0.2 • Demo</div>
    </aside>
  );
}
