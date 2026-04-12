import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ShieldCheck } from 'lucide-react';

export default function StrengthMeter({ strength }) {
  if (!strength) return null;

  const { score, label, color, suggestions } = strength;

  const barColor =
    score <= 25 ? 'bg-red-400' :
    score <= 50 ? 'bg-yellow-400' :
    score <= 75 ? 'bg-luna-cyan' :
    'bg-luna-lightest';

  const textColor =
    score <= 25 ? 'text-red-400' :
    score <= 50 ? 'text-yellow-400' :
    score <= 75 ? 'text-luna-cyan' :
    'text-luna-lightest';

  return (
    <div className="mt-3 space-y-2">
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          style={{ boxShadow: score > 0 ? `0 0 10px ${score <= 25 ? '#f87171' : score <= 50 ? '#facc15' : score <= 75 ? '#00E5FF' : '#A7EBF2'}` : 'none' }}
        />
      </div>

      {/* Label row */}
      <div className="flex items-center gap-2">
        <motion.div
          key={score > 75 ? 'shield' : 'lock'}
          initial={{ rotateY: 90 }}
          animate={{ rotateY: 0 }}
          transition={{ duration: 0.3 }}
        >
          {score > 75 ? (
            <ShieldCheck size={18} className={textColor} />
          ) : (
            <Lock size={18} className={textColor} />
          )}
        </motion.div>
        <span className={`font-bold tracking-wide text-sm ${textColor} drop-shadow-[0_0_8px_currentColor]`}>{label}</span>
        <span className="text-[var(--color-cyber-text-muted)] text-sm font-semibold tracking-wider ml-auto">{score}%</span>
      </div>

      {/* Suggestions */}
      <AnimatePresence mode="wait">
        {suggestions && suggestions.length > 0 && (
          <motion.div
            key={suggestions.join(',')}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-0.5"
          >
            {suggestions.slice(0, 3).map((tip, i) => (
              <p key={i} className="text-white/60 text-sm">→ {tip}</p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
