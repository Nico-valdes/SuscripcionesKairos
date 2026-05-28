import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import { CreditCard, AlertCircle, LogOut, CheckCircle, Shield } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function PaywallPage() {
  const supabase = await createClient()

  // 1. Get logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // 2. Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/')
  }

  // 3. Fetch user subscription details
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const statusText = profile.status === 'pending_payment' ? 'Pendiente de Pago' : 'Suspendida'
  const isSuspended = profile.status === 'suspended'

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col justify-center items-center relative overflow-hidden px-4">
      {/* Background radial effects */}
      <div className="absolute top-[-20%] left-[-15%] w-[800px] h-[800px] bg-red-900/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-15%] w-[800px] h-[800px] bg-orange-900/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Grid pattern */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:16px_28px] pointer-events-none"
        style={{ maskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 80%, transparent 100%)' }}
      />

      <div className="w-full max-w-xl relative z-10">
        {/* Header Warning */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
            isSuspended ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            <AlertCircle className="w-7 h-7" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            Activación de Suscripción Requerida
          </h1>
          <p className="text-sm text-zinc-400 max-w-md">
            Hola, <span className="text-zinc-200 font-medium">{profile.full_name}</span>. Tu cuenta está en estado <span className={`font-semibold ${isSuspended ? 'text-red-400' : 'text-amber-400'}`}>{statusText}</span>. Adhiérete al débito automático para continuar.
          </p>
        </div>

        {/* Invoice / Subscription Detail Card */}
        {subscription ? (
          <div className="bg-zinc-950/60 backdrop-blur-3xl border border-zinc-800/80 rounded-2xl p-6 shadow-2xl mb-6 relative overflow-hidden">
            {/* Top glass reflection */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />

            <div className="flex justify-between items-start border-b border-zinc-800 pb-5 mb-5">
              <div>
                <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold block mb-1">Concepto del Servicio</span>
                <h3 className="text-lg font-bold text-white">{subscription.concept}</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-zinc-500 uppercase tracking-widest font-semibold block mb-1">Monto</span>
                <p className="text-2xl font-extrabold text-white">
                  ${Number(subscription.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  <span className="text-xs text-zinc-400 font-normal"> ARS</span>
                </p>
                <span className="text-[10px] text-indigo-400 font-medium uppercase bg-indigo-500/10 px-2 py-0.5 rounded-full mt-1 inline-block">
                  {subscription.frequency === 'yearly' ? 'Anual' : 'Mensual'}
                </span>
              </div>
            </div>

            <div className="space-y-4 text-sm text-zinc-400 mb-6">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-4.5 h-4.5 text-zinc-600 flex-shrink-0" />
                <span>Débito automático recurrente con tarjeta de crédito/débito</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-4.5 h-4.5 text-zinc-600 flex-shrink-0" />
                <span>Acceso inmediato a tus reportes y analíticas web una vez completado</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-4.5 h-4.5 text-zinc-600 flex-shrink-0" />
                <span>Puedes pausar o cancelar la suscripción en cualquier momento</span>
              </div>
            </div>

            {/* Mercado Pago Checkout Button */}
            <a
              href={subscription.mp_init_point}
              className="w-full py-4 px-6 bg-[#009ee3] hover:bg-[#0087c4] text-white font-bold rounded-xl shadow-lg shadow-[#009ee3]/20 transition-all duration-200 flex items-center justify-center gap-2.5 text-base text-center cursor-pointer select-none group"
            >
              <CreditCard className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Suscribirse con Mercado Pago
            </a>

            {/* Security Notice */}
            <div className="flex items-center justify-center gap-2 mt-4 text-[11px] text-zinc-500">
              <Shield className="w-3.5 h-3.5" />
              <span>Transacción procesada de forma segura por Mercado Pago</span>
            </div>
          </div>
        ) : (
          <div className="bg-zinc-950/60 backdrop-blur-3xl border border-zinc-800/80 rounded-2xl p-8 text-center shadow-2xl mb-6">
            <p className="text-zinc-400">No encontramos ninguna suscripción configurada para tu cuenta.</p>
            <p className="text-xs text-zinc-500 mt-2">Por favor, comunícate con soporte de Kairos para asignar un concepto de cobro.</p>
          </div>
        )}

        {/* Action Buttons (Logout) */}
        <div className="flex justify-between items-center px-2">
          <form action={logout}>
            <button
              type="submit"
              className="text-xs text-zinc-400 hover:text-zinc-100 flex items-center gap-1.5 transition-colors py-2"
            >
              <LogOut className="w-4.5 h-4.5" />
              Cerrar sesión
            </button>
          </form>
          <span className="text-xs text-zinc-600">Suscripciones Kairos Portal</span>
        </div>
      </div>
    </div>
  )
}
