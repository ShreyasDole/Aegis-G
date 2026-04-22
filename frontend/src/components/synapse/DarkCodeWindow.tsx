import React from 'react';
import { Copy } from 'lucide-react';
import { motion } from 'framer-motion';

interface DarkCodeWindowProps {
  filename: string;
  code: React.ReactNode;
  delay?: number;
}

export const DarkCodeWindow: React.FC<DarkCodeWindowProps> = ({ filename, code, delay = 0 }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
      className="ide-window w-full"
    >
      {/* Toolbar */}
      <div className="h-10 px-4 bg-bg-tertiary flex items-center justify-between border-b border-border-medium">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-danger/50" />
          <div className="w-3 h-3 rounded-full bg-warning/50" />
          <div className="w-3 h-3 rounded-full bg-success/50" />
        </div>
        <div className="text-[10px] font-mono text-text-muted tracking-widest uppercase">
          {filename}
        </div>
        <button className="text-text-muted hover:text-white transition-colors">
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {/* Code Space */}
      <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto text-text-secondary">
        {code}
      </div>
    </motion.div>
  );
};
