import { motion } from 'framer-motion';
import { Mail, Building2, Share2, Briefcase, FolderOpen, Trash2 } from 'lucide-react';
import VisibilityToggle from './VisibilityToggle';
import CopyButton from './CopyButton';
import BreachBadge from './BreachBadge';

const categoryIcons = {
  email: Mail,
  banking: Building2,
  social_media: Share2,
  work: Briefcase,
  others: FolderOpen
};

export default function PasswordCard({
  password,
  index = 0,
  onReveal,
  onDelete,
  revealedPassword,
  showRevealed
}) {
  const Icon = categoryIcons[password.category] || FolderOpen;

  const saveTypeLabel =
    password.save_type === 'original' ? 'Original' :
    password.save_type === 'encrypted' ? 'Encrypted' : 'Both';

  const timeAgo = (date) => {
    if (!date) return '';
    const ts = new Date(date).getTime();
    if (Number.isNaN(ts)) return '';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: 'easeOut' }}
      className="glass-panel glass-panel-hover rounded-2xl p-4 mb-4 relative group"
    >
      {/* Breach badge */}
      {password.is_breached && (
        <div className="absolute top-3 right-3">
          <BreachBadge count={1} />
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Category icon */}
        <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(0,0,0,0.5)] group-hover:bg-[var(--color-cyber-cyan)]/10 group-hover:border-[var(--color-cyber-cyan)]/30 group-hover:shadow-[0_0_20px_rgba(0,229,255,0.2)] transition-all duration-300">
          <Icon size={20} className="text-[var(--color-cyber-cyan)]" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold tracking-wide text-[16px] truncate">{password.site_name}</h3>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="bg-[var(--color-cyber-cyan)]/10 border border-[var(--color-cyber-cyan)]/20 text-[var(--color-cyber-cyan)] text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-md">
              {saveTypeLabel}
            </span>
            <span className="text-[var(--color-cyber-text-muted)] font-medium text-[11px] uppercase tracking-wider">{timeAgo(password.last_updated || password.created_at)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <span className="text-[var(--color-cyber-text-muted)] font-mono text-[13px] mr-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
            {showRevealed && revealedPassword ? revealedPassword : '••••••••'}
          </span>
          {showRevealed && revealedPassword && (
            <CopyButton text={revealedPassword} size={18} />
          )}
          <VisibilityToggle
            show={showRevealed}
            onToggle={() => onReveal(password)}
          />
          <CopyButton text={password.encrypted_version} size={18} />
          <button
            onClick={() => onDelete(password)}
            className="text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors p-2"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
