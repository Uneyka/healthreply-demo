import { patients } from "@/data/patients"
import Link from "next/link"
import Badge from "@/components/Badge"
import { ArrowLeft, CalendarDays, Pencil } from "lucide-react"

export default function PatientDetail({ params }:{ params: { id: string }}) {
  const p = patients.find(x => x.id === params.id)
  if (!p) {
    return (
      <div className="p-6">
        <Link href="/patients" className="inline-flex items-center gap-2 text-white/80 hover:text-white">
          <ArrowLeft size={16}/> Zurück
        </Link>
        <div className="mt-6 rounded-xl border bg-white p-6">Patient nicht gefunden.</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src={p.avatar} alt={p.fullName} className="h-16 w-16 rounded-full object-cover"/>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{p.fullName}</h1>
            <div className="text-sm text-gray-600">Zimmer {p.room ?? "—"} • Geb. {p.birthDate ?? "—"}</div>
          </div>
        </div>
        <div>
          {p.status === "aktiv" ? <Badge tone="success">aktiv</Badge> : <Badge tone="danger">inaktiv</Badge>}
        </div>
      </div>

      {p.notes && (
        <div className="rounded-xl border bg-white p-4">
          <div className="text-sm text-gray-500 mb-1">Notizen</div>
          <div className="text-gray-800">{p.notes}</div>
        </div>
      )}

      <div className="rounded-xl border bg-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-medium text-gray-900">Tageskarte (Demo)</div>
          <button className="inline-flex items-center gap-2 rounded-md bg-red-600 text-white px-3 py-1.5 hover:bg-red-700">
            <Pencil size={16}/> Status erfassen
          </button>
        </div>
        <div className="text-sm text-gray-600">
          Hier kommt gleich die schnelle Erfassung (Schlaf, Essen, Aktivität, Stimmung) mit Vorschau der Nachricht.
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center gap-2 text-gray-700 mb-2">
          <CalendarDays size={16}/> <span className="font-medium">Nachrichten (Demo)</span>
        </div>
        <ul className="list-disc ml-5 space-y-1 text-gray-800">
          <li>Heute: „Herr Meier hat gut gegessen und war beim Spaziergang mit dabei.“</li>
          <li>Gestern: „Ruhiger Tag, Stimmung freundlich.“</li>
        </ul>
      </div>

      <Link href="/patients" className="inline-flex items-center gap-2 text-white/80 hover:text-white">
        <ArrowLeft size={16}/> Zurück zur Liste
      </Link>
    </div>
  )
}
