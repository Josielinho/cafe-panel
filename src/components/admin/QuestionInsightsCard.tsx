import { useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatQuestionType } from "@/lib/dashboardAnalytics"
import type { QuestionAnalyticsCard } from "@/types/dashboardTypes"

export type QuestionChartType = "barras" | "pastel" | "dona"

const chartPalette = ["#2f6f35", "#c4a14e", "#7a4a2b", "#86a86f", "#d7bf82", "#8d6548"]

export function QuestionInsightsCard({
  data,
  chartType,
  onChartTypeChange,
  onOpenResponse,
  onDeleteResponse,
  deletingResponseId,
}: {
  data: QuestionAnalyticsCard
  chartType: QuestionChartType
  onChartTypeChange: (value: QuestionChartType) => void
  onOpenResponse: (responseId: string) => void
  onDeleteResponse: (responseId: string) => void
  deletingResponseId?: string | null
}) {
  const [showAllResponses, setShowAllResponses] = useState(false)

  const chartData = useMemo(
    () =>
      data.distribution.map((item) => ({
        ...item,
        etiquetaCorta: item.etiqueta.length > 22 ? `${item.etiqueta.slice(0, 22)}…` : item.etiqueta,
      })),
    [data.distribution]
  )

  const summaryItems = data.respondentItems.slice(0, 4)

  return (
    <>
      <Card className="overflow-hidden border border-[#e4dccd] bg-white shadow-none">
        <CardContent className="p-0">
          <div className="border-b border-[#ece5d8] px-5 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="rounded-full bg-[#f6f1e4] text-[#7a644f] hover:bg-[#f6f1e4]">
                    {formatQuestionType(data.question.tipo_pregunta)}
                  </Badge>
                  {data.question.es_obligatoria ? (
                    <Badge variant="secondary" className="rounded-full bg-[#eef6ef] text-[#2f6f35] hover:bg-[#eef6ef]">
                      Obligatoria
                    </Badge>
                  ) : null}
                </div>
                <h4 className="mt-3 text-xl font-semibold leading-tight text-[#3d3025]">{data.question.texto_pregunta}</h4>
              </div>

              <div className="w-full max-w-[220px]">
                <Select value={chartType} onValueChange={(value: QuestionChartType) => onChartTypeChange(value)}>
                  <SelectTrigger className="h-10 border-[#e1d9cb] bg-[#fcfbf8] text-[#3d3025]">
                    <SelectValue placeholder="Tipo de gráfico" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="barras">Gráfico de barras</SelectItem>
                    <SelectItem value="pastel">Gráfico pastel</SelectItem>
                    <SelectItem value="dona">Gráfico dona</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid gap-0 xl:grid-cols-[0.95fr,0.85fr]">
            <div className="border-b border-[#ece5d8] px-5 py-5 xl:border-b-0 xl:border-r">
              <div className="grid gap-2 sm:grid-cols-3">
                <MiniStat label="Personas" value={data.uniqueRespondents} />
                <MiniStat label="Registros" value={data.totalAnswered} />
                <MiniStat label="Categorías" value={chartData.length} />
              </div>

              <div className="mt-5 h-[220px]">
                {chartData.length ? (
                  chartType === "barras" ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ebe4d9" horizontal={false} />
                        <XAxis type="number" tick={{ fill: "#7a6654", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <YAxis
                          type="category"
                          dataKey="etiquetaCorta"
                          width={150}
                          tick={{ fill: "#7a6654", fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip formatter={(value) => [value, "Registros"]} labelFormatter={(_, payload) => payload?.[0]?.payload?.etiqueta ?? ""} />
                        <Bar dataKey="valor" radius={[0, 8, 8, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`${entry.etiqueta}-${index}`} fill={chartPalette[index % chartPalette.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="valor"
                          nameKey="etiqueta"
                          innerRadius={chartType === "dona" ? 52 : 0}
                          outerRadius={78}
                          paddingAngle={2}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`${entry.etiqueta}-${index}`} fill={chartPalette[index % chartPalette.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value, "Registros"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  )
                ) : (
                  <EmptyBlock message="Todavía no hay respuestas." />
                )}
              </div>

              {chartData.length ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {chartData.slice(0, 6).map((item, index) => (
                    <div key={item.etiqueta} className="flex items-center justify-between rounded-xl border border-[#eee6da] bg-[#fcfbf8] px-3 py-2 text-sm text-[#6d665d]">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: chartPalette[index % chartPalette.length] }} />
                        <span className="truncate">{item.etiqueta}</span>
                      </div>
                      <span className="font-semibold text-[#3d3025]">{item.valor}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="px-5 py-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h5 className="text-base font-semibold text-[#3d3025]">Resumen de respuestas</h5>
                  <p className="mt-1 text-xs text-[#8b8177]">Mostrando {summaryItems.length} de {data.respondentItems.length} personas registradas.</p>
                </div>
                {data.respondentItems.length > 4 ? (
                  <Button type="button" variant="outline" className="h-9 border-[#e2dbcf] text-[#3d3025]" onClick={() => setShowAllResponses(true)}>
                    Ver más
                  </Button>
                ) : null}
              </div>
              <div className="space-y-2.5">
                {summaryItems.length ? (
                  summaryItems.map((item) => (
                    <ResponseRow
                      key={`${item.responseId}-${item.respondentName}`}
                      item={item}
                      onOpenResponse={onOpenResponse}
                      onDeleteResponse={onDeleteResponse}
                      deletingResponseId={deletingResponseId}
                    />
                  ))
                ) : (
                  <EmptyBlock message="No hay respuestas registradas." />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAllResponses} onOpenChange={setShowAllResponses}>
        <DialogContent className="max-w-3xl border-[#e0d4c4] bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#3d3025]">Todas las respuestas registradas</DialogTitle>
            <DialogDescription className="text-[#6d665d]">
              Revisa el listado completo y abre el detalle de cada persona cuando lo necesites.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {data.respondentItems.map((item) => (
              <ResponseRow
                key={`dialog-${item.responseId}-${item.respondentName}`}
                item={item}
                onOpenResponse={(responseId) => {
                  setShowAllResponses(false)
                  onOpenResponse(responseId)
                }}
                onDeleteResponse={onDeleteResponse}
                deletingResponseId={deletingResponseId}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ResponseRow({
  item,
  onOpenResponse,
  onDeleteResponse,
  deletingResponseId,
}: {
  item: QuestionAnalyticsCard["respondentItems"][number]
  onOpenResponse: (responseId: string) => void
  onDeleteResponse: (responseId: string) => void
  deletingResponseId?: string | null
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[14px] border border-[#ebe4d9] bg-[#fcfbf8] px-4 py-3">
      <button type="button" onClick={() => onOpenResponse(item.responseId)} className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-semibold text-[#3d3025]">{item.respondentName}</p>
        <p className="mt-1 truncate text-xs text-[#8b8177]">{item.fecha}</p>
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-xl text-[#9a5b42] hover:bg-[#f3ebe2] hover:text-[#7a4a2b]"
        onClick={() => onDeleteResponse(item.responseId)}
        disabled={deletingResponseId === item.responseId}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[#e8dfd1] bg-[#fcfbf8] px-4 py-3 text-sm text-[#6d665d]">
      <p className="text-lg font-semibold text-[#3d3025]">{value}</p>
      <p className="mt-1">{label}</p>
    </div>
  )
}

function EmptyBlock({ message }: { message: string }) {
  return <div className="rounded-[14px] bg-[#faf8f3] p-4 text-sm text-[#6d665d]">{message}</div>
}
