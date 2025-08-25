import Link from "next/link";
import { patients } from "@/data/patients";

export const dynamic = "force-static";

export default function Dashboard() {
  const total = patients.length;
  const active = patients.filter(p => p.status === "aktiv").length;
  const inactive = total - active;

  return (
    <div className="space-y-8">
      <h1 className="h1">Dashboard</h1>

      {/* Kennzahlen */}
      <section className="section">
        <div className="section-title">
          <span>Übersicht</span>
        </div>
        <div className="divider" />
        <div className="stats sm:grid-cols-2 lg:grid-cols-3">
          <div className="card stat">
            <div className="icon" />
            <div>
              <div className="label">Bewohner gesamt</div>
              <div className="value">{total}</div>
            </div>
          </div>
          <div className="card stat">
            <div className="icon" />
            <div>
              <div className="label">Aktive Bewohner</div>
              <div className="value">{active}</div>
            </div>
          </div>
          <div className="card stat">
            <div className="icon" />
            <div>
              <div className="label">Inaktive Bewohner</div>
              <div className="value">{inactive}</div>
            </div>
          </div>
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
    </div>
  );
}
