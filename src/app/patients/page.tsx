import Link from "next/link"
import { Plus, Search } from "lucide-react"
import Badge from "@/components/Badge"
import { patients } from "@/data/patients"

export const revalidate = 0

function filterPatients(q: string | undefined, status: string | undefined) {
  const qn = (q ?? "").toLowerCase().trim()
  const s = (status ?? "").toLowerCase().trim()
  return patients.filter((p) => {
    const matchesQ = !qn || p.fullName.toLowerCase().includes(qn) || p.room?.toLowerCase().includes(qn)
    const matchesS = !s || p.status === s
    return matchesQ && matchesS
  })
}

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: "aktiv" | "inaktiv" }>
}) {
  const { q, status } = await searchParams
  const rows = filterPatients(q, status)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Patienten</h1>
        <Link href="/patients/new" className="btn btn-primary">
          <Plus size={16}/> Neu anlegen
        </Link>
      </div>

      <form className="flex flex-wrap gap-2" method="get">
        <label className="relative">
          <input name="q" placeholder="Suche nach Name/Zimmer…" defaultValue={q ?? ""} className="input pl-9 w-80" />
          <Search size={16} className="absolute left-2 top-2.5 text-slate-500"/>
        </label>
        <select name="status" defaultValue={status ?? ""} className="select">
          <option value="">Status: alle</option>
          <option value="aktiv">aktiv</option>
          <option value="inaktiv">inaktiv</option>
        </select>
        <button className="btn btn-soft">Filter anwenden</button>
        {(q || status) && (
          <Link href="/patients" className="btn btn-soft">Zurücksetzen</Link>
        )}
      </form>

      <div className="grid gap-3">
        {rows.map((p) => (
          <Link key={p.id} href={`/patients/${p.id}`} className="card p-4 hover:shadow transition flex items-center gap-4">
            <img src={p.avatar} alt={p.fullName} className="h-12 w-12 rounded-full object-cover"/>
            <div className="flex-1">
              <div className="font-medium">{p.fullName}</div>
              <div className="text-sm text-slate-600">Zimmer {p.room ?? "—"} • Geb. {p.birthDate ?? "—"}</div>
            </div>
            <div>{p.status === "aktiv" ? <Badge tone="success">aktiv</Badge> : <Badge tone="danger">inaktiv</Badge>}</div>
          </Link>
        ))}
        {rows.length === 0 && (
          <div className="card p-8 text-center text-slate-600 border-dashed">Keine Treffer. Suchbegriff/Filter anpassen.</div>
        )}
      </div>
    </div>
  )
}
