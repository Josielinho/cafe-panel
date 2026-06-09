import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ArrowRight, BarChart3, ClipboardList, CheckCircle2, Users } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { fetchDashboardSurveys } from "@/services/dashboardService"
import { MetricStrip } from "@/components/admin/MetricStrip"

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                  */
/* ------------------------------------------------------------------ */
const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */
export default function HomePage() {
  const navigate = useNavigate()
  const now = useMemo(() => new Date(), [])

  const formattedDate = format(now, "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: es,
  })

  const surveysQuery = useQuery({
    queryKey: ["dashboard-surveys"],
    queryFn: fetchDashboardSurveys,
  })

  const surveys = surveysQuery.data ?? []
  
  const metrics = useMemo(() => {
    const totalSurveys = surveys.length
    const publishedSurveys = surveys.filter(s => s.estado === 'publicada').length
    const totalResponses = surveys.reduce((sum, s) => sum + (s.response_count || 0), 0)
    
    return {
      totalSurveys,
      publishedSurveys,
      totalResponses
    }
  }, [surveys])

  const recentSurveys = useMemo(() => {
    // Just grab the first 4 for the dashboard preview
    return surveys.slice(0, 4)
  }, [surveys])

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8"
    >
      {/* ── 1. WELCOME ───────────────────────────────────────────── */}
      <motion.section variants={fadeUp} className="mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Bienvenidos al panel de encuestas de ACARO
          </h1>
          <p className="mt-2 text-base text-muted-foreground capitalize">
            {formattedDate}
          </p>
        </div>
      </motion.section>

      {/* ── 2. GLOBAL METRICS ──────────────────────────────────── */}
      <motion.section variants={fadeUp} className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Resumen General
        </h2>
        
        <div className="bg-background rounded-2xl border border-border">
           <MetricStrip items={[
              {
                 label: "Total Respuestas",
                 value: metrics.totalResponses,
                 subtitle: "En todas las encuestas",
                 icon: Users
              },
              {
                 label: "Encuestas Activas",
                 value: metrics.publishedSurveys,
                 subtitle: "Publicadas",
                 icon: CheckCircle2
              },
              {
                 label: "Total Encuestas",
                 value: metrics.totalSurveys,
                 subtitle: "Creadas en el sistema",
                 icon: ClipboardList
              }
           ]} />
        </div>
      </motion.section>

      {/* ── 3. RECENT SURVEYS ───────────────────────────────────── */}
      <motion.section variants={fadeUp} className="mb-8">
         <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
               Actividad Reciente
            </h2>
            <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
               <Link to="/encuestas">
                  Ver todas
                  <ArrowRight className="ml-2 h-4 w-4" />
               </Link>
            </Button>
         </div>

         <div className="bg-background rounded-2xl border border-border overflow-hidden">
            {surveysQuery.isLoading ? (
               <div className="p-8 text-center text-sm text-muted-foreground">
                  Cargando encuestas...
               </div>
            ) : recentSurveys.length > 0 ? (
               <div className="divide-y divide-border">
                  {recentSurveys.map(survey => (
                     <div key={survey.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                        <div className="min-w-0 flex-1">
                           <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground truncate">{survey.titulo}</h3>
                              <Badge variant="outline" className={survey.estado === 'publicada' ? 'border-primary/50 text-primary bg-primary/5 text-[10px]' : 'border-accent/50 text-accent bg-accent/5 text-[10px]'}>
                                 {survey.estado === 'publicada' ? 'Publicada' : 'Borrador'}
                              </Badge>
                           </div>
                           <p className="text-sm text-muted-foreground truncate">{survey.descripcion || 'Sin descripción'}</p>
                        </div>
                        <div className="flex items-center gap-4 sm:shrink-0 text-sm">
                           <div className="flex flex-col items-end">
                              <span className="font-medium text-foreground">{survey.response_count || 0}</span>
                              <span className="text-xs text-muted-foreground">respuestas</span>
                           </div>
                           <div className="h-8 w-px bg-border hidden sm:block"></div>
                           <Button variant="secondary" size="sm" onClick={() => navigate(`/analitica?survey=${survey.id}`)}>
                              <BarChart3 className="mr-2 h-4 w-4" />
                              Analítica
                           </Button>
                        </div>
                     </div>
                  ))}
               </div>
            ) : (
               <div className="p-8 text-center text-sm text-muted-foreground">
                  No hay encuestas creadas todavía.
               </div>
            )}
         </div>
      </motion.section>
    </motion.div>
  )
}
