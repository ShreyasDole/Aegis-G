import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  variant?: 'default' | 'safe' | 'warning' | 'critical';
  icon?: React.ReactNode;
  subtext?: string;
  className?: string;
}

const variantBorder: Record<string, string> = {
  default:  'border-[rgba(255,255,255,0.05)]',
  safe:     'border-[rgba(16,185,129,0.2)]',
  warning:  'border-[rgba(249,115,22,0.2)]',
  critical: 'border-[rgba(239,68,68,0.2)]',
};

const variantText: Record<string, string> = {
  default:  'text-[#f3f4f6]',
  safe:     'text-[#10b981]',
  warning:  'text-[#f97316]',
  critical: 'text-[#ef4444]',
};

export function StatCard({ label, value, variant = 'default', icon, subtext, className = '' }: StatCardProps) {
  return (
    <div className={`card ${variantBorder[variant]} ${className}`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-2xs font-medium uppercase tracking-wider text-[#6b7280]">{label}</p>
        {icon && <span className="text-[#6b7280]">{icon}</span>}
      </div>
      <p className={`text-2xl font-semibold tabular-nums ${variantText[variant]}`}>{value}</p>
      {subtext && <p className="text-xs text-[#6b7280] mt-1">{subtext}</p>}
    </div>
  );
}
