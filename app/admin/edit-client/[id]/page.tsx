import { createClient } from '@/lib/supabase/server'
import EditClientForm from './EditClientForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditClientPage(props: PageProps) {
  const { id } = await props.params

  const supabase = await createClient()

  // 1. Fetch client profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (profileError || !profile) {
    console.error('Error fetching client profile:', profileError)
    redirect('/admin')
  }

  // 2. Fetch client subscription
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', id)
    .single()

  if (subError) {
    console.error('Error fetching client subscription:', subError)
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
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Editar Cliente</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Modifica los accesos, estadísticas y planes del cliente. Si cambias el monto o concepto, se regenerará el link de pago automáticamente.
          </p>
        </div>

        {/* Form component */}
        <EditClientForm profile={profile} subscription={subscription} />

      </main>
    </div>
  )
}
