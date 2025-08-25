'use client';

import { useEffect, useMemo, useState } from 'react';
import { contacts as seedContacts } from '@/data/contacts';
import { patients } from '@/data/patients';

type WAMsg = { id:string; ts:string; contactId:string; text:string; from:'care'|'relative'; delivered?:boolean; read?:boolean; media?:string };
const LS_WA = 'hr_wa_threads_v1';

function uid(p='id'){ return p + '-' + Math.random().toString(36).slice(0,7) }

export default function WhatsAppPage(){
  const [items, setItems] = useState<WAMsg[]>([]);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string | null>(null); // contactId
  const [compose, setCompose] = useState('');

  useEffect(()=>{
    const raw = localStorage.getItem(LS_WA);
    setItems(raw ? JSON.parse(raw) : seedBootstrap());
  },[]);
  useEffect(()=>{ localStorage.setItem(LS_WA, JSON.stringify(items)) },[items]);

  const contacts = useMemo(()=>{
    const qn = q.toLowerCase().trim();
    return seedContacts
      .filter(c => c.verified !== false) // nur opt-in/verified (oder leer) in der Demo
      .filter(c => !qn || c.fullName.toLowerCase().includes(qn) || (c.email||'').toLowerCase().includes(qn) || (c.relation||'').toLowerCase().includes(qn));
  },[q]);

  const active = selected ? contacts.find(c=>c.id===selected) || null : null;

  const thread = useMemo(()=> items.filter(m => m.contactId===selected).sort((a,b)=> b.ts.localeCompare(a.ts)), [items, selected]);

  function sendTo(contactId:string, text:string){
    const now = new Date().toISOString();
    const msg: WAMsg = { id: uid('wa'), ts: now, contactId, text, from:'care', delivered:true };
    setItems(prev => [msg, ...prev]);
    setCompose('');
  }

  function broadcast(template:'daily'|'neutral'|'visit'){
    const now = new Date().toISOString();
    const out: WAMsg[] = [];
    seedContacts.forEach(c=>{
      if (c.verified===false) return;
      const pat = patients.find(p=>p.id===c.residentId)?.fullName ?? 'Ihrem Angehörigen';
      const text =
        template==='daily' ? `Kurzes Update zu ${pat}: Heute hat alles gut geklappt, freundlicher Tag.` :
        template==='visit' ? `Hinweis zu ${pat}: Morgen um 14:00 Uhr Termin (Frisör).` :
        `Rückmeldung zu ${pat}: Tag verlief ruhig.` ;
      out.push({ id: uid('wa'), ts: now, contactId: c.id, text, from:'care', delivered:true });
    });
    setItems(prev => [...out, ...prev]);
    alert(`Broadcast gesendet: ${out.length} Kontakte (Demo)`);
  }

  function exportChat(contactId:string){
    const msgs = items.filter(m=>m.contactId===contactId).sort((a,b)=> a.ts.localeCompare(b.ts));
    const lines = msgs.map(m => `[${new Date(m.ts).toLocaleString('de-DE')}] ${m.from==='care'?'Pflege':'Angehörige'}: ${m.text}`);
    const blob = new Blob([lines.join('\n')], {type:'text/plain;charset=utf-8;'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href=url; a.download=`whatsapp_${contactId}.txt`; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="grid lg:grid-cols-[320px,1fr] gap-4">
      {/* Left: contacts */}
      <div className="space-y-3">
        <div className="card p-3">
          <div className="label">Suche</div>
          <input className="input w-full" placeholder="Name, E-Mail, Beziehung…" value={q} onChange={e=>setQ(e.target.value)} />
        </div>
        <div className="card p-0">
          <ul className="max-h-[72vh] overflow-auto">
            {contacts.map(c=>{
              const pat = patients.find(p=>p.id===c.residentId);
              const last = items.filter(m=>m.contactId===c.id).sort((a,b)=> b.ts.localeCompare(a.ts))[0];
              return (
                <li key={c.id}
                    className={`p-3 border-b cursor-pointer hover:bg-[color:var(--brand-50)] ${selected===c.id?'bg-[color:var(--brand-50)]':''}`}
                    onClick={()=>setSelected(c.id)}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{c.fullName}</div>
                    <div className="text-xs text-slate-500">{last ? new Date(last.ts).toLocaleDateString('de-DE', {hour:'2-digit', minute:'2-digit'}) : ''}</div>
                  </div>
                  <div className="text-sm text-slate-600">{c.relation ?? 'Angehörige:r'} • {pat?.fullName ?? '—'}</div>
                  {c.frequency && <span className="badge badge-blue mt-1">{c.frequency}</span>}
                </li>
              )
            })}
            {contacts.length===0 && <div className="p-4 text-slate-600">Keine Kontakte.</div>}
          </ul>
        </div>

        <div className="card p-3">
          <div className="label mb-2">Broadcasts</div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-soft" onClick={()=>broadcast('daily')}>Tagesupdate</button>
            <button className="btn btn-soft" onClick={()=>broadcast('neutral')}>Neutrales Update</button>
            <button className="btn btn-soft" onClick={()=>broadcast('visit')}>Termin-Hinweis</button>
          </div>
          <div className="text-xs text-slate-600 mt-2">Sendet an alle verifizierten Angehörigen (Demo).</div>
        </div>
      </div>

      {/* Right: chat */}
      <div className="card p-0">
        {!active && <div className="p-6 text-slate-600">Kontakt auswählen…</div>}
        {active && (
          <div className="grid grid-rows-[auto,1fr,auto] min-h-[70vh]">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <div className="font-semibold">{active.fullName}</div>
                <div className="text-sm text-slate-600">
                  {active.relation ?? 'Angehörige:r'} • Patient: {patients.find(p=>p.id===active.residentId)?.fullName ?? '—'}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-soft" onClick={()=>exportChat(active.id)}>Export</button>
              </div>
            </div>

            <div className="p-4 max-h-[60vh] overflow-auto space-y-2 bg-[color:var(--brand-50)]/40">
              {thread.map(m => (
                <div key={m.id} className={`max-w-[75%] p-2 rounded-lg ${m.from==='care' ? 'ml-auto bg-white border' : 'bg-white'}`}>
                  <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                  <div className="text-[10px] text-slate-500 mt-1 text-right">
                    {new Date(m.ts).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})} {m.delivered ? '✓' : ''}{m.read ? '✓' : ''}
                  </div>
                </div>
              ))}
              {thread.length===0 && <div className="text-slate-600">Noch keine Nachrichten.</div>}
            </div>

            <div className="p-3 border-t">
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="Nachricht schreiben…" value={compose} onChange={e=>setCompose(e.target.value)} />
                <button className="btn btn-primary" onClick={()=>{ if (compose.trim()) sendTo(active.id, compose.trim()); }}>Senden</button>
              </div>
              <div className="text-xs text-slate-600 mt-2">Medien sind in der Demo deaktiviert – in echt: Foto/Video-Upload mit DSGVO-Hinweis.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* Seed einmalig */
function seedBootstrap(): WAMsg[] {
  const anna = seedContacts.find(c=>c.email==='anna@example.com');
  if (!anna) return [];
  const now = Date.now();
  return [
    { id: uid('wa'), ts: new Date(now-7200_000).toISOString(), contactId: anna.id, text:'Guten Morgen, wie geht es meinem Vater heute?', from:'relative', read:true, delivered:true },
    { id: uid('wa'), ts: new Date(now-7100_000).toISOString(), contactId: anna.id, text:'Guten Morgen! Er hat gut gefrühstückt und war kurz im Garten 😊', from:'care', delivered:true },
  ];
}
