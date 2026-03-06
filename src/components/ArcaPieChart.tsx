interface Slice {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

interface ArcaPieChartProps {
  title: string;
  subtitle?: string;
  slices: Slice[];
  showBalances?: boolean;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);

export function ArcaPieChart({ title, subtitle, slices, showBalances }: ArcaPieChartProps) {
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  const nonZero = slices.filter((s) => s.percentage > 0);

  // SVG donut parameters
  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 58;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * radius;

  // Build segments
  let accumulated = 0;
  const segments = nonZero.map((slice) => {
    const dashLength = (slice.percentage / 100) * circumference;
    const dashGap = circumference - dashLength;
    const offset = circumference * 0.25 - accumulated; // start from top (12 o'clock)
    accumulated += dashLength;
    return { ...slice, dashArray: `${dashLength} ${dashGap}`, dashOffset: offset };
  });

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5">
      <div className="mb-1">
        <div className="text-sm font-semibold text-gray-900">{title}</div>
        {subtitle && <div className="text-[11px] text-gray-400">{subtitle}</div>}
      </div>

      <div className="flex flex-col items-center">
        {/* Donut */}
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mb-3">
          {/* Background circle */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth}
          />
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx={cx} cy={cy} r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={seg.dashArray}
              strokeDashoffset={seg.dashOffset}
              strokeLinecap="butt"
              className="transition-all duration-500"
            />
          ))}
          {/* Center text */}
          {showBalances && total > 0 && (
            <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="#374151">
              {fmt(total)}
            </text>
          )}
          {!showBalances && (
            <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="#374151">
              25% cada
            </text>
          )}
        </svg>

        {/* Legend */}
        <div className="w-full space-y-1.5">
          {slices.map((slice) => (
            <div key={slice.label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="text-gray-700">{slice.label}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <span className="font-medium">{slice.percentage.toFixed(1)}%</span>
                {showBalances && <span>{fmt(slice.value)}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
