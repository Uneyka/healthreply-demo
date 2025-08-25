import type { CalEvent } from '@/types/calendar';

const now = new Date();
const day = now.toISOString().split('T')[0];

export const calSeed: CalEvent[] = [
  {
    id: 'c1',
    title: 'Arztvisite – Herr Meier',
    start: `${day}T10:00:00`,
    end:   `${day}T10:30:00`,
    type: 'Termin',
    patientId: 'p1',
    notes: 'Routineuntersuchung'
  },
  {
    id: 'c2',
    title: 'Medikamentengabe Frau Schmidt',
    start: `${day}T08:00:00`,
    end:   `${day}T08:15:00`,
    type: 'Medikament',
    patientId: 'p2',
  },
  {
    id: 'c3',
    title: 'Besuch – Angehörige Anna bei Herrn Meier',
    start: `${day}T15:00:00`,
    end:   `${day}T16:00:00`,
    type: 'Besuch',
    patientId: 'p1',
    contactId: 'c1'
  },
  {
    id: 'c4',
    title: 'Pflege-Übergabe Frühschicht',
    start: `${day}T06:30:00`,
    end:   `${day}T07:00:00`,
    type: 'Pflege',
  },
];
