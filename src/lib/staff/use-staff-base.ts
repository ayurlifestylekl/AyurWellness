import { usePathname } from 'next/navigation'

export type StaffBase = '/console' | '/doctor'

/** Which staff portal a page belongs to, from its address. */
export function staffBaseOf(pathname: string | null | undefined): StaffBase {
  return pathname?.startsWith('/doctor') ? '/doctor' : '/console'
}

/**
 * The portal the current page is in (front desk "/console" or doctor
 * "/doctor"), so shared screens such as checkout keep their links in it.
 */
export function useStaffBase(): StaffBase {
  return staffBaseOf(usePathname())
}
