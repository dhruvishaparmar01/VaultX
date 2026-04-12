import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function GeminiSuggestion({ suggestions, loading }) {
  if (!loading && (!suggestions || suggestions.length === 0)) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        className="glass-panel border-l-2 border-l-[var(--color-cyber-purple)] rounded-xl p-5 mt-5 shadow-[0_4px_20px_rgba(124,58,237,0.1)] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-cyber-purple)] opacity-5 blur-3xl pointer-events-none rounded-full" />
        <div className="flex items-center gap-3 mb-4">
          <div className="p-1.5 rounded-md bg-[var(--color-cyber-purple)]/10 border border-[var(--color-cyber-purple)]/20 shadow-[0_0_10px_rgba(124,58,237,0.2)]">
            <Sparkles size={16} className="text-[var(--color-cyber-purple)]" />
          </div>
          <span className="text-[var(--color-cyber-purple)] font-bold tracking-wide text-sm drop-shadow-[0_0_5px_rgba(124,58,237,0.5)]">AI Suggestion</span>
          <span className="text-[var(--color-cyber-text-muted)] text-[10px] uppercase font-semibold tracking-widest ml-auto px-2 py-1 bg-white/5 rounded-md border border-white/5">Powered by Gemini</span>
        </div>

        {loading ? (
          <div className="space-y-3 mt-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-2 bg-white/10 rounded-full animate-pulse shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]"
                style={{ width: `${60 + i * 15}%`, animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2 mt-3 relative z-10">
            {suggestions.map((tip, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-[var(--color-cyber-purple)]/70 mt-0.5 tracking-tighter">→</span>
                <p className="text-white/80 text-sm py-1 font-medium tracking-wide leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
