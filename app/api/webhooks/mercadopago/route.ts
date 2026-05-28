import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  // Read body JSON if present
  let body: any = {}
  try {
    body = await request.json()
  } catch (e) {
    // Body might not be JSON or empty (IPN request)
  }

  // Parse query params (Mercado Pago IPN sends query params instead of body)
  const { searchParams } = new URL(request.url)
  
  // Mercado Pago payload structure:
  // Webhook body: { "type": "subscription_authorized", "data": { "id": "12345" } }
  // IPN URL query: ?topic=payment&id=12345
  const topic = searchParams.get('topic') || body.type || body.action
  const id = searchParams.get('id') || (body.data && body.data.id) || body.id

  console.log(`[Mercado Pago Webhook] Received notification - Topic: ${topic}, ID: ${id}`)

  if (!id || !topic) {
    return NextResponse.json({ error: 'Faltan parámetros id o topic' }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()

  // 1. Handle Subscription / Preapproval Events
  if (topic === 'subscription_authorized' || topic === 'preapproval' || topic === 'authorized') {
    try {
      const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
        headers: {
          'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        },
      })

      if (!mpResponse.ok) {
        console.error(`[Mercado Pago Webhook] Failed to fetch preapproval ${id} from MP. Status: ${mpResponse.status}`)
        return NextResponse.json({ error: 'Error al consultar preaprobación en Mercado Pago' }, { status: 500 })
      }

      const mpData = await mpResponse.json()
      const preapprovalStatus = mpData.status // 'authorized', 'paused', 'cancelled', 'pending'

      console.log(`[Mercado Pago Webhook] Preapproval status: ${preapprovalStatus} for ID: ${id}`)

      // Look up subscription by either the subscriber preapproval ID or the plan ID
      const { data: subscription, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .or(`mp_preapproval_id.eq.${id},mp_preapproval_id.eq.${mpData.preapproval_plan_id}`)
        .single()

      if (subError || !subscription) {
        console.warn(`[Mercado Pago Webhook] Subscription not found in database for ID: ${id} or Plan ID: ${mpData.preapproval_plan_id}`)
        return NextResponse.json({ error: 'Suscripción no registrada en la base de datos' }, { status: 404 })
      }

      // If it matched the plan ID, update the DB record with the actual subscriber's ID
      if (subscription.mp_preapproval_id === mpData.preapproval_plan_id) {
        const { error: updateSubError } = await supabaseAdmin
          .from('subscriptions')
          .update({ mp_preapproval_id: id })
          .eq('id', subscription.id)
        
        if (updateSubError) {
          console.error(`[Mercado Pago Webhook] Failed to update subscription with subscriber ID:`, updateSubError)
        } else {
          console.log(`[Mercado Pago Webhook] Updated subscription ${subscription.id} preapproval_id from Plan ID ${mpData.preapproval_plan_id} to Subscriber ID ${id}`)
        }
      }

      // Map MP preapproval status to profiles status
      let profileStatus: 'pending_payment' | 'active' | 'suspended' = 'pending_payment'
      if (preapprovalStatus === 'authorized') {
        profileStatus = 'active'
      } else if (preapprovalStatus === 'paused') {
        profileStatus = 'suspended'
      } else if (preapprovalStatus === 'cancelled') {
        profileStatus = 'suspended' // Suspend account access on cancel
      }

      // Update client profile status
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({ status: profileStatus })
        .eq('id', subscription.user_id)

      if (profileError) {
        console.error(`[Mercado Pago Webhook] Error updating profile status:`, profileError)
        return NextResponse.json({ error: profileError.message }, { status: 500 })
      }

      console.log(`[Mercado Pago Webhook] Successfully updated user ${subscription.user_id} profile status to: ${profileStatus}`)
      return NextResponse.json({ success: true, status: profileStatus })
    } catch (err: any) {
      console.error(`[Mercado Pago Webhook] Exception processing subscription event:`, err)
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  // 2. Handle Payment Event (e.g. initial or recurring subscription payment charge)
  if (topic === 'payment') {
    try {
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: {
          'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        },
      })

      if (!mpResponse.ok) {
        console.error(`[Mercado Pago Webhook] Failed to fetch payment details for ${id}. Status: ${mpResponse.status}`)
        return NextResponse.json({ error: 'Error al consultar pago en Mercado Pago' }, { status: 500 })
      }

      const mpData = await mpResponse.json()
      const preapprovalId = mpData.preapproval_id // Key connecting recurring payment to subscription
      const status = mpData.status // 'approved', 'rejected', 'in_process', 'refunded', 'charged_back'

      console.log(`[Mercado Pago Webhook] Payment ${id} status: ${status}, Preapproval ID: ${preapprovalId}`)

      if (preapprovalId) {
        // Query matching subscription
        const { data: subscription, error: subError } = await supabaseAdmin
          .from('subscriptions')
          .select('*')
          .eq('mp_preapproval_id', preapprovalId)
          .single()

        if (subError || !subscription) {
          console.warn(`[Mercado Pago Webhook] No matching subscription found for payment preapproval ID ${preapprovalId}`)
          return NextResponse.json({ error: 'Suscripción no encontrada para el cobro' }, { status: 404 })
        }

        // Save payment history log in database (upserting on mp_payment_id)
        const { error: historyError } = await supabaseAdmin
          .from('payment_history')
          .upsert({
            subscription_id: subscription.id,
            mp_payment_id: id.toString(),
            amount_paid: mpData.transaction_amount,
            payment_status: status,
            paid_at: mpData.date_approved || mpData.date_created || new Date().toISOString(),
          }, {
            onConflict: 'mp_payment_id'
          })

        if (historyError) {
          console.error(`[Mercado Pago Webhook] Error saving payment log:`, historyError)
        }

        // Adjust profile status based on payment status
        let newProfileStatus: 'active' | 'suspended' | null = null
        if (status === 'approved') {
          newProfileStatus = 'active'
        } else if (status === 'rejected' || status === 'refunded' || status === 'charged_back') {
          newProfileStatus = 'suspended'
        }

        if (newProfileStatus) {
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ status: newProfileStatus })
            .eq('id', subscription.user_id)

          if (profileError) {
            console.error(`[Mercado Pago Webhook] Error updating profile status to ${newProfileStatus}:`, profileError)
          } else {
            console.log(`[Mercado Pago Webhook] Profile status for user ${subscription.user_id} updated to ${newProfileStatus} due to payment status.`)
          }
        }
      }

      return NextResponse.json({ success: true })
    } catch (err: any) {
      console.error(`[Mercado Pago Webhook] Exception processing payment event:`, err)
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  // Fallback for unhandled webhook events (e.g. generic merchant order notifications)
  return NextResponse.json({ message: `Webhook recibido y ignorado: Topic: ${topic}` }, { status: 200 })
}
