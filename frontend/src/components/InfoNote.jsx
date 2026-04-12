import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';

export default function InfoNote({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.3 }}
          className="glass-panel border-l-2 border-l-[var(--color-cyber-cyan)] rounded-xl px-5 py-4 mt-5 flex items-start gap-4 shadow-[0_4px_20px_rgba(0,229,255,0.05)]"
        >
          <Info size={20} className="text-[var(--color-cyber-cyan)] flex-shrink-0 mt-0.5 drop-shadow-[0_0_5px_rgba(0,229,255,0.8)]" />
          <div className="flex flex-col gap-1.5">
            <p className="text-white font-semibold text-sm tracking-wide">
              You only need to remember your original password.
            </p>
            <p className="text-[var(--color-cyber-text-muted)] text-[12px] leading-relaxed">
              VaultX will predictably generate the precise encrypted version for it automatically — every single time.
            </p>
            <p className="text-[var(--color-cyber-cyan)] text-[11px] font-bold uppercase tracking-widest mt-1">
              Just enter your password here whenever you need the encrypted format.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
