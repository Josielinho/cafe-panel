import { ArrowRight, BarChart3, ClipboardList } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="space-y-4">
      <section className="acaro-surface overflow-hidden rounded-[24px] bg-[#fcfaf5]">
        <div className="grid gap-0 xl:grid-cols-[1.25fr,0.75fr]">
          <div className="border-b border-[#e8ddcf] px-6 py-8 sm:px-8 xl:border-b-0 xl:border-r">
            <p className="acaro-section-title">Panel</p>
            <h2 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight text-[#3d3025] sm:text-4xl">
              Resultados y gestión de encuestas en un solo espacio.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#6d665d]">
              Consulta respuestas, revisa tendencias y administra encuestas desde una misma vista.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-2xl bg-[#c4a14e] text-white hover:bg-[#b08f43]">
                <Link to="/analitica">
                  Abrir analítica
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-2xl border-[#d8ccb9] bg-transparent text-[#3d3025] hover:bg-[#f5efe4]">
                <Link to="/encuestas">Abrir encuestas</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-0 sm:grid-cols-2 xl:grid-cols-1">
            <ModuleLink
              title="Analítica"
              text="Actividad por fecha, picos y detalle por persona."
              to="/analitica"
              action="Ir a analítica"
              icon={BarChart3}
            />
            <ModuleLink
              title="Encuestas"
              text="Creación, edición y publicación de encuestas."
              to="/encuestas"
              action="Ir a encuestas"
              icon={ClipboardList}
            />
          </div>
        </div>
      </section>
    </div>
  )
}

function ModuleLink({
  title,
  text,
  to,
  action,
  icon: Icon,
}: {
  title: string
  text: string
  to: string
  action: string
  icon: typeof BarChart3
}) {
  return (
    <div className="border-t border-[#e8ddcf] px-6 py-6 first:border-t-0 xl:first:border-t-0 sm:first:border-r sm:last:border-r-0 xl:border-r-0 xl:border-t xl:first:border-t-0">
      <div className="flex items-start gap-4">
        <div className="rounded-[16px] bg-[#f5f1e6] p-3 text-[#2f6f35]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-semibold text-[#3d3025]">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#6d665d]">{text}</p>
          <Button asChild variant="link" className="mt-3 h-auto p-0 text-[#c4a14e]">
            <Link to={to}>{action}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
