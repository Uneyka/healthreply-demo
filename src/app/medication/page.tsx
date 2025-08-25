'use client'

import { useEffect, useMemo, useState } from 'react'
import { patients } from '@/data/patients'
import { medications as seedMeds } from '@/data/medications'
import type { Medication, DoseTime, StellenEvent } from '@/types/medication'
import Link from 'next/link'

const LS_PLAN = 'hr_med_plan_v1'
const LS_STELL = 'hr_med_stellen_v1'

function uid(p='id'){ return p + '-' + Math.random().toString(36).slice(2,9) }
function todayStr(d=new Date()){ return d.toISOString().slice(0,10) }
const SHIFTS = ['Früh','Spät','Nacht'] as const
const TIMES: DoseTime[] = ['morgens','mittags','abends','nachts']

export default function MedicationPage(){
  // localStorage Plan + Events
  const [plan, setPlan] = useState<Medication[]>([])
  const [events, setEvents] = useState<StellenEvent[]>([])

  useEffect(()=>{
    const base = localStorage.getItem(LS_PLAN)
    setPlan(base ? JSON.parse(base) : seedMeds)
    const ev = localStorage.getItem(LS_STELL)
    setEvents(ev ? JSON.parse(ev) : [])
  },[])
  useEffect(()=>{ if (plan.length) localStorage.setItem(LS_PLAN, JSON.stringify(plan)) },[plan])
  useEffect(()=>{ localStorage.setItem(LS_STELL, JSON.stringify(events)) },[events])

  // Filter
  const [date, setDate] = useState(todayStr())
  const [shift, setShift] = useState<'Früh'|'Spät'|'Nacht'>('Früh')
  const [resident, setResident] = useState('')  // patient id

  // Abgeleiteter Tagesplan
  const daily = useMemo(()=>{
    const list = resident ? plan.filter(m => m.residentId===resident) : plan
    // Zu jeder Med alle geplanten Zeiten an dem Tag -> Zeilen
    const rows = list.flatMap(m => (m.times.length ? m.times : [null]).map(t => ({ med:m, time:t as DoseTime|null })))
    return rows
  },[plan, resident])

  // „gestellt“ Status lookup
  function isPrepared(pid:string, mid:string, time:DoseTime|null){
    if(!time) return false
    return events.some(e => e.date===date && e.shift===shift && e.residentId===pid && e.medicationId===mid && e.time===time && e.prepared)
  }
  function togglePrepared(pid:string, mid:string, time:DoseTime|null){
    if(!time) return
    const exists = events.find(e => e.date===date && e.shift===shift && e.residentId===pid && e.medicationId===mid && e.time===time)
    if (exists) {
      const upd = { ...exists, prepared: !exists.prepared, at:new Date().toISOString() }
      setEvents(prev => prev.map(x => x.id===exists.id ? upd : x))
    } else {
      const ev: StellenEvent = { id: uid('se'), date, shift, residentId: pid, medicationId: mid, time, prepared: true, at: new Date().toISOString() }
      setEvents(prev => [ev, ...prev])
    }
  }

  // CSV-Export
  function exportCSV(){
    const header = ['Datum','Schicht','Bewohner','Medikament','Form','Stärke','Dosis','Zeit','PRN','Notiz','gestellt']
    const rows = daily.map(r=>{
      const pat = patients.find(p => p.id===r.med.residentId)
      return [
        date, shift,
        pat?.fullName ?? '—',
        r.med.name,
        r.med.form,
        r.med.strength ?? '',
        r.med.dose ?? '',
        r.time ?? '',
        r.med.prn ? 'ja' : 'nein',
        r.med.notes ?? '',
        r.time ? (isPrepared(r.med.residentId, r.med.id, r.time) ? 'ja' : 'nein') : ''
      ]
    })
    const csv = [header, ...rows].map(cols => cols.map(v => `"${String(v).replace(/"/g,'""')}"`).join(';')).join('\n')
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `medikamentenplan_${date}_${shift}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  // „Alles gestellt“ für die gefilterte Sicht
  function markAllPrepared(){
    const toMark = daily.filter(r => r.time).map(r => ({ pid:r.med.residentId, mid:r.med.id, time:r.time as DoseTime }))
    setEvents(prev => {
      const next = [...prev]
      const key = (x:{pid:string,mid:string,time:DoseTime}) => `${date}|${shift}|${x.pid}|${x.mid}|${x.time}`
      const setKeys = new Set(next.map(e => `${e.date}|${e.shift}|${e.residentId}|${e.medicationId}|${e.time}`))
      toMark.forEach(x=>{
        const k = key(x)
        if (setKeys.has(k)) {
          // toggle auf prepared=true
          const idx = next.findIndex(e => `${e.date}|${e.shift}|${e.residentId}|${e.medicationId}|${e.time}`===k)
          next[idx] = { ...next[idx], prepared: true, at:new Date().toISOString() }
        } else {
          next.unshift({ id: uid('se'), date, shift, residentId: x.pid, medicationId: x.mid, time: x.time, prepared:true, at:new Date().toISOString() })
        }
      })
      return next
    })
  }

  // „Stellen“-Checkliste (Modal)
  const [openChecklist, setOpenChecklist] = useState(false)

  // Gruppierungen
  const grouped = useMemo(()=>{
    const map = new Map<string, { patientName:string, items: Array<{med:Medication, time:DoseTime|null}> }>()
    daily.forEach(r=>{
      const pat = patients.find(p=>p.id===r.med.residentId)
      const key = r.med.residentId
      const entry = map.get(key) ?? { patientName: pat?.fullName ?? '—', items: [] }
      entry.items.push(r)
      map.set(key, entry)
    })
    return Array.from(map.entries()).map(([pid, v]) => ({ pid, ...v }))
  }, [daily])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="h1">Medikamentenplan</h1>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-soft" onClick={()=>setOpenChecklist(true)}>Stellen-Checkliste</button>
          <button className="btn btn-soft" onClick={markAllPrepared}>Alle als gestellt markieren</button>
          <button className="btn btn-primary" onClick={exportCSV}>CSV exportieren</button>
        </div>
      </div>

      {/* Filter */}
      <div className="card p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <label className="block">
          <div className="label">Datum</div>
          <input type="date" className="input w-full" value={date} onChange={e=>setDate(e.target.value)} />
        </label>
        <label className="block">
          <div className="label">Schicht</div>
          <select className="select w-full" value={shift} onChange={e=>setShift(e.target.value as any)}>
            {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="block">
          <div className="label">Bewohner</div>
          <select className="select w-full" value={resident} onChange={e=>setResident(e.target.value)}>
            <option value="">alle</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} (Zimmer {p.room ?? '—'})</option>)}
          </select>
        </label>
        <div className="text-sm text-slate-600">Hinweis: Demo-Daten; Änderungen werden lokal gespeichert.</div>
      </div>

      {/* Tabelle */}
      <div className="card p-0 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[color:var(--brand-200)]/60">
            <tr>
              <th className="text-left px-3 py-2">Bewohner</th>
              <th className="text-left px-3 py-2">Medikament</th>
              <th className="text-left px-3 py-2">Form</th>
              <th className="text-left px-3 py-2">Stärke</th>
              <th className="text-left px-3 py-2">Dosis</th>
              <th className="text-left px-3 py-2">Zeit</th>
              <th className="text-left px-3 py-2">PRN</th>
              <th className="text-left px-3 py-2">Notiz</th>
              <th className="text-left px-3 py-2">gestellt</th>
              <th className="text-left px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {daily.map((r, i) => {
              const pat = patients.find(p => p.id===r.med.residentId)
              const prepared = r.time ? isPrepared(r.med.residentId, r.med.id, r.time) : false
              return (
                <tr key={r.med.id + i} className="border-t">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Link href={`/patients/${r.med.residentId}`} className="text-[color:var(--brand-700)] hover:underline">
                      {pat?.fullName ?? '—'}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{r.med.name}</td>
                  <td className="px-3 py-2">{r.med.form}</td>
                  <td className="px-3 py-2">{r.med.strength ?? '—'}</td>
                  <td className="px-3 py-2">{r.med.dose ?? '—'}</td>
                  <td className="px-3 py-2">{r.time ?? (r.med.prn ? 'bei Bedarf' : '—')}</td>
                  <td className="px-3 py-2">{r.med.prn ? <span className="badge badge-blue">PRN</span> : '—'}</td>
                  <td className="px-3 py-2">{r.med.notes ?? '—'}</td>
                  <td className="px-3 py-2">
                    {r.time ? (
                      <input
                        type="checkbox"
                        checked={prepared}
                        onChange={()=>togglePrepared(r.med.residentId, r.med.id, r.time)}
                      />
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-3 py-2">
                    <button className="btn btn-soft" onClick={()=>alert('In echter Version: Einzel-Etikett/Blisterdruck oder Detailansicht')}>
                      Aktion …
                    </button>
                  </td>
                </tr>
              )
            })}
            {daily.length===0 && (
              <tr><td colSpan={10} className="px-3 py-6 text-center text-slate-600">Kein Plan für diese Filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Checkliste Modal */}
      {openChecklist && (
        <ChecklistModal
          date={date} shift={shift}
          grouped={grouped}
          isPrepared={isPrepared}
          onToggle={togglePrepared}
          onClose={()=>setOpenChecklist(false)}
        />
      )}
    </div>
  )
}

function ChecklistModal({
  date, shift,
  grouped,
  isPrepared,
  onToggle,
  onClose
}:{
  date:string, shift:string,
  grouped: Array<{ pid:string, patientName:string, items: Array<{med:Medication, time: DoseTime|null}> }>,
  isPrepared: (pid:string, mid:string, time:DoseTime|null)=>boolean
  onToggle: (pid:string, mid:string, time:DoseTime|null)=>void
  onClose: ()=>void
}){
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card p-5 w-full max-w-4xl bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="h2">Stellen-Checkliste · {date} · {shift}</div>
          <button className="btn btn-soft" onClick={onClose}>Schließen</button>
        </div>

        <div className="grid md:grid-cols-2 gap-4 max-h-[70vh] overflow-auto pr-2">
          {grouped.map(g => (
            <div key={g.pid} className="card p-3">
              <div className="font-semibold mb-2">{g.patientName}</div>
              <ul className="space-y-2">
                {g.items.map((r, i) => (
                  <li key={r.med.id + i} className="flex items-start gap-2 animate-fadein">
                    <input
                      type="checkbox"
                      checked={r.time ? isPrepared(r.med.residentId, r.med.id, r.time) : false}
                      disabled={!r.time}
                      onChange={()=>onToggle(r.med.residentId, r.med.id, r.time)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{r.med.name} {r.med.strength ? `• ${r.med.strength}` : ''}</div>
                      <div className="text-sm text-slate-600">
                        {r.time ?? (r.med.prn ? 'bei Bedarf' : '—')} • {r.med.dose ?? '—'} {r.med.prn && <span className="badge badge-blue ml-1">PRN</span>}
                      </div>
                      {r.med.notes && <div className="text-xs text-slate-600">{r.med.notes}</div>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-4 text-xs text-slate-600">
          Hinweis: In der echten Version würden hier Etiketten/Blisterdruck und eine revisionssichere Stell-Dokumentation erfolgen.
        </div>
      </div>
    </div>
  )
}
