import type { User, OrgSettings } from '@/types/user';

export const orgSeed: OrgSettings = {
  orgName: 'Muster Pflegeheim',
  emailDomain: 'example.com',
  brandColor: '#1c78ea',
  requirePDLApproval: true,
  defaultFrequency: 'täglich',
  theme: 'blue',
};

export const userSeed: User[] = [
  {
    id: 'u-admin',
    email: 'admin@example.com',
    fullName: 'Admin Muster',
    initials: 'AM',
    role: 'admin',
    active: true,
    shortCode: 'AM',
    phone: '+49 151 000000',
    modules: { dashboard:true, patients:true, medication:true, relatives:true, rooms:true, admin:true },
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    password: 'admin', // DEMO!
  },
  {
    id: 'u-pdl',
    email: 'pdl@example.com',
    fullName: 'Leitung Pflege',
    initials: 'LP',
    role: 'pdl',
    active: true,
    shortCode: 'LP',
    modules: { dashboard:true, patients:true, medication:true, relatives:true, rooms:true, admin:false },
    createdAt: new Date().toISOString(),
    password: 'pdl',
  },
  {
    id: 'u-pflege1',
    email: 'pflege1@example.com',
    fullName: 'Pflegekraft Eins',
    initials: 'PE',
    role: 'pflege',
    active: true,
    shortCode: 'PE',
    modules: { dashboard:true, patients:true, medication:true, relatives:false, rooms:false, admin:false },
    createdAt: new Date().toISOString(),
    password: 'pflege',
  }
];
