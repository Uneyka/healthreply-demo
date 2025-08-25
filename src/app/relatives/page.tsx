'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { contacts as seedContacts } from '@/data/contacts'
import { patients } from '@/data/patients'
import type { Contact } from '@/types/contact'

type EmailLog = { id: string; contactId: string; ts: string; subject: string; status: 'sent'|'queued'|'bounced' }

const LS_KEY = 'hr_relatives_v1'
const LS_LOGS = 'hr_relatives_email_logs_v1'

function uid(p='id'){ return p + '-' + Math.random().toString(36).slice(2,9) }

// localStorage State (seed -> ls -> state)
function useRelatives() {
  const [items, setItems] = useState<Contact[]>([])
  const [logs, setLogs] = useState<EmailLog[]>([])

  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY)
    const base = raw ? (JSON.parse(raw) as Contact[]) : seedContacts
    setItems(base)
    const rawLogs = localStorage.getItem(LS_LOGS)
    setLogs(rawLogs ? JSON.parse(rawLogs) as EmailLog[] : [])
  }, [])

  useEffect(() => { if (items.length) localStorage.setItem(LS_KEY, JSON.stringify(items)) }, [items])
  useEffect(() => { localStorage.setItem(LS_LOGS, JSON.stringify(logs)) }, [logs])

  const add = (c: Omit<Contact,'id'>) => {
    const it = { ...c, id: uid('c') }
    setItems(prev => [it, ...prev])
  }
  const update = (id: string, patch: Partial<Contact>) => {
    setItems(prev => prev.map(x => x.id===id ? {...x, ...patch} : x))
  }
  const remove = (id: string) => setItems(prev => prev.filter(x => x.id!==id))

  const addLog = (l: Omit<EmailLog,'id'|'ts'>) => {
    const entry: EmailLog = { ...l, id: uid('m'), ts: new Date().toISOString() }
    setLogs(prev => [entry, ...prev])
  }

  return { items, setItems, add, update, remove, logs, addLog }
}

function Avatar({ name }:{name:string}) {
  const initials = name.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()
  return (
    <div style={{width:48, height:48, borderRadius:12, background:'var(--brand-200)',
      display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'#0b376e'}}>
      {initials}
    </div>
  )
}

function Badge({ tone='blue', children }:{tone?:'blue'|'green'|'red'|'gray', children:React.ReactNode}) {
  const cls = tone==='green' ? 'badge badge-green' : tone==='red' ? 'badge badge-red' :
              tone==='gray' ? 'badge bg-slate-100 text-slate-700' : 'badge badge-blue'
  return <span className={cls}>{children}</span>
}

