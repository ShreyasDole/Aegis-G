import { Shield } from 'lucide-react';

/** Left rail for sign-in / register — enterprise dashboard style (no Stitch dependency). */
export function AuthBrandingPanel() {
  return (
    <div className="hidden lg:flex lg:w-[44%] min-h-screen flex-col justify-between p-10 xl:p-14 relative overflow-hidden border-r border-border-subtle bg-gradient-to-br from-[#14161c] via-bg-secondary to-[#0d0f14]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.4) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/35 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-display text-xl font-bold tracking-[0.2em] text-text-primary">AEGIS-G</p>
            <p className="text-[11px] text-text-muted uppercase tracking-widest">Security Operations</p>
          </div>
        </div>
        <h1 className="text-3xl xl:text-4xl font-semibold text-text-primary leading-tight tracking-tight max-w-md">
          Modern enterprise security command
        </h1>
        <p className="mt-4 text-sm text-text-secondary leading-relaxed max-w-sm">
          Unified threat intelligence, graph analysis, and policy control in one audited platform.
        </p>
      </div>
      <div className="relative z-10 text-[11px] text-text-muted uppercase tracking-widest">
        Internal use · Monitored session
      </div>
    </div>
  );
}
