import { supabase } from '@/lib/supabaseClient'

const STORAGE_KEY = 'acaro_admin_session'

export type AdminSession = {
  id: string
  usuario: string
  loggedAt: string
}

type VerifyAdminLoginRow = {
  ok: boolean
  admin_id: string | null
  admin_usuario: string | null
}

export async function loginAdmin(usuario: string, password: string) {
  const cleanUser = usuario.trim()
  const cleanPassword = password

  if (!cleanUser || !cleanPassword) {
    throw new Error('Escribe usuario y contraseña.')
  }

  const { data, error } = await supabase.rpc('verify_admin_login', {
    p_usuario: cleanUser,
    p_password: cleanPassword,
  })

  if (error) {
    throw new Error('No se pudo validar el acceso. Revisa el script SQL del login.')
  }

  const row = Array.isArray(data) ? (data[0] as VerifyAdminLoginRow | undefined) : undefined

  if (!row?.ok || !row.admin_id || !row.admin_usuario) {
    throw new Error('Usuario o contraseña incorrectos.')
  }

  const session: AdminSession = {
    id: row.admin_id,
    usuario: row.admin_usuario,
    loggedAt: new Date().toISOString(),
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  return session
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null

  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as AdminSession
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function isAdminLoggedIn() {
  return !!getAdminSession()
}

export function logoutAdmin() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