export default function RelativesPage(){
  const { items, add, update, remove, logs, addLog } = useRelatives()
  const [q, setQ] = useState(''); const [resident, setResident] = useState('')

  const list = useMemo(() => {
    const qn = q.toLowerCase().trim()
    return items.filter(c => {
      const matchQ = !qn || c.fullName.toLowerCase().includes(qn) || c.email.toLowerCase().includes(qn) || (c.relation||'').toLowerCase().includes(qn)
      const matchR = !resident || c.residentId === resident
      return matchQ && matchR
    })
  }, [items, q, resident])

  const [modal, setModal] = useState<null | {mode:'new'|'edit', contact?:Contact}>(null)
  const [magicFor, setMagicFor] = useState<Contact | null>(null)
  const [logFor, setLogFor] = useState<Contact | null>(null)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="h1">Angehörige</h1>
        <button className="btn btn-primary" onClick={()=>setModal({mode:'new'})}>Neu verknüpfen</button>
      </div>

      {/* Filter */}
      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <label className="block">
          <div className="label">Suche (Name/E-Mail/Beziehung)</div>
          <input className="input w-80" value={q} onChange={e=>setQ(e.target.value)} placeholder="z. B. Anna / Sohn / anna@example.com"/>
        </label>
        <label className="block">
          <div className="label">Bewohner</div>
          <select className="select w-60" value={resident} onChange={e=>setResident(e.target.value)}>
            <option value="">alle</option>
            {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} (Zimmer {p.room ?? '—'})</option>)}
          </select>
        </label>
        {(q || resident) && <button className="btn btn-soft" onClick={()=>{setQ(''); setResident('')}}>Zurücksetzen</button>}
      </div>

      {/* Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map(c => {
          const p = patients.find(x=>x.id===c.residentId)
          return (
            <div key={c.id} className="card p-4 animate-popin">
              <div className="flex items-start gap-3">
                <Avatar name={c.fullName}/>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">{c.fullName}</div>
                    {c.primary && <Badge tone="blue">Primär</Badge>}
                    {c.verified ? <Badge tone="green">verifiziert</Badge> : <Badge tone="red">unbestätigt</Badge>}
                  </div>
                  <div className="text-sm text-slate-600">{c.relation ?? 'Angehörige:r'} • {c.email}</div>
                  <div className="text-sm text-slate-600">Bewohner: {p ? p.fullName : '—'}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge tone={c.prefersEmail ? 'green' : 'gray'}>E-Mail</Badge>
                    <Badge tone={c.prefersWeb ? 'green' : 'gray'}>Web</Badge>
                    <Badge tone="blue">{c.frequency ?? 'täglich'}</Badge>
                    <Badge tone={c.bounceStatus==='ok'?'green':'red'}>{c.bounceStatus ?? 'ok'}</Badge>
                  </div>
                </div>
              </div>

              {/* Aktionen */}
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="btn btn-soft" onClick={()=>setModal({mode:'edit', contact:c})}>Bearbeiten</button>
                <button className="btn btn-soft" onClick={()=>setMagicFor(c)}>Magic-Link</button>
                <button className="btn btn-soft" onClick={()=>{
                  addLog({ contactId: c.id, subject: `Update zu ${p?.fullName ?? 'Bewohner'}`, status: 'sent' })
                  setLogFor(c)
                }}>Test-E-Mail</button>
                <Link href={p ? `/patients/${p.id}` : '/patients'} className="btn btn-soft">Zum Bewohner</Link>
                <button className="btn btn-soft" onClick={()=>update(c.id, { verified: true, consentAt: new Date().toISOString() })}>Als verifiziert markieren</button>
                <button className="btn btn-soft" onClick={()=>remove(c.id)}>Entfernen</button>
              </div>

              {/* Notizen */}
              {c.notes && <div className="mt-3 text-sm text-slate-700"><b>Notiz:</b> {c.notes}</div>}
            </div>
          )
        })}
        {list.length===0 && (
          <div className="card p-8 text-center text-slate-600 border-dashed">Keine Treffer.</div>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <RelativeModal
          mode={modal.mode}
          contact={modal.contact}
          onClose={()=>setModal(null)}
          onSave={(data)=> {
            if (modal.mode==='new') add(data)
            else if (modal.contact) {
              // wenn E-Mail etc. geändert: update
              // (id bleibt gleich)
              // @ts-ignore
              const id = modal.contact.id
              // typesafe patch:
              const {id: _omit, ...patch} = { ...modal.contact, ...data } as Contact
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              // @ts-ignore
              delete patch.id
              // @ts-ignore
              update(id, patch)
            }
            setModal(null)
          }}
        />
      )}

      {magicFor && <MagicLinkModal contact={magicFor} onClose={()=>setMagicFor(null)} />}

      {logFor && <EmailLogModal contact={logFor} logs={logs.filter(l=>l.contactId===logFor.id)} onClose={()=>setLogFor(null)} />}
    </div>
  )
}

/* -------------------- Modals & Forms -------------------- */

