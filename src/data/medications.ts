import type { Medication } from '@/types/medication'

export const medications: Medication[] = [
  {
    id: 'm-metformin',
    residentId: 'p2',
    name: 'Metformin',
    form: 'Tablette',
    strength: '500 mg',
    dose: '1-0-1-0',
    times: ['morgens','abends'],
    notes: 'Zu den Mahlzeiten.'
  },
  {
    id: 'm-asa',
    residentId: 'p1',
    name: 'ASS',
    form: 'Tablette',
    strength: '100 mg',
    dose: '1-0-0-0',
    times: ['morgens'],
    notes: 'Magenschutz beachten.'
  },
  {
    id: 'm-vitd',
    residentId: 'p1',
    name: 'Vitamin D3',
    form: 'Tropfen',
    strength: '1000 IE',
    dose: '5 Tropfen',
    times: ['mittags'],
    prn: false
  },
  {
    id: 'm-paracetamol',
    residentId: 'p3',
    name: 'Paracetamol',
    form: 'Tablette',
    strength: '500 mg',
    dose: '1 Tablette',
    times: [],
    prn: true,
    notes: 'bei Bedarf, max. 4x/Tag'
  }
]
