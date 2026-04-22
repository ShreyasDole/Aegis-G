import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface CardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({ 
  children, 
  className = '',
  hover = false,
  ...props
}, ref) => {
  return (
    <motion.div 
      ref={ref}
      className={`bg-bg-secondary rounded-xl border border-border-subtle p-6 shadow-card transition-colors ${hover ? 'hover:border-primary/50 hover:shadow-glow-blue' : ''} ${className}`}
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
});

Card.displayName = 'Card';
