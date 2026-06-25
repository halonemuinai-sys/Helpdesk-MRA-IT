import { motion } from 'framer-motion';

// Idle/searching radar animation shown in a tab/page before "Proses / Muat Data" has been clicked
function SearchingRadarAnimation() {
  return (
    <div className="relative w-44 h-44 flex items-center justify-center select-none pointer-events-none mb-3">
      {/* Background Pulse Rings */}
      <motion.div
        className="absolute w-32 h-32 rounded-full border border-rose-500/20 dark:border-rose-400/10 bg-rose-500/5 dark:bg-rose-400/5"
        animate={{ scale: [0.9, 1.2, 0.9], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-40 h-40 rounded-full border border-amber-500/15 dark:border-amber-400/5"
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Rotating Radar Sweep Ring */}
      <motion.div
        className="absolute w-36 h-36 rounded-full border border-dashed border-rose-500/30 dark:border-rose-400/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

      {/* Rotating sweep gradient */}
      <div className="absolute w-36 h-36 overflow-hidden rounded-full pointer-events-none z-10">
        <motion.div
          className="w-full h-full bg-gradient-to-tr from-transparent via-transparent to-rose-500/10 origin-center"
          style={{ transformOrigin: '50% 50%' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Animated Floating Nodes */}
      <motion.div
        className="absolute w-2 h-2 rounded-full bg-rose-500 top-10 left-14 shadow-lg shadow-rose-500/50"
        animate={{ scale: [0.6, 1.2, 0.6], opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
      <motion.div
        className="absolute w-1.5 h-1.5 rounded-full bg-amber-500 bottom-14 right-10 shadow-lg shadow-amber-500/50"
        animate={{ scale: [0.5, 1.2, 0.5], opacity: [0.2, 1, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />
      <motion.div
        className="absolute w-1.5 h-1.5 rounded-full bg-emerald-500 top-16 right-14 shadow-lg shadow-emerald-500/50"
        animate={{ scale: [0.5, 1.2, 0.5], opacity: [0.2, 1, 0.2] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
      />

      {/* Center Icon: floating package outline */}
      <motion.div
        className="relative z-20 w-14 h-14 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl flex items-center justify-center shadow-lg shadow-gray-900/5 dark:shadow-black/40"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg
          className="w-7 h-7 text-rose-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          />
          <motion.polyline
            points="3.27 6.96 12 12.01 20.73 6.96"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.3 }}
          />
          <motion.line
            x1="12"
            y1="22.08"
            x2="12"
            y2="12"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.6 }}
          />
        </svg>
      </motion.div>
    </div>
  );
}

// Wrapper card for the "not yet loaded" placeholder shown before "Proses / Muat Data" is clicked.
// Used consistently across pages that load data strictly on demand (Peripherals, Assets, ...).
export default function PendingProcessPlaceholder({ title, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative bg-white/60 dark:bg-slate-900/55 border border-gray-250/60 dark:border-slate-800/50 rounded-3xl p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[380px] overflow-hidden"
    >
      {/* Floating abstract backdrop blur circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
        <motion.div
          className="absolute w-40 h-40 rounded-full bg-rose-500/5 -top-12 -left-12 blur-2xl"
          animate={{ x: [0, 20, 0], y: [0, 15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-44 h-44 rounded-full bg-amber-500/5 -bottom-16 -right-16 blur-2xl"
          animate={{ x: [0, -20, 0], y: [0, -15, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <SearchingRadarAnimation />

      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="text-sm font-black text-gray-800 dark:text-white relative z-10"
      >
        {title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.4 }}
        className="text-gray-500 dark:text-slate-400 text-xs max-w-sm mt-3 leading-relaxed relative z-10"
      >
        {description}
      </motion.p>
    </motion.div>
  );
}
