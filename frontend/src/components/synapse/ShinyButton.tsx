import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ShinyButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  className?: string;
}

export const ShinyButton: React.FC<ShinyButtonProps> = ({ children, className = '', ...props }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`shiny-border-btn ${className}`}
      {...props}
    >
      <div className="shiny-border-btn-inner text-text-primary uppercase tracking-[0.2em] font-bold text-sm">
        {children}
      </div>
    </motion.button>
  );
};
