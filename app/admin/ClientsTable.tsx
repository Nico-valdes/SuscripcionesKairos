'use client'

import { useState } from 'react'
import { Search, ExternalLink, CreditCard, Shield, User, Filter, AlertTriangle, Copy, Check, Pencil } from 'lucide-react'
import Link from 'next/link'

interface Subscription {
  id: string
  concept: string
  amount: number
  frequency: string
  mp_init_point: string
  mp_preapproval_id: string
}

interface Client {
  id: string
  full_name: string
  email: string
  status: 'pending_payment' | 'active' | 'suspended'
  analytics_url: string | null
  subscriptions: Subscription[]
}

interface ClientsTableProps {
  initialClients: Client[]
}

export default function ClientsTable({ initialClients }: ClientsTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyPaymentLink = (link: string, subId: string) => {
    navigator.clipboard.writeText(link)
    setCopiedId(subId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Filter clients based on search and status
  const filteredClients = initialClients.filter((client) => {
    const matchesSearch = 
      client.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.subscriptions[0]?.concept || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = 
      statusFilter === 'all' || client.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Activo
          </span>
        )
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            Suspendido
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pendiente
          </span>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-zinc-950/20 border border-zinc-900 rounded-xl p-4">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-sm transition-all"
          />
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="w-4 h-4 text-zinc-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-300 text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Todos los Estados</option>
            <option value="active">Activos</option>
            <option value="pending_payment">Pendiente de Pago</option>
            <option value="suspended">Suspendidos</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-zinc-950/40 backdrop-blur-md border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          {filteredClients.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-900/20 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Servicio / Frecuencia</th>
                  <th className="px-6 py-4">Monto</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 text-sm">
                {filteredClients.map((client) => {
                  const sub = client.subscriptions[0]
                  return (
                    <tr key={client.id} className="hover:bg-zinc-900/10 transition-colors">
                      {/* Client Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-semibold uppercase">
                            {client.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{client.full_name}</p>
                            <p className="text-xs text-zinc-500">{client.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Subscription Concept & Frequency */}
                      <td className="px-6 py-4">
                        {sub ? (
                          <div>
                            <p className="text-zinc-200 font-medium">{sub.concept}</p>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                              {sub.frequency === 'yearly' ? 'Anual' : 'Mensual'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-600 italic text-xs">Sin suscripción</span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 font-semibold text-white">
                        {sub ? (
                          <span>${Number(sub.amount).toLocaleString('es-AR')} ARS</span>
                        ) : (
                          <span>-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">{getStatusBadge(client.status)}</td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {client.analytics_url && (
                            <a
                              href={client.analytics_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-all"
                              title="Ver Estadísticas (Looker)"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          {sub && (
                            <>
                              <button
                                type="button"
                                onClick={() => copyPaymentLink(sub.mp_init_point, sub.id)}
                                className="p-1.5 text-zinc-400 hover:text-[#009ee3] hover:bg-[#009ee3]/10 rounded-lg transition-all cursor-pointer"
                                title="Copiar Link de Cobro"
                              >
                                {copiedId === sub.id ? (
                                  <Check className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                              <a
                                href={sub.mp_init_point}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-zinc-400 hover:text-[#009ee3] hover:bg-[#009ee3]/10 rounded-lg transition-all"
                                title="Ir a link de pago"
                              >
                                <CreditCard className="w-4 h-4" />
                              </a>
                            </>
                          )}
                          <Link
                            href={`/admin/edit-client/${client.id}`}
                            className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-all"
                            title="Editar Cliente"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-zinc-500 space-y-2">
              <AlertTriangle className="w-8 h-8 text-zinc-600 mx-auto" />
              <p>No se encontraron clientes que coincidan con los filtros.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
