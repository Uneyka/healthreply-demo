'use client';

import { useEffect, useMemo, useState } from 'react';
import { patients } from '@/data/patients';
import type { BillingPlan, InvoiceItem, CareLevel, BillingCategory } from '@/types/billing';
import { billingPlansSeed, billingItemsSeed } from '@/data/billingSeed';
import Link from 'next/link';

const LS_PLANS = 'hr_billing_plans_v1';
const LS_ITEMS = 'hr_billing_items_v1';

type RowVM = {
  patientId: string;
  fullName: string;
  room?: string;
  insurerName: string;
  careLevel: CareLevel;
  budgetSach: number;
  budgetEntl: number;
  usedSach: number;
  usedEntl: number;
  copay: number;
  status: 'ok' | 'warn' | 'over';
};

function uid(p='id'){ return p + '-' + Math.random().toString(36).slice(2,9); }
function ym(d: Date){ return d.toISOString().slice(0,7); }
function isInMonth(isoDate: string, month: string){ return isoDate.slice(0,7) === month; }
function clamp(n:number, min=0, max=1){ return Math.max(min, Math.min(max, n)); }
function euro(n:number){ return n.toLocaleString('de-DE',{ style:'currency', currency:'EUR' }); }
function initials(name?: string){ if(!name) return '??'; const p=name.split(' ').filter(Boolean); return (p[0]?.[0]??'')+(p[1]?.[0]??''); }

type SortKey = 'name' | 'restSach' | 'restEntl' | 'copay' | 'care';

