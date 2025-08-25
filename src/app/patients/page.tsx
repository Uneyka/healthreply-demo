// src/app/patients/page.tsx
import Link from "next/link"
import { Plus, Search } from "lucide-react"
import Badge from "@/components/Badge"
import { patients } from "@/data/patients"

export const revalidate = 0

function filterPatients(q: string | undefined, status: string | undefined) {
  const qn = (q ?? "").toLowerCase().trim()
  const s = (status ?? "").toLowerCase().trim()
  return patients.filter((p) => {
    const matchesQ =
      !qn ||
      p.fullName.toLowerCase().includes(qn) ||
      p.room?.toLowerCase().includes(qn)
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
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Patienten</h1>
        <Link
          href="/patients/new"
          className="inline-flex items-center gap-2 rounded-md bg-white/10 hover:bg-white/20 text-white px-3 py-2"
        >
          <Plus size={16} /> Neu anlegen
        </Link>
      </div>

      {/* Suche & Filter (GET-Form) */}
      <form className="mb-4 flex flex-wrap gap-2" method="get">
        <label className="relative">
          <input
            name="q"
            placeholder="Suche nach Name/Zimmer…"
            defaultValue={q ?? ""}
            className="pl-9 pr-3 py-2 rounded-md border bg-white w-72 text-gray-900"
          />
          <Search size={16} className="absolute left-2 top-2.5 text-gray-500" />
        </label>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="px-3 py-2 rounded-md border bg-white text-gray-900"
        >
          <option value="">Status: alle</option>
          <option value="aktiv">aktiv</option>
          <option value="inaktiv">inaktiv</option>
        </select>
        <button className="px-3 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">
          Filter anwenden
        </button>
        {(q || status) && (
          <Link
            href="/patients"
            className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 text-white"
          >
            Zurücksetzen
          </Link>
        )}
      </form>

      {/* Liste */}
      <div className="grid gap-3">
        {rows.map((p) => (
          <Link
            key={p.id}
            href={`/patients/${p.id}`}
            className="group rounded-xl border bg-white hover:bg-gray-50 transition p-4 flex items-center gap-4"
          >
            <img
              src={p.avatar}
              alt={p.fullName}
              className="h-12 w-12 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900">{p.fullName}</div>
              <div className="text-sm text-gray-600">
                Zimmer {p.room ?? "—"} • Geb. {p.birthDate ?? "—"}
              </div>
            </div>
            <div>
              {p.status === "aktiv" ? (
                <Badge tone="success">aktiv</Badge>
              ) : (
                <Badge tone="danger">inaktiv</Badge>
              )}
            </div>
          </Link>
        ))}

        {rows.length === 0 && (
          <div className="rounded-xl border border-dashed p-8 text-center text-gray-600 bg-white">
            Keine Treffer. Suchbegriff/Filter anpassen.
          </div>
        )}
      </div>
    </div>
  )
}
