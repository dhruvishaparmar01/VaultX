import { pingBackend } from '../services/api';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, ShieldCheck, ShieldAlert, AlertTriangle, Lock, Shield, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import StatCard from '../components/StatCard';
import ActivityFeed from '../components/ActivityFeed';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashLoading, setDashLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [passwords, setPasswords] = useState([]);
  const [activities, setActivities] = useState([]);

 useEffect(() => {
  pingBackend(); // Wake Render backend immediately on app load
  if (!user) return;
  loadAll();
}, [user]);
  
  const loadAll = async () => {
    setDashLoading(true);
    try {
      await Promise.all([
        loadProfile(),
        loadPasswords(),
        loadActivity()
      ]);
    } catch (err) {
      // Still show dashboard even on partial failure
      console.error('Dashboard load error:', err);
    } finally {
      setDashLoading(false);
    }
  };

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .single();

    if (error || !data) {
      // Profile missing — create it now
      const { data: created } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name || '',
          last_name: user.user_metadata?.last_name || '',
          master_password_hash: ''
        }, { onConflict: 'id' })
        .select()
        .single();

      setProfile(created || {
        first_name: '',
        last_name: '',
        email: user.email
      });
    } else {
      setProfile(data);
    }
  };

  const loadPasswords = async () => {
    const { data } = await supabase
      .from('passwords')
      .select('id, strength_score, is_breached')
      .eq('user_id', user.id);
    setPasswords(data || []);
  };

const loadActivity = async () => {
  const { data } = await supabase
    .from('activity_logs')
    .select('id, action, metadata, created_at')   // ← changed
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })     // ← changed
    .limit(10);
  setActivities(data || []);
};

  const displayName = profile
    ? [profile.first_name, profile.last_name]
        .filter(Boolean).join(' ').trim()
        || user?.email
    : user?.email || 'User';

  const stats = {
    total: passwords.length,
    strong: passwords.filter(p => (p.strength_score || 0) > 75).length,
    weak: passwords.filter(p => (p.strength_score || 0) <= 50 && (p.strength_score || 0) > 0).length,
    breached: passwords.filter(p => p.is_breached).length
  };

  if (dashLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-luna-dark">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/50 text-sm">Loading your vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-luna-dark">
      <Sidebar />
      <TopBar title="Overview" />

      <main className="lg:ml-60 p-6 pb-24 lg:pb-6">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 15, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-8"
        >
          <p className="text-[var(--color-cyber-text-muted)] text-sm tracking-wide">Welcome back,</p>
          <p className="text-white font-bold text-3xl mt-1 tracking-tight">{displayName}</p>
          <p className="text-white/40 text-sm mt-2">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard label="Total Saved" value={stats.total} icon={LayoutDashboard} color="text-white" index={0} />
          <StatCard label="Strong" value={stats.strong} icon={ShieldCheck} color="text-green-400" index={1} glowColor="rgba(74,222,128,0.2)" />
          <StatCard label="Weak" value={stats.weak} icon={ShieldAlert} color="text-yellow-400" index={2} glowColor="rgba(250,204,21,0.2)" />
          <StatCard label="Breached" value={stats.breached} icon={AlertTriangle} color="text-red-400" breached index={3} glowColor="rgba(248,113,113,0.2)" />
        </div>

        {/* Quick Actions */}
        <h3 className="text-[var(--color-cyber-text)] font-semibold mb-4 tracking-wide uppercase text-xs">Quick Actions</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate('/encrypt')}
            className="cyber-button rounded-xl py-4 font-semibold flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(0,229,255,0.2)] hover:shadow-[0_6px_25px_rgba(0,229,255,0.4)]"
          >
            <Lock size={18} /> Encrypt Password
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate('/vault')}
            className="glass-panel hover:bg-white/5 border-white/5 text-white rounded-xl py-4 font-semibold flex items-center justify-center gap-2 transition-colors relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            <Shield size={18} /> Open Vault
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate('/vault')}
            className="border border-[var(--color-cyber-cyan)]/50 text-[var(--color-cyber-cyan)] bg-[var(--color-cyber-cyan)]/5 hover:bg-[var(--color-cyber-cyan)]/10 rounded-xl py-4 font-semibold flex items-center justify-center gap-2 transition-all shadow-[inset_0_0_15px_rgba(0,229,255,0.05)]"
          >
            <Plus size={18} /> Add Password
          </motion.button>
        </div>

        {/* Activity */}
        <h3 className="text-[var(--color-cyber-text)] font-semibold mb-4 tracking-wide uppercase text-xs">Recent Activity</h3>
        <ActivityFeed activities={activities} />
      </main>

      <BottomNav />
    </div>
  );
}
