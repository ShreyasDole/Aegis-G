import React from 'react';

interface StatCardProps {
  value: string | number;
  label: string;
  variant?: 'safe' | 'warning' | 'critical' | 'default';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  variant = 'default',
  trend
}) => {
  const variantClasses = {
    safe: 'border-l-4 border-l-success',
    warning: 'border-l-4 border-l-warning',
    critical: 'border-l-4 border-l-danger',
    default: 'border-l-4 border-l-primary',
  };

  return (
    <div className={`card-hover ${variantClasses[variant]}`}>
      <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
        {label}
      </div>
      <div className="text-3xl font-bold text-text-primary mb-2">{value}</div>
      {trend && (
        <div className="flex items-center gap-1">
          <svg 
            className={`w-4 h-4 ${trend.isPositive ? 'text-success rotate-180' : 'text-danger'}`} 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className={`text-xs font-semibold ${trend.isPositive ? 'text-success' : 'text-danger'}`}>
            {Math.abs(trend.value)}% today
          </span>
        </div>
      )}
    </div>
  );
};

