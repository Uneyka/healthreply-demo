// src/app/dashboard/page.tsx
import Link from "next/link";
import { patients } from "@/data/patients";

/**
 * Demo-Dashboard mit vielen Widgets.
 * - keine Zusatzlibs nötig (alles CSS/HTML)
 * - Daten: einfache Ableitungen aus patients + Mock-Events
 * - kann später leicht angepasst/ausgedünnt werden
 */
export const dynamic = "force-static";

type FeedItem = {
  id: string;
  time: string;
  text: string;
  tone?: "ok" | "info" | "warn";
};

function Badge({ tone = "info", children }: { tone?: "ok" | "info" | "warn"; children: React.ReactNode }) {
  const cls =
    tone === "ok"
      ? "badge badge-green"
      : tone === "warn"
      ? "badge badge-red"
      : "badge badge-blue";
  return <span className={cls}>{children}</span>;
}

export default function Dashboard() {
  // Basiszahlen
  const total = patients.length;
  const active = patients.filter((p) => p.status === "aktiv").length;
  const inactive = total - active;
  const roomsUsed = new Set(patients.map((p) => p.room ?? "—")).size;

  // Demo-Feed (heute)
  const feed: FeedItem[] = [
    { id: "f1", time: "08:10", text: "Herr Meier war beim Spaziergang dabei.", tone: "ok" },
    { id: "f2", time: "09:30", text: "Frau Schulz: ruhiger Vormittag, Stimmung freundlich.", tone: "info" },
    { id: "f3", time: "11:50", text: "Zimmer 103: Termin für Frisör wurde bestätigt (14:00).", tone: "info" },
    { id: "f4", time: "12:40", text: "Frau Keller hat wenig gegessen – Beobachtung am Nachmittag.", tone: "warn" },
  ];

  // Schnelle Touren (Demo)
  const tours = patients
    .filter((p) => p.status === "aktiv")
    .map((p) => ({
      id: `t-${p.id}`,
      title: `Runde: ${p.fullName}`,
      items: ["Morgens", "Mittags", "Abends"],
      link: `/patients/${p.id}`,
    }));

  // Zimmerbelegung (kompakt)
  const byRoom: Record<string, string[]> = {};
  patients.forEach((p) => {
    const r = p.room ?? "—";
    byRoom[r] = byRoom[r] ? [...byRoom[r], p.fullName] : [p.fullName];
  });

  // Angehörige (Demo)
  const relatives = [
    { name: "Anna Meier (Tochter)", for: "Herr Meier", email: "anna@example.com" },
    { name: "Peter Schulz (Sohn)", for: "Frau Schulz", email: "peter@example.com" },
  ];

  // Systemstatus (Demo-Indikatoren)
  const systems = [
    { label: "E-Mail Versand", state: "OK" },
    { label: "Web-Ansicht", state: "OK" },
    { label: "Backups", state: "OK" },
  ];

  // „Belegungsquote“ (ganz grob)
  const occupancy = Math.min(100, Math.round((active / Math.max(1, roomsUsed)) * 100));

  return (
    <div className="space-y-8">
      <h1 className="h1">Dashboard</h1>

      {/* KPIs */}
      <section className="section">
        <div className="section-title">Übersicht</div>
        <div className="divider" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Bewohner gesamt" value={total} />
          <StatCard label="Aktive Bewohner" value={active} badge={<Badge tone="ok">aktiv</Badge>} />
          <StatCard label="Inaktive Bewohner" value={inactive} badge={<Badge tone="warn">inaktiv</Badge>} />
          <StatCard
            label="Belegungsquote (grobe Demo)"
            value={`${occupancy}%`}
            sub="Ø aktiv / Zimmer"
          />
        </div>
      </section>

      {/* Schnellzugriff */}
      <section className="section">
        <div className="section-title">Schnellzugriff</div>
        <div className="divider" />
        <div className="flex flex-wrap gap-2">
          <Link href="/patients" className="btn btn-primary">Patienten</Link>
          <Link href="/patients/new" className="btn btn-soft">Neuer Patient</Link>
          <Link href="/rooms" className="btn btn-soft">Zimmer</Link>
          <Link href="/relatives" className="btn btn-soft">Angehörige</Link>
        </div>
      </section>

      {/* Heute versendet / Ereignisse */}
      <section className="section grid gap-6 lg:grid-cols-2">
        <div className="card p-4">
          <div className="section-title">Heute versendet</div>
          <div className="divider" />
          <ul className="space-y-2">
            {feed.map((f) => (
              <li key={f.id} className="flex items-start gap-3 animate-fadein">
                <div className="text-xs text-slate-500 mt-1 w-12">{f.time}</div>
                <div className="flex-1">{f.text}</div>
                <Badge tone={f.tone}>{f.tone === "ok" ? "Info" : f.tone === "warn" ? "Hinweis" : "Update"}</Badge>
              </li>
            ))}
          </ul>
        </div>

        {/* Systemstatus + Tipps */}
        <div className="grid gap-6">
          <div className="card p-4">
            <div className="section-title">Systemstatus</div>
            <div className="divider" />
            <div className="grid sm:grid-cols-3 gap-3">
              {systems.map((s) => (
                <div key={s.label} className="card p-3 text-center">
                  <div className="text-sm muted">{s.label}</div>
                  <div className="mt-1 font-semibold">
                    <span className="badge badge-green">{s.state}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <div className="section-title">Hinweise</div>
            <div className="divider" />
            <ul className="list-disc ml-5 space-y-1 text-slate-700">
              <li>Demo zeigt nur Alltags-Infos, <b>keine Diagnosen / medizinischen Details</b>.</li>
              <li>E-Mails an Angehörige sind in dieser Demo simuliert.</li>
              <li>In der echten Version kann das Dashboard pro Einrichtung personalisiert werden.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Touren heute */}
      <section className="section">
        <div className="section-title">Touren heute</div>
        <div className="divider" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tours.map((t) => (
            <div key={t.id} className="card p-4">
              <div className="font-medium">{t.title}</div>
              <div className="muted text-sm">{t.items.join(" • ")}</div>
              <div className="mt-3">
                <Link className="btn btn-soft" href={t.link}>Zum Bewohner</Link>
              </div>
            </div>
          ))}
          {tours.length === 0 && (
            <div className="card-ghost p-6 text-slate-600 text-center">Keine aktiven Touren.</div>
          )}
        </div>
      </section>

      {/* Zimmerbelegung kompakt */}
      <section className="section">
        <div className="section-title">Zimmerbelegung</div>
        <div className="divider" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(byRoom).map(([room, names]) => (
            <div key={room} className="card p-4">
              <div className="font-medium">Zimmer {room}</div>
              <ul className="list-disc ml-5 text-slate-700">
                {names.map((n) => <li key={n}>{n}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Angehörige zuletzt aktiv */}
      <section className="section">
        <div className="section-title">Angehörige (Beispiel)</div>
        <div className="divider" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {relatives.map((r) => (
            <div key={r.email} className="card p-4">
              <div className="font-medium">{r.name}</div>
              <div className="muted text-sm">für {r.for}</div>
              <div className="mt-2 badge badge-blue">{r.email}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/** Kleine KPI-Karte */
function StatCard({
  label,
  value,
  sub,
  badge,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="card p-4 animate-popin">
      <div className="muted text-sm">{label}</div>
      <div className="text-3xl font-extrabold tracking-tight">{value}</div>
      <div className="mt-1 flex items-center gap-2">
        {badge}
        {sub && <span className="text-xs muted">{sub}</span>}
      </div>
    </div>
  );
}
