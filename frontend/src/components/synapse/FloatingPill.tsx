import React from 'react';
import { motion } from 'framer-motion';

interface FloatingPillProps {
  links: { label: string; onClick: () => void; active?: boolean }[];
  cta?: { label: string; onClick: () => void };
}

export const FloatingPill: React.FC<FloatingPillProps> = ({ links, cta }) => {
  return (
    <motion.div 
      initial={{ y: -50, opacity: 0, x: "-50%" }}
      animate={{ y: 0, opacity: 1, x: "-50%" }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
      className="absolute z-50 top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-[672px] h-[52px] rounded-full bg-black/70 backdrop-blur-xl border border-white/10 flex items-center justify-between px-2 pr-2 shadow-card"
    >
      <div className="flex items-center gap-2 pl-3">
        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-tr from-secondary to-primary animate-pulse" />
        <span className="font-display text-white text-base font-medium tracking-tight">AEGIS</span>
      </div>

      <div className="flex items-center gap-1">
        {links.map((link, i) => (
          <button 
            key={i}
            onClick={link.onClick}
            className={`px-3 py-1.5 text-xs uppercase font-medium tracking-widest rounded-full transition-colors ${
              link.active 
                ? 'bg-white/10 text-white' 
                : 'text-text-muted hover:text-white hover:bg-white/5'
            }`}
          >
            {link.label}
          </button>
        ))}
      </div>

      {cta ? (
        <button 
          onClick={cta.onClick}
          className="bg-white text-black px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/90 transition-transform active:scale-95"
        >
          {cta.label}
        </button>
      ) : <div className="w-[100px]" />}
    </motion.div>
  );
};
