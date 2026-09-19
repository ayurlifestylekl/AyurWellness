'use server'

import { revalidatePath } from 'next/cache'
import { requireStaff } from './guard'

type Ok = { ok: true }
type Err = { error: string }

/** Create a new therapist. Code is immutable after creation. */
export async function createTherapist(input: {
  code: string
  name: string
  gender: 'male' | 'female'
}): Promise<Ok | Err> {
  const { db } = await requireStaff(['admin', 'front_desk'])
  
  const code = input.code.trim().toUpperCase()
  const name = input.name.trim()
  
  if (!code || !/^[A-Z0-9_]{2,10}$/.test(code)) {
    return { error: 'Code must be 2-10 uppercase letters, numbers, or underscores.' }
  }
  if (!name) return { error: 'Name is required.' }
  if (input.gender !== 'male' && input.gender !== 'female') {
    return { error: 'Gender must be male or female.' }
  }
  
  const { error } = await db.from('therapists').insert({
    code,
    name,
    gender: input.gender,
    active: true,
  })
  
  if (error) {
    if (error.code === '23505') return { error: 'A therapist with this code already exists.' }
    return { error: error.message }
  }
  
  revalidatePath('/console/roster')
  revalidatePath('/console/schedule')
  revalidatePath('/console')
  return { ok: true }
}

/** Update a therapist's name. */
export async function updateTherapistName(code: string, name: string): Promise<Ok | Err> {
  const { db } = await requireStaff(['admin', 'front_desk'])
  
  const trimmed = name.trim()
  if (!trimmed) return { error: 'Name is required.' }
  
  const { error } = await db.from('therapists').update({ name: trimmed, updated_at: new Date().toISOString() }).eq('code', code)
  if (error) return { error: error.message }
  
  revalidatePath('/console/roster')
  revalidatePath('/console/schedule')
  revalidatePath('/console')
  return { ok: true }
}

/** Toggle a therapist's active status. */
export async function toggleTherapistActive(code: string, active: boolean): Promise<Ok | Err> {
  const { db } = await requireStaff(['admin', 'front_desk'])
  
  const { error } = await db.from('therapists').update({ active, updated_at: new Date().toISOString() }).eq('code', code)
  if (error) return { error: error.message }
  
  revalidatePath('/console/roster')
  revalidatePath('/console/schedule')
  revalidatePath('/console')
  return { ok: true }
}

/** Create a new Vaidya. Code is immutable after creation. */
export async function createVaidya(input: {
  code: string
  name: string
  publicFacing: boolean
}): Promise<Ok | Err> {
  const { db } = await requireStaff(['admin', 'front_desk'])
  
  const code = input.code.trim().toUpperCase()
  const name = input.name.trim()
  
  if (!code || !/^[A-Z0-9_]{2,10}$/.test(code)) {
    return { error: 'Code must be 2-10 uppercase letters, numbers, or underscores.' }
  }
  if (!name) return { error: 'Name is required.' }
  
  const { error } = await db.from('vaidyas').insert({
    code,
    name,
    public_facing: input.publicFacing,
    active: true,
  })
  
  if (error) {
    if (error.code === '23505') return { error: 'A Vaidya with this code already exists.' }
    return { error: error.message }
  }
  
  revalidatePath('/console/roster')
  revalidatePath('/console/schedule')
  revalidatePath('/console')
  return { ok: true }
}

/** Update a Vaidya's name. */
export async function updateVaidyaName(code: string, name: string): Promise<Ok | Err> {
  const { db } = await requireStaff(['admin', 'front_desk'])
  
  const trimmed = name.trim()
  if (!trimmed) return { error: 'Name is required.' }
  
  const { error } = await db.from('vaidyas').update({ name: trimmed, updated_at: new Date().toISOString() }).eq('code', code)
  if (error) return { error: error.message }
  
  revalidatePath('/console/roster')
  revalidatePath('/console/schedule')
  revalidatePath('/console')
  return { ok: true }
}

/** Toggle a Vaidya's active status. */
export async function toggleVaidyaActive(code: string, active: boolean): Promise<Ok | Err> {
  const { db } = await requireStaff(['admin', 'front_desk'])
  
  const { error } = await db.from('vaidyas').update({ active, updated_at: new Date().toISOString() }).eq('code', code)
  if (error) return { error: error.message }
  
  revalidatePath('/console/roster')
  revalidatePath('/console/schedule')
  revalidatePath('/console')
  return { ok: true }
}

/** Toggle a Vaidya's public_facing flag. */
export async function toggleVaidyaPublicFacing(code: string, publicFacing: boolean): Promise<Ok | Err> {
  const { db } = await requireStaff(['admin', 'front_desk'])
  
  const { error } = await db.from('vaidyas').update({ public_facing: publicFacing, updated_at: new Date().toISOString() }).eq('code', code)
  if (error) return { error: error.message }
  
  revalidatePath('/console/roster')
  revalidatePath('/console/schedule')
  revalidatePath('/console')
  return { ok: true }
}
