import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Lock, Shield, Settings, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/encrypt', label: 'Encrypt', icon: Lock },
  { to: '/vault', label: 'Vault', icon: Shield },
  { to: '/settings', label: 'Settings', icon: Settings }
];

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-[var(--color-cyber-dark)]/80 backdrop-blur-2xl border-r border-white/5 h-screen fixed left-0 top-0 z-40 shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-8">
        <div className="relative">
          <ShieldCheck size={28} className="text-[var(--color-cyber-cyan)] relative z-10" />
          <div className="absolute inset-0 bg-[var(--color-cyber-cyan)] blur-md opacity-50 z-0"></div>
        </div>
        <span className="text-white font-bold text-xl tracking-tight">Vault<span className="text-[var(--color-cyber-cyan)]">X</span></span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 mt-2">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-4 py-3.5 rounded-xl mb-2 transition-all duration-300 ${
                  isActive
                    ? 'text-[var(--color-cyber-cyan)] bg-[var(--color-cyber-cyan)]/10 font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--color-cyber-cyan)] rounded-r-full shadow-[0_0_10px_rgba(0,229,255,0.6)]"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon size={20} className={`transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_8px_rgba(0,229,255,0.5)]' : 'group-hover:text-[var(--color-cyber-cyan)]'}`} />
                  <span className="font-medium tracking-wide">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User info + Logout */}
      <div className="px-5 pb-6">
        <div className="bg-white/5 border border-white/5 rounded-xl p-3 mb-2">
          <p className="text-[var(--color-cyber-text-muted)] text-[11px] uppercase tracking-wider mb-1 font-semibold">Logged in as</p>
          <p className="text-white text-sm truncate font-medium">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-300 px-4 py-3 w-full text-sm font-semibold border border-transparent hover:border-red-500/20"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
