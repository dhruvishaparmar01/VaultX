import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Download, Trash2, LogOut, Loader2, Save, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { changeMasterPassword, exportVault, clearAllPasswords, getUserProfile } from '../services/api';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Profile state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [originalFirstName, setOriginalFirstName] = useState('');
  const [originalLastName, setOriginalLastName] = useState('');
  const [saving, setSaving] = useState(false);

  // Security state
  const [showChangePw, setShowChangePw] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [changingPw, setChangingPw] = useState(false);

  // Data state
  const [showClearModal, setShowClearModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load profile on mount
  useEffect(() => {
    if (user) {
      getUserProfile(user.id).then(profile => {
        setFirstName(profile.first_name || '');
        setLastName(profile.last_name || '');
        setUserEmail(profile.email || user.email || '');
        setOriginalFirstName(profile.first_name || '');
        setOriginalLastName(profile.last_name || '');
      }).catch(() => {
        setUserEmail(user.email || '');
      });
    }
  }, [user]);

  const profileChanged = firstName !== originalFirstName || lastName !== originalLastName;

  // M1: Proper try-catch wrapper for profile save
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim()
        })
        .eq('id', user.id);

      if (error) throw error;
      addToast('Profile updated successfully!', 'success');
      setOriginalFirstName(firstName.trim());
      setOriginalLastName(lastName.trim());
    } catch (err) {
      addToast('Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePw = async () => {
    if (newPw !== confirmPw) { addToast('Passwords do not match', 'error'); return; }
    if (newPw.length < 8) { addToast('Min 8 characters', 'error'); return; }
    setChangingPw(true);
    try {
      await changeMasterPassword(currentPw, newPw);
      addToast('Master password updated!', 'success');
      setShowChangePw(false); setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (e) { addToast(e.message, 'error'); }
    finally { setChangingPw(false); }
  };

  const handleExport = async () => {
    setExporting(true);
    try { await exportVault(); addToast('Export downloaded', 'success'); }
    catch (e) { addToast(e.message, 'error'); }
    finally { setExporting(false); }
  };

  const handleClearAll = async () => {
    try { await clearAllPasswords(); addToast('All passwords cleared', 'success'); setShowClearModal(false); }
    catch (e) { addToast(e.message, 'error'); }
  };

  const handleLogout = async () => { await signOut(); navigate('/auth'); };

  const inputCls = "w-full cyber-input px-4 py-3.5 rounded-xl transition-all";

  return (
    <div className="min-h-screen bg-luna-dark">
      <Sidebar /><TopBar title="Settings" />
      <main className="lg:ml-60 p-6 pb-24 lg:pb-6 max-w-2xl">

        {/* ═══ PROFILE SECTION ═══ */}
        <div className="glass-panel border border-white/5 rounded-2xl p-7 mb-5 relative">
          <h3 className="text-white font-bold text-lg mb-5 tracking-wide">Profile Information</h3>
          <div className="space-y-5">
            <div>
              <label className="text-[var(--color-cyber-text-muted)] text-[12px] uppercase tracking-widest font-semibold mb-2 block">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="First Name"
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-[var(--color-cyber-text-muted)] text-[12px] uppercase tracking-widest font-semibold mb-2 block">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Last Name"
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-[var(--color-cyber-text-muted)] text-[12px] uppercase tracking-widest font-semibold mb-2 block">Email Address</label>
              <input
                type="email"
                value={userEmail}
                disabled
                className={inputCls + ' opacity-50 cursor-not-allowed'}
              />
              <p className="text-white/30 text-xs mt-1">Email cannot be changed</p>
            </div>
            {profileChanged && (
              <motion.button
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleSaveProfile}
                disabled={saving}
                className="cyber-button font-bold rounded-xl py-3.5 px-6 flex items-center justify-center gap-2 mt-4 shadow-[0_4px_15px_rgba(0,229,255,0.2)] disabled:opacity-70"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Save Changes
              </motion.button>
            )}
          </div>
        </div>

        {/* ═══ SECURITY ═══ */}
        <div className="glass-panel border border-white/5 rounded-2xl p-7 mb-5">
          <h3 className="text-white font-bold text-lg mb-4 tracking-wide">Security Settings</h3>
          <button onClick={() => setShowChangePw(!showChangePw)} className="w-full flex items-center justify-between py-2 text-white/80 font-medium hover:text-[var(--color-cyber-cyan)] transition-colors">
            <span>Change Master Password</span> <ChevronRight size={18} className="text-white/40" />
          </button>
          <AnimatePresence>
            {showChangePw && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="space-y-4 mt-5 pt-5 border-t border-white/10">
                  <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="Current password" className={inputCls} />
                  <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="New password" className={inputCls} />
                  <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Confirm new password" className={inputCls} />
                  <button onClick={handleChangePw} disabled={changingPw} className="w-full cyber-button py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(0,229,255,0.2)]">
                    {changingPw && <Loader2 size={18} className="animate-spin" />} Update Password
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ═══ DATA ═══ */}
        <div className="glass-panel border border-white/5 rounded-2xl p-7 mb-5">
          <h3 className="text-white font-bold text-lg mb-4 tracking-wide">Data Management</h3>
          <button onClick={handleExport} disabled={exporting} className="w-full flex items-center gap-4 py-3 text-white/80 hover:text-[var(--color-cyber-cyan)] transition-colors group">
            <div className="w-10 h-10 rounded-full bg-[var(--color-cyber-cyan)]/10 flex items-center justify-center group-hover:bg-[var(--color-cyber-cyan)]/20 transition-colors">
              <Download size={18} className="text-[var(--color-cyber-cyan)]" />
            </div>
            <div className="text-left"><p className="font-semibold tracking-wide">Export Passwords</p><p className="text-[var(--color-cyber-text-muted)] text-[11px] uppercase tracking-wider mt-0.5">Download encrypted backup</p></div>
            {exporting && <Loader2 size={18} className="animate-spin ml-auto" />}
          </button>
          <div className="border-t border-white/10 my-2" />
          <button onClick={() => setShowClearModal(true)} className="w-full flex items-center gap-4 py-3 text-white/80 hover:text-red-400 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
              <Trash2 size={18} className="text-red-400" />
            </div>
            <div className="text-left"><p className="font-semibold tracking-wide">Clear All Passwords</p><p className="text-[var(--color-cyber-text-muted)] text-[11px] uppercase tracking-wider mt-0.5">Permanently delete all</p></div>
          </button>
        </div>

        {/* ═══ ACCOUNT ═══ */}
        <div className="glass-panel border border-white/5 rounded-2xl p-7 mb-5 text-center">
          <p className="text-[var(--color-cyber-text-muted)] text-[12px] uppercase tracking-widest font-semibold mb-2">Signed in with</p>
          <p className="text-[var(--color-cyber-cyan)] font-mono text-lg mb-6">{userEmail}</p>
          <button onClick={handleLogout} className="w-full bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 rounded-xl py-3.5 transition-all flex items-center justify-center gap-2 font-bold shadow-[0_4px_15px_rgba(239,68,68,0.1)]">
            <LogOut size={18} /> Logout Account
          </button>
        </div>
      </main>
      <BottomNav />

      {/* Clear All Modal */}
      <AnimatePresence>
        {showClearModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowClearModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 20, filter: 'blur(10px)' }} animate={{ scale: 1, y: 0, filter: 'blur(0px)' }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="glass-panel border-red-500/30 rounded-2xl p-7 w-full max-w-sm relative shadow-[0_20px_50px_rgba(239,68,68,0.15)] overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-60"></div>
              <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2"><AlertTriangle className="text-red-400" size={20} /> Clear All Passwords</h3>
              <p className="text-red-200/80 text-sm mb-6 leading-relaxed">This action is irreversible. All saved passwords will be permanently deleted from your Vault.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowClearModal(false)} className="flex-1 glass-panel hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-colors shrink-0 whitespace-nowrap px-4">Cancel</button>
                <button onClick={handleClearAll} className="flex-1 bg-red-500/90 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-[0_4px_15px_rgba(239,68,68,0.3)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.5)] transition-all shrink-0 whitespace-nowrap px-4">Delete All</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
