export type Role = 'admin' | 'pdl' | 'pflege';
export type ModuleKey = 'dashboard' | 'patients' | 'medication' | 'relatives' | 'rooms' | 'admin';

export type User = {
  id: string;
  email: string;
  fullName: string;
  initials?: string;
  photo?: string;          // URL (Demo)
  role: Role;
  active: boolean;
  shortCode?: string;      // Kürzel z.B. FM
  phone?: string;

  modules: Record<ModuleKey, boolean>; // Modulfähigkeiten
  createdAt: string;
  lastLoginAt?: string;

  // Demo-Passwort (niemals so in echt!)
  password?: string;
};

export type OrgSettings = {
  orgName: string;
  emailDomain?: string;
  brandColor?: string;             // CSS color
  requirePDLApproval?: boolean;    // PDL-Freigabe Pflicht
  defaultFrequency?: 'sofort' | 'täglich' | 'wöchentlich';
  theme?: 'light' | 'dark' | 'blue';
};
