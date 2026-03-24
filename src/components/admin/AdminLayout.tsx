import { useMemo, useState, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { BarChart3, ClipboardList, Download, LayoutDashboard, LogOut, Menu, PanelLeftClose, Plus } from "lucide-react"
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { exportSurveyResponsesToExcel, fetchDashboardSurveys } from "@/services/dashboardService"
import { logoutAdmin } from "@/auth/adminAuth"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const navigation = [
  { to: "/", label: "Inicio", helper: "Resumen", icon: LayoutDashboard },
  { to: "/analitica", label: "Analítica", helper: "Resultados", icon: BarChart3 },
  { to: "/encuestas", label: "Encuestas", helper: "Gestión", icon: ClipboardList },
]

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const surveysQuery = useQuery({
    queryKey: ["dashboard-surveys"],
    queryFn: fetchDashboardSurveys,
    enabled: location.pathname === "/encuestas",
  })

  const currentPage = useMemo(() => {
    if (location.pathname === "/analitica") return "Analítica"
    if (location.pathname === "/encuestas") return "Encuestas"
    return "Inicio"
  }, [location.pathname])

  const selectedSurveyId = useMemo(() => new URLSearchParams(location.search).get("survey"), [location.search])
  const isCreateSurvey = useMemo(() => new URLSearchParams(location.search).get("mode") === "create", [location.search])
  const exportSurveyId = useMemo(() => {
    if (location.pathname === "/encuestas") return selectedSurveyId
    if (location.pathname === "/analitica") return selectedSurveyId
    return null
  }, [location.pathname, selectedSurveyId])


  const handleLogout = () => {
    logoutAdmin()
    navigate("/login", { replace: true })
  }

  const handleExport = async () => {
    if (!exportSurveyId) {
      toast.error("Selecciona una encuesta para exportar")
      return
    }

    try {
      setIsExporting(true)
      await exportSurveyResponsesToExcel(exportSurveyId)
      toast.success("Archivo listo para Excel")
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo exportar la encuesta"
      toast.error(message)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f9faf7] text-[#3d3025]">
      <div className="flex min-h-screen w-full">
        <aside className="hidden w-[268px] shrink-0 border-r border-[#e7e2d8] bg-white lg:block">
          <div className="sticky top-0 flex min-h-screen flex-col px-5 py-6">
            <BrandBlock />

            <div className="mt-8">
              <p className="acaro-section-title px-2">Navegación</p>
              <nav className="mt-3 space-y-1.5">
                {navigation.map((item) => {
                  const itemIsActive = location.pathname === item.to
                  return (
                    <div key={item.to}>
                      <NavItem {...item} onClick={() => setMobileOpen(false)} />

                      {item.to === "/encuestas" && itemIsActive ? (
                        <div className="mt-2 border-l border-[#e5dfd3] pl-4 ml-5">
                          <div className="max-h-[340px] space-y-1 overflow-y-auto pr-1">
                            <SidebarSubLink
                              to="/encuestas?mode=create"
                              label="Crear encuesta"
                              active={isCreateSurvey}
                              icon={<Plus className="h-3.5 w-3.5" />}
                            />
                            {(surveysQuery.data ?? []).map((survey) => (
                              <SidebarSubLink
                                key={survey.id}
                                to={`/encuestas?survey=${survey.id}`}
                                label={survey.titulo}
                                active={!isCreateSurvey && selectedSurveyId === survey.id}
                                helper={`${survey.question_count ?? 0} preg.`}
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </nav>
            </div>

            <div className="mt-auto">
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full justify-center rounded-2xl border-[#d8cfbf] bg-[#fafaf8] text-[#3d3025] hover:bg-[#f4efe5] disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleExport}
                disabled={!exportSurveyId || isExporting}
              >
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? "Exportando..." : "Exportar a Excel"}
              </Button>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-[#f9faf7]">
          <header className="sticky top-0 z-30 border-b border-[#e7e2d8] bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3 lg:hidden">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl border-[#ddd6c8] bg-white"
                  onClick={() => setMobileOpen((value) => !value)}
                >
                  {mobileOpen ? <PanelLeftClose className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
                <img src="/acaro-robusta-logo.png" alt="ACARO" className="h-10 w-10 rounded-full object-contain" />
                <div>
                  <p className="acaro-section-title">ACARO</p>
                  <p className="text-sm font-semibold text-[#3d3025]">Panel de encuestas</p>
                </div>
              </div>

              <div className="hidden min-w-0 lg:block">
                <p className="acaro-section-title">ACARO / {currentPage}</p>
                <h1 className="mt-1 text-[2rem] font-semibold leading-none text-[#3d3025]">{currentPage}</h1>
              </div>

              <div className="hidden items-center gap-3 md:flex">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-full border-[#ded5c5] bg-[#fafaf8] px-4 text-sm font-medium text-[#6d675e] hover:bg-[#f4efe5]"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Salir
                </Button>
                <div className="rounded-full border border-[#e0dacd] bg-[#fafaf8] px-4 py-2 text-sm font-medium text-[#6d675e]">
                  ACARO OBC
                </div>
                <img
                  src="/acaro-robusta-logo.png"
                  alt="ACARO"
                  className="h-11 w-11 rounded-full border border-[#e2dcd0] bg-white p-1 object-contain"
                />
              </div>
            </div>

            {mobileOpen ? (
              <div className="border-t border-[#eadfce] bg-white px-4 py-4 lg:hidden">
                <BrandBlock compact />
                <nav className="mt-4 space-y-2">
                  {navigation.map((item) => (
                    <NavItem key={item.to} {...item} onClick={() => setMobileOpen(false)} />
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2 h-11 w-full justify-center rounded-2xl border-[#d8cfbf] bg-[#fafaf8] text-[#3d3025] hover:bg-[#f4efe5]"
                    onClick={() => {
                      setMobileOpen(false)
                      handleLogout()
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar sesión
                  </Button>
                  {location.pathname === "/encuestas" ? (
                    <div className="ml-4 mt-3 space-y-1 border-l border-[#eadfce] pl-4">
                      <SidebarSubLink
                        to="/encuestas?mode=create"
                        label="Crear encuesta"
                        active={isCreateSurvey}
                        icon={<Plus className="h-3.5 w-3.5" />}
                        onClick={() => setMobileOpen(false)}
                      />
                      {(surveysQuery.data ?? []).map((survey) => (
                        <SidebarSubLink
                          key={survey.id}
                          to={`/encuestas?survey=${survey.id}`}
                          label={survey.titulo}
                          active={!isCreateSurvey && selectedSurveyId === survey.id}
                          helper={`${survey.question_count ?? 0} preg.`}
                          onClick={() => setMobileOpen(false)}
                        />
                      ))}
                    </div>
                  ) : null}
                </nav>
              </div>
            ) : null}
          </header>

          <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

function BrandBlock({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("overflow-hidden rounded-[22px] border border-[#e4ddd2] bg-white p-5", compact && "rounded-[18px]") }>
      <div className="flex items-center gap-4">
        <div className="rounded-[16px] bg-[#f5f1e8] p-2.5">
          <img src="/acaro-robusta-logo.png" alt="ACARO" className="h-12 w-12 rounded-full object-contain" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#927043]">ACARO</p>
          <h2 className="text-xl font-semibold text-[#3d3025]">Panel de encuestas</h2>
        </div>
      </div>
      <div className="mt-4 h-1 w-16 rounded-full bg-[#2f6f35]" />
      <p className="mt-4 text-sm leading-6 text-[#6d665d]">Gestión y resultados.</p>
    </div>
  )
}

function NavItem({
  to,
  label,
  helper,
  icon: Icon,
  onClick,
}: {
  to: string
  label: string
  helper: string
  icon: typeof LayoutDashboard
  onClick?: () => void
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-2xl px-4 py-3 transition",
          isActive
            ? "bg-[#eef5ee] text-[#22562d]"
            : "text-[#665e56] hover:bg-[#faf7f0] hover:text-[#3d3025]"
        )
      }
    >
      <div className="rounded-xl bg-[#f6f2ea] p-2 text-[#927043]">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{label}</p>
        <p className="truncate text-xs opacity-75">{helper}</p>
      </div>
    </NavLink>
  )
}

function SidebarSubLink({
  to,
  label,
  helper,
  active,
  icon,
  onClick,
}: {
  to: string
  label: string
  helper?: string
  active?: boolean
  icon?: ReactNode
  onClick?: () => void
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "block rounded-xl px-3 py-2 text-sm transition",
        active ? "bg-[#f5f1e6] text-[#6f552a]" : "text-[#6b635b] hover:bg-[#faf7f0] hover:text-[#3d3025]"
      )}
    >
      <div className="flex items-start gap-2">
        {icon ? <span className="mt-0.5 text-[#927043]">{icon}</span> : null}
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-medium leading-5">{label}</p>
          {helper ? <p className="mt-0.5 text-xs text-[#8b8177]">{helper}</p> : null}
        </div>
      </div>
    </Link>
  )
}
