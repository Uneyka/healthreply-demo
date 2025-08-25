export type Patient = {
  id: string
  fullName: string
  room?: string
  birthDate?: string
  status: 'aktiv' | 'inaktiv'
  avatar?: string

  // Neues
  insuranceName?: string        // Krankenkasse
  insuranceId?: string          // Versichertennummer
  allergies?: string[]          // Allergien
  diet?: string                 // Ernährung (z. B. Normalkost, Diabetiker)
  primaryPhysician?: string     // Hausarzt
  notes?: string

  // Verknüpfungen
  relatives?: Array<{
    name: string
    relation?: string
    email?: string
  }>
}
