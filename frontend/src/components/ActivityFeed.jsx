import { Database, Clock } from 'lucide-react';

export default function ActivityFeed({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[160px]">
        <Clock size={32} className="text-[var(--color-cyber-teal)] opacity-50 mb-3" />
        <p className="text-[var(--color-cyber-text-muted)] font-medium">No recent activity yet</p>
      </div>
    );
  }

  const actionLabels = {
    added: 'Added',
    viewed: 'Viewed',
    edited: 'Edited',
    deleted: 'Deleted',
    exported: 'Exported',
    encrypted: 'Encrypted'
  };

  const timeAgo = (timestamp) => {
    if (!timestamp) return '';
    const ts = new Date(timestamp).getTime();
    if (Number.isNaN(ts)) return '';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="glass-panel rounded-2xl p-2 relative">
      {activities.map((activity, i) => (
        <div key={activity.id} className="group hover:bg-white/5 rounded-xl transition-colors p-2.5">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-[var(--color-cyber-cyan)]/10 border border-[var(--color-cyber-cyan)]/20 rounded-full flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(0,229,255,0.1)] group-hover:shadow-[0_0_15px_rgba(0,229,255,0.2)] transition-shadow">
              <Database size={14} className="text-[var(--color-cyber-cyan)]" />
            </div>
            <p className="text-white/80 text-sm flex-1 tracking-wide leading-relaxed">
              <span className="font-semibold text-white">{actionLabels[activity.action] || activity.action}</span>{' '}
              {activity.metadata?.site_name && (
                <span className="text-[var(--color-cyber-teal)] bg-[var(--color-cyber-teal)]/10 px-2 py-0.5 rounded-md font-medium text-xs tracking-wider mx-1 border border-[var(--color-cyber-teal)]/20">
                  {activity.metadata.site_name}
                </span>
              )}
              {activity.metadata?.count !== undefined && (
                <span className="text-[var(--color-cyber-text-muted)] font-medium text-xs tracking-wider mx-1">
                  ({activity.metadata.count})
                </span>
              )}
            </p>
            <span className="text-[var(--color-cyber-text-muted)] text-[11px] font-medium tracking-wide uppercase bg-white/5 px-2 py-1 rounded-md">
              {timeAgo(activity.timestamp)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
