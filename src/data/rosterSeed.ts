import type { Shift, TimeOff, CoverageReq, ShiftType } from '@/types/roster';

function todayISO(d=new Date()){ return d.toISOString().slice(0,10); }
function addDays(iso:string, n:number){ const d=new Date(iso); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }

const WEEK_START = (()=>{ const d=new Date(); const w=(d.getDay()+6)%7; d.setDate(d.getDate()-w); return d.toISOString().slice(0,10); })();

export const defaultTimes: Record<ShiftType,{start:string,end:string}> = {
  'Früh':  { start:'06:00', end:'14:00' },
  'Spät':  { start:'14:00', end:'22:00' },
  'Nacht': { start:'22:00', end:'06:00' },
};

export const rosterSeed: Shift[] = [
  { id:'s1', userId:'u-pflege1', date: WEEK_START,           type:'Früh',  ...defaultTimes['Früh'],  unit:'1. OG', status:'geplant' },
  { id:'s2', userId:'u-pflege1', date: addDays(WEEK_START,1),type:'Spät',  ...defaultTimes['Spät'],  unit:'1. OG', status:'geplant' },
  { id:'s3', userId:'u-pdl',     date: addDays(WEEK_START,2),type:'Früh',  ...defaultTimes['Früh'],  unit:'Leitung', status:'bestätigt' },
];

export const timeOffSeed: TimeOff[] = [
  { id:'o1', userId:'u-pflege1', from:addDays(WEEK_START,3), to:addDays(WEEK_START,3), reason:'Arzt', status:'genehmigt' },
];

export const coverageSeed: CoverageReq[] = Array.from({length:7}, (_,i)=>i).flatMap(i => {
  const d = addDays(WEEK_START,i);
  return (['Früh','Spät','Nacht'] as ShiftType[]).map(t => ({
    date:d, type:t, required: t==='Nacht' ? 2 : 3
  }));
});
