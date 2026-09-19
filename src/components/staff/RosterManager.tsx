'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Therapist, Vaidya } from '@/lib/staff/therapists'
import {
  createTherapist,
  updateTherapistName,
  toggleTherapistActive,
  createVaidya,
  updateVaidyaName,
  toggleVaidyaActive,
  toggleVaidyaPublicFacing,
} from '@/lib/staff/roster-actions'

interface Props {
  therapists: Therapist[]
  vaidyas: Vaidya[]
}

export default function RosterManager({ therapists, vaidyas }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<'therapists' | 'vaidyas'>('therapists')
  const [showAddTherapist, setShowAddTherapist] = useState(false)
  const [showAddVaidya, setShowAddVaidya] = useState(false)
  const [editingTherapist, setEditingTherapist] = useState<string | null>(null)
  const [editingVaidya, setEditingVaidya] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  // Therapist form state
  const [therapistCode, setTherapistCode] = useState('')
  const [therapistName, setTherapistName] = useState('')
  const [therapistGender, setTherapistGender] = useState<'male' | 'female'>('female')

  // Vaidya form state
  const [vaidyaCode, setVaidyaCode] = useState('')
  const [vaidyaName, setVaidyaName] = useState('')
  const [vaidyaPublicFacing, setVaidyaPublicFacing] = useState(true)

  const resetTherapistForm = () => {
    setTherapistCode('')
    setTherapistName('')
    setTherapistGender('female')
    setShowAddTherapist(false)
    setEditingTherapist(null)
    setError(null)
  }

  const resetVaidyaForm = () => {
    setVaidyaCode('')
    setVaidyaName('')
    setVaidyaPublicFacing(true)
    setShowAddVaidya(false)
    setEditingVaidya(null)
    setError(null)
  }

  const handleCreateTherapist = () => {
    setError(null)
    start(async () => {
      const res = await createTherapist({ code: therapistCode, name: therapistName, gender: therapistGender })
      if ('error' in res) setError(res.error)
      else {
        resetTherapistForm()
        router.refresh()
      }
    })
  }

  const handleUpdateTherapistName = (code: string, name: string) => {
    setError(null)
    start(async () => {
      const res = await updateTherapistName(code, name)
      if ('error' in res) setError(res.error)
      else {
        setEditingTherapist(null)
        router.refresh()
      }
    })
  }

  const handleToggleTherapistActive = (code: string, active: boolean) => {
    start(async () => {
      await toggleTherapistActive(code, active)
      router.refresh()
    })
  }

  const handleCreateVaidya = () => {
    setError(null)
    start(async () => {
      const res = await createVaidya({ code: vaidyaCode, name: vaidyaName, publicFacing: vaidyaPublicFacing })
      if ('error' in res) setError(res.error)
      else {
        resetVaidyaForm()
        router.refresh()
      }
    })
  }

  const handleUpdateVaidyaName = (code: string, name: string) => {
    setError(null)
    start(async () => {
      const res = await updateVaidyaName(code, name)
      if ('error' in res) setError(res.error)
      else {
        setEditingVaidya(null)
        router.refresh()
      }
    })
  }

  const handleToggleVaidyaActive = (code: string, active: boolean) => {
    start(async () => {
      await toggleVaidyaActive(code, active)
      router.refresh()
    })
  }

  const handleToggleVaidyaPublicFacing = (code: string, publicFacing: boolean) => {
    start(async () => {
      await toggleVaidyaPublicFacing(code, publicFacing)
      router.refresh()
    })
  }

  const inp = 'rounded-lg border border-accent/30 px-3 py-2 font-body text-[13px] text-dark focus:border-accent focus:outline-none'
  const btn = 'rounded-lg px-4 py-2 font-heading text-[11px] font-bold uppercase tracking-[0.14em] transition-colors'
  const btnPrimary = `${btn} bg-accent text-white hover:bg-accent/90 disabled:opacity-60`
  const btnSecondary = `${btn} border border-accent/30 text-accent hover:bg-accent/5`

  return (
    <div>
      {/* Tabs */}
      <div className="mb-5 flex gap-2 border-b border-accent/20">
        <button
          onClick={() => setTab('therapists')}
          className={`px-4 py-2 font-heading text-[12px] font-bold uppercase tracking-[0.14em] transition-colors ${
            tab === 'therapists'
              ? 'border-b-2 border-accent text-accent'
              : 'text-dark/50 hover:text-dark/70'
          }`}
        >
          Therapists
        </button>
        <button
          onClick={() => setTab('vaidyas')}
          className={`px-4 py-2 font-heading text-[12px] font-bold uppercase tracking-[0.14em] transition-colors ${
            tab === 'vaidyas'
              ? 'border-b-2 border-accent text-accent'
              : 'text-dark/50 hover:text-dark/70'
          }`}
        >
          Vaidyas
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 font-body text-[13px] text-red-800">
          {error}
        </div>
      )}

      {/* Therapists Tab */}
      {tab === 'therapists' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-[16px] font-bold text-dark">Therapists ({therapists.length})</h2>
            <button onClick={() => setShowAddTherapist(!showAddTherapist)} className={btnPrimary} disabled={pending}>
              {showAddTherapist ? 'Cancel' : '+ Add Therapist'}
            </button>
          </div>

          {showAddTherapist && (
            <div className="mb-5 rounded-xl border border-accent/30 bg-white p-5">
              <h3 className="mb-3 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-accent">New Therapist</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-dark/60">Code *</label>
                  <input
                    value={therapistCode}
                    onChange={(e) => setTherapistCode(e.target.value.toUpperCase())}
                    placeholder="e.g. NT02"
                    className={inp}
                    disabled={pending}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-dark/60">Name *</label>
                  <input
                    value={therapistName}
                    onChange={(e) => setTherapistName(e.target.value)}
                    placeholder="e.g. Nithin"
                    className={inp}
                    disabled={pending}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-dark/60">Gender *</label>
                  <select value={therapistGender} onChange={(e) => setTherapistGender(e.target.value as 'male' | 'female')} className={inp} disabled={pending}>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                  </select>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={handleCreateTherapist} className={btnPrimary} disabled={pending}>
                  Create
                </button>
                <button onClick={resetTherapistForm} className={btnSecondary} disabled={pending}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-accent/30 bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-accent/20 bg-cream/40">
                  <th className="px-4 py-3 text-left font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-dark/60">Code</th>
                  <th className="px-4 py-3 text-left font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-dark/60">Name</th>
                  <th className="px-4 py-3 text-left font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-dark/60">Gender</th>
                  <th className="px-4 py-3 text-left font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-dark/60">Status</th>
                  <th className="px-4 py-3 text-left font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-dark/60">Actions</th>
                </tr>
              </thead>
              <tbody>
                {therapists.map((t) => (
                  <tr key={t.code} className={`border-b border-accent/10 ${t.active === false ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-mono text-[12px] text-dark">{t.code}</td>
                    <td className="px-4 py-3">
                      {editingTherapist === t.code ? (
                        <input
                          defaultValue={t.name}
                          onBlur={(e) => handleUpdateTherapistName(t.code, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateTherapistName(t.code, e.currentTarget.value)
                            if (e.key === 'Escape') setEditingTherapist(null)
                          }}
                          className={`${inp} w-full`}
                          autoFocus
                          disabled={pending}
                        />
                      ) : (
                        <button
                          onClick={() => setEditingTherapist(t.code)}
                          className="font-body text-[13px] text-dark hover:text-accent"
                          disabled={pending}
                        >
                          {t.name}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 font-body text-[13px] capitalize text-dark/70">{t.gender}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-1 font-body text-[11px] font-semibold ${
                        t.active === false ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
                      }`}>
                        {t.active === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleTherapistActive(t.code, t.active === false)}
                        className="font-body text-[12px] text-accent hover:underline"
                        disabled={pending}
                      >
                        {t.active === false ? 'Activate' : 'Deactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vaidyas Tab */}
      {tab === 'vaidyas' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-[16px] font-bold text-dark">Vaidyas ({vaidyas.length})</h2>
            <button onClick={() => setShowAddVaidya(!showAddVaidya)} className={btnPrimary} disabled={pending}>
              {showAddVaidya ? 'Cancel' : '+ Add Vaidya'}
            </button>
          </div>

          {showAddVaidya && (
            <div className="mb-5 rounded-xl border border-accent/30 bg-white p-5">
              <h3 className="mb-3 font-heading text-[12px] font-bold uppercase tracking-[0.14em] text-accent">New Vaidya</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-dark/60">Code *</label>
                  <input
                    value={vaidyaCode}
                    onChange={(e) => setVaidyaCode(e.target.value.toUpperCase())}
                    placeholder="e.g. VAIDYA"
                    className={inp}
                    disabled={pending}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-dark/60">Name *</label>
                  <input
                    value={vaidyaName}
                    onChange={(e) => setVaidyaName(e.target.value)}
                    placeholder="e.g. Vaidya [Full Name]"
                    className={inp}
                    disabled={pending}
                  />
                </div>
              </div>
              <label className="mt-3 flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={vaidyaPublicFacing}
                  onChange={(e) => setVaidyaPublicFacing(e.target.checked)}
                  className="h-4 w-4 accent-[#006B3C]"
                  disabled={pending}
                />
                <span className="font-body text-[13px] text-dark/80">Public-facing (shown in customer consultation booking)</span>
              </label>
              <div className="mt-3 flex gap-2">
                <button onClick={handleCreateVaidya} className={btnPrimary} disabled={pending}>
                  Create
                </button>
                <button onClick={resetVaidyaForm} className={btnSecondary} disabled={pending}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-accent/30 bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-accent/20 bg-cream/40">
                  <th className="px-4 py-3 text-left font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-dark/60">Code</th>
                  <th className="px-4 py-3 text-left font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-dark/60">Name</th>
                  <th className="px-4 py-3 text-left font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-dark/60">Public</th>
                  <th className="px-4 py-3 text-left font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-dark/60">Status</th>
                  <th className="px-4 py-3 text-left font-heading text-[11px] font-bold uppercase tracking-[0.12em] text-dark/60">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vaidyas.map((v) => (
                  <tr key={v.code} className={`border-b border-accent/10 ${v.active === false ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-mono text-[12px] text-dark">{v.code}</td>
                    <td className="px-4 py-3">
                      {editingVaidya === v.code ? (
                        <input
                          defaultValue={v.name}
                          onBlur={(e) => handleUpdateVaidyaName(v.code, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdateVaidyaName(v.code, e.currentTarget.value)
                            if (e.key === 'Escape') setEditingVaidya(null)
                          }}
                          className={`${inp} w-full`}
                          autoFocus
                          disabled={pending}
                        />
                      ) : (
                        <button
                          onClick={() => setEditingVaidya(v.code)}
                          className="font-body text-[13px] text-dark hover:text-accent"
                          disabled={pending}
                        >
                          {v.name}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleVaidyaPublicFacing(v.code, v.publicFacing !== true)}
                        className="font-body text-[12px] text-accent hover:underline"
                        disabled={pending}
                      >
                        {v.publicFacing !== false ? 'Yes' : 'No'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-1 font-body text-[11px] font-semibold ${
                        v.active === false ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
                      }`}>
                        {v.active === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleVaidyaActive(v.code, v.active === false)}
                        className="font-body text-[12px] text-accent hover:underline"
                        disabled={pending}
                      >
                        {v.active === false ? 'Activate' : 'Deactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
