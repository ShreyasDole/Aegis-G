import React from 'react';

type BadgeVariant = 'critical' | 'high' | 'medium' | 'low' | 'info' | 'accent' | 'success' | 'warning' | 'secondary';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const variantMap: Record<string, string> = {
  critical:  'badge-critical',
  high:      'badge-high',
  medium:    'badge-medium',
  low:       'badge-low',
  info:      'badge-info',
  accent:    'badge-accent',
  success:   'badge-success',
  warning:   'badge-warning',
  secondary: 'badge',
};

export function Badge({ variant = 'secondary', children, icon, className = '' }: BadgeProps) {
  return (
    <span className={`badge ${variantMap[variant] || ''} ${className}`}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
