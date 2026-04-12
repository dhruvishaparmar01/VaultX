import { Globe, Mail, Building2, Share2, Briefcase, FolderOpen } from 'lucide-react';

const categories = [
  { id: 'all', label: 'All', icon: Globe },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'banking', label: 'Banking', icon: Building2 },
  { id: 'social_media', label: 'Social Media', icon: Share2 },
  { id: 'work', label: 'Work', icon: Briefcase },
  { id: 'others', label: 'Others', icon: FolderOpen }
];

export default function CategoryTabs({ active, onChange }) {
  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide py-3">
      {categories.map(cat => {
        const Icon = cat.icon;
        const isActive = active === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl whitespace-nowrap transition-all duration-300 text-[13px] font-semibold tracking-wide border ${
              isActive
                ? 'bg-[var(--color-cyber-cyan)]/15 text-[var(--color-cyber-cyan)] border-[var(--color-cyber-cyan)]/40 shadow-[0_0_20px_rgba(0,229,255,0.15)]'
                : 'bg-white/5 text-[var(--color-cyber-text-muted)] border-white/5 hover:bg-white/10 hover:text-white hover:border-white/10'
            }`}
          >
            <Icon size={16} className={isActive ? 'drop-shadow-[0_0_5px_rgba(0,229,255,0.8)]' : ''} />
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

export { categories };
