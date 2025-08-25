export type Patient = {
  id: string
  fullName: string
  room?: string
  birthDate?: string
  status: 'aktiv' | 'inaktiv'
  avatar?: string
  notes?: string
}
