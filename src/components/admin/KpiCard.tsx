import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string
  value: string | number
  subtitle: string
  icon: LucideIcon
}) {
  return (
    <Card className="rounded-[18px] border border-[#e0d4c4] bg-[#fcfaf5] shadow-none">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#7b6551]">{title}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[#3d3025]">{value}</p>
            <p className="mt-1 text-sm text-[#8a725b]">{subtitle}</p>
          </div>
          <div className="rounded-[14px] bg-white p-3 text-[#2f6f35]">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
