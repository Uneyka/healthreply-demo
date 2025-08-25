import { Patient } from '@/types/patient'

export const patients: Patient[] = [
  {
    id: 'p1',
    fullName: 'Herr Meier',
    room: '101',
    birthDate: '1942-03-14',
    status: 'aktiv',
    avatar: 'https://i.pravatar.cc/100?img=12',
    insuranceName: 'AOK Bayern',
    insuranceId: 'AOK-19420314-001',
    diet: 'Normalkost',
    allergies: ['Pollen (leicht)'],
    primaryPhysician: 'Dr. med. Schneider',
    notes: 'Geht gern spazieren, mag kurze Nachrichten.',
    relatives: [
      { name: 'Anna Meier', relation: 'Tochter', email: 'anna@example.com' }
    ]
  },
  {
    id: 'p2',
    fullName: 'Frau Schulz',
    room: '102',
    birthDate: '1937-11-02',
    status: 'aktiv',
    avatar: 'https://i.pravatar.cc/100?img=32',
    insuranceName: 'TK',
    insuranceId: 'TK-19371102-221',
    diet: 'Diabetiker',
    allergies: ['Penicillin'],
    primaryPhysician: 'MVZ Innenstadt',
    relatives: [
      { name: 'Peter Schulz', relation: 'Sohn', email: 'peter@example.com' }
    ]
  },
  {
    id: 'p3',
    fullName: 'Frau Keller',
    room: '103',
    birthDate: '1930-06-21',
    status: 'inaktiv',
    avatar: 'https://i.pravatar.cc/100?img=5',
    insuranceName: 'DAK Gesundheit',
    insuranceId: 'DAK-19300621-045',
    diet: 'Leichtverdaulich',
    allergies: [],
    primaryPhysician: 'Hausarztpraxis West',
    relatives: []
  }
]
