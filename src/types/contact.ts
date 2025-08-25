export type Contact = {
  id: string
  fullName: string
  email: string
  phone?: string
  relation?: string

  residentId: string       // Patient ID (z. B. "p1")
  primary?: boolean        // Haupt-Ansprechpartner

  // Opt-In / Verifizierung
  verified?: boolean
  consentAt?: string | null

  // Benachrichtigungseinstellungen
  prefersEmail?: boolean
  prefersWeb?: boolean
  frequency?: 'sofort' | 'täglich' | 'wöchentlich'

  // Zustellstatus (Demo)
  bounceStatus?: 'ok' | 'soft-bounce' | 'hard-bounce'

  notes?: string
}
