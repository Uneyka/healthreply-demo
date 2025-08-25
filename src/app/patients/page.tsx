'use client'

import Link from "next/link"
import { useMemo, useState } from "react"
import { patients as seed } from "@/data/patients"

function StatusBadge({status}:{status:'aktiv'|'inaktiv'}) {
  return (
    <span className={status==='aktiv' ? 'badge badge-green' : 'badge badge-red'}>
      {status}
    </span>
  )
}

export default function PatientsPage(){
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')

  const rows = useMemo(()=>{
    const qn = q.toLowerCase().trim()
    const s = status.toLowerCase().trim()
    return seed.filter(p => {
      const matchesQ =
        !qn ||
        p.fullName.toLowerCase().includes(qn) ||
        (p.room||'').toLowerCase().includes(qn) ||
        (p.insuranceName||'').toLowerCase().includes(qn)
      const matchesS = !s || p.status===s
      return matchesQ && matchesS
    })
  }, [q, status])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="h1">Patienten</h1>
        <Link href="/patients/new" className="btn btn-primary">Neu anlegen</Link>
      </div>

      {/* Filter */}
      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <label className="block">
          <div className="label">Suche (Name/Zimmer/Kasse)</div>
          <input className="input w-80" placeholder="z. B. Meier / 101 / AOK" value={q} onChange={e=>setQ(e.target.value)}/>
        </label>
        <label className="block">
          <div className="label">Status</div>
          <select className="select w-48" value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="">alle</option>
            <option value="aktiv">aktiv</option>
            <option value="inaktiv">inaktiv</option>
          </select>
        </label>
        { (q || status) && (
          <button className="btn btn-soft" onClick={()=>{ setQ(''); setStatus(''); }}>Zurücksetzen</button>
        )}
      </div>

      {/* Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map(p => (
          <Link key={p.id} href={`/patients/${p.id}`} className="card p-4 hover:shadow transition animate-popin">
            <div className="flex items-center gap-4">
              <img src={p.avatar} alt={p.fullName} className="h-14 w-14 rounded-full object-cover"/>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{p.fullName}</div>
                  <StatusBadge status={p.status}/>
                </div>
                <div className="text-sm text-slate-600">
                  Zimmer {p.room ?? '—'} • Geb. {p.birthDate ?? '—'}
                </div>
                <div className="text-sm text-slate-600">
                  {p.insuranceName ? `Kasse: ${p.insuranceName}` : '—'}{p.insuranceId ? ` • ${p.insuranceId}` : ''}
                </div>
              </div>
            </div>
            {/* Untere Zeile */}
            <div className="mt-3 flex flex-wrap gap-2">
              {p.diet && <span className="badge badge-blue">{p.diet}</span>}
              {p.allergies && p.allergies.slice(0,2).map(a => <span key={a} className="badge badge-red">{a}</span>)}
              {p.relatives && p.relatives[0] && (
                <span className="badge bg-slate-100 text-slate-700">
                  {p.relatives[0].name}{p.relatives.length>1 ? ` +${p.relatives.length-1}` : ''}
                </span>
              )}
            </div>
          </Link>
        ))}
        {rows.length===0 && (
          <div className="card p-8 text-center text-slate-600 border-dashed">Keine Treffer. Suchbegriff/Filter anpassen.</div>
        )}
      </div>
    </div>
  )
}
