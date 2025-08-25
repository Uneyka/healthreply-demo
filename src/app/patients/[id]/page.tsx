import { patients } from "@/data/patients"
import Link from "next/link"
import Badge from "@/components/Badge"
import StatusForm from "@/components/StatusForm"
import { ArrowLeft, CalendarDays } from "lucide-react"

export default async function PatientDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const p = patients.find((x) => x.id === id)

  if (!p) {
    return (
      <div className="space-y-4">
        <Link href="/patients" className="btn btn-soft">
          <ArrowLeft size={16}/> Zurück
        </Link>
        <div className="card p-6">Patient nicht gefunden.</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src={p.avatar} alt={p.fullName} className="h-16 w-16 rounded-full object-cover"/>
          <div>
            <h1 className="text-3xl font-semibold">{p.fullName}</h1>
            <div className="text-sm text-slate-600">Zimmer {p.room ?? "—"} • Geb. {p.birthDate ?? "—"}</div>
          </div>
        </div>
        <div>{p.status === "aktiv" ? <Badge tone="success">aktiv</Badge> : <Badge tone="danger">inaktiv</Badge>}</div>
      </div>

      {p.notes && (
        <div className="card p-4">
          <div className="text-sm text-slate-500 mb-1">Notizen</div>
          <div>{p.notes}</div>
        </div>
      )}

      <StatusForm name={p.fullName} />

      <div className="card p-4">
        <div className="flex items-center gap-2 text-slate-700 mb-2">
          <CalendarDays size={16}/> <span className="font-medium">Nachrichten (Demo)</span>
        </div>
        <ul className="list-disc ml-5 space-y-1">
          <li>Heute: „{p.fullName.split(' ')[0]} hat gut gegessen und war beim Spaziergang mit dabei.“</li>
          <li>Gestern: „Ruhiger Tag, Stimmung freundlich.“</li>
        </ul>
      </div>

      <Link href="/patients" className="btn btn-soft"><ArrowLeft size={16}/> Zurück zur Liste</Link>
    </div>
  )
}
