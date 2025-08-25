'use client';

import { useEffect, useMemo, useState } from 'react';
import { rooms as seedRooms } from '@/data/rooms';
import type { Room, RoomStatus } from '@/types/room';
import { patients as seedPatients } from '@/data/patients';
import Link from 'next/link';

const LS_ROOMS = 'hr_rooms_v1';
const LS_MOVES = 'hr_room_moves_v1'; // protokollierter Umzug
const LS_NOTES = 'hr_room_notes_v1'; // { [roomId]: string }

type MoveLog = { id: string; ts: string; patientId: string; from?: string|null; to?: string|null };

function uid(p='id'){ return p + '-' + Math.random().toString(36).slice(2,9) }

export default function RoomsPage(){
  // persistente Zimmer + Notizen + Umzugslog
  const [rooms, setRooms] = useState<Room[]>([]);
  const [patients, setPatients] = useState([...seedPatients]); // lokale Kopie, damit wir .room ändern können
  const [notes, setNotes] = useState<Record<string,string>>({});
  const [moves, setMoves] = useState<MoveLog[]>([]);

  useEffect(()=>{
    setRooms(JSON.parse(localStorage.getItem(LS_ROOMS) || 'null') || seedRooms);
    setMoves(JSON.parse(localStorage.getItem(LS_MOVES) || '[]'));
    setNotes(JSON.parse(localStorage.getItem(LS_NOTES) || '{}'));
  },[]);
  useEffect(()=>{ if(rooms.length) localStorage.setItem(LS_ROOMS, JSON.stringify(rooms)) },[rooms]);
  useEffect(()=>{ localStorage.setItem(LS_MOVES, JSON.stringify(moves)) },[moves]);
  useEffect(()=>{ localStorage.setItem(LS_NOTES, JSON.stringify(notes)) },[notes]);

  // Filter
  const [q, setQ] = useState('');
  const [floor, setFloor] = useState<number|''>('');
  const [status, setStatus] = useState<RoomStatus|''>('');

  // abgeleitete Belegung
  const occupancy = useMemo(()=>{
    const map = new Map<string, string[]>();
    patients.forEach(p => {
      const r = p.room ?? '';
      if(!r) return;
      map.set(r, [...(map.get(r) || []), p.fullName]);
    });
    return map; // roomId -> [patient names]
  }, [patients]);

  const roomsFiltered = useMemo(()=>{
    const qn = q.trim();
    return rooms.filter(r => {
      const matchQ = !qn || r.id.includes(qn);
      const matchF = floor==='' || r.floor === floor;
      const matchS = !status || r.status===status;
      return matchQ && matchF && matchS;
    }).sort((a,b)=> a.floor===b.floor ? a.id.localeCompare(b.id) : a.floor-b.floor);
  }, [rooms, q, floor, status]);

  const floors = Array.from(new Set(rooms.map(r=>r.floor))).sort();

  // Aktionen
  function setRoomStatus(id:string, st:RoomStatus){
    setRooms(prev => prev.map(r => r.id===id ? {...r, status:st} : r));
  }
  function setRoomNote(roomId:string, text:string){
    setNotes(prev => ({...prev, [roomId]: text}));
  }
  function movePatient(patientId: string, toRoom: string){
    setPatients(prev => prev.map(p => p.id===patientId ? {...p, room: toRoom || undefined} : p));
    const from = seedPatients.find(p=>p.id===patientId)?.room ?? null;
    setMoves(prev => [{ id: uid('mv'), ts: new Date().toISOString(), patientId, from, to: toRoom || null }, ...prev]);
    // optional: Zimmerstatus automatisch auf 'belegt' wenn Kapazität ausgeschöpft (Demo)
    const occTo = (occupancy.get(toRoom) || []).length + 1;
    const capTo = rooms.find(r=>r.id===toRoom)?.capacity ?? 1;
    if (occTo >= capTo) setRoomStatus(toRoom, 'belegt');
  }

  // CSV Export
  function exportCSV(){
    const header = ['Zimmer','Stockwerk','Kapazität','Status','Belegt (Namen)','Notiz'];
    const rows = roomsFiltered.map(r=>{
      const occ = occupancy.get(r.id) || [];
      return [r.id, String(r.floor), String(r.capacity), r.status, occ.join(' | '), notes[r.id] || ''];
    });
    const csv = [header, ...rows].map(cols => cols.map(v => `"${String(v).replace(/"/g,'""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='zimmer_belegung.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  // Heatmap (Demo): pro Zimmer % Auslastung ~ (belegt / capacity)
  function loadPct(r:Room){
    const occ = (occupancy.get(r.id) || []).length;
    return Math.min(100, Math.round(100 * (occ / Math.max(1, r.capacity))));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="h1">Zimmer</h1>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-soft" onClick={exportCSV}>CSV exportieren</button>
        </div>
      </div>

      {/* Filter */}
      <div className="card p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <label className="block">
          <div className="label">Suche (Zimmer)</div>
          <input className="input w-full" placeholder="z. B. 101" value={q} onChange={e=>setQ(e.target.value)} />
        </label>
        <label className="block">
          <div className="label">Stockwerk</div>
          <select className="select w-full" value={String(floor)} onChange={e=>setFloor(e.target.value===''?'':Number(e.target.value))}>
            <option value="">alle</option>
            {floors.map(f=><option key={f} value={f}>{f}. OG</option>)}
          </select>
        </label>
        <label className="block">
          <div className="label">Status</div>
          <select className="select w-full" value={status} onChange={e=>setStatus(e.target.value as any)}>
            <option value="">alle</option>
            <option value="frei">frei</option>
            <option value="belegt">belegt</option>
            <option value="reinigung">reinigung</option>
          </select>
        </label>
        {(q || floor!=='' || status) && (
          <button className="btn btn-soft" onClick={()=>{ setQ(''); setFloor(''); setStatus(''); }}>Zurücksetzen</button>
        )}
      </div>

      {/* Heatmap (Demo) */}
      <div className="card p-4">
        <div className="h2 mb-2">Belegungs-Heatmap (Demo)</div>
        <div className="divider" />
        <div className="grid md:grid-cols-4 sm:grid-cols-3 grid-cols-2 gap-2">
          {roomsFiltered.map(r=>{
            const pct = loadPct(r);
            const clr = pct>80 ? 'bg-red-200' : pct>50 ? 'bg-yellow-200' : 'bg-green-200';
            return (
              <div key={'h-'+r.id} className={`p-2 rounded-lg ${clr} text-sm`}>
                <div className="font-semibold">Zimmer {r.id}</div>
                <div className="text-xs text-slate-700">Auslastung: {pct}%</div>
              </div>
            )
          })}
          {roomsFiltered.length===0 && <div className="text-slate-600">Keine Zimmer im Filter.</div>}
        </div>
      </div>

      {/* Zimmer-Karten */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roomsFiltered.map(r=>{
          const occ = occupancy.get(r.id) || [];
          const free = Math.max(0, r.capacity - occ.length);
          return (
            <div key={r.id} className="card p-4 animate-popin">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-lg">Zimmer {r.id}</div>
                  <div className="text-sm text-slate-600">{r.floor}. OG • Kapazität {r.capacity}</div>
                </div>
                <StatusPill status={r.status}/>
              </div>

              {/* Belegungszeile */}
              <div className="mt-3">
                <div className="text-sm text-slate-600 mb-1">Belegung</div>
                <div className="flex flex-wrap gap-2">
                  {occ.map(name => <span key={name} className="badge bg-slate-100 text-slate-700">{name}</span>)}
                  {free>0 && <span className="badge badge-blue">frei: {free}</span>}
                </div>
              </div>

              {/* Umzug / Zuweisung */}
              <div className="mt-3 grid sm:grid-cols-2 gap-2">
                <MoveInSelect roomId={r.id} patients={patients} onMove={movePatient}/>
                <StatusSelect value={r.status} onChange={(v)=>setRoomStatus(r.id, v)}/>
              </div>

              {/* Notizen */}
              <div className="mt-3">
                <div className="label">Notiz</div>
                <textarea
                  className="input w-full"
                  rows={2}
                  value={notes[r.id] || ''}
                  onChange={e=>setRoomNote(r.id, e.target.value)}
                  placeholder="z. B. Reinigung geplant, Hausmeister informiert …"
                />
              </div>

              {/* Aktionen */}
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/patients`} className="btn btn-soft">Zur Bewohnerliste</Link>
                <button
                  className="btn btn-soft"
                  onClick={()=>{
                    if (!confirm(`Zimmer ${r.id} wirklich leeren? (nur Demo)`)) return;
                    const ids = seedPatients.filter(p=>p.room===r.id).map(p=>p.id);
                    setPatients(prev => prev.map(p=> ids.includes(p.id) ? {...p, room: undefined} : p));
                    setRoomStatus(r.id, 'frei');
                  }}
                >
                  Zimmer leeren (Demo)
                </button>
              </div>
            </div>
          )
        })}
        {roomsFiltered.length===0 && (
          <div className="card p-8 text-center text-slate-600 border-dashed">Keine Zimmer gefunden.</div>
        )}
      </div>

      {/* Umzugsprotokoll */}
      <div className="card p-4">
        <div className="h2 mb-2">Umzugsprotokoll</div>
        <div className="divider" />
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2">
          {moves.slice(0,12).map(m=>{
            const p = seedPatients.find(x=>x.id===m.patientId);
            return (
              <div key={m.id} className="card p-3">
                <div className="text-sm font-medium">{p?.fullName ?? m.patientId}</div>
                <div className="text-xs text-slate-600">{new Date(m.ts).toLocaleString('de-DE')}</div>
                <div className="text-sm mt-1">
                  {m.from ? `von ${m.from}` : 'neu zugewiesen'} → {m.to || 'kein Zimmer'}
                </div>
              </div>
            )
          })}
          {moves.length===0 && <div className="text-slate-600">Noch keine Umzüge.</div>}
        </div>
      </div>
    </div>
  );
}

