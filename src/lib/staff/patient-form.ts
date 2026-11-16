// Shared by the patient form (client) and its page (server). Kept out of the
// 'use client' file: a server component importing a plain value from there gets
// a client reference instead of the object, so EMPTY_PATIENT.id looked set.

export interface PatientFormValues {
  id?: string
  fullName: string
  phone: string
  email: string
  gender: '' | 'female' | 'male'
  dateOfBirth: string
  address: string
  conditions: string
  allergies: string
  medications: string
  notes: string
}

export const EMPTY_PATIENT: PatientFormValues = {
  fullName: '',
  phone: '',
  email: '',
  gender: '',
  dateOfBirth: '',
  address: '',
  conditions: '',
  allergies: '',
  medications: '',
  notes: '',
}
