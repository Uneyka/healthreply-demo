import { Patient } from '@/types/patient'

export const patients: Patient[] = [
  {
    id: 'p1',
    fullName: 'Herr Meier',
    room: '101',
    birthDate: '1942-03-14',
    status: 'aktiv',
    avatar: 'https://i.pravatar.cc/100?img=12',
    notes: 'Geht gern spazieren, mag kurze Nachrichten.'
  },
  {
    id: 'p2',
    fullName: 'Frau Schulz',
    room: '102',
    birthDate: '1937-11-02',
    status: 'aktiv',
    avatar: 'https://i.pravatar.cc/100?img=32'
  },
  {
    id: 'p3',
    fullName: 'Frau Keller',
    room: '103',
    birthDate: '1930-06-21',
    status: 'inaktiv',
    avatar: 'https://i.pravatar.cc/100?img=5'
  }
]
