import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'

export default function NewPatientPage() {
  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/patients" className="btn btn-soft">
          <ArrowLeft size={16}/> Zurück
        </Link>
        <h1 className="text-3xl font-semibold">Neuer Patient (Demo)</h1>
      </div>

      <div className="card p-5 space-y-4">
        <div>
          <label className="label">Voller Name</label>
          <input className="input w-full" placeholder="z. B. Frau Beispiel"/>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Zimmer</label>
            <input className="input w-full" placeholder="101"/>
          </div>
          <div>
            <label className="label">Geburtsdatum</label>
            <input type="date" className="input w-full"/>
          </div>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="select w-full">
            <option>aktiv</option>
            <option>inaktiv</option>
          </select>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="text-sm text-slate-600">Hinweis: In der Demo wird nichts gespeichert.</div>
          <button className="btn btn-primary"><Save size={16}/> Speichern</button>
        </div>
      </div>
    </div>
  )
}
