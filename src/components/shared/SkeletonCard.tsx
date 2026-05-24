interface Props { rows?: number; className?: string; }

export function SkeletonCard({ rows = 3, className = "" }: Props) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border border-[#E8E6E0] ${className}`}>
      <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-3 bg-gray-100 rounded animate-pulse mb-2" style={{ width: `${70 + (i % 3) * 10}%` }} />
      ))}
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr className="border-b border-[#E8E6E0]">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 bg-gray-100 rounded animate-pulse" style={{ width: `${50 + (i % 4) * 15}%` }} />
        </td>
      ))}
    </tr>
  );
}