/* ---- kleine UI-Teile ---- */

function StatusPill({status}:{status:RoomStatus}){
  const map: Record<RoomStatus, string> = {
    frei: 'badge badge-green',
    belegt: 'badge badge-red',
    reinigung: 'badge badge-blue',
  };
  return <span className={map[status]}>{status}</span>;
}

function StatusSelect({value, onChange}:{value:RoomStatus; onChange:(v:RoomStatus)=>void}){
  return (
    <label className="block">
      <div className="label">Status</div>
      <select className="select w-full" value={value} onChange={e=>onChange(e.target.value as RoomStatus)}>
        <option value="frei">frei</option>
        <option value="belegt">belegt</option>
        <option value="reinigung">reinigung</option>
      </select>
    </label>
  );
}

function MoveInSelect({roomId, patients, onMove}:{roomId:string; patients: typeof seedPatients; onMove:(pid:string, to:string)=>void}){
  const [pid, setPid] = useState('');
  return (
    <label className="block">
      <div className="label">Bewohner zuweisen/umziehen</div>
      <div className="flex gap-2">
        <select className="select w-full" value={pid} onChange={e=>setPid(e.target.value)}>
          <option value="">— Bewohner wählen —</option>
          {patients.map(p => (
            <option key={p.id} value={p.id}>
              {p.fullName} {p.room ? `(aktuell ${p.room})` : '(ohne Zimmer)'}
            </option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={() => { if(pid) onMove(pid, roomId); setPid(''); }}>
          Zuweisen
        </button>
      </div>
    </label>
  );
}
