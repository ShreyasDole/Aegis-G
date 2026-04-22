import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  delay?: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -12 }}
      className="group bg-card border border-border-subtle p-[40px] rounded-[24px] transition-all duration-300 hover:border-secondary/40 hover:shadow-glow-violet backdrop-blur-xl relative overflow-hidden"
    >
      {/* Neon Hover Background Reveal */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="relative z-10">
        <motion.div 
          className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 mb-6 text-white group-hover:text-secondary group-hover:border-secondary/30 transition-colors"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {icon}
        </motion.div>
        
        <h3 className="text-3xl font-display text-white mb-4 leading-tight">{title}</h3>
        <p className="text-text-secondary text-sm leading-relaxed max-w-[90%]">
          {description}
        </p>
      </div>
    </motion.div>
  );
};
