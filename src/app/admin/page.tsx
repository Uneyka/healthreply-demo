'use client';

import { useEffect, useMemo, useState } from 'react';
import type { OrgSettings, User, Role, ModuleKey } from '@/types/user';
import { orgSeed, userSeed } from '@/data/users';

const LS_ORG = 'hr_admin_org_v1';
const LS_USERS = 'hr_admin_users_v1';
const MODULES: {key: ModuleKey; label: string}[] = [
  { key:'dashboard',  label:'Dashboard' },
  { key:'patients',   label:'Patienten' },
  { key:'medication', label:'Medikamentenplan' },
  { key:'relatives',  label:'Angehörige' },
  { key:'rooms',      label:'Zimmer' },
  { key:'admin',      label:'Admin' },
];

function uid(p='id'){ return p + '-' + Math.random().toString(36).slice(2,9); }

export default function AdminPage(){
  // Load
  const [org, setOrg] = useState<OrgSettings>(orgSeed);
  const [users, setUsers] = useState<User[]>(userSeed);

  useEffect(()=>{
    setOrg(JSON.parse(localStorage.getItem(LS_ORG) || 'null') || orgSeed);
    setUsers(JSON.parse(localStorage.getItem(LS_USERS) || 'null') || userSeed);
  },[]);
  useEffect(()=>{ localStorage.setItem(LS_ORG, JSON.stringify(org)) },[org]);
  useEffect(()=>{ localStorage.setItem(LS_USERS, JSON.stringify(users)) },[users]);

  // Filters
  const [q, setQ] = useState('');
  const [role, setRole] = useState<Role|''>('');
  const [activeOnly, setActiveOnly] = useState(false);

  const list = useMemo(()=>{
    const qn = q.toLowerCase().trim();
    return users.filter(u => {
      const mQ = !qn || u.fullName.toLowerCase().includes(qn) || u.email.toLowerCase().includes(qn) || (u.shortCode||'').toLowerCase().includes(qn);
      const mR = !role || u.role===role;
      const mA = !activeOnly || u.active;
      return mQ && mR && mA;
    })
  },[users, q, role, activeOnly]);

  // Modals
  const [openEditOrg, setOpenEditOrg] = useState(false);
  const [openUser, setOpenUser] = useState<null | {mode:'new'|'edit', user?:User}>(null);
  const [impersonate, setImpersonate] = useState<User | null>(null);

  // CSV Export
  function exportUsers(){
    const header = ['Name','E-Mail','Rolle','Aktiv','Kürzel','Telefon','Module','Erstellt','Letzter Login'];
    const rows = list.map(u => [
      u.fullName, u.email, u.role, u.active?'ja':'nein', u.shortCode||'', u.phone||'',
      MODULES.filter(m=>u.modules[m.key]).map(m=>m.label).join('|'),
      u.createdAt, u.lastLoginAt||''
    ]);
    const csv = [header, ...rows].map(r => r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'benutzer.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  // JSON Import/Export
  function exportJSON(){
    const json = JSON.stringify({ org, users }, null, 2);
    const blob = new Blob([json], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'admin_export.json'; a.click();
    URL.revokeObjectURL(url);
  }
  function importJSON(file: File){
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const data = JSON.parse(String(reader.result));
        if (data.org) setOrg(data.org);
        if (Array.isArray(data.users)) setUsers(data.users);
        alert('Import erfolgreich (Demo).');
      }catch(e){
        alert('Import fehlgeschlagen: ungültiges JSON.');
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="h1">Admin</h1>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-soft" onClick={()=>setOpenEditOrg(true)}>Einrichtung bearbeiten</button>
          <button className="btn btn-soft" onClick={exportUsers}>CSV Export</button>
          <button className="btn btn-soft" onClick={exportJSON}>JSON Export</button>
          <label className="btn btn-soft" style={{cursor:'pointer'}}>
            JSON Import
            <input type="file" accept="application/json" hidden onChange={e=>{ const f=e.target.files?.[0]; if(f) importJSON(f); }} />
          </label>
          <button className="btn btn-primary" onClick={()=>setOpenUser({mode:'new'})}>Benutzer anlegen</button>
        </div>
      </div>

      {/* Org-Overview */}
      <div className="card p-4">
        <div className="h2">Einrichtung</div>
        <div className="divider" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Info label="Name" value={org.orgName}/>
          <Info label="E-Mail-Domain" value={org.emailDomain || '—'}/>
          <Info label="Brand-Farbe" value={org.brandColor || '—'}/>
          <Info label="PDL-Freigabe erforderlich" value={org.requirePDLApproval ? 'ja' : 'nein'}/>
          <Info label="Standard-Frequenz" value={org.defaultFrequency || 'täglich'}/>
          <Info label="Theme" value={org.theme || 'blue'}/>
        </div>
      </div>

      {/* Filter */}
      <div className="card p-4 grid md:grid-cols-4 gap-3 items-end">
        <label className="block">
          <div className="label">Suche</div>
          <input className="input w-full" value={q} onChange={e=>setQ(e.target.value)} placeholder="Name/E-Mail/Kürzel" />
        </label>
        <label className="block">
          <div className="label">Rolle</div>
          <select className="select w-full" value={role} onChange={e=>setRole(e.target.value as any)}>
            <option value="">alle</option>
            <option value="admin">Admin</option>
            <option value="pdl">PDL/Leitung</option>
            <option value="pflege">Pflegekraft</option>
          </select>
        </label>
        <label className="flex items-center gap-2 mt-6">
          <input type="checkbox" checked={activeOnly} onChange={e=>setActiveOnly(e.target.checked)} />
          <span>nur aktive</span>
        </label>
        {(q || role || activeOnly) && <button className="btn btn-soft" onClick={()=>{ setQ(''); setRole(''); setActiveOnly(false);}}>Zurücksetzen</button>}
      </div>

      {/* User Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map(u => (
          <div key={u.id} className="card p-4 animate-popin">
            <div className="flex items-start gap-3">
              <Avatar user={u}/>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{u.fullName}</div>
                  <span className={`badge ${u.active ? 'badge-green' : 'badge-red'}`}>{u.active ? 'aktiv' : 'inaktiv'}</span>
                  <span className="badge bg-slate-100 text-slate-700">{u.role}</span>
                </div>
                <div className="text-sm text-slate-600">{u.email} • {u.shortCode || '—'}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {MODULES.filter(m=>u.modules[m.key]).map(m => (
                    <span key={m.key} className="badge badge-blue">{m.label}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn btn-soft" onClick={()=>setOpenUser({mode:'edit', user:u})}>Bearbeiten</button>
              <button className="btn btn-soft" onClick={()=>setImpersonate(u)}>Impersonate (Demo)</button>
              <button className="btn btn-soft" onClick={()=>{
                const pass = prompt('Neues Passwort (Demo):'); if(!pass) return;
                updateUser(u.id, { password: pass });
                alert('Passwort gesetzt (nur Demo).');
              }}>Passwort setzen</button>
              <button className="btn btn-soft" onClick={()=>{
                updateUser(u.id, { active: !u.active });
              }}>{u.active ? 'Deaktivieren' : 'Aktivieren'}</button>
              <button className="btn btn-soft" onClick={()=>{
                if(!confirm(`Benutzer ${u.fullName} wirklich entfernen? (Demo)`)) return;
                removeUser(u.id);
              }}>Entfernen</button>
            </div>
          </div>
        ))}
        {list.length===0 && <div className="card p-8 text-center text-slate-600 border-dashed">Keine Benutzer.</div>}
      </div>

      {/* Modals */}
      {openEditOrg && (
        <OrgModal
          value={org}
          onClose={()=>setOpenEditOrg(false)}
          onSave={(v)=>{ setOrg(v); setOpenEditOrg(false); }}
        />
      )}
      {openUser && (
        <UserModal
          mode={openUser.mode}
          user={openUser.user}
          onClose={()=>setOpenUser(null)}
          onSave={(payload)=> {
            if (openUser.mode==='new') addUser(payload);
            else if (openUser.user) updateUser(openUser.user.id, payload);
            setOpenUser(null);
          }}
        />
      )}
      {impersonate && (
        <ImpersonateModal user={impersonate} onClose={()=>setImpersonate(null)} />
      )}
    </div>
  );

  // helpers that close over users/setUsers
  function addUser(payload: Omit<User,'id'|'createdAt'>){
    const u: User = { ...payload, id: uid('u'), createdAt: new Date().toISOString() };
    setUsers(prev => [u, ...prev]);
  }
  function updateUser(id:string, patch: Partial<User>){
    setUsers(prev => prev.map(u => u.id===id ? ({...u, ...patch}) : u));
  }
  function removeUser(id:string){
    setUsers(prev => prev.filter(u => u.id!==id));
  }
}

/* ---------- components in file (simpel) ---------- */

function Info({label, value}:{label:string; value?:string|null}){
  return (
    <div>
      <div className="text-sm text-slate-500">{label}</div>
      <div className="font-medium">{value || '—'}</div>
    </div>
  );
}

function Avatar({user}:{user:User}){
  const initials = user.initials || user.fullName.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase();
  if (user.photo) {
    return <img src={user.photo} className="h-12 w-12 rounded-xl object-cover" alt={user.fullName} />
  }
  return (
    <div style={{
      width:48, height:48, borderRadius:12, background:'var(--brand-200)',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontWeight:800, color:'#0b376e'
    }}>{initials}</div>
  )
}

/* ----- Modals ----- */

function OrgModal({value, onClose, onSave}:{value:OrgSettings; onClose:()=>void; onSave:(v:OrgSettings)=>void}){
  const [v, setV] = useState<OrgSettings>(value);
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card p-5 w-full max-w-2xl bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="h2">Einrichtung bearbeiten</div>
          <button className="btn btn-soft" onClick={onClose}>Schließen</button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name">
            <input className="input w-full" value={v.orgName} onChange={e=>setV({...v, orgName:e.target.value})}/>
          </Field>
          <Field label="E-Mail-Domain (optional)">
            <input className="input w-full" placeholder="example.com" value={v.emailDomain||''} onChange={e=>setV({...v, emailDomain:e.target.value})}/>
          </Field>
          <Field label="Brand-Farbe">
            <input className="input w-full" type="color" value={v.brandColor||'#1c78ea'} onChange={e=>setV({...v, brandColor:e.target.value})}/>
          </Field>
          <Field label="Standard-Frequenz">
            <select className="select w-full" value={v.defaultFrequency||'täglich'} onChange={e=>setV({...v, defaultFrequency: e.target.value as any})}>
              <option value="sofort">sofort</option>
              <option value="täglich">täglich</option>
              <option value="wöchentlich">wöchentlich</option>
            </select>
          </Field>
          <Field label="PDL-Freigabe erforderlich">
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" checked={!!v.requirePDLApproval} onChange={e=>setV({...v, requirePDLApproval: e.target.checked})}/>
              <span>aktiv</span>
            </div>
          </Field>
          <Field label="Theme">
            <select className="select w-full" value={v.theme||'blue'} onChange={e=>setV({...v, theme: e.target.value as any})}>
              <option value="blue">Light-Blue</option>
              <option value="light">Light</option>
              <option value="dark">Dark (Demo)</option>
            </select>
          </Field>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-soft" onClick={onClose}>Abbrechen</button>
          <button className="btn btn-primary" onClick={()=>onSave(v)}>Speichern</button>
        </div>
      </div>
    </div>
  )
}

function Field({label, children}:{label:string; children:React.ReactNode}){
  return (
    <label className="block">
      <div className="label">{label}</div>
      {children}
    </label>
  )
}

function UserModal({mode, user, onClose, onSave}:{mode:'new'|'edit'; user?:User; onClose:()=>void; onSave:(u:Omit<User,'id'|'createdAt'>)=>void}){
  const emptyModules: User['modules'] = { dashboard:true, patients:true, medication:true, relatives:false, rooms:false, admin:false };
  const [state, setState] = useState<Omit<User,'id'|'createdAt'>>({
    email: user?.email || '',
    fullName: user?.fullName || '',
    initials: user?.initials || '',
    photo: user?.photo || '',
    role: user?.role || 'pflege',
    active: user?.active ?? true,
    shortCode: user?.shortCode || '',
    phone: user?.phone || '',
    modules: user?.modules || emptyModules,
    lastLoginAt: user?.lastLoginAt,
    password: user?.password || '',
  });

  function toggleModule(k: ModuleKey){
    setState(s => ({...s, modules: {...s.modules, [k]: !s.modules[k] }}))
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card p-5 w-full max-w-3xl bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="h2">{mode==='new' ? 'Benutzer anlegen' : 'Benutzer bearbeiten'}</div>
          <button className="btn btn-soft" onClick={onClose}>Schließen</button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Voller Name"><input className="input w-full" value={state.fullName} onChange={e=>setState({...state, fullName:e.target.value})}/></Field>
          <Field label="E-Mail"><input className="input w-full" value={state.email} onChange={e=>setState({...state, email:e.target.value})}/></Field>
          <Field label="Kürzel"><input className="input w-full" value={state.shortCode} onChange={e=>setState({...state, shortCode:e.target.value})}/></Field>
          <Field label="Telefon"><input className="input w-full" value={state.phone} onChange={e=>setState({...state, phone:e.target.value})}/></Field>
          <Field label="Rolle">
            <select className="select w-full" value={state.role} onChange={e=>setState({...state, role:e.target.value as any})}>
              <option value="pflege">Pflegekraft</option>
              <option value="pdl">PDL/Leitung</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          <Field label="Aktiv">
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" checked={state.active} onChange={e=>setState({...state, active:e.target.checked})}/>
              <span>aktiv</span>
            </div>
          </Field>
          <Field label="Foto (URL, Demo)"><input className="input w-full" value={state.photo||''} onChange={e=>setState({...state, photo:e.target.value})} placeholder="https://..."/></Field>
          <Field label="Initialen"><input className="input w-full" value={state.initials||''} onChange={e=>setState({...state, initials:e.target.value})}/></Field>
        </div>

        <div className="mt-4 card p-3">
          <div className="font-medium mb-2">Module & Rechte</div>
          <div className="grid sm:grid-cols-3 gap-2">
            {MODULES.map(m => (
              <label key={m.key} className="flex items-center gap-2">
                <input type="checkbox" checked={!!state.modules[m.key]} onChange={()=>toggleModule(m.key)} />
                <span>{m.label}</span>
              </label>
            ))}
          </div>
          <div className="text-xs text-slate-600 mt-2">Hinweis: Im Demo-Modus werden Rechte nur angezeigt – keine echte Zugriffskontrolle.</div>
        </div>

        <div className="mt-4 card p-3">
          <div className="font-medium mb-2">Passwort (Demo)</div>
          <input className="input w-full" type="password" placeholder={mode==='edit' ? 'unverändert' : 'Passwort setzen'} value={state.password || ''} onChange={e=>setState({...state, password:e.target.value})}/>
          <div className="text-xs text-slate-600 mt-2">In Produktion niemals im Klartext speichern – nur Hash (z. B. bcrypt)!</div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-soft" onClick={onClose}>Abbrechen</button>
          <button className="btn btn-primary" onClick={()=>onSave(state)}>Speichern</button>
        </div>
      </div>
    </div>
  )
}

function ImpersonateModal({user, onClose}:{user:User; onClose:()=>void}){
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="card p-5 w-full max-w-xl bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="h2">Impersonate (Demo)</div>
          <button className="btn btn-soft" onClick={onClose}>Schließen</button>
        </div>
        <div className="mb-2">Du „loggst“ dich als <b>{user.fullName}</b> ein (nur UI-Simulation).</div>
        <ul className="list-disc ml-5 text-slate-700">
          <li>Rolle: {user.role}</li>
          <li>Aktiv: {user.active ? 'ja' : 'nein'}</li>
          <li>Module: {MODULES.filter(m=>user.modules[m.key]).map(m=>m.label).join(', ') || 'keine'}</li>
        </ul>
        <div className="text-xs text-slate-600 mt-3">In echt würde hier ein Server-Token/Session gesetzt.</div>
      </div>
    </div>
  )
}
