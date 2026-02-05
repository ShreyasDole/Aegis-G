import React from 'react';

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: React.ReactNode;
  variant?: 'safe' | 'warning' | 'critical' | 'default';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  icon,
  variant = 'default',
  trend
}) => {
  const variantClasses = {
    safe: 'stat-card-safe',
    warning: 'stat-card-warning',
    critical: 'stat-card-critical',
    default: 'card-hover',
  };

  return (
    <div className={variantClasses[variant]}>
      {icon && (
        <div className="absolute top-4 right-4 text-2xl opacity-30">
          {icon}
        </div>
      )}
      <div className="text-4xl font-bold mb-2">{value}</div>
      <div className="text-sm text-text-secondary uppercase tracking-wider">
        {label}
      </div>
      {trend && (
        <div className={`text-xs mt-2 ${trend.isPositive ? 'text-success' : 'text-danger'}`}>
          {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
        </div>
      )}
    </div>
  );
};

