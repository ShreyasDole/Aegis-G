import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "className" | "children" | "icon"> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ai';
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ 
  variant = 'primary', 
  children, 
  icon,
  className = '',
  ...props 
}, ref) => {
  const baseClasses = "inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-bold text-sm tracking-wide uppercase transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed z-10 relative";

  const variantClasses = {
    primary: 'bg-primary text-bg-primary hover:bg-cyan-400 hover:shadow-glow-cyan',
    secondary: 'bg-transparent border border-border-medium hover:border-primary hover:text-primary text-text-secondary',
    danger: 'bg-danger text-white hover:bg-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]',
    ai: 'bg-gradient-to-r from-secondary to-primary text-white hover:shadow-glow-violet',
  };

  return (
    <motion.button 
      ref={ref}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.95 }}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {icon && <span>{icon}</span>}
      {children}
    </motion.button>
  );
});

Button.displayName = 'Button';
