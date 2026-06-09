import { useMemo, useState, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { BarChart3, ClipboardList, Download, LayoutDashboard, LogOut, Menu, PanelLeftClose, Plus, Sun, Moon, ChevronLeft, X } from "lucide-react"
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { exportSurveyResponsesToExcel, fetchDashboardSurveys } from "@/services/dashboardService"
import { logoutAdmin } from "@/auth/adminAuth"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"

const navigation = [
  { to: "/", label: "Inicio", helper: "Resumen", icon: LayoutDashboard },
  { to: "/analitica", label: "Analítica", helper: "Resultados", icon: BarChart3 },
  { to: "/encuestas", label: "Encuestas", helper: "Gestión", icon: ClipboardList },
]

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()

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

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen w-full">
        {/* ── Desktop Sidebar ── */}
        <motion.aside
          initial={false}
          animate={{ width: collapsed ? 80 : 256 }}
          className="hidden shrink-0 border-r border-[#26211e] bg-[#1a1614] lg:block relative"
        >
          <div className="sticky top-0 flex min-h-screen flex-col overflow-hidden">
            {/* ── Brand ── */}
            <div className="px-4 pt-6 pb-2">
              <div className="flex items-center gap-3">
                <img
                  src="/acaro-robusta-logo.png"
                  alt="ACARO"
                  className="h-10 w-10 shrink-0 rounded-full object-contain"
                />
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                      className="min-w-0"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#c4a14e]">
                        ACARO
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-white/70">
                        Panel Administrativo
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {!collapsed && (
                <div className="mt-4 h-px w-full bg-white/10" />
              )}
            </div>

            {/* ── Collapse button ── */}
            <div className={cn("px-4 pb-2", collapsed ? "flex justify-center" : "flex justify-end")}>
              <button
                onClick={() => setCollapsed((v) => !v)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/10 hover:text-white/70"
                title={collapsed ? "Expandir" : "Colapsar"}
              >
                <ChevronLeft
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    collapsed && "rotate-180"
                  )}
                />
              </button>
            </div>

            {/* ── Navigation ── */}
            <nav className="mt-1 flex-1 space-y-1 px-3">
              {navigation.map((item) => {
                const itemIsActive = location.pathname === item.to
                return (
                  <div key={item.to}>
                    <SidebarNavItem
                      {...item}
                      collapsed={collapsed}
                      onClick={() => setMobileOpen(false)}
                    />

                    {/* Survey sub-links (desktop) */}
                    {item.to === "/encuestas" && itemIsActive && !collapsed ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-1 ml-5 border-l border-white/10 pl-3"
                      >
                        <div className="max-h-[340px] space-y-0.5 overflow-y-auto pr-1">
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
                      </motion.div>
                    ) : null}
                  </div>
                )
              })}
            </nav>

            {/* ── Bottom section ── */}
            <div className="mt-auto space-y-2 px-3 pb-5">
              {/* Export button */}
              <button
                type="button"
                onClick={handleExport}
                disabled={!exportSurveyId || isExporting}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  "text-white/60 hover:bg-white/10 hover:text-white/90",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                  collapsed && "justify-center px-0"
                )}
                title={collapsed ? (isExporting ? "Exportando..." : "Exportar a Excel") : undefined}
              >
                <Download className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <span>{isExporting ? "Exportando..." : "Exportar a Excel"}</span>
                )}
              </button>

              {/* Dark / Light mode toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  "text-white/60 hover:bg-white/10 hover:text-white/90",
                  collapsed && "justify-center px-0"
                )}
                title={collapsed ? (theme === "dark" ? "Modo claro" : "Modo oscuro") : undefined}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4 shrink-0" />
                ) : (
                  <Moon className="h-4 w-4 shrink-0" />
                )}
                {!collapsed && (
                  <span>{theme === "dark" ? "Modo claro" : "Modo oscuro"}</span>
                )}
              </button>

              {!collapsed && (
                <div className="h-px w-full bg-white/10" />
              )}

              {/* Collapse indicator on small */}
              {collapsed && (
                <div className="h-px w-full bg-white/10" />
              )}
            </div>
          </div>
        </motion.aside>

        {/* ─── Mobile Overlay + Drawer ─── */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                onClick={() => setMobileOpen(false)}
              />

              {/* Drawer */}
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-[#1a1614] lg:hidden"
              >
                <div className="flex min-h-screen flex-col overflow-y-auto">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 pt-5 pb-2">
                    <div className="flex items-center gap-3">
                      <img
                        src="/acaro-robusta-logo.png"
                        alt="ACARO"
                        className="h-10 w-10 rounded-full object-contain"
                      />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#c4a14e]">
                          ACARO
                        </p>
                        <p className="mt-0.5 text-sm font-medium text-white/70">
                          Panel Administrativo
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setMobileOpen(false)}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-white/40 hover:bg-white/10 hover:text-white/70"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mx-4 mt-2 h-px bg-white/10" />

                  {/* Nav */}
                  <nav className="mt-4 flex-1 space-y-1 px-3">
                    {navigation.map((item) => {
                      const itemIsActive = location.pathname === item.to
                      return (
                        <div key={item.to}>
                          <SidebarNavItem
                            {...item}
                            collapsed={false}
                            onClick={() => setMobileOpen(false)}
                          />

                          {item.to === "/encuestas" && itemIsActive ? (
                            <div className="mt-1 ml-5 border-l border-white/10 pl-3">
                              <div className="max-h-[340px] space-y-0.5 overflow-y-auto pr-1">
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
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </nav>

                  {/* Bottom */}
                  <div className="mt-auto space-y-2 px-3 pb-5">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false)
                        handleExport()
                      }}
                      disabled={!exportSurveyId || isExporting}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white/90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Download className="h-4 w-4 shrink-0" />
                      <span>{isExporting ? "Exportando..." : "Exportar a Excel"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white/90"
                    >
                      {theme === "dark" ? (
                        <Sun className="h-4 w-4 shrink-0" />
                      ) : (
                        <Moon className="h-4 w-4 shrink-0" />
                      )}
                      <span>{theme === "dark" ? "Modo claro" : "Modo oscuro"}</span>
                    </button>

                    <div className="h-px bg-white/10" />

                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false)
                        handleLogout()
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400/80 transition-colors hover:bg-white/10 hover:text-red-300"
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ─── Main Column ─── */}
        <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-background">
          {/* ── Header ── */}
          <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              {/* Left: mobile hamburger + brand */}
              <div className="flex items-center gap-3 lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-lg"
                  onClick={() => setMobileOpen((value) => !value)}
                >
                  {mobileOpen ? (
                    <PanelLeftClose className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
                <img
                  src="/acaro-robusta-logo.png"
                  alt="ACARO"
                  className="h-8 w-8 rounded-full object-contain"
                />
                <span className="text-sm font-semibold text-foreground">ACARO</span>
              </div>

              {/* Left: breadcrumb (desktop) */}
              <div className="hidden items-center gap-2 lg:flex">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#927043]">
                  ACARO
                </span>
                <span className="text-xs text-muted-foreground">/</span>
                <span className="text-xs font-medium text-muted-foreground">
                  {currentPage}
                </span>
              </div>

              {/* Right: profile + logout */}
              <div className="flex items-center gap-2">
                <div className="hidden items-center gap-2 rounded-full border border-border bg-muted/50 py-1.5 pl-3 pr-1.5 sm:flex">
                  <span className="text-sm font-medium text-muted-foreground">ACARO OBC</span>
                  <img
                    src="/acaro-robusta-logo.png"
                    alt="ACARO"
                    className="h-7 w-7 rounded-full border border-border bg-background object-contain p-0.5"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="hidden h-9 gap-2 rounded-lg text-muted-foreground hover:text-foreground sm:flex"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm">Salir</span>
                </Button>
              </div>
            </div>
          </header>

          {/* ── Page Content ── */}
          <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            <Outlet />
          </main>

          {/* ── Footer ── */}
          <footer className="border-t border-border px-4 py-4 sm:px-6 lg:px-8">
            <p className="text-center text-xs text-muted-foreground">
              Desarrollado por Klhetvin G., Abdel N. y Andrey G.
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Sidebar Nav Item (dark sidebar)
   ───────────────────────────────────────────── */
function SidebarNavItem({
  to,
  label,
  helper,
  icon: Icon,
  collapsed,
  onClick,
}: {
  to: string
  label: string
  helper: string
  icon: typeof LayoutDashboard
  collapsed: boolean
  onClick?: () => void
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      end={to === "/"}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
          isActive
            ? "border-l-2 border-[#2f6f35] bg-white/[0.08] text-white"
            : "border-l-2 border-transparent text-white/50 hover:bg-white/[0.06] hover:text-white/80",
          collapsed && "justify-center px-0"
        )
      }
      title={collapsed ? label : undefined}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium leading-5">{label}</p>
          <p className="truncate text-[11px] text-white/40">{helper}</p>
        </div>
      )}
    </NavLink>
  )
}

/* ─────────────────────────────────────────────
   Sidebar Sub-Link (dark sidebar)
   ───────────────────────────────────────────── */
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
        "block rounded-md px-2.5 py-1.5 text-sm transition-colors",
        active
          ? "bg-white/[0.1] text-[#c4a14e]"
          : "text-white/40 hover:bg-white/[0.06] hover:text-white/70"
      )}
    >
      <div className="flex items-start gap-2">
        {icon ? <span className="mt-0.5 text-[#c4a14e]/70">{icon}</span> : null}
        <div className="min-w-0">
          <p className="line-clamp-2 text-[13px] font-medium leading-5">{label}</p>
          {helper ? (
            <p className="mt-0.5 text-[11px] text-white/30">{helper}</p>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
