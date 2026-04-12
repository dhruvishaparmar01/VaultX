import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function StatCard({ label, value, icon: Icon, color, breached, index = 0, glowColor }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value === 0) { setDisplayValue(0); return; }
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
      className={`glass-panel rounded-2xl p-5 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 ${
        breached && value > 0 ? 'border-red-500/30' : 'border-white/5'
      }`}
    >
      {/* Background glow */}
      {glowColor && value > 0 && (
        <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl" style={{ backgroundColor: glowColor }}></div>
      )}
      
      {breached && value > 0 && (
        <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(239,68,68,0.15)] pointer-events-none rounded-2xl"></div>
      )}

      <div className="flex items-center gap-3 mb-3 relative z-10">
        <Icon size={24} className={color} />
      </div>
      <p className={`text-3xl font-bold tracking-tight relative z-10 ${color}`}>{displayValue}</p>
      <p className="text-[var(--color-cyber-text-muted)] text-xs font-semibold uppercase tracking-wider mt-1.5 relative z-10">{label}</p>
    </motion.div>
  );
}
