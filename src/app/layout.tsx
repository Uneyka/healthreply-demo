import type { Metadata } from "next";
import SideNavClient from "@/components/SideNavClient";
import "./globals.css"; // nur normales CSS, KEINE @tailwind-Direktiven mehr

export const metadata: Metadata = {
  title: "PflegeNetz",
  description: "Demo Pflegeplattform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <head>
        {/* Tailwind CDN: dauerhaft (Demo-stabil) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind = {
                theme: {
                  extend: {
                    colors: {
                      brand: {
                        50:  '#f0f9ff',
                        100: '#e0f2fe',
                        200: '#bae6fd',
                        300: '#7dd3fc',
                        400: '#38bdf8',
                        500: '#0ea5e9',
                        600: '#0284c7',
                        700: '#0369a1',
                        800: '#075985',
                        900: '#0c4a6e',
                      }
                    },
                    borderRadius: {
                      '3xl': '1.5rem'
                    }
                  }
                }
              }
            `,
          }}
        />
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="flex bg-slate-50 text-slate-800">
        <SideNavClient />
        <main className="flex-1 min-h-screen p-6">{children}</main>
      </body>
    </html>
  );
}
