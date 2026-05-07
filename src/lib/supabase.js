import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Usa sessionStorage para isolar sessão por aba
// Cada aba tem seu próprio login independente
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: window.sessionStorage,
    storageKey: 'recorrenciaos-auth',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  }
})