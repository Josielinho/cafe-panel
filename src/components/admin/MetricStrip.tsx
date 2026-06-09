import { LucideIcon } from "lucide-react"

export interface MetricItem {
  label: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
}

export function MetricStrip({ items }: { items: MetricItem[] }) {
  return (
    <div className="metric-strip rounded-2xl border bg-background overflow-hidden">
      {items.map((item, i) => (
        <div key={item.label} className="flex flex-1">
          <div className="metric-item flex-1">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              {item.icon && <item.icon className="h-4 w-4" />}
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <p className="text-3xl font-semibold text-foreground tracking-tight">{item.value}</p>
            {item.subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{item.subtitle}</p>
            )}
          </div>
          {i < items.length - 1 && <div className="metric-divider hidden sm:block" />}
        </div>
      ))}
    </div>
  )
}
