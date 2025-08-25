import "./globals.css";
import type { Metadata } from "next";
import SideNavClient from "@/components/SideNavClient";

export const metadata: Metadata = {
  title: "PflegeNetz",
  description: "Demo Pflegeplattform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="flex">
        {/* Sidebar */}
        <SideNavClient />

        {/* Main Content */}
        <main className="flex-1 min-h-screen bg-slate-50 p-6">
          {children}
        </main>
      </body>
    </html>
  );
}
