"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  Pill,
  BedDouble,
  Calendar,
  Mail,
  MessageCircle,
  Settings,
  Briefcase,
} from "lucide-react";

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
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
        active
          ? "bg-[color:var(--brand-200)] text-[color:var(--brand-900)] font-semibold"
          : "text-slate-700 hover:bg-[color:var(--brand-100)]"
      }`}
    >
      <span className="w-5 h-5">{icon}</span>
      <span>{children}</span>
    </Link>
  );
}

export default function SideNavClient() {
  return (
    <aside className="w-64 bg-[color:var(--brand-50)] h-screen flex flex-col border-r">
      {/* Logo + Branding */}
      <div className="flex items-center gap-3 px-4 py-4 border-b">
        <Image
          src="/logo.png"
          alt="PflegeNetz Logo"
          width={36}
          height={36}
          className="rounded-md"
        />
        <span className="font-bold text-lg text-[color:var(--brand-800)]">
          PflegeNetz
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        <NavItem href="/" icon={<LayoutDashboard size={18} />}>
          Dashboard
        </NavItem>
        <NavItem href="/patients" icon={<Users size={18} />}>
          Patienten
        </NavItem>
        <NavItem href="/relatives" icon={<Users size={18} />}>
          Angehörige
        </NavItem>
        <NavItem href="/medication" icon={<Pill size={18} />}>
          Medikamentenplan
        </NavItem>
        <NavItem href="/rooms" icon={<BedDouble size={18} />}>
          Zimmer
        </NavItem>
        <NavItem href="/calendar" icon={<Calendar size={18} />}>
          Kalender
        </NavItem>
        <NavItem href="/roster" icon={<Briefcase size={18} />}>
          Dienstplan
        </NavItem>
        <NavItem href="/mail" icon={<Mail size={18} />}>
          E-Mail
        </NavItem>
        <NavItem href="/whatsapp" icon={<MessageCircle size={18} />}>
          WhatsApp
        </NavItem>
        <NavItem href="/admin" icon={<Settings size={18} />}>
          Admin
        </NavItem>
      </nav>
    </aside>
  );
}
