import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface StatCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
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
  trend,
  className = '',
  ...props
}) => {
  const variantClasses = {
    safe: 'border-l-4 border-l-success from-bg-secondary to-emerald-950/20',
    warning: 'border-l-4 border-l-warning from-bg-secondary to-amber-950/20',
    critical: 'border-l-4 border-l-danger from-bg-secondary to-red-950/20',
    default: 'border-l-4 border-l-primary from-bg-secondary to-blue-950/20',
  };

  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.01 }}
      className={`relative overflow-hidden bg-gradient-to-br bg-bg-secondary rounded-xl p-6 shadow-card transition-shadow hover:shadow-xl ${variantClasses[variant]} ${className}`}
      {...props}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        {/* Subtle background abstract shape based on variant */}
        <div className={`w-24 h-24 rounded-full blur-2xl ${
          variant === 'safe' ? 'bg-success' : 
          variant === 'warning' ? 'bg-warning' : 
          variant === 'critical' ? 'bg-danger' : 'bg-primary'
        }`} />
      </div>

      <div className="relative z-10">
        <div className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-2 flex items-center justify-between">
          {label}
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="text-4xl font-black font-display tracking-tighter text-text-primary mb-3"
        >
          {value}
        </motion.div>
        
        {trend && (
          <div className="flex items-center gap-1.5 bg-bg-tertiary/50 w-fit px-2 py-1 rounded inline-flex">
            <svg 
              className={`w-3.5 h-3.5 ${trend.isPositive ? 'text-success rotate-180' : 'text-danger'}`} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${trend.isPositive ? 'text-success' : 'text-danger'}`}>
              {Math.abs(trend.value)}% today
            </span>
          </div>
        )}
      </div>
      
      {/* Animated Sweep Line on Hover - Native CSS approach or Framer Approach */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg]"
        initial={{ x: "-100%" }}
        whileHover={{ x: "200%" }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
    </motion.div>
  );
};

StatCard.displayName = 'StatCard';
