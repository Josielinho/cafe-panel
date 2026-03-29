import { FormEvent, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { loginAdmin } from '@/auth/adminAuth'

const palette = {
  bg: 'from-[#e7f5ff] via-[#f6fbff] to-[#f8f6f1]',
  card: 'bg-white/95',
  border: 'border-[#e6ddcf]',
  text: 'text-[#2f261f]',
  muted: 'text-[#7b6f64]',
  green: 'bg-[#2f6f35] hover:bg-[#275c2d]',
  gold: 'bg-[#c59f49]',
  brown: 'bg-[#7a4b2b]',
}

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
    <div className={`flex min-h-screen flex-col bg-gradient-to-b ${palette.bg} px-4 pt-8 sm:px-6 lg:px-8`}>
      <div className="mx-auto flex w-full flex-1 max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.05fr,0.95fr] lg:items-center">
          <div className="hidden lg:block">
            <div className="max-w-xl">
              <div className="mb-5 flex items-center gap-3">
                <img
                  src="/acaro-robusta-logo.png"
                  alt="ACARO"
                  className="h-14 w-14 rounded-2xl border border-[#eadfce] bg-white p-2 object-contain shadow-sm"
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#927043]">ACARO</p>
                  <h1 className="text-2xl font-semibold text-[#2f261f]">Panel de encuestas</h1>
                </div>
              </div>

              <h2 className="text-5xl font-semibold leading-[1.04] text-[#2f261f]">
                Acceso al panel de administración.
              </h2>
              <p className="mt-5 max-w-lg text-lg leading-8 text-[#6e665e]">
                Ingresa con el usuario del panel para administrar encuestas, revisar resultados y exportar información.
              </p>

              <div className="mt-8 flex items-center gap-4">
                <span className={`h-4 w-4 rounded-full ${palette.brown}`} />
                <span className={`h-4 w-4 rounded-full ${palette.gold}`} />
                <span className={`h-4 w-4 rounded-full ${palette.green.split(' ')[0]}`} />
              </div>
            </div>
          </div>

          <div className={`mx-auto w-full max-w-md rounded-[28px] border ${palette.border} ${palette.card} p-6 shadow-[0_20px_70px_rgba(45,35,22,0.08)] sm:p-8`}>
            <div className="mb-6 flex justify-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl border border-[#e8dfcf] bg-[#f8f4ec] text-[#2f6f35] shadow-sm">
                <LogIn className="h-7 w-7" />
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-3xl font-semibold text-[#2f261f]">Iniciar sesión</h2>
              <p className="mt-3 text-sm leading-6 text-[#7b6f64]">
                Usa el acceso del administrador para entrar al panel privado.
              </p>
            </div>

            <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#3b3027]">Usuario</label>
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  autoComplete="username"
                  placeholder="Tu usuario"
                  className="h-12 w-full rounded-2xl border border-[#e4dbcb] bg-[#fcfbf8] px-4 text-[#2f261f] outline-none transition focus:border-[#c59f49] focus:ring-2 focus:ring-[#efe1bf]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#3b3027]">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  className="h-12 w-full rounded-2xl border border-[#e4dbcb] bg-[#fcfbf8] px-4 text-[#2f261f] outline-none transition focus:border-[#c59f49] focus:ring-2 focus:ring-[#efe1bf]"
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-[#f0c8bf] bg-[#fff4f1] px-4 py-3 text-sm text-[#9d422e]">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 h-12 w-full rounded-2xl bg-[#2f6f35] px-4 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(47,111,53,0.18)] transition hover:bg-[#275c2d] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? 'Entrando...' : 'Ingresar'}
              </button>
            </form>

            <div className="mt-7 border-t border-[#efe5d6] pt-4 text-center text-xs leading-5 text-[#8a7d6f]">
              Este acceso protege la administración del panel.
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-8 py-6 text-center text-sm text-[#8a7d6f]">
        Este sistema fue desarrollado por Klhetvin G., Abdel N. y Andrey G.
      </footer>
    </div>
  )
}
