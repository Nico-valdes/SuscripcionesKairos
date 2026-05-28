'use client'

import { useActionState, useState, useEffect } from 'react'
import { createClientAccount } from '@/app/actions/admin'
import { ArrowLeft, User, Mail, Lock, FileText, DollarSign, Activity, RefreshCw, BarChart2, Check, Copy } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NewClientPage() {
  const router = useRouter()
  const [state, action, isPending] = useActionState(createClientAccount, null)
  const [tempPassword, setTempPassword] = useState('')
  const [copiedText, setCopiedText] = useState<string | null>(null)

  // Generate a random temporary password on load
  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setTempPassword(password)
  }

  useEffect(() => {
    generatePassword()
  }, [])

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(type)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const copyAll = () => {
    if (state?.success) {
      const text = `Acceso al Portal Kairos:\nEmail: ${state.email}\nContraseña Temporal: ${state.password}\nLink de Suscripción: ${state.initPoint}`
      copyToClipboard(text, 'all')
    }
  }

  if (state?.success) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-center items-center relative overflow-hidden px-4">
        {/* Background blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-900/5 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-900/5 rounded-full blur-[130px] pointer-events-none" />

        <div className="w-full max-w-lg bg-zinc-950/40 backdrop-blur-2xl border border-zinc-800 rounded-2xl p-8 shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-white">¡Cliente Creado con Éxito!</h1>
            <p className="text-xs text-zinc-400">Guarda estas credenciales antes de volver al panel.</p>
          </div>

          <div className="space-y-4 bg-zinc-900/40 border border-zinc-850 rounded-xl p-5 text-sm">
            <div className="space-y-1">
              <span className="text-xs text-zinc-500 block uppercase tracking-wider font-semibold">Correo de Acceso</span>
              <div className="flex justify-between items-center gap-2">
                <span className="text-white font-mono break-all">{state.email}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(state.email!, 'email')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex-shrink-0"
                >
                  {copiedText === 'email' ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            <div className="space-y-1 border-t border-zinc-900 pt-3">
              <span className="text-xs text-zinc-500 block uppercase tracking-wider font-semibold">Contraseña Temporal</span>
              <div className="flex justify-between items-center gap-2">
                <span className="text-white font-mono">{state.password}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(state.password!, 'password')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex-shrink-0"
                >
                  {copiedText === 'password' ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            <div className="space-y-1 border-t border-zinc-900 pt-3">
              <span className="text-xs text-zinc-500 block uppercase tracking-wider font-semibold">Link de Cobro (Mercado Pago)</span>
              <div className="flex justify-between items-start gap-4">
                <span className="text-zinc-300 font-mono text-xs break-all line-clamp-2">{state.initPoint}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(state.initPoint!, 'link')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex-shrink-0"
                >
                  {copiedText === 'link' ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={copyAll}
              className="flex-1 py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium rounded-xl transition-all text-sm flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              <span>{copiedText === 'all' ? '¡Todo Copiado!' : 'Copiar Todo el Acceso'}</span>
            </button>
            <Link
              href="/admin"
              className="flex-1 py-2.5 px-4 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/20 text-center transition-all text-sm flex items-center justify-center select-none"
            >
              Volver al Panel
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-900/5 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-900/5 rounded-full blur-[130px] pointer-events-none" />

      {/* Main Container */}
      <main className="max-w-2xl w-full mx-auto px-4 py-12 relative z-10 flex-1 flex flex-col justify-center">
        
        {/* Back Button */}
        <Link
          href="/admin"
          className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-100 text-sm mb-6 transition-colors self-start py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Panel</span>
        </Link>

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Registrar Nuevo Cliente</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Esto creará un usuario de acceso, iniciará un plan de suscripción en Mercado Pago y le asignará su dashboard de estadísticas.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-zinc-950/40 backdrop-blur-2xl border border-zinc-800/80 rounded-2xl p-8 shadow-2xl relative">
          <form action={action} className="space-y-6">
            {/* Error Message */}
            {state?.error && (
              <div className="p-4 rounded-xl bg-red-950/50 border border-red-800/50 text-red-300 text-sm">
                {state.error}
              </div>
            )}

            {/* Grid structure for two sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Client Credentials */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-900 pb-2 mb-3">
                  1. Cuenta de Acceso
                </h3>

                {/* Name */}
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
                      placeholder="Juan Pérez"
                      className="w-full pl-9 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-sm transition-all"
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
                      placeholder="cliente@correo.com"
                      className="w-full pl-9 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-sm transition-all"
                    />
                  </div>
                </div>

                {/* Temp Password */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-xs font-semibold text-zinc-400 block">
                    Contraseña Temporal
                  </label>
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type="text"
                        required
                        value={tempPassword}
                        onChange={(e) => setTempPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-sm transition-all font-mono"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-100 transition-colors"
                      title="Generar nueva contraseña"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Billing & Analytics */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-900 pb-2 mb-3">
                  2. Suscripción y Reportes
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
                      placeholder="Mantenimiento Mensual + Hosting"
                      className="w-full pl-9 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-sm transition-all"
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
                        placeholder="15000"
                        className="w-full pl-8 pr-3 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-sm transition-all"
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
                      defaultValue="monthly"
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
                    URL de Looker Studio / Reporte (Opcional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                      <BarChart2 className="w-4 h-4" />
                    </div>
                    <input
                      id="analyticsUrl"
                      name="analyticsUrl"
                      type="url"
                      placeholder="https://lookerstudio.google.com/embed/..."
                      className="w-full pl-9 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-sm transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
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
                  <span>Guardar y Generar Cobro</span>
                )}
              </button>
            </div>
          </form>
        </div>

      </main>
    </div>
  )
}
