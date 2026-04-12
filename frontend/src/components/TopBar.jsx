import { useAuth } from '../context/AuthContext';

export default function TopBar({ title }) {
  const { user } = useAuth();

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'VX';

  return (
    <div className="bg-[var(--color-cyber-dark)]/60 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between lg:ml-60 sticky top-0 z-30">
      <h1 className="text-white font-semibold text-xl tracking-wide">{title}</h1>
      <div className="w-9 h-9 bg-gradient-to-br from-[var(--color-cyber-teal)] to-[var(--color-cyber-cyan)] rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.4)]">
        <span className="text-[var(--color-cyber-darkest)] text-sm font-bold tracking-wider">{initials}</span>
      </div>
    </div>
  );
}
