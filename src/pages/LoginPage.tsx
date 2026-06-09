import { FormEvent, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { loginAdmin } from '@/auth/adminAuth'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const redirectTo = useMemo(() => {
    const state = location.state as { from?: string } | null
    return state?.from || '/'
  }, [location.state])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await loginAdmin(usuario, password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* ── Left Side (Branding) ── */}
      <div className="hidden lg:flex lg:w-[60%] relative flex-col items-center justify-center bg-[#1a1614] overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1614] via-[#22562d]/20 to-[#c4a14e]/10 pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center text-center px-8"
        >
          <img
            src="/acaro-logo.png"
            alt="ACARO"
            className="w-48 h-48 object-contain mb-8 drop-shadow-2xl"
          />
          <h1 className="text-5xl font-bold text-white tracking-tight mb-2">ACARO</h1>
          <h2 className="text-2xl font-medium text-[#c4a14e] mb-4">Asociación Café Robusta OBC</h2>
          <p className="text-lg text-white/60 tracking-widest uppercase">Panel Administrativo</p>
        </motion.div>
      </div>

      {/* ── Right Side (Form) ── */}
      <div className="w-full lg:w-[40%] flex flex-col justify-center items-center px-6 py-12 relative bg-background">
        
        {/* Mobile Header (Only visible on small screens) */}
        <div className="lg:hidden absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-[#1a1614] to-background flex flex-col items-center justify-center pt-8 pb-4">
           <img
            src="/acaro-logo.png"
            alt="ACARO"
            className="w-20 h-20 object-contain mb-2"
          />
          <h1 className="text-xl font-bold text-white">ACARO</h1>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md z-10 mt-24 lg:mt-0"
        >
          <div className="mb-10 text-center lg:text-left">
            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Bienvenido</p>
            <h2 className="text-4xl font-bold tracking-tight mb-3">Iniciar sesión</h2>
            <p className="text-muted-foreground">Ingresa tus credenciales de administrador para continuar.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Usuario</label>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                autoComplete="username"
                placeholder="Tu usuario"
                className="w-full h-12 px-4 rounded-xl border border-input bg-background text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Tu contraseña"
                className="w-full h-12 px-4 rounded-xl border border-input bg-background text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {error ? (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 text-sm rounded-lg bg-destructive/10 text-destructive border border-destructive/20"
              >
                {error}
              </motion.div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-4 rounded-xl bg-primary text-primary-foreground font-medium shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                'Entrando...'
              ) : (
                <>
                  Ingresar
                  <LogIn className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-12 text-center text-xs text-muted-foreground">
            Este acceso protege la administración del panel.<br/>
            Desarrollado por Klhetvin G., Abdel N. y Andrey G.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
