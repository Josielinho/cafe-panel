interface Props {
  current: number;
  total: number;
  label?: string;
}

export default function ProgressBar({ current, total, label }: Props) {
  const percent = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-sm text-[#7a6659]">
        <span className="font-medium text-[#5f4a3d]">{label ?? 'Avance de la encuesta'}</span>
        <span>
          {current} de {total}
        </span>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#e7ddd0]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#b99063_0%,#2d5b3c_100%)] transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
