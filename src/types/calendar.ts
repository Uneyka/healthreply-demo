export type CalView = 'day' | 'week' | 'month';

export type CalEvent = {
  id: string;
  title: string;
  start: string;        // ISO
  end: string;          // ISO
  type: 'Termin' | 'Medikament' | 'Besuch' | 'Pflege' | 'System';
  patientId?: string;
  roomId?: string;
  contactId?: string;
  notes?: string;
};
