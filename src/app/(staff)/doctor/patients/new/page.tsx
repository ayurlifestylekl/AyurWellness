import { requireStaff } from '@/lib/staff/guard'
import PatientFormScreen from '@/components/staff/screens/PatientFormScreen'

export const dynamic = 'force-dynamic'

// Shared with the front desk portal: see components/staff/screens/PatientFormScreen.tsx.
export default async function Page({ searchParams }: { searchParams: { edit?: string; from?: string } }) {
  const { db } = await requireStaff(['admin', 'doctor'])
  return <PatientFormScreen db={db} base="/doctor" searchParams={searchParams} />
}
