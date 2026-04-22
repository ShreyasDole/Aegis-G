import React from 'react';
import { motion } from 'framer-motion';

interface NeonGlassCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  themeColor: 'neon-cyan' | 'neon-magenta' | 'neon-lime';
  features?: string[];
}

export const NeonGlassCard: React.FC<NeonGlassCardProps> = ({ title, description, icon, themeColor, features }) => {
  // Map our semantic themes to tailwind utility classes for the specific neon color
  const colorMap = {
    'neon-cyan': {
      text: 'text-neon-cyan',
      bgHover: 'group-hover:bg-neon-cyan',
      borderHover: 'hover:border-neon-cyan',
      shadowHover: 'hover:shadow-neon-cyan',
      bgFill: 'bg-neon-cyan',
    },
    'neon-magenta': {
      text: 'text-neon-magenta',
      bgHover: 'group-hover:bg-neon-magenta',
      borderHover: 'hover:border-neon-magenta',
      shadowHover: 'hover:shadow-neon-magenta',
      bgFill: 'bg-neon-magenta',
    },
    'neon-lime': {
      text: 'text-neon-lime',
      bgHover: 'group-hover:bg-neon-lime',
      borderHover: 'hover:border-neon-lime',
      shadowHover: 'hover:shadow-neon-lime',
      bgFill: 'bg-neon-lime',
    }
  };

  const colors = colorMap[themeColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.4 }}
      className={`group glass-panel rounded-3xl p-8 transition-all duration-400 ${colors.borderHover} ${colors.shadowHover} flex flex-col h-full`}
    >
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center border border-white/10 mb-8 transition-colors duration-400 ${colors.bgHover}`}>
        <div className={`text-white group-hover:text-bg-base transition-colors duration-400`}>
          {icon}
        </div>
      </div>
      
      <h3 className="text-3xl mb-4 text-white">{title}</h3>
      <p className="text-white/60 mb-8 flex-1 leading-relaxed">{description}</p>
      
      {features && (
        <ul className="space-y-3 mt-auto">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-3 text-sm text-white/80">
              <span className={`w-1.5 h-1.5 rounded-full ${colors.bgFill}`} />
              {feature}
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
};
