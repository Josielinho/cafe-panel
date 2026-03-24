import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { extractRawAnswer, formatDateTime, formatQuestionType, getResponseDetail, getRespondentName } from "@/lib/dashboardAnalytics"
import type { DashboardQuestion, DashboardResponse } from "@/types/dashboardTypes"

export function ResponseDetailModal({
  open,
  onOpenChange,
  response,
  questions,
  onDeleteResponse,
  deleting,
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
  response?: DashboardResponse
  questions: DashboardQuestion[]
  onDeleteResponse?: (responseId: string) => void
  deleting?: boolean
}) {
  if (!response) {
    return <Dialog open={open} onOpenChange={onOpenChange} />
  }

  const respondentName = getRespondentName(response, questions)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-4xl border border-[#e2dbcf] bg-[#fcfaf6] p-0">
        <DialogHeader className="border-b border-[#ebe4d9] px-6 py-5 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <DialogTitle className="text-2xl text-[#3d3025]">{respondentName}</DialogTitle>
              <DialogDescription className="mt-2 text-sm text-[#6d665d]">
                Respuesta registrada el {formatDateTime(response.fecha_respuesta)}.
              </DialogDescription>
            </div>
            {onDeleteResponse ? (
              <Button
                type="button"
                variant="outline"
                className="border-[#e1d6ca] bg-white text-[#8d563d] hover:bg-[#f8efe8] hover:text-[#7a4a2b]"
                onClick={() => onDeleteResponse(response.id)}
                disabled={deleting}
              >
                Eliminar respuesta
              </Button>
            ) : null}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(88vh-110px)] px-6 py-6 sm:px-8">
          <div className="space-y-4 pb-4">
            {questions.map((question) => {
              const detail = getResponseDetail(response, question.id)
              const answer = extractRawAnswer(detail, question) || "Sin respuesta"
              return (
                <article key={question.id} className="rounded-[22px] border border-[#ebe4d9] bg-white p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="rounded-full bg-[#faf8f3] text-[#6d665d] hover:bg-[#faf8f3]">
                      {formatQuestionType(question.tipo_pregunta)}
                    </Badge>
                    {question.es_obligatoria ? (
                      <Badge variant="secondary" className="rounded-full bg-[#eef6ef] text-[#2f6f35] hover:bg-[#eef6ef]">
                        Obligatoria
                      </Badge>
                    ) : null}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-[#3d3025]">{question.texto_pregunta}</h3>
                  <div className="mt-4 rounded-[18px] bg-[#faf8f3] p-4 text-sm leading-7 text-[#6d665d]">{answer}</div>
                </article>
              )
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
