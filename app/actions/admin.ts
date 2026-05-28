'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createClientAccount(prevState: any, formData: FormData) {
  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const concept = formData.get('concept') as string
  const amountStr = formData.get('amount') as string
  const frequency = formData.get('frequency') as string // 'monthly' | 'yearly'
  const analyticsUrl = formData.get('analyticsUrl') as string

  // Validation
  if (!fullName || !email || !password || !concept || !amountStr || !frequency) {
    return { error: 'Por favor, completa todos los campos obligatorios.' }
  }

  const amount = parseFloat(amountStr)
  if (isNaN(amount) || amount <= 0) {
    return { error: 'El monto debe ser un número positivo.' }
  }

  const supabaseAdmin = createAdminClient()

  // 1. Create the Auth User
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: 'client'
    }
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      return { error: 'El correo electrónico ya se encuentra registrado.' }
    }
    return { error: `Error al crear usuario: ${authError.message}` }
  }

  const userId = authUser.user?.id
  if (!userId) {
    return { error: 'No se pudo obtener el ID del nuevo usuario.' }
  }

  // 2. Update the profile with analytics_url
  if (analyticsUrl) {
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({ analytics_url: analyticsUrl })
      .eq('id', userId)

    if (profileUpdateError) {
      // Clean up the user if profile update fails
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return { error: `Error al configurar perfil: ${profileUpdateError.message}` }
    }
  }

  // 3. Create Subscription in Mercado Pago
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://suscripciones-kairos.vercel.app'
    // Trim trailing slash from appUrl just in case
    const cleanAppUrl = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl

    const mpResponse = await fetch('https://api.mercadopago.com/preapproval_plan', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: concept,
        auto_recurring: {
          frequency: frequency === 'yearly' ? 12 : 1,
          frequency_type: 'months',
          transaction_amount: amount,
          currency_id: 'ARS',
        },
        back_url: `${cleanAppUrl}/dashboard`,
      }),
    })

    if (!mpResponse.ok) {
      const errorData = await mpResponse.json()
      console.error('Mercado Pago API error:', errorData)
      // Clean up the user since MP failed
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return { error: `Error de Mercado Pago: ${errorData.message || 'Error al generar link de cobro'}` }
    }

    const mpData = await mpResponse.json()

    // 4. Save subscription details in Supabase
    const { error: subError } = await supabaseAdmin.from('subscriptions').insert({
      user_id: userId,
      mp_preapproval_id: mpData.id,
      mp_init_point: mpData.init_point,
      concept,
      amount,
      frequency,
    })

    if (subError) {
      // Clean up user and subscription status
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return { error: `Error al registrar suscripción: ${subError.message}` }
    }

    // Success! Revalidate the admin dashboard
    revalidatePath('/admin')
    return { success: true, email, password, initPoint: mpData.init_point }
  } catch (error: any) {
    console.error('Network error calling Mercado Pago:', error)
    // Clean up
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return { error: 'Error de red al conectar con Mercado Pago. Inténtalo de nuevo.' }
  }
}

export async function updateClientAccount(prevState: any, formData: FormData) {
  const clientId = formData.get('clientId') as string
  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string
  const status = formData.get('status') as 'pending_payment' | 'active' | 'suspended'
  const analyticsUrl = formData.get('analyticsUrl') as string
  const concept = formData.get('concept') as string
  const amountStr = formData.get('amount') as string
  const frequency = formData.get('frequency') as 'monthly' | 'yearly'

  if (!clientId || !fullName || !email || !status || !concept || !amountStr || !frequency) {
    return { error: 'Por favor, completa todos los campos obligatorios.' }
  }

  const amount = parseFloat(amountStr)
  if (isNaN(amount) || amount <= 0) {
    return { error: 'El monto debe ser un número positivo.' }
  }

  const supabaseAdmin = createAdminClient()

  try {
    // 1. Update user auth email
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(clientId, {
      email,
      user_metadata: { full_name: fullName }
    })

    if (authError) {
      return { error: `Error al actualizar autenticación: ${authError.message}` }
    }

    // 2. Update user profile details
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: fullName,
        email,
        status,
        analytics_url: analyticsUrl || null
      })
      .eq('id', clientId)

    if (profileError) {
      return { error: `Error al actualizar perfil: ${profileError.message}` }
    }

    // 3. Get existing subscription
    const { data: existingSub, error: subFetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', clientId)
      .single()

    if (subFetchError) {
      return { error: `Suscripción no encontrada: ${subFetchError.message}` }
    }

    let newPreapprovalId = existingSub.mp_preapproval_id
    let newInitPoint = existingSub.mp_init_point

    // 4. If billing details changed, regenerate Mercado Pago plan
    if (
      existingSub.concept !== concept ||
      Number(existingSub.amount) !== amount ||
      existingSub.frequency !== frequency
    ) {
      console.log(`[Admin Action] Billing details changed for client ${clientId}. Regenerating Mercado Pago plan...`)
      
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://suscripciones-kairos.vercel.app'
      const cleanAppUrl = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl

      const mpResponse = await fetch('https://api.mercadopago.com/preapproval_plan', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: concept,
          auto_recurring: {
            frequency: frequency === 'yearly' ? 12 : 1,
            frequency_type: 'months',
            transaction_amount: amount,
            currency_id: 'ARS',
          },
          back_url: `${cleanAppUrl}/dashboard`,
        }),
      })

      if (!mpResponse.ok) {
        const errorData = await mpResponse.json()
        console.error('Mercado Pago API error:', errorData)
        return { error: `Error de Mercado Pago al regenerar plan: ${errorData.message || 'Error desconocido'}` }
      }

      const mpData = await mpResponse.json()
      newPreapprovalId = mpData.id
      newInitPoint = mpData.init_point
    }

    // 5. Update subscription record in Supabase
    const { error: subUpdateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        concept,
        amount,
        frequency,
        mp_preapproval_id: newPreapprovalId,
        mp_init_point: newInitPoint
      })
      .eq('id', existingSub.id)

    if (subUpdateError) {
      return { error: `Error al actualizar suscripción en base de datos: ${subUpdateError.message}` }
    }

    revalidatePath('/admin')
    return { success: true }
  } catch (error: any) {
    console.error('Error in updateClientAccount action:', error)
    return { error: `Ocurrió un error inesperado: ${error.message || error}` }
  }
}