export default function BillingPage(){
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [month, setMonth] = useState<string>(ym(new Date()));
  const [q, setQ] = useState('');
  const [lvl, setLvl] = useState<string>('');
  const [ins, setIns] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortKey>('name');

  // load & persist
  useEffect(()=>{
    setPlans(JSON.parse(localStorage.getItem(LS_PLANS) || 'null') || billingPlansSeed);
    setItems(JSON.parse(localStorage.getItem(LS_ITEMS) || 'null') || billingItemsSeed);
  },[]);
  useEffect(()=>{ localStorage.setItem(LS_PLANS, JSON.stringify(plans)); },[plans]);
  useEffect(()=>{ localStorage.setItem(LS_ITEMS, JSON.stringify(items)); },[items]);

  // compute rows
  const rows = useMemo<RowVM[]>(()=>{
    const r = plans.map(p => {
      const pat = patients.find(x=>x.id===p.patientId);
      const monthItems = items.filter(i => i.patientId===p.patientId && isInMonth(i.date, month));
      const usedSach = monthItems.filter(i => i.category==='Pflegesachleistung').reduce((s,i)=>s+i.amount,0);
      const usedEntl = monthItems.filter(i => i.category==='Entlastungsbetrag').reduce((s,i)=>s+i.amount,0);
      const copay    = monthItems.filter(i => i.category==='Eigenanteil').reduce((s,i)=>s+i.amount,0);
      const restSach = p.budgets.sachleistung - usedSach;
      const restEntl = p.budgets.entlastung - usedEntl;
      const status: RowVM['status'] =
        restSach < 0 || restEntl < 0 ? 'over' :
        (usedSach > p.budgets.sachleistung * 0.85 || usedEntl > p.budgets.entlastung * 0.85) ? 'warn' : 'ok';

      return {
        patientId: p.patientId,
        fullName: pat?.fullName ?? p.patientId,
        room: (pat as any)?.room ?? (pat as any)?.roomNumber ?? undefined,
        insurerName: p.insurerName,
        careLevel: p.careLevel,
        budgetSach: p.budgets.sachleistung,
        budgetEntl: p.budgets.entlastung,
        usedSach, usedEntl, copay, status,
      };
    })
    .filter(r => !q || r.fullName.toLowerCase().includes(q.toLowerCase()))
    .filter(r => !lvl || String(r.careLevel)===lvl)
    .filter(r => !ins || r.insurerName.toLowerCase().includes(ins.toLowerCase()));

    // sorting
    const keyer: Record<SortKey, (a: RowVM)=>number | string> = {
      name:     a => a.fullName.toLowerCase(),
      restSach: a => a.budgetSach - a.usedSach,
      restEntl: a => a.budgetEntl - a.usedEntl,
      copay:    a => -a.copay, // desc
      care:     a => a.careLevel,
    };
    const k = keyer[sortBy];
    return r.sort((a,b) => (k(a) > k(b) ? 1 : k(a) < k(b) ? -1 : 0));
  },[plans, items, month, q, lvl, ins, sortBy]);

  // summary
  const sumBudgetSach = rows.reduce((s,r)=>s+r.budgetSach,0);
  const sumUsedSach   = rows.reduce((s,r)=>s+r.usedSach,0);
  const sumBudgetEntl = rows.reduce((s,r)=>s+r.budgetEntl,0);
  const sumUsedEntl   = rows.reduce((s,r)=>s+r.usedEntl,0);
  const sumCopay      = rows.reduce((s,r)=>s+r.copay,0);

  // state: modals
  const [editPlan, setEditPlan] = useState<null | BillingPlan>(null);
  const [bookFor, setBookFor]   = useState<null | { patientId:string }>(null);
  const [detailFor, setDetailFor] = useState<null | { patientId:string, name:string }>(null);

  // actions
  function savePlan(next: BillingPlan){
    setPlans(prev=>{
      const i = prev.findIndex(p=>p.patientId===next.patientId);
      if(i>=0){ const copy=[...prev]; copy[i]=next; return copy; }
      return [...prev, next];
    });
    setEditPlan(null);
  }
  function addItem(it: Omit<InvoiceItem, 'id'>){ setItems(prev => [{ id: uid('bi'), ...it }, ...prev]); setBookFor(null); }
  function removeItem(id:string){ setItems(prev => prev.filter(i=>i.id!==id)); }
  function resetDemo(){ setPlans(billingPlansSeed); setItems(billingItemsSeed); }
  function exportCSV(){
    const header = ['Monat','Patient','Zimmer','Kasse','PG','Budget Sach','Verbraucht Sach','Rest Sach','Budget Entl','Verbraucht Entl','Rest Entl','Eigenanteil'];
    const rowsCsv = rows.map(r => [
      month, r.fullName, r.room ?? '', r.insurerName, r.careLevel,
      r.budgetSach, r.usedSach, (r.budgetSach - r.usedSach),
      r.budgetEntl, r.usedEntl, (r.budgetEntl - r.usedEntl),
      r.copay
    ]);
    const csv = [header, ...rowsCsv].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(';')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`abrechnung_${month}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  // auto demo: füllt schnell Werte im aktuellen Monat
  function autoDemo(){
    const pats = plans.map(p=>p.patientId);
    const add = (pid:string, cat:BillingCategory, desc:string, amt:number, day=15) =>
      addItem({ patientId: pid, date: `${month}-${String(day).padStart(2,'0')}`, category: cat, description: desc, amount: amt, coveredBy: cat==='Eigenanteil'?'Eigenanteil':'Budget' });
    pats.slice(0,3).forEach((pid, i)=> add(pid,'Pflegesachleistung','Zusatzleistung (auto)', 200 + i*90, 10+i*3));
    pats.slice(2,5).forEach((pid, i)=> add(pid,'Entlastungsbetrag','Betreuung (auto)', 60 + i*30, 22+i));
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="h1">Pflegegrad & Abrechnung</h1>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="input w-[160px]" />
          <input placeholder="Suche Name…" className="input w-[180px]" value={q} onChange={e=>setQ(e.target.value)} />
          <select className="select w-[120px]" value={lvl} onChange={e=>setLvl(e.target.value)}>
            <option value="">PG: alle</option>
            <option value="1">PG 1</option><option value="2">PG 2</option><option value="3">PG 3</option><option value="4">PG 4</option><option value="5">PG 5</option>
          </select>
          <input placeholder="Kasse…" className="input w-[160px]" value={ins} onChange={e=>setIns(e.target.value)} />
          <select className="select w-[170px]" value={sortBy} onChange={e=>setSortBy(e.target.value as SortKey)}>
            <option value="name">Sortierung: Name</option>
            <option value="restSach">Sortierung: Rest Sachleistung</option>
            <option value="restEntl">Sortierung: Rest Entlastung</option>
            <option value="copay">Sortierung: Eigenanteil (absteigend)</option>
            <option value="care">Sortierung: Pflegegrad</option>
          </select>
          <button className="btn btn-soft" onClick={autoDemo}>Auto-Demo</button>
          <button className="btn btn-soft" onClick={resetDemo}>Demo zurücksetzen</button>
          <button className="btn btn-primary" onClick={exportCSV}>CSV Export</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-4 gap-3">
        <KPI title="Sachleistung (Monat)" value={`${euro(sumUsedSach)} / ${euro(sumBudgetSach)}`} ratio={clamp(sumUsedSach / Math.max(1,sumBudgetSach))} />
        <KPI title="Entlastungsbetrag (Monat)" value={`${euro(sumUsedEntl)} / ${euro(sumBudgetEntl)}`} ratio={clamp(sumUsedEntl / Math.max(1,sumBudgetEntl))} />
        <KPI title="Eigenanteile (Monat)" value={euro(sumCopay)} />
        <KPI title="Bewohner im Überblick" value={`${rows.length}`} subtitle="gefiltert" />
      </div>

      {/* Tabelle */}
      <div className="card p-0 overflow-auto">
        <table className="min-w-[960px] text-sm">
          <thead className="bg-sky-50 sticky top-0 z-10">
            <tr className="text-left">
              <th className="px-3 py-2 w-[280px]">Patient</th>
              <th className="px-3 py-2">Kasse</th>
              <th className="px-3 py-2">PG</th>
              <th className="px-3 py-2 w-[320px]">Sachleistung</th>
              <th className="px-3 py-2 w-[260px]">Entlastung</th>
              <th className="px-3 py-2">Eigenanteil</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r=>{
              const restSach = r.budgetSach - r.usedSach;
              const restEntl = r.budgetEntl - r.usedEntl;
              return (
                <tr key={r.patientId} className="border-t hover:bg-slate-50/60">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-sky-200 text-sky-900 grid place-items-center font-semibold">{initials(r.fullName)}</div>
                      <div>
                        <div className="font-medium">{r.fullName}</div>
                        <div className="text-xs text-slate-500">Zimmer {r.room ?? '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">{r.insurerName}</td>
                  <td className="px-3 py-2"><span className="badge badge-blue">PG {r.careLevel}</span></td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span>{euro(r.usedSach)}</span>
                      <span className={`${restSach<0?'text-red-700':'text-slate-600'}`}>
                        {euro(restSach)} Rest
                      </span>
                    </div>
                    <Progress value={clamp(r.usedSach / Math.max(1,r.budgetSach))} danger={restSach<0}/>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span>{euro(r.usedEntl)}</span>
                      <span className={`${restEntl<0?'text-red-700':'text-slate-600'}`}>
                        {euro(restEntl)} Rest
                      </span>
                    </div>
                    <Progress value={clamp(r.usedEntl / Math.max(1,r.budgetEntl))} danger={restEntl<0}/>
                  </td>
                  <td className="px-3 py-2">{euro(r.copay)}</td>
                  <td className="px-3 py-2">
                    {r.status==='ok'   && <span className="badge badge-green">Im grünen Bereich</span>}
                    {r.status==='warn' && <span className="badge badge-yellow">Achtung: hoch</span>}
                    {r.status==='over' && <span className="badge badge-red">Budget überschritten</span>}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button className="btn btn-soft" onClick={()=> setEditPlan(plans.find(p=>p.patientId===r.patientId) || null)}>Plan</button>
                      <button className="btn btn-soft" onClick={()=> setBookFor({patientId:r.patientId})}>Buchen</button>
                      <button className="btn btn-primary" onClick={()=>{
                        const pat = patients.find(p=>p.id===r.patientId);
                        setDetailFor({ patientId:r.patientId, name: pat?.fullName ?? r.fullName });
                      }}>Details</button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length===0 && (
              <tr><td className="px-3 py-6 text-slate-500" colSpan={8}>Keine Einträge für Filter.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {editPlan && (
        <PlanModal
          plan={editPlan}
          onClose={()=>setEditPlan(null)}
          onSave={savePlan}
        />
      )}
      {bookFor && (
        <BookModal
          patientId={bookFor.patientId}
          month={month}
          onClose={()=>setBookFor(null)}
          onSave={addItem}
        />
      )}
      {detailFor && (
        <DetailModal
          patientId={detailFor.patientId}
          name={detailFor.name}
          month={month}
          items={items.filter(i=>i.patientId===detailFor.patientId && isInMonth(i.date, month))}
          onDelete={removeItem}
          onClose={()=>setDetailFor(null)}
        />
      )}
    </div>
  );
}

/* ---------- UI Helpers ---------- */

function KPI({ title, value, ratio, subtitle }: { title:string; value:string; ratio?:number; subtitle?:string }) {
  return (
    <div className="card">
      <div className="text-sm text-slate-600">{title}</div>
      <div className="text-xl font-semibold">{value}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>}
      {typeof ratio === 'number' && (
        <div className="mt-2">
          <div className="h-2 rounded-full bg-slate-200">
            <div className="h-2 rounded-full bg-sky-500" style={{width: `${Math.round(clamp(ratio)*100)}%`}} />
          </div>
        </div>
      )}
    </div>
  );
}

function Progress({value, danger}:{value:number; danger?:boolean}){
  return (
    <div className="h-2 rounded-full bg-slate-200 mt-1">
      <div className={`h-2 rounded-full ${danger?'bg-red-500':'bg-sky-500'}`} style={{width: `${Math.round(value*100)}%`}} />
    </div>
  );
}

/* ---------- Modals ---------- */

function PlanModal({ plan, onClose, onSave }:{
  plan: import('@/types/billing').BillingPlan;
  onClose: ()=>void;
  onSave: (p: import('@/types/billing').BillingPlan)=>void;
}){
  const [insurerName, setInsurerName] = useState(plan.insurerName);
  const [insurer, setInsurer] = useState(plan.insurer);
  const [careLevel, setCareLevel] = useState<number>(plan.careLevel);
  const [sach, setSach] = useState<number>(plan.budgets.sachleistung);
  const [geld, setGeld] = useState<number>(plan.budgets.pflegegeld);
  const [entl, setEntl] = useState<number>(plan.budgets.entlastung);
  const [validFrom, setValidFrom] = useState(plan.validFrom);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div className="card bg-white p-5 w-full max-w-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="h2">Plan bearbeiten</div>
          <button className="btn btn-soft" onClick={onClose}>×</button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <div className="label mb-1 text-sm text-slate-600">Kasse (Name)</div>
            <input className="input" value={insurerName} onChange={e=>setInsurerName(e.target.value)} />
          </label>
          <label className="block">
            <div className="label mb-1 text-sm text-slate-600">Kassentyp</div>
            <select className="select" value={insurer} onChange={e=>setInsurer(e.target.value as any)}>
              <option value="gesetzlich">gesetzlich</option>
              <option value="privat">privat</option>
              <option value="Beihilfe">Beihilfe</option>
            </select>
          </label>
          <label className="block">
            <div className="label mb-1 text-sm text-slate-600">Pflegegrad</div>
            <select className="select" value={careLevel} onChange={e=>setCareLevel(Number(e.target.value))}>
              <option value="1">PG 1</option><option value="2">PG 2</option><option value="3">PG 3</option><option value="4">PG 4</option><option value="5">PG 5</option>
            </select>
          </label>
          <label className="block">
            <div className="label mb-1 text-sm text-slate-600">gültig ab</div>
            <input type="date" className="input" value={validFrom} onChange={e=>setValidFrom(e.target.value)} />
          </label>

          <label className="block">
            <div className="label mb-1 text-sm text-slate-600">Budget Sachleistung (€ / Monat)</div>
            <input type="number" className="input" value={sach} onChange={e=>setSach(Number(e.target.value))} />
          </label>
          <label className="block">
            <div className="label mb-1 text-sm text-slate-600">Pflegegeld (Info, €/Monat)</div>
            <input type="number" className="input" value={geld} onChange={e=>setGeld(Number(e.target.value))} />
          </label>
          <label className="block sm:col-span-2">
            <div className="label mb-1 text-sm text-slate-600">Entlastungsbetrag (€ / Monat)</div>
            <input type="number" className="input" value={entl} onChange={e=>setEntl(Number(e.target.value))} />
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-soft" onClick={onClose}>Abbrechen</button>
          <button className="btn btn-primary" onClick={()=>{
            onSave({
              ...plan,
              insurerName: insurerName || plan.insurerName,
              insurer,
              careLevel: careLevel as CareLevel,
              budgets: { sachleistung: Number(sach)||0, pflegegeld: Number(geld)||0, entlastung: Number(entl)||0 },
              validFrom: validFrom || plan.validFrom,
            });
          }}>Speichern</button>
        </div>
      </div>
    </div>
  );
}

function BookModal({ patientId, month, onClose, onSave }:{
  patientId: string; month: string; onClose: ()=>void; onSave: (i: Omit<InvoiceItem,'id'>)=>void;
}){
  const pat = patients.find(p=>p.id===patientId);
  const [date, setDate] = useState(`${month}-15`);
  const [cat, setCat] = useState<BillingCategory>('Pflegesachleistung');
  const [desc, setDesc] = useState('');
  const [amt, setAmt] = useState<number>(0);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div className="card bg-white p-5 w-full max-w-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="h2">Buchung hinzufügen – {pat?.fullName ?? patientId}</div>
          <button className="btn btn-soft" onClick={onClose}>×</button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block">
            <div className="label mb-1 text-sm text-slate-600">Datum</div>
            <input type="date" className="input" value={date} onChange={e=>setDate(e.target.value)} />
          </label>
          <label className="block">
            <div className="label mb-1 text-sm text-slate-600">Kategorie</div>
            <select className="select" value={cat} onChange={e=>setCat(e.target.value as BillingCategory)}>
              <option>Pflegesachleistung</option>
              <option>Entlastungsbetrag</option>
              <option>Eigenanteil</option>
              <option>Sonstiges</option>
            </select>
          </label>
          <label className="block sm:col-span-2">
            <div className="label mb-1 text-sm text-slate-600">Beschreibung</div>
            <input className="input" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="z. B. Behandlungspflege" />
          </label>
          <label className="block">
            <div className="label mb-1 text-sm text-slate-600">Betrag (€)</div>
            <input type="number" className="input" value={amt} onChange={e=>setAmt(Number(e.target.value))} />
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-soft" onClick={onClose}>Abbrechen</button>
          <button className="btn btn-primary" onClick={()=>{
            if(!date || !desc || !amt) return alert('Bitte Datum, Beschreibung und Betrag angeben.');
            onSave({ patientId, date, category: cat, description: desc, amount: Number(amt), coveredBy: cat==='Eigenanteil'?'Eigenanteil':'Budget' });
          }}>Speichern</button>
        </div>
      </div>
    </div>
  );
}

function DetailModal({ patientId, name, month, items, onDelete, onClose }:{
  patientId: string; name: string; month: string;
  items: InvoiceItem[];
  onDelete: (id:string)=>void;
  onClose: ()=>void;
}){
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4">
      <div className="card bg-white p-5 w-full max-w-3xl">
        <div className="flex items-center justify-between mb-3">
          <div className="h2">Details {name} – {month}</div>
          <button className="btn btn-soft" onClick={onClose}>×</button>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-sky-50 sticky top-0">
              <tr className="text-left">
                <th className="px-3 py-2">Datum</th>
                <th className="px-3 py-2">Kategorie</th>
                <th className="px-3 py-2">Beschreibung</th>
                <th className="px-3 py-2">Betrag</th>
                <th className="px-3 py-2">Bezahlt aus</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(i=>(
                <tr key={i.id} className="border-t hover:bg-slate-50/60">
                  <td className="px-3 py-2">{i.date}</td>
                  <td className="px-3 py-2">{i.category}</td>
                  <td className="px-3 py-2">{i.description}</td>
                  <td className="px-3 py-2">{euro(i.amount)}</td>
                  <td className="px-3 py-2">{i.coveredBy ?? '—'}</td>
                  <td className="px-3 py-2">
                    <button className="btn btn-soft" onClick={()=>onDelete(i.id)}>🗑</button>
                  </td>
                </tr>
              ))}
              {items.length===0 && (
                <tr><td className="px-3 py-6 text-slate-500" colSpan={6}>Keine Buchungen im Monat.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
