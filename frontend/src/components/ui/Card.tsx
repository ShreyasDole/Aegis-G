import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', hover, padding = 'md' }: CardProps) {
  const padClass = {
    none: 'p-0',
    sm:   'p-3',
    md:   'p-4',
    lg:   'p-6',
  }[padding];

  return (
    <div className={`card ${hover ? 'card-hover' : ''} ${padClass} ${className}`}>
      {children}
    </div>
  );
}
