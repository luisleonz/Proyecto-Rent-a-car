package com.lucianos.rentacar.data.remote

import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest

// ─── TODO: Pega aquí tus credenciales de Supabase ────────────────────────────
// Las encuentras en: supabase.com → tu proyecto → Project Settings → API
const val SUPABASE_URL = "https://TU_PROJECT_ID.supabase.co"
const val SUPABASE_ANON_KEY = "TU_ANON_KEY"
// ─────────────────────────────────────────────────────────────────────────────

val supabase = createSupabaseClient(
    supabaseUrl = SUPABASE_URL,
    supabaseKey = SUPABASE_ANON_KEY
) {
    install(Postgrest)
    install(Auth)
}
