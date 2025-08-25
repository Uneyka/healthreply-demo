export type DoseTime = 'morgens' | 'mittags' | 'abends' | 'nachts';

export type Medication = {
  id: string;
  residentId: string;
  name: string;                 // z. B. "Metformin"
  form: 'Tablette' | 'Tropfen' | 'Kapsel' | 'Salbe' | 'Injektion' | 'Sonstiges';
  strength?: string;            // "500 mg"
  dose?: string;                // Freitext: "1-0-1-0" oder "1 Tablette"
  times: DoseTime[];            // geplante Einnahmezeiten
  prn?: boolean;                // "bei Bedarf"
  notes?: string;               // Hinweise
};

export type StellenEvent = {
  id: string;
  date: string;                 // yyyy-mm-dd (Tag)
  shift: 'Früh' | 'Spät' | 'Nacht';
  residentId: string;
  medicationId: string;
  time: DoseTime;
  prepared: boolean;            // gestellt?
  given?: boolean;              // verabreicht? (optional für Demo)
  at: string;                   // ISO timestamp
};
