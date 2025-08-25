export type ShiftType = 'Früh' | 'Spät' | 'Nacht';

export type Shift = {
  id: string;
  userId: string;
  date: string;       // yyyy-mm-dd
  type: ShiftType;
  start: string;      // "06:00"
  end: string;        // "14:00" (Nacht kann über Mitternacht gehen, hier Demo-String)
  unit?: string;      // Station/Einheit
  notes?: string;
  status?: 'geplant' | 'bestätigt' | 'tausch-angefragt';
};

export type TimeOff = {
  id: string;
  userId: string;
  from: string;       // yyyy-mm-dd
  to: string;         // yyyy-mm-dd
  reason?: string;
  status: 'beantragt' | 'genehmigt' | 'abgelehnt';
};

export type CoverageReq = {
  date: string;       // yyyy-mm-dd
  type: ShiftType;
  required: number;   // Soll-Besetzung
};
