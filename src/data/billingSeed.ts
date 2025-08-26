import type { BillingPlan, InvoiceItem, CareLevel } from '@/types/billing';

// Vereinfachte (Demo) Budgets je Pflegegrad (€/Monat) – nicht rechtsverbindlich
const PG_SACH: Record<CareLevel, number> = { 1: 0, 2: 770, 3: 1300, 4: 1693, 5: 2095 };
const PG_GELD: Record<CareLevel, number> = { 1: 0, 2: 332, 3: 573, 4: 765, 5: 947 };

export const billingPlansSeed: BillingPlan[] = [
  { patientId: 'p1', insurer: 'gesetzlich', insurerName: 'AOK Bayern', careLevel: 3, budgets: { sachleistung: PG_SACH[3], pflegegeld: PG_GELD[3], entlastung: 125 }, validFrom: '2025-01-01' },
  { patientId: 'p2', insurer: 'gesetzlich', insurerName: 'TK',          careLevel: 4, budgets: { sachleistung: PG_SACH[4], pflegegeld: PG_GELD[4], entlastung: 125 }, validFrom: '2025-03-01' },
  { patientId: 'p3', insurer: 'privat',     insurerName: 'Allianz Privat', careLevel: 2, budgets: { sachleistung: PG_SACH[2], pflegegeld: PG_GELD[2], entlastung: 125 }, validFrom: '2025-05-15' },
  { patientId: 'p4', insurer: 'gesetzlich', insurerName: 'DAK',         careLevel: 5, budgets: { sachleistung: PG_SACH[5], pflegegeld: PG_GELD[5], entlastung: 125 }, validFrom: '2025-02-01' },
  { patientId: 'p5', insurer: 'gesetzlich', insurerName: 'Barmer',      careLevel: 3, budgets: { sachleistung: PG_SACH[3], pflegegeld: PG_GELD[3], entlastung: 125 }, validFrom: '2025-06-01' },
];

export const billingItemsSeed: InvoiceItem[] = [
  // p1 – leicht unter Budget
  { id: 'b1',  patientId: 'p1', date: '2025-08-01', category: 'Pflegesachleistung', description: 'Grundpflege (August)', amount: 650, coveredBy: 'Budget' },
  { id: 'b2',  patientId: 'p1', date: '2025-08-10', category: 'Entlastungsbetrag',  description: 'Betreuung (2h)',       amount: 60,  coveredBy: 'Budget' },
  { id: 'b3',  patientId: 'p1', date: '2025-08-18', category: 'Eigenanteil',        description: 'U/V',                   amount: 180, coveredBy: 'Eigenanteil' },

  // p2 – Sachleistung nahe am Limit
  { id: 'b4',  patientId: 'p2', date: '2025-08-05', category: 'Pflegesachleistung', description: 'Behandlungspflege',     amount: 980, coveredBy: 'Budget' },
  { id: 'b5',  patientId: 'p2', date: '2025-08-15', category: 'Pflegesachleistung', description: 'Grundpflege',           amount: 610, coveredBy: 'Budget' },
  { id: 'b6',  patientId: 'p2', date: '2025-08-20', category: 'Eigenanteil',        description: 'U/V',                   amount: 220, coveredBy: 'Eigenanteil' },

  // p3 – Entlastung genutzt, wenig Sachleistung
  { id: 'b7',  patientId: 'p3', date: '2025-08-03', category: 'Entlastungsbetrag',  description: 'Alltagshilfe (3h)',     amount: 90,  coveredBy: 'Budget' },
  { id: 'b8',  patientId: 'p3', date: '2025-08-21', category: 'Pflegesachleistung', description: 'Grundpflege',           amount: 250, coveredBy: 'Budget' },

  // p4 – Budget-Überschreitung demonstrieren
  { id: 'b9',  patientId: 'p4', date: '2025-08-06', category: 'Pflegesachleistung', description: 'Intensivpflege',        amount: 1800, coveredBy: 'Budget' },
  { id: 'b10', patientId: 'p4', date: '2025-08-22', category: 'Pflegesachleistung', description: 'Zusatzleistungen',      amount: 420,  coveredBy: 'Budget' },
  { id: 'b11', patientId: 'p4', date: '2025-08-24', category: 'Entlastungsbetrag',  description: 'Betreuung (4h)',        amount: 120,  coveredBy: 'Budget' },

  // p5 – „durchschnittlich“
  { id: 'b12', patientId: 'p5', date: '2025-08-02', category: 'Pflegesachleistung', description: 'Grundpflege',           amount: 500, coveredBy: 'Budget' },
  { id: 'b13', patientId: 'p5', date: '2025-08-12', category: 'Entlastungsbetrag',  description: 'Begleitung',            amount: 45,  coveredBy: 'Budget' },
  { id: 'b14', patientId: 'p5', date: '2025-08-19', category: 'Eigenanteil',        description: 'U/V',                   amount: 210, coveredBy: 'Eigenanteil' },
];
