import { useState } from 'react';
import { Copy, CheckCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CopyButton({ text, size = 18 }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleCopy}
      whileTap={{ scale: 1.15 }}
      className="p-1.5 rounded-md transition-all hover:bg-white/5"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <CheckCheck size={size+2} className="text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]" />
      ) : (
        <Copy size={size} className="text-[var(--color-cyber-text-muted)] hover:text-white" />
      )}
    </motion.button>
  );
}