function RelativeModal({ mode, contact, onClose, onSave }:{
  mode:'new'|'edit',
  contact?: Contact,
  onClose:()=>void,
  onSave:(data: Omit<Contact,'id'>)=>void
}) {
  const [fullName, setName] = useState(contact?.fullName ?? '')
  const [email, setEmail] = useState(contact?.email ?? '')
  const [phone, setPhone] = useState(contact?.phone ?? '')
  const [relation, setRelation] = useState(contact?.relation ?? '')
  const [residentId, setResidentId] = useState(contact?.residentId ?? (patients[0]?.id ?? ''))
  const [primary, setPrimary] = useState(contact?.primary ?? false)
  const [verified, setVerified] = useState(contact?.verified ?? false)
  const [prefEmail, setPrefEmail] = useState(contact?.prefersEmail ?? true)
  const [prefWeb, setPrefWeb] = useState(contact?.prefersWeb ?? true)
  const [freq, setFreq] = useState<Contact['frequency']>(contact?.frequency ?? 'täglich')
  const [notes, setNotes] = useState(contact?.notes ?? '')

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card p-5 w-full max-w-2xl bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="h2">{mode==='new'?'Angehörige:n anlegen':'Angehörige:n bearbeiten'}</div>
          <button className="btn btn-soft" onClick={onClose}>Schließen</button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <div className="label">Voller Name</div>
            <input className="input w-full" value={fullName} onChange={e=>setName(e.target.value)} />
          </div>
          <div>
            <div className="label">Beziehung</div>
            <input className="input w-full" value={relation} onChange={e=>setRelation(e.target.value)} placeholder="z. B. Tochter, Sohn, Ehepartner"/>
          </div>
          <div>
            <div className="label">E-Mail</div>
            <input className="input w-full" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div>
            <div className="label">Telefon</div>
            <input className="input w-full" value={phone} onChange={e=>setPhone(e.target.value)} />
          </div>
          <div>
            <div className="label">Bewohner</div>
            <select className="select w-full" value={residentId} onChange={e=>setResidentId(e.target.value)}>
              {patients.map(p => <option key={p.id} value={p.id}>{p.fullName} (Zimmer {p.room ?? '—'})</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 mt-6">
            <input type="checkbox" checked={primary} onChange={e=>setPrimary(e.target.checked)} />
            <span>Primärer Ansprechpartner</span>
          </div>
        </div>

        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <div className="card p-3">
            <div className="font-medium mb-2">Benachrichtigungen</div>
            <div className="flex items-center gap-2 mb-2">
              <input type="checkbox" checked={prefEmail} onChange={e=>setPrefEmail(e.target.checked)} />
              <span>E-Mail erhalten</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input type="checkbox" checked={prefWeb} onChange={e=>setPrefWeb(e.target.checked)} />
              <span>Web-Ansicht nutzen</span>
            </div>
            <div className="label">Häufigkeit</div>
            <select className="select w-full" value={freq} onChange={e=>setFreq(e.target.value as any)}>
              <option value="sofort">sofort</option>
              <option value="täglich">täglich</option>
              <option value="wöchentlich">wöchentlich</option>
            </select>
          </div>

          <div className="card p-3">
            <div className="font-medium mb-2">Opt-In / Verifizierung</div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={verified} onChange={e=>setVerified(e.target.checked)} />
              <span>Verifiziert</span>
            </div>
            <div className="text-xs text-slate-600 mt-2">
              Hinweis: In der echten App erfolgt die Verifizierung per Magic-Link und Double-Opt-In (DSGVO).
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="label">Notizen</div>
          <textarea className="input w-full" rows={3} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Hinweise für den Umgang, Erreichbarkeit, Präferenzen …" />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-soft" onClick={onClose}>Abbrechen</button>
          <button
            className="btn btn-primary"
            onClick={() => onSave({
              fullName, email, phone, relation, residentId,
              primary, verified, consentAt: verified ? new Date().toISOString() : null,
              prefersEmail: prefEmail, prefersWeb: prefWeb, frequency: freq,
              bounceStatus: 'ok', notes
            })}
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  )
}

function MagicLinkModal({ contact, onClose }:{contact: Contact; onClose:()=>void}) {
  const p = patients.find(x=>x.id===contact.residentId)
  const link = `https://healthreply-demo.vercel.app/magic/${contact.id}.${btoa(contact.email).slice(0,8)}`
  const subject = `Zugang bestätigen: Update zu ${p?.fullName ?? 'Ihrem Angehörigen'}`
  const preview = `
Hallo ${contact.fullName},

bitte bestätigen Sie Ihre E-Mail-Adresse, um regelmäßige Updates zu erhalten.

Bewohner: ${p?.fullName ?? '—'}
Häufigkeit: ${contact.frequency ?? 'täglich'}
Kanäle: ${contact.prefersEmail ? 'E-Mail ' : ''}${contact.prefersWeb ? '+ Webansicht' : ''}

Bestätigungslink (gültig 24h):
${link}

Herzliche Grüße
HealthReply Team (Demo)
`.trim()

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card p-5 w-full max-w-2xl bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="h2">Magic-Link Vorschau</div>
          <button className="btn btn-soft" onClick={onClose}>Schließen</button>
        </div>
        <div className="text-sm text-slate-600 mb-2"><b>Betreff:</b> {subject}</div>
        <pre style={{whiteSpace:'pre-wrap'}} className="card p-3 bg-[color:var(--brand-50)] text-slate-800">{preview}</pre>
        <div className="mt-3 text-xs text-slate-600">Hinweis: Nur Demo-Vorschau – kein echter Versand.</div>
      </div>
    </div>
  )
}

function EmailLogModal({ contact, logs, onClose }:{contact: Contact; logs: EmailLog[]; onClose:()=>void}) {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card p-5 w-full max-w-2xl bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="h2">E-Mail Logs: {contact.fullName}</div>
          <button className="btn btn-soft" onClick={onClose}>Schließen</button>
        </div>
        {logs.length===0 ? (
          <div className="text-slate-600">Noch keine Logs.</div>
        ) : (
          <div className="grid gap-2">
            {logs.map(l => (
              <div key={l.id} className="card p-3">
                <div className="text-sm"><b>{l.subject}</b></div>
                <div className="text-xs text-slate-600">{new Date(l.ts).toLocaleString('de-DE')}</div>
                <div className="mt-1"><Badge tone={l.status==='bounced'?'red':'green'}>{l.status}</Badge></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
