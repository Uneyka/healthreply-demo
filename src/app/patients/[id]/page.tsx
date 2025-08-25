'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { patients } from '@/data/patients'

type TabKey = 'stammdaten' | 'angehoerige' | 'akte'

export default function PatientDetailPage(){
  const { id } = useParams<{id:string}>()
  const router = useRouter()
  const p = useMemo(()=>patients.find(x=>x.id===String(id)), [id])

  const [tab, setTab] = useState<TabKey>('stammdaten')

  if (!p) {
    return (
      <div className="space-y-4">
        <Link href="/patients" className="btn btn-soft">Zurück</Link>
        <div className="card p-6">Patient nicht gefunden.</div>
      </div>
    )
  }

  // Demo-Akte: feste Einträge + aus localStorage (falls vorhanden)
  const key = `akte-${p.id}`
  const customEntries: Array<{ts:string; text:string}> = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem(key) || '[]')
    : []
  const akte = [
    { ts: 'Heute 12:40', text: `${p.fullName.split(' ')[0]} hat wenig gegessen – Beobachtung am Nachmittag.` },
    { ts: 'Heute 09:30', text: `Ruhiger Vormittag, Stimmung freundlich.` },
    { ts: 'Gestern 18:05', text: `Abendliche Gymnastik, danach ruhig geschlafen.` },
    ...customEntries
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src={p.avatar} className="h-16 w-16 rounded-full object-cover" alt={p.fullName}/>
          <div>
            <h1 className="h1">{p.fullName}</h1>
            <div className="text-sm text-slate-600">Zimmer {p.room ?? '—'} • Geb. {p.birthDate ?? '—'}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/medication?resident=${p.id}`} className="btn btn-soft">Zum Medikamentenplan</Link>
          <Link href="/patients" className="btn btn-soft">Zurück</Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="card p-3">
        <div className="flex gap-2">
          <TabButton active={tab==='stammdaten'} onClick={()=>setTab('stammdaten')}>Stammdaten</TabButton>
          <TabButton active={tab==='angehoerige'} onClick={()=>setTab('angehoerige')}>Angehörige</TabButton>
          <TabButton active={tab==='akte'} onClick={()=>setTab('akte')}>Patientenakte</TabButton>
        </div>
      </div>

      {/* Content */}
      {tab==='stammdaten' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-4">
            <h2 className="h2">Versicherung</h2>
            <div className="divider"></div>
            <Info label="Krankenkasse" value={p.insuranceName}/>
            <Info label="Versichertennummer" value={p.insuranceId}/>
            <Info label="Hausarzt" value={p.primaryPhysician}/>
          </div>
          <div className="card p-4">
            <h2 className="h2">Gesundheit</h2>
            <div className="divider"></div>
            <Info label="Ernährung" value={p.diet}/>
            <Info label="Allergien" value={p.allergies?.length ? p.allergies.join(', ') : '—'}/>
            <Info label="Notizen" value={p.notes}/>
          </div>
        </div>
      )}

      {tab==='angehoerige' && (
        <div className="card p-4">
          <h2 className="h2">Verknüpfte Angehörige</h2>
          <div className="divider"></div>

          {/* Aktion oben: Verknüpfen */}
          <div className="mb-3 flex flex-wrap gap-2">
            <Link className="btn btn-primary" href={`/relatives`}>Angehörige verknüpfen</Link>
          </div>

          {/* Liste */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {p.relatives?.length
              ? p.relatives.map((r, i) => (
                  <div key={i} className="card p-3">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-sm text-slate-600">{r.relation ?? 'Angehörige:r'}</div>
                    {r.email && <div className="mt-1 badge badge-blue">{r.email}</div>}
                  </div>
                ))
              : <div className="text-slate-600">Keine Angehörigen hinterlegt.</div>}
          </div>
        </div>
      )}

      {tab==='akte' && (
        <div className="card p-4">
          <h2 className="h2">Patientenakte (Demo, unveränderbar)</h2>
          <div className="divider"></div>
          <ul className="space-y-3">
            {akte.map((e, idx) => (
              <li key={idx} className="animate-fadein">
                <div className="text-xs text-slate-500">{e.ts}</div>
                <div>{e.text}</div>
              </li>
            ))}
          </ul>

          {/* Demo: neuen Eintrag simulieren */}
          <div className="mt-4">
            <button
              className="btn btn-primary"
              onClick={()=>{
                const t = prompt('Kurzen Akteneintrag formulieren (wird der Demo-Akte hinzugefügt):')
                if (!t) return
                const now = new Date()
                const ts = now.toLocaleDateString('de-DE') + ' ' + now.toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit'})
                const next = [{ts, text: t}, ...customEntries]
                localStorage.setItem(key, JSON.stringify(next))
                window.location.reload()
              }}
            >
              Neuen Akteneintrag hinzufügen (Demo)
            </button>
            <div className="text-xs text-slate-500 mt-2">
              Hinweis: In der echten Version wird die Akte revisionssicher gespeichert (unlöschbar, unveränderbar).
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TabButton({active, children, onClick}:{active:boolean; children:React.ReactNode; onClick:()=>void}) {
  return (
    <button
      className={`px-3 py-2 rounded-lg ${active ? 'bg-[color:var(--brand-200)] text-[color:var(--brand-900)]' : 'bg-white text-slate-700'} border border-slate-200`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  )
}

function Info({label, value}:{label:string; value?:string|null}) {
  return (
    <div className="py-2">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="font-medium">{value || '—'}</div>
    </div>
  )
}
