import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Lock, Shield, Settings } from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard },
  { to: '/encrypt', icon: Lock },
  { to: '/vault', icon: Shield },
  { to: '/settings', icon: Settings }
];

export default function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-6 left-4 right-4 bg-[var(--color-cyber-dark)]/80 backdrop-blur-2xl z-40 border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      <div className="flex justify-around py-1.5">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative flex flex-col items-center py-3 px-4 transition-all duration-300 ${
                  isActive ? 'text-[var(--color-cyber-cyan)] scale-110' : 'text-white/50 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} className={isActive ? 'drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]' : ''} />
                  {isActive && <div className="absolute bottom-1 w-1.5 h-1.5 bg-[var(--color-cyber-cyan)] rounded-full shadow-[0_0_8px_rgba(0,229,255,1)]"></div>}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
