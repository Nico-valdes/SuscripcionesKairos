'use client'

import { useActionState, useEffect } from 'react'
import { updateClientAccount } from '@/app/actions/admin'
import { ArrowLeft, User, Mail, FileText, DollarSign, BarChart2, Shield, Settings } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Subscription {
  id: string
  concept: string
  amount: number
  frequency: string
  mp_init_point: string
  mp_preapproval_id: string
}

interface ClientProfile {
  id: string
  full_name: string
  email: string
  status: 'pending_payment' | 'active' | 'suspended'
  analytics_url: string | null
}

interface EditClientFormProps {
  profile: ClientProfile
  subscription: Subscription | null
}

export default function EditClientForm({ profile, subscription }: EditClientFormProps) {
  const router = useRouter()
  const [state, action, isPending] = useActionState(updateClientAccount, null)

  // Redirect on success
  useEffect(() => {
    if (state?.success) {
      router.push('/admin')
    }
  }, [state, router])

  return (
    <div className="bg-zinc-950/40 backdrop-blur-2xl border border-zinc-800/80 rounded-2xl p-8 shadow-2xl relative">
      <form action={action} className="space-y-6">
        {/* Hidden Client ID */}
        <input type="hidden" name="clientId" value={profile.id} />

        {/* Error Message */}
        {state?.error && (
          <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/50 text-red-300 text-sm">
            {state.error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Left Column: Account details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-900 pb-2 mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Datos de Cuenta
            </h3>

            {/* Full Name */}
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-xs font-semibold text-zinc-400 block">
                Nombre Completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  defaultValue={profile.full_name}
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-sm transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold text-zinc-400 block">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  defaultValue={profile.email}
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-sm transition-all"
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label htmlFor="status" className="text-xs font-semibold text-zinc-400 block">
                Estado de la Cuenta
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Shield className="w-4 h-4" />
                </div>
                <select
                  id="status"
                  name="status"
                  required
                  defaultValue={profile.status}
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-300 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                >
                  <option value="pending_payment">Pendiente de Pago</option>
                  <option value="active">Activo</option>
                  <option value="suspended">Suspendido</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Column: Subscription details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-900 pb-2 mb-3 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              Suscripción y Analíticas
            </h3>

            {/* Concept */}
            <div className="space-y-2">
              <label htmlFor="concept" className="text-xs font-semibold text-zinc-400 block">
                Concepto del Cobro
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <FileText className="w-4 h-4" />
                </div>
                <input
                  id="concept"
                  name="concept"
                  type="text"
                  required
                  defaultValue={subscription?.concept || ''}
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-sm transition-all"
                />
              </div>
            </div>

            {/* Amount and Frequency */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="amount" className="text-xs font-semibold text-zinc-400 block">
                  Monto (ARS)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    required
                    defaultValue={subscription?.amount || 0}
                    className="w-full pl-8 pr-3 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-sm transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="frequency" className="text-xs font-semibold text-zinc-400 block">
                  Frecuencia
                </label>
                <select
                  id="frequency"
                  name="frequency"
                  required
                  defaultValue={subscription?.frequency || 'monthly'}
                  className="w-full px-3 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-300 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
                >
                  <option value="monthly">Mensual</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>
            </div>

            {/* Analytics URL */}
            <div className="space-y-2">
              <label htmlFor="analyticsUrl" className="text-xs font-semibold text-zinc-400 block">
                URL de Reporte (Looker Studio)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <input
                  id="analyticsUrl"
                  name="analyticsUrl"
                  type="url"
                  defaultValue={profile.analytics_url || ''}
                  placeholder="https://lookerstudio.google.com/embed/..."
                  className="w-full pl-9 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-sm transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-zinc-900 flex justify-end gap-3">
          <Link
            href="/admin"
            className="py-2.5 px-5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-100 border border-zinc-800 rounded-xl transition-all text-sm select-none"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="py-2.5 px-6 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isPending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Guardar Cambios</span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
