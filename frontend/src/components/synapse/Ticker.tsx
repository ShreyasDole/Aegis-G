import React from 'react';

interface TickerProps {
  items: { label: string; value: string | React.ReactNode; icon?: React.ReactNode }[];
}

export const Ticker: React.FC<TickerProps> = ({ items }) => {
  return (
    <div className="w-full h-[60px] bg-black/40 border-y border-white/5 overflow-hidden flex flex-col justify-center relative backdrop-blur-md">
      {/* 
        To make a perfect infinite seamless loop, we double the rendered track 
        and animate to -50% width inside the keyframes
      */}
      <div className="flex w-[200%] animate-ticker-scroll hover:[animation-play-state:paused]">
        {/* Render twice for the loop */}
        {[1, 2].map((set) => (
          <div key={set} className="flex-1 flex justify-around items-center px-4">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 text-text-primary px-8 border-r border-white/5 last:border-r-0 shrink-0">
                {item.icon && <span className="opacity-70">{item.icon}</span>}
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-muted">
                  {item.label}
                </span>
                <span className="text-base font-mono font-bold tracking-widest text-[#06b6d4]">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
