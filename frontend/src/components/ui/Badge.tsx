import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'critical' | 'high' | 'medium' | 'low' | 'info';
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'info',
}) => {
  const variantClasses = {
    critical: 'badge-critical',
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
    info: 'badge-info',
  };

  return (
    <span className={variantClasses[variant]}>
      {children}
    </span>
  );
};

