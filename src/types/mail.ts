export type MailFolder = 'INBOX' | 'SENT' | 'ARCHIVE' | 'SPAM';
export type Mailbox = {
  id: string;           // z.B. "user:pflege1@example.com" oder "shared:info@pflege.de"
  address: string;
  label: string;        // Anzeige
};

export type MailMessage = {
  id: string;
  mailboxId: string;
  folder: MailFolder;
  threadId: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  date: string;         // ISO
  body: string;         // Plain/HTML-ähnlich
  read: boolean;
  // Verknüpfung (optional)
  residentId?: string;
  contactEmail?: string;
};
