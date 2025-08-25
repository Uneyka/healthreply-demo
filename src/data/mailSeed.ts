import type { Mailbox, MailMessage } from '@/types/mail';

export const mailboxes: Mailbox[] = [
  { id: 'user:pflege1@example.com', address: 'pflege1@example.com', label: 'Mein Postfach' },
  { id: 'shared:info@pflege.de',    address: 'info@pflege.de',      label: 'info@pflege.de (Shared)' },
];

export const mailSeed: MailMessage[] = [
  {
    id: 'm1',
    mailboxId: 'shared:info@pflege.de',
    folder: 'INBOX',
    threadId: 't-anna-p1',
    subject: 'Rückfrage zu Herrn Meier',
    from: 'anna@example.com',
    to: ['info@pflege.de'],
    date: new Date().toISOString(),
    body: 'Hallo, wie geht es meinem Vater heute? Beste Grüße, Anna',
    read: false,
    residentId: 'p1',
    contactEmail: 'anna@example.com'
  },
  {
    id: 'm2',
    mailboxId: 'user:pflege1@example.com',
    folder: 'SENT',
    threadId: 't-anna-p1',
    subject: 'Re: Rückfrage zu Herrn Meier',
    from: 'pflege1@example.com',
    to: ['anna@example.com'],
    date: new Date(Date.now()-3600_000).toISOString(),
    body: 'Hallo Anna, heute guter Vormittag, Spaziergang geplant. Viele Grüße!',
    read: true,
    residentId: 'p1',
    contactEmail: 'anna@example.com'
  }
];
