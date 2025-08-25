'use client'
import { useMemo, useState } from 'react'
import { generateMessage } from '@/lib/generateMessage'
import { Save } from 'lucide-react'

export default function StatusForm({ name }:{ name: string }) {
  const [schlaf, setSchlaf] = useState<'gut'|'mittel'|'schlecht'|''>('')
  const [essen, setEssen]   = useState<'gut'|'okay'|'wenig'|''>('')
  const [aktiv, setAktiv]   = useState<string[]>([])
  const [stimmung, setStimmung] = useState<'fröhlich'|'ruhig'|'angespannt'|''>('')
  const [note, setNote] = useState('')

  const toggle = (v:string) => setAktiv(a => a.includes(v) ? a.filter(x=>x!==v) : [...a, v])

  const message = useMemo(() => generateMessage(name, {
    schlaf: schlaf || undefined,
    essen: essen || undefined,
    aktivitaet: aktiv.length ? aktiv : undefined,
    stimmung: stimmung || undefined,
    note: note || undefined
  }), [name, schlaf, essen, aktiv, stimmung, note])

  return (
    <div className="card p-4 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Schlaf">
          <Select value={schlaf} onChange={e=>setSchlaf(e.target.value as any)} options={['','gut','mittel','schlecht']} />
        </Field>
        <Field label="Essen">
          <Select value={essen} onChange={e=>setEssen(e.target.value as any)} options={['','gut','okay','wenig']} />
        </Field>
        <Field label="Aktivität">
          <div className="flex flex-wrap gap-2">
            {['Spaziergang','Gymnastik','Singen','Besuch'].map(v => (
              <button key={v} type="button" onClick={()=>toggle(v)}
                className={"btn " + (aktiv.includes(v) ? "btn-primary" : "btn-soft")}>{v}</button>
            ))}
          </div>
        </Field>
        <Field label="Stimmung">
          <Select value={stimmung} onChange={e=>setStimmung(e.target.value as any)} options={['','fröhlich','ruhig','angespannt']} />
        </Field>
      </div>

      <Field label="Bemerkung (optional)">
        <textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={250}
          className="input w-full" placeholder="kurzer Hinweis (max. 250 Zeichen)" />
        <div className="text-xs text-slate-500 mt-1">{note.length}/250</div>
      </Field>

      <div>
        <div className="text-sm text-slate-500 mb-1">Vorschau der Nachricht</div>
        <div className="card p-3 bg-[color:var(--brand-50)]">{message}</div>
      </div>

      <div className="flex justify-end">
        <button type="button" className="btn btn-primary">
          <Save size={16}/> Speichern (Demo)
        </button>
      </div>
    </div>
  )
}

function Field({label, children}:{label:string; children:React.ReactNode}) {
  return (
    <label className="block">
      <div className="label">{label}</div>
      {children}
    </label>
  )
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & {options:string[]}) {
  const {options, className='', ...rest} = props
  return (
    <select {...rest} className={"select w-full " + className}>
      {options.map(o => <option key={o} value={o}>{o || '—'}</option>)}
    </select>
  )
}
