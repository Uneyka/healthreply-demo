export type CareLevel = 1 | 2 | 3 | 4 | 5;
export type InsurerType = 'gesetzlich' | 'privat' | 'Beihilfe';

export type BillingCategory =
  | 'Pflegesachleistung'
  | 'Entlastungsbetrag'
  | 'Eigenanteil'
  | 'Sonstiges';

export interface BillingPlan {
  patientId: string;
  insurer: InsurerType;
  insurerName: string;
  careLevel: CareLevel;
  budgets: {
    sachleistung: number;  // € / Monat
    pflegegeld: number;    // € / Monat (Info)
    entlastung: number;    // € / Monat (i. d. R. 125 €)
  };
  validFrom: string;       // ISO yyyy-mm-dd
}

export interface InvoiceItem {
  id: string;
  patientId: string;
  date: string;            // ISO yyyy-mm-dd
  category: BillingCategory;
  description: string;
  amount: number;          // €
  coveredBy?: 'Kasse' | 'Budget' | 'Eigenanteil';
}
