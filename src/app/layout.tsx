// src/app/layout.tsx
import "./globals.css";
import Link from "next/link";
import type { Metadata, Viewport } from "next";
import { Users, Contact2, Map, BedDouble, Settings } from "lucide-react";

export const metadata: Metadata = {
  title: "HealthReply",
  description: "Demo",
};
export const viewport: Viewport = { themeColor: "#ffffff" };

function NavItem({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="antialiased">
        <header className="border-b">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-semibold text-lg">HealthReply</Link>
            <nav aria-label="Hauptnavigation" className="flex items-center gap-1">
              <NavItem href="/residents" icon={<Users size={18} />}>Bewohner</NavItem>
              <NavItem href="/relatives" icon={<Contact2 size={18} />}>Angehörige</NavItem>
              <NavItem href="/wards" icon={<Map size={18} />}>Stationen</NavItem>
              <NavItem href="/rooms" icon={<BedDouble size={18} />}>Zimmer</NavItem>
              <NavItem href="/settings" icon={<Settings size={18} />}>Einstellungen</NavItem>
            </nav>
          </div>
        </header>
        <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
      </body>
    </html>
  );
}
