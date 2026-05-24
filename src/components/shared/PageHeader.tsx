import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  rightContent?: ReactNode;
}

export function PageHeader({ title, subtitle, rightContent }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0A0A0A] tracking-tight">{title}</h1>
        {subtitle && <p className="text-[#6B6B6B] text-sm mt-1">{subtitle}</p>}
      </div>
      {rightContent && <div className="flex items-center gap-3 flex-shrink-0">{rightContent}</div>}
    </div>
  );
}
