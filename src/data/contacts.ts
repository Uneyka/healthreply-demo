import { Contact } from '@/types/contact'

export const contacts: Contact[] = [
  {
    id: 'c1',
    fullName: 'Anna Meier',
    email: 'anna@example.com',
    phone: '+49 151 1234567',
    relation: 'Tochter',
    residentId: 'p1',
    primary: true,
    verified: true,
    consentAt: '2025-07-14T09:10:00Z',
    prefersEmail: true,
    prefersWeb: true,
    frequency: 'sofort',
    bounceStatus: 'ok',
    notes: 'Berufstätig; bevorzugt kurze, positive Updates.'
  },
  {
    id: 'c2',
    fullName: 'Peter Schulz',
    email: 'peter@example.com',
    phone: '+49 170 7654321',
    relation: 'Sohn',
    residentId: 'p2',
    verified: false,
    consentAt: null,
    prefersEmail: true,
    prefersWeb: false,
    frequency: 'täglich',
    bounceStatus: 'ok',
    notes: 'Ist häufig unterwegs; Mails am Abend ok.'
  }
]
