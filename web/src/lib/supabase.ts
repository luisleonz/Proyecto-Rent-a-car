import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url  = import.meta.env.VITE_SUPABASE_URL  as string
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Invite / password-recovery emails land as #access_token=…&type=invite (or #error=…).
// Read it before the client consumes and clears the hash.
const linkParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''))
let enlacePendiente = linkParams.get('access_token') ? linkParams.get('type') : null

export const errorDeEnlace = linkParams.get('error_code') ?? linkParams.get('error')

// Where to send a user right after their session appears
export function rutaTrasSesion() {
  return enlacePendiente === 'invite' || enlacePendiente === 'recovery' || enlacePendiente === 'signup'
    ? `/crear-contrasena?modo=${enlacePendiente === 'recovery' ? 'recuperar' : 'nueva'}`
    : '/app/home'
}
export function enlaceAtendido() { enlacePendiente = null }

export const supabase = createClient<Database>(url, key)
