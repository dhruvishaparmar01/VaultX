import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VisibilityToggle({ show, onToggle }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      onClick={onToggle}
      className="text-white/40 hover:text-[var(--color-cyber-cyan)] transition-all p-1.5 rounded-md hover:bg-[var(--color-cyber-cyan)]/10"
      aria-label={show ? 'Hide password' : 'Show password'}
    >
      {show ? <EyeOff size={18} /> : <Eye size={18} />}
    </motion.button>
  );
}
