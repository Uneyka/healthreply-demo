'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Shift, ShiftType, TimeOff, CoverageReq } from '@/types/roster';
import { rosterSeed, timeOffSeed, coverageSeed, defaultTimes } from '@/data/rosterSeed';
import { userSeed } from '@/data/users';
import type { User } from '@/types/user';

const LS_SHIFTS = 'hr_roster_shifts_v1';
const LS_OFF    = 'hr_roster_off_v1';
const LS_COVER  = 'hr_roster_cover_v1';

function uid(p='id'){ return p + '-' + Math.random().toString(36).slice(2,9); }
function startOfWeek(d=new Date()){ const x=new Date(d); const w=(x.getDay()+6)%7; x.setDate(x.getDate()-w); x.setHours(0,0,0,0); return x; }
function fmtISO(d:Date){ return d.toISOString().slice(0,10); }
function addDays(date:Date, n:number){ const d=new Date(date); d.setDate(d.getDate()+n); return d; }

const SHIFT_TYPES: ShiftType[] = ['Früh','Spät','Nacht'];
const UNITS = ['EG','1. OG','2. OG','Demenz','Leitung'];

export default function RosterPage(){
  // Daten laden/speichern
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [offs, setOffs]     = useState<TimeOff[]>([]);
  const [cover, setCover]   = useState<CoverageReq[]>([]);
  useEffect(()=>{
    setShifts(JSON.parse(localStorage.getItem(LS_SHIFTS) || 'null') || rosterSeed);
    setOffs(JSON.parse(localStorage.getItem(LS_OFF) || 'null') || timeOffSeed);
    setCover(JSON.parse(localStorage.getItem(LS_COVER) || 'null') || coverageSeed);
  },[]);
  useEffect(()=>{ localStorage.setItem(LS_SHIFTS, JSON.stringify(shifts)) },[shifts]);
  useEffect(()=>{ localStorage.setItem(LS_OFF, JSON.stringify(offs)) },[offs]);
  useEffect(()=>{ localStorage.setItem(LS_COVER, JSON.stringify(cover)) },[cover]);

  // Mitarbeitende: Demo = alle aktiven außer Admin
  const staff: User[] = useMemo(()=> userSeed.filter(u => u.active && u.role !== 'admin'), []);

  // Sicht: Woche
  const [week, setWeek] = useState(startOfWeek());
  const days = Array.from({length:7},(_,i)=>addDays(week,i));
  const dayISO = days.map(fmtISO);

  // Filter/Ansicht
  const [unitFilter, setUnitFilter] = useState<string>('');
  const [userFilter, setUserFilter] = useState<string>('');

  const shiftsWeek = useMemo(()=>{
    return shifts.filter(s => dayISO.includes(s.date))
      .filter(s => !unitFilter || s.unit===unitFilter)
      .filter(s => !userFilter || s.userId===userFilter);
  }, [shifts, week, unitFilter, userFilter]);

  // Abwesenheiten in Woche
  const offsWeek = useMemo(()=>{
    return offs.filter(o => dayISO.some(d => d >= o.from && d <= o.to));
  }, [offs, week]);

  // Drag&Drop
  const [dragId, setDragId] = useState<string | null>(null);
  function onDragStart(e: React.DragEvent, id:string){ setDragId(id); e.dataTransfer.setData('text/plain', id); }
  function onDropCell(e: React.DragEvent, userId: string, dateISO: string){
    e.preventDefault();
    const id = dragId || e.dataTransfer.getData('text/plain');
    if (!id) return;
    setShifts(prev => prev.map(s => s.id===id ? {...s, userId, date: dateISO, status: s.status==='tausch-angefragt' ? 'geplant' : s.status} : s));
    setDragId(null);
  }

  // Coverage (Soll vs Ist)
  function coveredCount(dateISO:string, type:ShiftType){
    return shiftsWeek.filter(s => s.date===dateISO && s.type===type).length;
  }
  function requiredCount(dateISO:string, type:ShiftType){
    return cover.find(c => c.date===dateISO && c.type===type)?.required ?? 0;
  }

  // Auto-Planung (Round-Robin)
  function autoplan(){
    const next: Shift[] = [...shifts];
    SHIFT_TYPES.forEach(t => {
      dayISO.forEach(d => {
        const req = requiredCount(d,t);
        const have = next.filter(s => s.date===d && s.type===t).length;
        if (have >= req) return;
        const need = req - have;
        // verfügbare Mitarbeiter ohne Off an dem Tag
        const available = staff.filter(u => !offsWeek.some(o => u.id && d >= o.from && d <= o.to && o.userId===u.id));
        // Round-Robin: mischen anhand Tagesindex
        for (let i=0;i<need;i++){
          const u = available[(i + days.indexOf(days.find(x=>fmtISO(x)===d)!)) % Math.max(1, available.length)];
          if (!u) break;
          next.push({
            id: uid('s'), userId: u.id, date: d, type: t,
            start: defaultTimes[t].start, end: defaultTimes[t].end,
            unit: UNITS[(i + SHIFT_TYPES.indexOf(t)) % UNITS.length],
            status: 'geplant'
          });
        }
      });
    });
    setShifts(next);
    alert('Auto-Planung (Demo) durchgeführt.');
  }

  // CSV Export Woche
  function exportCSV(){
    const header = ['Datum','Wochentag','Mitarbeiter','Rolle','Schicht','Start','Ende','Einheit','Status'];
    const rows = shiftsWeek
      .sort((a,b)=> (a.date+b.userId).localeCompare(b.date+b.userId))
      .map(s => {
        const u = staff.find(x=>x.id===s.userId);
        const d = new Date(s.date);
        return [
          s.date,
          d.toLocaleDateString('de-DE',{weekday:'short'}),
          u?.fullName ?? s.userId,
          u?.role ?? '',
          s.type, s.start, s.end, s.unit ?? '', s.status ?? 'geplant'
        ];
      });
    const csv = [header, ...rows].map(r => r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`dienstplan_${fmtISO(week)}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  // Print
  function printPlan(){ window.print(); }

  // Modal: Neue/ Edit Schicht
  const [editOpen, setEditOpen] = useState<null | { mode:'new'|'edit', data?:Shift, preset?:{userId?:string, date?:string} }>(null);
  function saveShift(payload: Omit<Shift,'id'>, id?:string){
    if (id) setShifts(prev => prev.map(s => s.id===id ? {...payload, id} : s));
    else    setShifts(prev => [{ id: uid('s'), ...payload }, ...prev]);
  }

  // Off beantragen (Demo)
  const [offOpen, setOffOpen] = useState<null | { userId?:string, date?:string }>(null);
  function saveOff(o: Omit<TimeOff,'id'>){ setOffs(prev => [{ id: uid('o'), ...o }, ...prev]); }

  // Tausch
  function requestSwap(id:string){ setShifts(prev => prev.map(s => s.id===id ? {...s, status:'tausch-angefragt'} : s)); }
  function confirmShift(id:string){ setShifts(prev => prev.map(s => s.id===id ? {...s, status:'bestätigt'} : s)); }

  // Überstunden grob: Früh/Spät/Nacht = 8h
  const hoursByUser = useMemo(()=>{
    const h: Record<string, number> = {};
    const hoursFor = (t:ShiftType)=> 8;
    shiftsWeek.forEach(s => { h[s.userId] = (h[s.userId]||0) + hoursFor(s.type); });
    return h;
  }, [shiftsWeek]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="h1">Dienstplan & Schichten</h1>
        <div className="ml-auto flex flex-wrap gap-2">
          <button className="btn btn-soft" onClick={()=>setWeek(addDays(week,-7))}>← Vorherige Woche</button>
          <button className="btn btn-soft" onClick={()=>setWeek(startOfWeek(new Date()))}>Heute</button>
          <button className="btn btn-soft" onClick={()=>setWeek(addDays(week,7))}>Nächste Woche →</button>
          <button className="btn btn-soft" onClick={autoplan}>Auto-Planung</button>
          <button className="btn btn-soft" onClick={exportCSV}>CSV Export</button>
          <button className="btn btn-primary" onClick={printPlan}>Drucken</button>
        </div>
      </div>

      {/* Soll/Ist Übersichten */}
      <div className="card p-4">
        <div className="h2">Besetzungsübersicht</div>
        <div className="divider" />
        <div className="grid md:grid-cols-3 gap-3">
          {SHIFT_TYPES.map(t => (
            <div key={t} className="card p-3 bg-white">
              <div className="font-semibold mb-2">{t}-Schicht</div>
              <div className="grid grid-cols-7 gap-2 text-sm">
                {dayISO.map(d=>{
                  const req = requiredCount(d,t);
                  const got = coveredCount(d,t);
                  const ok = got>=req;
                  return (
                    <div key={d} className={`p-2 rounded-lg text-center ${ok?'bg-green-100 text-green-800':'bg-red-100 text-red-800'}`}>
                      <div className="font-semibold">{got}/{req}</div>
                      <div className="text-xs">{new Date(d).toLocaleDateString('de-DE',{weekday:'short'})}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div className="card p-4 grid md:grid-cols-4 gap-3 items-end">
        <label className="block">
          <div className="label">Station</div>
          <select className="select w-full" value={unitFilter} onChange={e=>setUnitFilter(e.target.value)}>
            <option value="">alle</option>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </label>
        <label className="block">
          <div className="label">Mitarbeiter:in</div>
          <select className="select w-full" value={userFilter} onChange={e=>setUserFilter(e.target.value)}>
            <option value="">alle</option>
            {staff.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
          </select>
        </label>
        <button className="btn btn-soft" onClick={()=>{ setUnitFilter(''); setUserFilter(''); }}>Zurücksetzen</button>
        <button className="btn btn-primary" onClick={()=>setEditOpen({mode:'new'})}>+ Schicht</button>
      </div>

      {/* Plan-Grid */}
      <div className="card p-0 overflow-auto print:overflow-visible">
        <table className="min-w-full text-sm print:w-full">
          <thead className="bg-[color:var(--brand-200)]/60">
            <tr>
              <th className="px-3 py-2 text-left w-[220px]">Mitarbeiter:in</th>
              {days.map(d => (
                <th key={d.toISOString()} className="px-3 py-2 text-left">
                  {d.toLocaleDateString('de-DE',{weekday:'short', day:'2-digit', month:'2-digit'})}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staff.map(u => (
              <tr key={u.id} className="border-t">
                {/* Mitarbeiter Spalte */}
                <td className="px-3 py-2 align-top">
                  <div className="font-medium">{u.fullName}</div>
                  <div className="text-xs text-slate-600">{u.role.toUpperCase()} {hoursByUser[u.id]?`• ${hoursByUser[u.id]}h`:''}</div>
                  {/* Abwesenheiten Badge */}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {offsWeek.filter(o => o.userId===u.id).map(o => (
                      <span key={o.id} className="badge badge-blue">{o.from===o.to ? o.from : `${o.from}–${o.to}`}</span>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-1">
                    <button className="btn btn-soft" onClick={()=>setOffOpen({userId:u.id})}>Abwesenheit</button>
                  </div>
                </td>

                {/* 7 Tage */}
                {dayISO.map(d => {
                  const userOff = offsWeek.some(o => o.userId===u.id && d>=o.from && d<=o.to);
                  const cellShifts = shiftsWeek.filter(s => s.userId===u.id && s.date===d);
                  return (
                    <td key={d+'-'+u.id}
                        onDragOver={e=>e.preventDefault()}
                        onDrop={e=>onDropCell(e, u.id, d)}
                        className={`px-2 py-2 align-top ${userOff?'bg-[color:var(--brand-50)]/60':''}`}
                    >
                      <div className="flex flex-col gap-1 min-h-[64px]">
                        {/* neue Schicht hinzufügen */}
                        <div className="flex gap-1">
                          <select className="select"
                                  onChange={e=>{
                                    const t=e.target.value as ShiftType;
                                    if(!t) return;
                                    saveShift({
                                      userId:u.id, date:d, type:t,
                                      start: defaultTimes[t].start, end: defaultTimes[t].end,
                                      unit: unitFilter || UNITS[0], status:'geplant'
                                    });
                                    e.currentTarget.value='';
                                  }}>
                            <option value="">+ Schicht</option>
                            {SHIFT_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <button className="btn btn-soft" onClick={()=>setEditOpen({mode:'new', preset:{userId:u.id, date:d}})}>…</button>
                        </div>

                        {/* vorhandene Schichten */}
                        {cellShifts.map(s => (
                          <div key={s.id}
                               draggable
                               onDragStart={(e)=>onDragStart(e, s.id)}
                               className={`p-2 rounded border bg-white cursor-move ${chipColor(s.type)}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-medium">{s.type} {s.start}–{s.end}</div>
                                <div className="text-xs text-slate-600">{s.unit ?? '—'} {s.notes ? `• ${s.notes}` : ''}</div>
                                {s.status==='tausch-angefragt' && <div className="text-[10px] text-orange-700">Tausch angefragt</div>}
                                {s.status==='bestätigt' && <div className="text-[10px] text-green-700">Bestätigt</div>}
                              </div>
                              <div className="flex flex-col gap-1">
                                <button className="btn btn-soft" onClick={()=>setEditOpen({mode:'edit', data:s})}>✎</button>
                                <button className="btn btn-soft" onClick={()=>requestSwap(s.id)}>⇄</button>
                                <button className="btn btn-soft" onClick={()=>confirmShift(s.id)}>✓</button>
                                <button className="btn btn-soft" onClick={()=>setShifts(prev => prev.filter(x => x.id!==s.id))}>🗑</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {editOpen && (
        <ShiftModal
          mode={editOpen.mode}
          data={editOpen.data}
          preset={editOpen.preset}
          onClose={()=>setEditOpen(null)}
          onSave={(payload, id)=>{ saveShift(payload, id); setEditOpen(null); }}
        />
      )}

      {offOpen && (
        <OffModal
          userId={offOpen.userId}
          date={offOpen.date}
          onClose={()=>setOffOpen(null)}
          onSave={(o)=>{ saveOff(o); setOffOpen(null); }}
        />
      )}
    </div>
  );
}

/* ---------- helpers/ui ---------- */

function chipColor(t:ShiftType){
  if(t==='Früh') return 'border-green-200';
  if(t==='Spät') return 'border-blue-200';
  return 'border-purple-200';
}

function ShiftModal({
  mode, data, preset, onClose, onSave
}:{
  mode:'new'|'edit',
  data?:Shift,
  preset?:{userId?:string, date?:string},
  onClose:()=>void,
  onSave:(payload: Omit<Shift,'id'>, id?:string)=>void
}){
  const [userId, setUserId] = useState<string>(data?.userId || preset?.userId || '');
  const [date, setDate]     = useState<string>(data?.date || preset?.date || new Date().toISOString().slice(0,10));
  const [type, setType]     = useState<ShiftType>(data?.type || 'Früh');
  const [start, setStart]   = useState<string>(data?.start || defaultTimes['Früh'].start);
  const [end, setEnd]       = useState<string>(data?.end || defaultTimes['Früh'].end);
  const [unit, setUnit]     = useState<string>(data?.unit || 'EG');
  const [notes, setNotes]   = useState<string>(data?.notes || '');
  const [status, setStatus] = useState<Shift['status']>(data?.status || 'geplant');

  useEffect(()=>{
    setStart(defaultTimes[type].start);
    setEnd(defaultTimes[type].end);
  }, [type]);

  const staff: User[] = userSeed.filter(u => u.active && u.role !== 'admin');

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card p-5 w-full max-w-xl bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="h2">{mode==='new' ? 'Neue Schicht' : 'Schicht bearbeiten'}</div>
          <button className="btn btn-soft" onClick={onClose}>Schließen</button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <div className="label">Mitarbeiter:in</div>
            <select className="select w-full" value={userId} onChange={e=>setUserId(e.target.value)}>
              <option value="">— wählen —</option>
              {staff.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
            </select>
          </label>
          <label className="block">
            <div className="label">Datum</div>
            <input type="date" className="input w-full" value={date} onChange={e=>setDate(e.target.value)} />
          </label>
          <label className="block">
            <div className="label">Schicht</div>
            <select className="select w-full" value={type} onChange={e=>setType(e.target.value as ShiftType)}>
              <option value="Früh">Früh</option>
              <option value="Spät">Spät</option>
              <option value="Nacht">Nacht</option>
            </select>
          </label>
          <label className="block">
            <div className="label">Einheit/Station</div>
            <select className="select w-full" value={unit} onChange={e=>setUnit(e.target.value)}>
              {['EG','1. OG','2. OG','Demenz','Leitung'].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </label>
          <label className="block">
            <div className="label">Start</div>
            <input type="time" className="input w-full" value={start} onChange={e=>setStart(e.target.value)} />
          </label>
          <label className="block">
            <div className="label">Ende</div>
            <input type="time" className="input w-full" value={end} onChange={e=>setEnd(e.target.value)} />
          </label>
          <label className="block sm:col-span-2">
            <div className="label">Notizen</div>
            <input className="input w-full" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="z. B. Einarbeitung, Doppelbesetzung …" />
          </label>
          <label className="block">
            <div className="label">Status</div>
            <select className="select w-full" value={status} onChange={e=>setStatus(e.target.value as any)}>
              <option value="geplant">geplant</option>
              <option value="bestätigt">bestätigt</option>
              <option value="tausch-angefragt">Tausch angefragt</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-soft" onClick={onClose}>Abbrechen</button>
          <button className="btn btn-primary" onClick={()=>{
            if (!userId) return alert('Bitte Mitarbeiter:in wählen.');
            onSave({ userId, date, type, start, end, unit, notes, status }, data?.id);
          }}>{mode==='new'?'Anlegen':'Speichern'}</button>
        </div>
      </div>
    </div>
  );
}

function OffModal({userId, date, onClose, onSave}:{userId?:string, date?:string, onClose:()=>void, onSave:(o:Omit<TimeOff,'id'>)=>void}){
  const [uid, setUid] = useState(userId || '');
  const [from, setFrom] = useState(date || new Date().toISOString().slice(0,10));
  const [to, setTo]     = useState(date || new Date().toISOString().slice(0,10));
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<TimeOff['status']>('beantragt');
  const staff: User[] = userSeed.filter(u => u.active && u.role !== 'admin');

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card p-5 w-full max-w-xl bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="h2">Abwesenheit</div>
          <button className="btn btn-soft" onClick={onClose}>Schließen</button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <div className="label">Mitarbeiter:in</div>
            <select className="select w-full" value={uid} onChange={e=>setUid(e.target.value)}>
              <option value="">— wählen —</option>
              {staff.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
            </select>
          </label>
          <label className="block">
            <div className="label">Von</div>
            <input type="date" className="input w-full" value={from} onChange={e=>setFrom(e.target.value)} />
          </label>
          <label className="block">
            <div className="label">Bis</div>
            <input type="date" className="input w-full" value={to} onChange={e=>setTo(e.target.value)} />
          </label>
          <label className="block">
            <div className="label">Status</div>
            <select className="select w-full" value={status} onChange={e=>setStatus(e.target.value as any)}>
              <option value="beantragt">beantragt</option>
              <option value="genehmigt">genehmigt</option>
              <option value="abgelehnt">abgelehnt</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <div className="label">Grund (optional)</div>
            <input className="input w-full" value={reason} onChange={e=>setReason(e.target.value)} placeholder="z. B. Urlaub, Arzt …" />
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-soft" onClick={onClose}>Abbrechen</button>
          <button className="btn btn-primary" onClick={()=>{
            if(!uid) return alert('Bitte Mitarbeiter:in wählen.');
            onSave({ userId: uid, from, to, reason, status });
          }}>Speichern</button>
        </div>
      </div>
    </div>
  );
}
