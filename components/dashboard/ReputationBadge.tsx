'use client';

export default function ReputationBadge() {
  return (
    <div
      className="glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col"
    >
      <div className="absolute bottom-0 right-0 w-40 h-40 bg-arc-violet/10 rounded-full blur-3xl -mr-5 -mb-5 pointer-events-none" />
      <h2 className="text-white font-display font-bold text-lg mb-6 flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--arc-violet)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>
        ERC-8004 Identity
      </h2>
      
      <div className="flex-1 flex flex-col justify-center items-center py-4">
         <div className="w-24 h-24 rounded-full border-4 border-arc-blue/30 flex items-center justify-center mb-4 relative shadow-glow-blue">
            <div className="absolute inset-0 border border-arc-light rounded-full border-dashed animate-border-spin" />
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--arc-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"></path><path d="M12 12 2.1 7.1"></path><path d="M12 12l9.9 4.9"></path></svg>
         </div>
         <p className="text-white font-medium text-lg">Agent Rova</p>
         <p className="text-arc-light font-mono text-xs">0x8FE6...2DAA</p>
      </div>

      <div className="mt-auto space-y-3 pt-4 border-t border-white/10">
        <div className="flex justify-between">
          <span className="text-gray-400 text-xs">Status</span>
          <span className="text-success text-xs font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-dot" /> Online
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 text-xs">Reputation Score</span>
          <span className="text-white text-xs font-mono font-medium">99.8 / 100</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 text-xs">Total Flows Executed</span>
          <span className="text-white text-xs font-mono font-medium">1,204</span>
        </div>
      </div>
    </div>
  );
}
