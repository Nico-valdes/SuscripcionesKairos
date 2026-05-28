'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Por favor, ingresa tu correo y contraseña.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Check for some common errors to translate them nicely
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'El correo electrónico o la contraseña son incorrectos.' }
    }
    return { error: error.message || 'Ocurrió un error al iniciar sesión.' }
  }

  // Redirect to root, where the proxy will redirect based on role
  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
