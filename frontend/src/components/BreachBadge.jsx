import { motion } from 'framer-motion';

export default function BreachBadge({ count }) {
  if (!count || count === 0) return null;

  return (
    <div className="relative group">
      <motion.div
        className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,1)]"
        animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 glass-panel border border-red-500/40 rounded-lg text-red-400 font-bold text-[10px] uppercase tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 shadow-[0_4px_15px_rgba(239,68,68,0.3)] transition-opacity duration-300 pointer-events-none z-50">
        Found in data breach
      </div>
    </div>
  );
}
