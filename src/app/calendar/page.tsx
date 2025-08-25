'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CalEvent, CalView } from '@/types/calendar';
import { calSeed } from '@/data/calendarSeed';
import { patients } from '@/data/patients';
import { contacts } from '@/data/contacts';
import { rooms } from '@/data/rooms';

const LS_CAL = 'hr_calendar_events_v1';

function uid(p='id'){ return p + '-' + Math.random().toString(36).slice(2,9); }

export default function CalendarPage(){
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [view, setView] = useState<CalView>('week');
  const [selDate, setSelDate] = useState(new Date());
  const [selected, setSelected] = useState<CalEvent | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  // Bootstrap
  useEffect(()=>{
    const raw = localStorage.getItem(LS_CAL);
    setEvents(raw ? JSON.parse(raw) : calSeed);
  },[]);
  useEffect(()=>{ localStorage.setItem(LS_CAL, JSON.stringify(events)) },[events]);

  const startOfWeek = (d:Date)=> {
    const n = new Date(d); n.setDate(d.getDate()-d.getDay()+1); n.setHours(0,0,0,0); return n;
  };
  const addDays = (d:Date,n:number)=> { const x=new Date(d); x.setDate(x.getDate()+n); return x; };

  const visibleDays = useMemo(()=>{
    if(view==='day') return [selDate];
    if(view==='week'){ const start=startOfWeek(selDate); return Array.from({length:7},(_,i)=>addDays(start,i)); }
    if(view==='month'){ const start=new Date(selDate.getFullYear(), selDate.getMonth(),1); return Array.from({length:30},(_,i)=>addDays(start,i)); }
    return [];
  },[view,selDate]);

  const visibleEvents = useMemo(()=>{
    return events.filter(e=>{
      const sd = new Date(e.start), ed = new Date(e.end);
      return visibleDays.some(d=> d.toDateString()===sd.toDateString() || d.toDateString()===ed.toDateString());
    });
  },[events,visibleDays]);

  function addEvent(ev:Omit<CalEvent,'id'>){
    setEvents(prev => [...prev, { ...ev, id: uid('c') }]);
  }
  function removeEvent(id:string){
    setEvents(prev => prev.filter(e=>e.id!==id));
    setSelected(null);
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 items-center">
        <button className="btn btn-soft" onClick={()=>setView('day')}>Tag</button>
        <button className="btn btn-soft" onClick={()=>setView('week')}>Woche</button>
        <button className="btn btn-soft" onClick={()=>setView('month')}>Monat</button>
        <button className="btn btn-primary ml-auto" onClick={()=>setNewOpen(true)}>+ Neuer Termin</button>
      </div>

      {/* Grid */}
      <div className="card p-0 overflow-auto">
        <div className={`grid ${view==='day'?'grid-cols-1':view==='week'?'grid-cols-7':'grid-cols-6'} min-h-[60vh]`}>
          {visibleDays.map(day => (
            <div key={day.toISOString()} className="border p-2 relative">
              <div className="text-xs font-medium mb-2">
                {day.toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit'})}
              </div>
              <div className="space-y-1">
                {visibleEvents.filter(e=> new Date(e.start).toDateString()===day.toDateString()).map(ev=>(
                  <div key={ev.id} className={`p-1 rounded text-xs cursor-pointer animate-fadein ${colorClass(ev.type)}`}
                       onClick={()=>setSelected(ev)}>
                    {ev.title}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
          <div className="card bg-white p-5 max-w-lg w-full">
            <div className="flex justify-between items-center mb-3">
              <div className="h2">{selected.title}</div>
              <button className="btn btn-soft" onClick={()=>setSelected(null)}>×</button>
            </div>
            <div className="text-sm text-slate-600">
              {new Date(selected.start).toLocaleString('de-DE')} – {new Date(selected.end).toLocaleString('de-DE')}
            </div>
            <div className="mt-2">Typ: {selected.type}</div>
            {selected.patientId && <div>Patient: {patients.find(p=>p.id===selected.patientId)?.fullName}</div>}
            {selected.contactId && <div>Angehörige:r: {contacts.find(c=>c.id===selected.contactId)?.fullName}</div>}
            {selected.roomId && <div>Zimmer: {rooms.find(r=>r.id===selected.roomId)?.id}</div>}
            {selected.notes && <div className="mt-2">{selected.notes}</div>}
            <div className="flex gap-2 mt-4">
              <button className="btn btn-soft" onClick={()=>removeEvent(selected.id)}>Löschen</button>
              <button className="btn btn-primary" onClick={()=>setSelected(null)}>Schließen</button>
            </div>
          </div>
        </div>
      )}

      {/* New Event */}
      {newOpen && (
        <NewEventModal onClose={()=>setNewOpen(false)} onSave={addEvent} />
      )}
    </div>
  );
}

function colorClass(t:string){
  switch(t){
    case 'Termin': return 'bg-blue-100 text-blue-800';
    case 'Medikament': return 'bg-green-100 text-green-800';
    case 'Besuch': return 'bg-purple-100 text-purple-800';
    case 'Pflege': return 'bg-orange-100 text-orange-800';
    case 'System': return 'bg-slate-100 text-slate-800';
    default: return 'bg-slate-200 text-slate-800';
  }
}

/* --- New Event Modal --- */
function NewEventModal({onClose,onSave}:{onClose:()=>void;onSave:(ev:Omit<CalEvent,'id'>)=>void}){
  const [title,setTitle] = useState('');
  const [start,setStart] = useState('');
  const [end,setEnd] = useState('');
  const [type,setType] = useState<'Termin'|'Medikament'|'Besuch'|'Pflege'|'System'>('Termin');
  const [patient,setPatient] = useState('');
  const [notes,setNotes] = useState('');

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div className="card bg-white p-5 max-w-lg w-full">
        <div className="flex justify-between items-center mb-3">
          <div className="h2">Neuer Termin</div>
          <button className="btn btn-soft" onClick={onClose}>×</button>
        </div>
        <div className="space-y-3">
          <input className="input w-full" placeholder="Titel" value={title} onChange={e=>setTitle(e.target.value)} />
          <input type="datetime-local" className="input w-full" value={start} onChange={e=>setStart(e.target.value)} />
          <input type="datetime-local" className="input w-full" value={end} onChange={e=>setEnd(e.target.value)} />
          <select className="select w-full" value={type} onChange={e=>setType(e.target.value as any)}>
            <option value="Termin">Termin</option>
            <option value="Medikament">Medikament</option>
            <option value="Besuch">Besuch</option>
            <option value="Pflege">Pflege</option>
            <option value="System">System</option>
          </select>
          <select className="select w-full" value={patient} onChange={e=>setPatient(e.target.value)}>
            <option value="">— Patient —</option>
            {patients.map(p=><option key={p.id} value={p.id}>{p.fullName}</option>)}
          </select>
          <textarea className="input w-full" rows={3} placeholder="Notizen…" value={notes} onChange={e=>setNotes(e.target.value)} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-soft" onClick={onClose}>Abbrechen</button>
          <button className="btn btn-primary" onClick={()=>{ if(title&&start&&end){ onSave({title,start,end,type,patientId:patient||undefined,notes}); onClose(); } }}>Speichern</button>
        </div>
      </div>
    </div>
  );
}
