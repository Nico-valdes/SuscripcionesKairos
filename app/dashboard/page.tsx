import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Percent, 
  CreditCard, 
  ShieldCheck, 
  LogOut, 
  ExternalLink,
  Laptop,
  Globe
} from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
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

  // Mock statistics for the client dashboard if analytics_url is empty
  const mockStats = [
    { name: 'Visitas Únicas', value: '14,248', change: '+12.4%', icon: Users, color: 'text-indigo-400' },
    { name: 'Duración Promedio', value: '2m 45s', change: '+4.8%', icon: Clock, color: 'text-emerald-400' },
    { name: 'Tasa de Rebote', value: '41.2%', change: '-2.3%', icon: Percent, color: 'text-rose-400' },
    { name: 'Conversiones', value: '384', change: '+18.1%', icon: TrendingUp, color: 'text-pink-400' },
  ]

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col relative overflow-hidden">
      {/* Background radial effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-900/5 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-900/5 rounded-full blur-[130px] pointer-events-none" />

      {/* Header / Topbar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/40 backdrop-blur-md relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-purple-300 bg-clip-text text-transparent">
              Kairos Analytics
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-medium text-zinc-200">{profile.full_name}</span>
              <span className="text-[11px] text-zinc-500">Cliente Activo</span>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-900/50 rounded-lg transition-all flex items-center gap-1.5 text-sm"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4.5 h-4.5" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: Analytics Report (Col-span 3) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Reporte de Performance Web</h2>
              <p className="text-sm text-zinc-400 mt-1">Estadísticas y comportamiento de tráfico en tiempo real</p>
            </div>
            {profile.analytics_url && (
              <a
                href={profile.analytics_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ver en pantalla completa</span>
              </a>
            )}
          </div>

          {/* Conditional Rendering: Google Looker Studio iframe or Simulated Dashboard */}
          {profile.analytics_url ? (
            <div className="relative w-full aspect-[16/9] bg-zinc-950/40 backdrop-blur-md border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
              <iframe
                src={profile.analytics_url}
                className="w-full h-full border-0"
                allowFullScreen
                loading="lazy"
              />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mockStats.map((stat, i) => {
                  const Icon = stat.icon
                  return (
                    <div key={i} className="bg-zinc-950/40 backdrop-blur-md border border-zinc-900 rounded-xl p-4.5 shadow-lg relative overflow-hidden">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">{stat.name}</span>
                        <Icon className={`w-4 h-4 ${stat.color}`} />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-white">{stat.value}</span>
                        <span className={`text-[10px] font-semibold ${
                          stat.change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {stat.change}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Mock Web Traffic SVG Chart */}
              <div className="bg-zinc-950/40 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">Historial de Tráfico (Últimos 30 días)</h3>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Tráfico Directo</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Búsquedas</span>
                  </div>
                </div>

                <div className="w-full h-64 relative">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                    <div className="border-b border-zinc-700 w-full" />
                    <div className="border-b border-zinc-700 w-full" />
                    <div className="border-b border-zinc-700 w-full" />
                    <div className="border-b border-zinc-700 w-full" />
                  </div>

                  {/* SVG Chart */}
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Indigo Chart Area */}
                    <path
                      d="M 0 80 Q 20 40, 40 55 T 80 25 T 100 10 L 100 100 L 0 100 Z"
                      fill="url(#indigo-grad)"
                      opacity="0.15"
                    />
                    {/* Indigo Line */}
                    <path
                      d="M 0 80 Q 20 40, 40 55 T 80 25 T 100 10"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Emerald Chart Area */}
                    <path
                      d="M 0 90 Q 25 70, 50 65 T 75 45 T 100 35 L 100 100 L 0 100 Z"
                      fill="url(#emerald-grad)"
                      opacity="0.1"
                    />
                    {/* Emerald Line */}
                    <path
                      d="M 0 90 Q 25 70, 50 65 T 75 45 T 100 35"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Gradients */}
                    <defs>
                      <linearGradient id="indigo-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="emerald-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                
                <div className="flex justify-between items-center text-xs text-zinc-500 border-t border-zinc-900 pt-3">
                  <span>Semana 1</span>
                  <span>Semana 2</span>
                  <span>Semana 3</span>
                  <span>Semana 4</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Subscription Details & Contract (Col-span 1) */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-white lg:opacity-0 pointer-events-none select-none hidden lg:block">Suscripción</h2>
          
          <div className="bg-zinc-950/40 backdrop-blur-md border border-zinc-800 rounded-2xl p-5 shadow-xl relative overflow-hidden space-y-5">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-400">Servicio Contratado</h3>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-400 font-semibold">Activo</span>
              </span>
            </div>

            {subscription ? (
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-zinc-500 block mb-0.5">Plan Contratado</span>
                  <p className="font-semibold text-white">{subscription.concept}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-zinc-500 block mb-0.5">Importe Recurrente</span>
                    <p className="font-bold text-white text-base">
                      ${Number(subscription.amount).toLocaleString('es-AR')}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500 block mb-0.5">Ciclo de Cobro</span>
                    <span className="text-xs text-indigo-400 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-full inline-block mt-0.5 uppercase">
                      {subscription.frequency === 'yearly' ? 'Anual' : 'Mensual'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-900 space-y-3.5 text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-zinc-500" />
                    <span>Débito Automático Activo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-500" />
                    <span>Suscripción Verificada</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-zinc-500 text-xs py-4 text-center">Cargando detalles del contrato...</p>
            )}
          </div>

          {/* Support Info Box */}
          <div className="bg-zinc-950/20 border border-zinc-900 rounded-2xl p-5 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-zinc-400">¿Necesitas Soporte?</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Si tienes dudas sobre las métricas mostradas, deseas actualizar tu sitio o reportar algún inconveniente, comunícate directamente con nuestro equipo.
            </p>
            <a 
              href={`mailto:soporte@kairos.app?subject=Soporte Portal Clientes - ${profile.full_name}`}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold inline-block pt-1 hover:underline"
            >
              soporte@kairos.app →
            </a>
          </div>
        </div>

      </main>
    </div>
  )
}
