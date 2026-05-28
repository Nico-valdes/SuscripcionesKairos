import { createClient } from '@/lib/supabase/server'
import ClientsTable from './ClientsTable'
import { logout } from '@/app/actions/auth'
import { Plus, Users, CreditCard, DollarSign, LogOut, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  // 1. Get logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // 2. Fetch profiles where role = 'client' with their subscription details
  const { data: clients, error } = await supabase
    .from('profiles')
    .select('*, subscriptions(*)')
    .eq('role', 'client')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching clients:', error)
  }

  const clientsList = clients || []

  // 3. Compute stats
  const totalClients = clientsList.length
  const activeClients = clientsList.filter((c) => c.status === 'active').length
  const pendingClients = clientsList.filter((c) => c.status === 'pending_payment').length
  const suspendedClients = clientsList.filter((c) => c.status === 'suspended').length

  let estimatedMRR = 0
  clientsList.forEach((client) => {
    // Only calculate active subscriptions toward MRR
    if (client.status === 'active' && client.subscriptions && client.subscriptions[0]) {
      const sub = client.subscriptions[0]
      const amount = Number(sub.amount)
      if (sub.frequency === 'monthly') {
        estimatedMRR += amount
      } else if (sub.frequency === 'yearly') {
        estimatedMRR += amount / 12
      }
    }
  })

  // Format stats for rendering
  const stats = [
    {
      name: 'MRR Activo Estimado',
      value: `$${Math.round(estimatedMRR).toLocaleString('es-AR')} ARS`,
      description: 'Ingresos Mensuales Recurrentes',
      icon: DollarSign,
      color: 'text-indigo-400',
    },
    {
      name: 'Clientes Activos',
      value: activeClients.toString(),
      description: `${totalClients} clientes totales registrados`,
      icon: Users,
      color: 'text-emerald-400',
    },
    {
      name: 'Cobros Pendientes',
      value: pendingClients.toString(),
      description: 'Clientes sin adherir al débito',
      icon: CreditCard,
      color: 'text-amber-400',
    },
  ]

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-900/5 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-900/5 rounded-full blur-[130px] pointer-events-none" />

      {/* Admin Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/40 backdrop-blur-md relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
              <span className="font-bold text-white text-base">K</span>
            </div>
            <span className="font-bold text-lg text-white">Panel Administrador</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-500 bg-zinc-800/50 border border-zinc-800 px-2.5 py-1 rounded-full">
              Modo Agencia
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-900/50 rounded-lg transition-all flex items-center gap-1.5 text-sm"
              >
                <LogOut className="w-4.5 h-4.5" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Admin Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-8">
        
        {/* Title and Action Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Administración de Clientes</h1>
            <p className="text-zinc-400 text-sm mt-1">Crea nuevos accesos, asigna conceptos de cobro y supervisa suscripciones</p>
          </div>
          <Link
            href="/admin/new-client"
            className="flex items-center gap-2 py-2.5 px-4 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/20 transition-all text-sm select-none"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nuevo Cliente</span>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <div
                key={i}
                className="bg-zinc-950/40 backdrop-blur-md border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{stat.name}</span>
                    <p className="text-2xl font-black text-white mt-2">{stat.value}</p>
                    <span className="text-xs text-zinc-400 block mt-1.5">{stat.description}</span>
                  </div>
                  <div className={`p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Clients Table section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-tight">Listado de Suscriptores</h2>
          <ClientsTable initialClients={clientsList} />
        </div>

      </main>
    </div>
  )
}
