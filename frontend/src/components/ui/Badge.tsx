import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'critical' | 'high' | 'medium' | 'low' | 'info' | 'success' | 'secondary' | 'default';
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'info',
  className = '',
  ...props
}) => {
  const variantClasses = {
    critical: 'badge-critical',
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
    info: 'badge-info',
    success: 'badge-success',
    secondary: 'badge-secondary',
    default: 'badge-info',
  };

  return (
    <span className={`${variantClasses[variant]} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
};
