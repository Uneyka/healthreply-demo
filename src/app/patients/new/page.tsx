import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

export default function NewPatientPage() {
  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/patients" className="inline-flex items-center gap-2 text-white/80 hover:text-white">
          <ArrowLeft size={16}/> Zurück
        </Link>
        <h1 className="text-2xl font-semibold">Neuer Patient (Demo)</h1>
      </div>

      <div className="rounded-xl border bg-white p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Voller Name</label>
          <input className="w-full rounded-md border px-3 py-2" placeholder="z. B. Frau Beispiel"/>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Zimmer</label>
            <input className="w-full rounded-md border px-3 py-2" placeholder="101"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1">Geburtsdatum</label>
            <input type="date" className="w-full rounded-md border px-3 py-2"/>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-1">Status</label>
          <select className="w-full rounded-md border px-3 py-2">
            <option>aktiv</option>
            <option>inaktiv</option>
          </select>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-gray-600">Hinweis: In der Demo wird nichts gespeichert.</div>
          <button className="inline-flex items-center gap-2 rounded-md bg-red-600 text-white px-4 py-2 hover:bg-red-700">
            <Save size={16}/> Speichern
          </button>
        </div>
      </div>
    </div>
  )
}
