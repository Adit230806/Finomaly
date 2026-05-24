import type { ReactNode } from "react";

interface Props { icon?: ReactNode; title: string; subtitle?: string; }

export function EmptyState({ icon, title, subtitle }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-4xl text-[#C0C0C0]">{icon}</div>}
      <p className="text-[#0A0A0A] font-semibold text-base">{title}</p>
      {subtitle && <p className="text-[#6B6B6B] text-sm mt-1 max-w-xs">{subtitle}</p>}
    </div>
  );
}
