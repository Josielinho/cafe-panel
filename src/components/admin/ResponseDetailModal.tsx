import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { extractRawAnswer, formatDateTime, formatQuestionType, getResponseDetail, getRespondentName } from "@/lib/dashboardAnalytics"
import type { DashboardQuestion, DashboardResponse } from "@/types/dashboardTypes"
import { Trash2 } from "lucide-react"

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
      <DialogContent className="max-h-[90vh] max-w-4xl border border-border bg-background p-0 rounded-2xl overflow-hidden shadow-2xl gap-0">
        <DialogHeader className="border-b border-border px-6 py-6 sm:px-8 bg-muted/20">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">{respondentName}</DialogTitle>
              <DialogDescription className="mt-2 text-sm text-muted-foreground">
                Respuesta registrada el {formatDateTime(response.fecha_respuesta)}.
              </DialogDescription>
            </div>
            {onDeleteResponse ? (
              <Button
                type="button"
                variant="outline"
                className="text-destructive border-destructive/30 hover:bg-destructive/10 shrink-0"
                onClick={() => onDeleteResponse(response.id)}
                disabled={deleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </Button>
            ) : null}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] px-6 py-6 sm:px-8">
          <div className="space-y-5 pb-4">
            {questions.map((question) => {
              const detail = getResponseDetail(response, question.id)
              const answer = extractRawAnswer(detail, question) || "Sin respuesta"
              return (
                <article key={question.id} className="rounded-xl border border-border bg-background p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="rounded-full">
                      {formatQuestionType(question.tipo_pregunta)}
                    </Badge>
                    {question.es_obligatoria ? (
                      <Badge variant="outline" className="rounded-full border-destructive/50 text-destructive bg-destructive/5">
                        Obligatoria
                      </Badge>
                    ) : null}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground leading-tight">{question.texto_pregunta}</h3>
                  <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4 text-sm leading-7 text-foreground/90 whitespace-pre-wrap">{answer}</div>
                </article>
              )
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
