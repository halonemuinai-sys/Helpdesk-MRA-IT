import React, { useState, useEffect } from 'react';
import { Cpu } from 'lucide-react';

const IT_BOOT_MESSAGES = [
  "CONNECTING_DB_POOL [SSL=TRUE]",
  "MRA_SECURE_TUNNEL: ONLINE",
  "PRISMA_CLIENT: GENERATING_TYPES",
  "LOADING_HELPDESK_METRICS...",
  "RESOLVING_SLA_COMPLIANCE_ALGORITHM",
  "DECRYPTING_WIFI_CREDENTIALS...",
  "PARSING_ROUTING_TABLES...",
  "COMPILING_LUCIDE_SVG_VECTORS...",
  "FETCHING_ACTIVE_API_ENDPOINTS...",
  "BUFFERING_AGENT_KPI_DATA...",
  "HANDSHAKE_ESTABLISHED: SUCCESS"
];

/**
 * ReactLoader Component
 * Renders an IT/Helpdesk themed loading component.
 * Features a circular CPU circuit board spinner and a scrolling diagnostic terminal.
 */
export default function ReactLoader({ 
  size = 'md', 
  text = 'Loading...', 
  fullscreen = false,
  inline = false
}) {
  const [logLines, setLogLines] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (inline || size === 'xs' || size === 'sm') return;

    // Seed initial console lines
    const sessionId = Math.floor(Math.random() * 9000 + 1000);
    setLogLines([
      `$ helpdesk_init --session=${sessionId}`,
      "KERN: INITIALIZING_SYS_DAEMON... [OK]",
      "DB: ESTABLISHING_POOL_CONNECTION... [OK]"
    ]);

    const interval = setInterval(() => {
      setCurrentIndex(prev => {
        const next = (prev + 1) % IT_BOOT_MESSAGES.length;
        setLogLines(lines => {
          const updated = [...lines, `SYS: ${IT_BOOT_MESSAGES[prev]}`];
          return updated.slice(-3); // Keep 3 lines of history
        });
        return next;
      });
    }, 900);

    return () => clearInterval(interval);
  }, [inline, size]);

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };
  
  const ringSizes = {
    xs: 'w-5 h-5',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  };

  const iconSize = iconSizes[size] || iconSizes.md;
  const ringSize = ringSizes[size] || ringSizes.md;

  // Mini spinner for inline/small loaders
  const compactSpinner = (
    <div className={`relative ${ringSize} ${ringSize} flex items-center justify-center shrink-0`}>
      {/* Outer spinning ring with gradient-like look */}
      <div className="absolute inset-0 rounded-full border border-t-rose-500 border-r-transparent border-b-cyan-400 border-l-transparent animate-spin" />
      {/* Pulse glow background */}
      <div className="absolute inset-0.5 rounded-full bg-rose-500/5 dark:bg-rose-500/10 animate-pulse" />
      <Cpu className={`${iconSize} text-rose-500 dark:text-rose-400 animate-pulse`} />
    </div>
  );

  if (inline) {
    return compactSpinner;
  }

  // If size is tiny (xs/sm), use a simple compact loader layout
  if (size === 'xs' || size === 'sm') {
    return (
      <div className="flex items-center space-x-2 select-none justify-center">
        {compactSpinner}
        {text && (
          <span className="text-[10px] font-mono tracking-wider text-slate-500 dark:text-slate-400 uppercase animate-pulse">
            {text}
          </span>
        )}
      </div>
    );
  }

  // Full-featured IT theme loader (for md, lg, xl sizes)
  const fullLoader = (
    <div className="flex flex-col items-center justify-center space-y-6 select-none max-w-sm w-full mx-auto">
      
      {/* mainframe CPU animation */}
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* Ambient glow backdrop */}
        <div className="absolute w-14 h-14 rounded-full bg-rose-500/15 dark:bg-rose-500/25 blur-xl animate-pulse" />
        
        {/* Outermost dotted radar ring */}
        <div className="absolute inset-0 rounded-full border border-dashed border-rose-500/25 dark:border-rose-500/35 animate-[spin_15s_linear_infinite]" />
        
        {/* Inner reverse-spinning dotted ring */}
        <div className="absolute inset-2 rounded-full border border-dotted border-cyan-500/30 dark:border-cyan-400/40 animate-[spin_8s_linear_infinite_reverse]" />

        {/* Medium dynamic spinner */}
        <div className="absolute inset-4 rounded-full border-2 border-t-rose-500 border-r-transparent border-b-cyan-400 border-l-transparent animate-[spin_2.5s_linear_infinite]" />

        {/* Core pulsing CPU container */}
        <div className="absolute w-11 h-11 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-center text-rose-500 dark:text-rose-400 animate-[pulse_2s_ease-in-out_infinite]">
          <Cpu className="w-5 h-5 animate-pulse" />
        </div>
      </div>

      {/* Terminal window panel */}
      <div className="w-full rounded-xl bg-slate-950/95 border border-slate-850 p-3 font-mono text-[9px] text-emerald-400/90 shadow-2xl flex flex-col space-y-1">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-1.5 mb-1.5 text-[8px] text-slate-500 font-sans tracking-wide">
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <span className="font-mono">tty1: helpdesk-session</span>
        </div>
        
        {/* Diagnostic logs */}
        <div className="flex flex-col space-y-0.5 min-h-[48px] text-left">
          {logLines.map((line, idx) => (
            <div key={idx} className="truncate text-slate-400 opacity-80 select-none">
              {line}
            </div>
          ))}
          {/* Active status line with cursor */}
          <div className="flex items-center space-x-1 text-cyan-400 font-bold">
            <span className="truncate">{text ? `> ${text}` : `> RUNNING_TASKS...`}</span>
            <span className="w-1 h-3 bg-cyan-400 animate-[pulse_0.8s_infinite]" />
          </div>
        </div>
      </div>

    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50/90 dark:bg-slate-950/90 backdrop-blur-md">
        {fullLoader}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full p-8 min-h-[220px]">
      {fullLoader}
    </div>
  );
}
