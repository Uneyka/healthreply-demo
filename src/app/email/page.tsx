'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Mailbox, MailMessage, MailFolder } from '@/types/mail';
import { mailboxes as seedBoxes, mailSeed } from '@/data/mailSeed';
import { patients } from '@/data/patients';
import { contacts } from '@/data/contacts';
import Link from 'next/link';

const LS_MAIL = 'hr_mail_messages_v1';
const LS_SEL  = 'hr_mail_selected_box_v1';

function uid(p='id'){ return p + '-' + Math.random().toString(36).slice(2,9); }

const FOLDERS: {key: MailFolder, label: string}[] = [
  { key:'INBOX',   label:'Eingang' },
  { key:'SENT',    label:'Gesendet' },
  { key:'ARCHIVE', label:'Archiv' },
  { key:'SPAM',    label:'Spam' },
];

export default function EmailPage(){
  const [boxes] = useState<Mailbox[]>(seedBoxes);
  const [boxId, setBoxId] = useState<string>('');
  const [items, setItems] = useState<MailMessage[]>([]);
  const [folder, setFolder] = useState<MailFolder>('INBOX');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);

  useEffect(()=>{
    const base = localStorage.getItem(LS_MAIL);
    setItems(base ? JSON.parse(base) as MailMessage[] : mailSeed);
    setBoxId(localStorage.getItem(LS_SEL) || seedBoxes[0].id);
  },[]);
  useEffect(()=>{ localStorage.setItem(LS_MAIL, JSON.stringify(items)) },[items]);
  useEffect(()=>{ if (boxId) localStorage.setItem(LS_SEL, boxId) },[boxId]);

  const list = useMemo(()=>{
    const qn = q.toLowerCase().trim();
    return items
      .filter(m => m.mailboxId===boxId && m.folder===folder)
      .filter(m =>{
        if (!qn) return true;
        return (
          m.subject.toLowerCase().includes(qn) ||
          m.from.toLowerCase().includes(qn) ||
          m.to.join(',').toLowerCase().includes(qn) ||
          (m.body||'').toLowerCase().includes(qn)
        );
      })
      .sort((a,b)=> (b.date.localeCompare(a.date)));
  },[items, boxId, folder, q]);

  const selected = list.find(m => m.id===selectedId) || null;

  function moveTo(id:string, to: MailFolder){
    setItems(prev => prev.map(m => m.id===id ? {...m, folder: to} : m));
    if (to!==folder) setSelectedId(null);
  }
  function markRead(id:string, read:boolean){
    setItems(prev => prev.map(m => m.id===id ? {...m, read} : m));
  }
  function sendMail(payload: {fromBoxId:string; to:string[]; subject:string; body:string; residentId?:string; contactEmail?:string;}){
    const fromBox = boxes.find(b => b.id===payload.fromBoxId)!;
    const threadId = 't-' + (payload.residentId || 'gen') + '-' + (payload.contactEmail || 'ext');
    const now = new Date().toISOString();
    const sent: MailMessage = {
      id: uid('m'),
      mailboxId: fromBox.id,
      folder: 'SENT',
      threadId,
      subject: payload.subject || '(ohne Betreff)',
      from: fromBox.address,
      to: payload.to,
      date: now,
      body: payload.body || '',
      read: true,
      residentId: payload.residentId,
      contactEmail: payload.contactEmail
    };
    setItems(prev => [sent, ...prev]);
    setFolder('SENT'); setSelectedId(sent.id);
  }

  // CSV export der aktuellen Liste
  function exportCSV(){
    const header = ['Datum','Von','An','Betreff','Ordner','Patient','Kontakt'];
    const rows = list.map(m=>{
      const pat = m.residentId ? patients.find(p=>p.id===m.residentId)?.fullName : '';
      return [new Date(m.date).toLocaleString('de-DE'), m.from, m.to.join(','), m.subject, m.folder, pat, m.contactEmail||''];
    });
    const csv = [header, ...rows].map(r => r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='mail_export.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  // Vorlagen
  const templates = [
    { k:'daily', label:'Tagesupdate (positiv)', text:(name:string)=>`Hallo, kurzes Update zu ${name}: Heute guter Appetit und ein kurzer Spaziergang. Herzliche Grüße!` },
    { k:'neutral', label:'Neutrales Update',     text:(name:string)=>`Kurze Rückmeldung zu ${name}: Der Tag verlief ruhig, alles in Ordnung.` },
    { k:'visit',  label:'Besuchsinfo',           text:(name:string)=>`Hinweis zu ${name}: Morgen um 14:00 Uhr kommt der Frisör. Liebe Grüße` },
  ];

  return (
    <div className="grid lg:grid-cols-[320px,1fr] gap-4">
      {/* Sidebar */}
      <div className="space-y-3">
        <div className="card p-3">
          <div className="label">Postfach</div>
          <select className="select w-full" value={boxId} onChange={e=>{ setBoxId(e.target.value); setSelectedId(null); }}>
            {boxes.map(b => <option key={b.id} value={b.id}>{b.label} • {b.address}</option>)}
          </select>
        </div>
        <div className="card p-3">
          <div className="label">Ordner</div>
          <div className="flex flex-wrap gap-2">
            {FOLDERS.map(f => (
              <button key={f.key} className={`btn ${folder===f.key?'btn-primary':'btn-soft'}`} onClick={()=>{ setFolder(f.key); setSelectedId(null); }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="card p-3">
          <div className="label">Suche</div>
          <input className="input w-full" placeholder="Betreff, Inhalt, Absender…" value={q} onChange={e=>setQ(e.target.value)} />
        </div>
        <div className="card p-3">
          <button className="btn btn-primary w-full" onClick={()=>setComposeOpen(true)}>Neue E-Mail</button>
          <button className="btn btn-soft w-full mt-2" onClick={exportCSV}>CSV Export</button>
        </div>
      </div>

      {/* List + Reader */}
      <div className="card p-0 overflow-hidden">
        <div className="grid md:grid-cols-[380px,1fr]">
          <div className="border-r">
            {list.length===0 && <div className="p-6 text-slate-600">Keine Nachrichten.</div>}
            <ul className="max-h-[72vh] overflow-auto">
              {list.map(m => {
                const pat = m.residentId ? patients.find(p=>p.id===m.residentId)?.fullName : null;
                return (
                  <li key={m.id}
                      className={`px-3 py-3 border-b hover:bg-[color:var(--brand-50)] cursor-pointer ${selectedId===m.id?'bg-[color:var(--brand-50)]':''}`}
                      onClick={()=>{ setSelectedId(m.id); markRead(m.id,true); }}>
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{m.subject}</div>
                      <div className="text-xs text-slate-500">{new Date(m.date).toLocaleString('de-DE')}</div>
                    </div>
                    <div className="text-sm text-slate-600">
                      {m.from} → {m.to.join(', ')}
                    </div>
                    <div className="text-xs text-[color:var(--brand-900)] mt-1">
                      {pat ? <>Patient: <Link href={`/patients/${m.residentId}`} className="underline">{pat}</Link></> : null}
                      {m.contactEmail ? <> • Kontakt: {m.contactEmail}</> : null}
                    </div>
                    {!m.read && <span className="badge badge-blue mt-1">neu</span>}
                  </li>
                )
              })}
            </ul>
          </div>
          <div className="p-4 min-h-[60vh]">
            {!selected && <div className="text-slate-600">Nachricht auswählen…</div>}
            {selected && (
              <div className="space-y-3 animate-fadein">
                <div className="flex items-center justify-between">
                  <div className="text-xl font-semibold">{selected.subject}</div>
                  <div className="flex gap-2">
                    {folder!=='ARCHIVE' && <button className="btn btn-soft" onClick={()=>moveTo(selected.id,'ARCHIVE')}>Archivieren</button>}
                    {folder!=='SPAM' && <button className="btn btn-soft" onClick={()=>moveTo(selected.id,'SPAM')}>Spam</button>}
                    <button className="btn btn-soft" onClick={()=>markRead(selected.id, !selected.read)}>{selected.read?'Als ungelesen':'Als gelesen'}</button>
                  </div>
                </div>
                <div className="text-sm text-slate-600">
                  Von: <b>{selected.from}</b> • An: {selected.to.join(', ')} • {new Date(selected.date).toLocaleString('de-DE')}
                </div>
                <div className="card p-3 bg-white whitespace-pre-wrap">{selected.body}</div>
                {/* Schnellantwort */}
                <div className="card p-3">
                  <div className="label">Schnellantwort</div>
                  <div className="flex flex-wrap gap-2">
                    {templates.map(t => {
                      const name = selected.residentId ? (patients.find(p=>p.id===selected.residentId)?.fullName ?? 'Ihrem Angehörigen') : 'Ihrem Angehörigen';
                      return (
                        <button key={t.k} className="btn btn-soft" onClick={()=>{
                          sendMail({
                            fromBoxId: boxId,
                            to: [selected.from],
                            subject: `Re: ${selected.subject}`,
                            body: t.text(name),
                            residentId: selected.residentId,
                            contactEmail: selected.contactEmail
                          });
                        }}>{t.label}</button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compose Modal */}
      {composeOpen && (
        <ComposeModal
          defaultFrom={boxId}
          onClose={()=>setComposeOpen(false)}
          onSend={(p)=>{ setComposeOpen(false); sendMail(p); }}
        />
      )}
    </div>
  );
}

/* --- Compose Modal --- */
function ComposeModal({defaultFrom, onClose, onSend}:{defaultFrom:string; onClose:()=>void; onSend:(p:{fromBoxId:string; to:string[]; subject:string; body:string; residentId?:string; contactEmail?:string;})=>void}){
  const [fromBox, setFromBox] = useState(defaultFrom);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [residentId, setResidentId] = useState('');
  const [contact, setContact] = useState('');

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card p-5 w-full max-w-2xl bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="h2">Neue E-Mail</div>
          <button className="btn btn-soft" onClick={onClose}>Schließen</button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <div className="label">Von (Postfach)</div>
            <select className="select w-full" value={fromBox} onChange={e=>setFromBox(e.target.value)}>
              <option value="user:pflege1@example.com">Mein Postfach (pflege1@example.com)</option>
              <option value="shared:info@pflege.de">Shared: info@pflege.de</option>
            </select>
          </label>
          <label className="block">
            <div className="label">An (Komma getrennt)</div>
            <input className="input w-full" value={to} onChange={e=>setTo(e.target.value)} placeholder="z. B. anna@example.com, peter@example.com" />
          </label>
          <label className="block sm:col-span-2">
            <div className="label">Betreff</div>
            <input className="input w-full" value={subject} onChange={e=>setSubject(e.target.value)} />
          </label>

          <label className="block">
            <div className="label">Patient (optional)</div>
            <select className="select w-full" value={residentId} onChange={e=>setResidentId(e.target.value)}>
              <option value="">—</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.fullName}</option>)}
            </select>
          </label>
          <label className="block">
            <div className="label">Angehörige:r (optional)</div>
            <select className="select w-full" value={contact} onChange={e=>setContact(e.target.value)}>
              <option value="">—</option>
              {contacts.map(c => <option key={c.id} value={c.email}>{c.fullName} • {c.email}</option>)}
            </select>
          </label>

          <label className="block sm:col-span-2">
            <div className="label">Nachricht</div>
            <textarea className="input w-full" rows={8} value={body} onChange={e=>setBody(e.target.value)} placeholder="Ihre Nachricht…" />
          </label>
        </div>

        <div className="mt-3 flex justify-end gap-2">
          <button className="btn btn-soft" onClick={onClose}>Abbrechen</button>
          <button className="btn btn-primary" onClick={()=>{
            const toList = to.split(',').map(s=>s.trim()).filter(Boolean);
            onSend({ fromBoxId: fromBox, to: toList, subject, body, residentId: residentId || undefined, contactEmail: contact || undefined });
          }}>Senden</button>
        </div>
      </div>
    </div>
  );
}
