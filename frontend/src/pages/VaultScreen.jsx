import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, ShieldOff, X, Lock, Loader2 } from 'lucide-react';
import { listVault, deletePassword, revealPassword, saveToVault } from '../services/api';
import { useToast } from '../context/ToastContext';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import CategoryTabs from '../components/CategoryTabs';
import PasswordCard from '../components/PasswordCard';
import VisibilityToggle from '../components/VisibilityToggle';
import StrengthMeter from '../components/StrengthMeter';
import InfoNote from '../components/InfoNote';

// H2: Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function Modal({ show, onClose, children }) {
  if (!show) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}>
        <motion.div initial={{ scale: 0.95, y: 20, filter: 'blur(10px)' }} animate={{ scale: 1, y: 0, filter: 'blur(0px)' }} exit={{ scale: 0.95, y: 20, filter: 'blur(10px)' }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="glass-panel border-white/10 rounded-2xl p-7 w-full max-w-md max-h-[85vh] overflow-y-auto relative shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--color-cyber-cyan)] to-transparent opacity-40"></div>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function VaultScreen() {
  const { addToast } = useToast();
  const [passwords, setPasswords] = useState([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [revealedId, setRevealedId] = useState(null);
  const [revealedPw, setRevealedPw] = useState('');
  const [modal, setModal] = useState(null); // 'reveal' | 'delete' | 'add'
  const [target, setTarget] = useState(null);
  const [masterPw, setMasterPw] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  // Add form
  const [addForm, setAddForm] = useState({ siteName: '', password: '', category: 'others', saveType: 'encrypted', masterPw: '', notes: '' });
  const [showAddPw, setShowAddPw] = useState(false);
  const [addStrength, setAddStrength] = useState(null);

  // H2: Debounced search
  const debouncedSearch = useDebounce(search, 400);

  // loadPasswords wrapped as useCallback so it satisfies hook dep rules
  const loadPasswords = useCallback(async () => {
    setLoading(true);
    try {
      const r = await listVault(category, debouncedSearch);
      if (r.success) setPasswords(r.data.passwords);
    } catch (err) {
      console.error('Vault load error:', err);
      setPasswords([]);
    } finally {
      setLoading(false);
    }
  }, [category, debouncedSearch]);

  useEffect(() => { loadPasswords(); }, [loadPasswords]);

  useEffect(() => {
    if (!revealedId) return;
    const t = setTimeout(() => { setRevealedId(null); setRevealedPw(''); }, 30000);
    return () => clearTimeout(t);
  }, [revealedId]);



  const handleReveal = pw => {
    if (revealedId === pw.id) { setRevealedId(null); setRevealedPw(''); return; }
    if (pw.save_type === 'encrypted') { addToast('Original not saved', 'info'); return; }
    setTarget(pw); setMasterPw(''); setModal('reveal');
  };

  const doReveal = async () => {
    setActionLoading(true);
    try {
      const r = await revealPassword(target.id, masterPw);
      if (r.success) { setRevealedId(target.id); setRevealedPw(r.data.password); setModal(null); addToast('Password revealed', 'success'); }
    } catch (e) { addToast(e.message, 'error'); } finally { setActionLoading(false); }
  };

  const doDelete = async () => {
    try { await deletePassword(target.id); setPasswords(p => p.filter(x => x.id !== target.id)); setModal(null); addToast('Deleted', 'success'); }
    catch (e) { addToast(e.message, 'error'); }
  };

  const checkLocal = pw => {
    if (!pw) { setAddStrength(null); return; }
    let s = 0; const sg = [];
    if (pw.length >= 8) s += 20; else sg.push('Use 8+ chars');
    if (pw.length >= 12) s += 20; else sg.push('Use 12+ chars');
    if (/[A-Z]/.test(pw)) s += 15; else sg.push('Add uppercase');
    if (/[a-z]/.test(pw)) s += 15;
    if (/[0-9]/.test(pw)) s += 15; else sg.push('Add number');
    if (/[!@#$%^&*]/.test(pw)) s += 15; else sg.push('Add symbol');
    s = Math.min(100, s);
    const l = s <= 25 ? 'Weak' : s <= 50 ? 'Fair' : s <= 85 ? 'Strong' : 'Very Strong';
    setAddStrength({ score: s, label: l, suggestions: sg.slice(0, 3) });
  };

  const doAdd = async () => {
    if (!addForm.siteName || !addForm.password) { addToast('Site name & password required', 'error'); return; }
    setActionLoading(true);
    try {
      await saveToVault({ siteName: addForm.siteName, category: addForm.category, saveType: addForm.saveType,
        originalPassword: addForm.password, masterPassword: addForm.saveType === 'encrypted' ? undefined : addForm.masterPw, notes: addForm.notes });
      addToast('Saved!', 'success'); setModal(null);
      setAddForm({ siteName: '', password: '', category: 'others', saveType: 'encrypted', masterPw: '', notes: '' });
      loadPasswords();
    } catch (e) { addToast(e.message, 'error'); } finally { setActionLoading(false); }
  };

  const inputCls = "w-full cyber-input px-4 py-3.5 rounded-xl";

  return (
    <div className="min-h-screen bg-luna-dark">
      <Sidebar /><TopBar title="Vault" />
      <main className="lg:ml-60 p-6 pb-24 lg:pb-6">
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-cyber-text-muted)] group-focus-within:text-[var(--color-cyber-cyan)] transition-colors" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your vault..."
              className="w-full cyber-input pl-11 pr-4 py-3.5 rounded-xl" />
          </div>
          <button onClick={() => setModal('add')} className="hidden lg:flex items-center gap-2 cyber-button px-6 py-3.5 rounded-xl font-semibold shadow-[0_4px_15px_rgba(0,229,255,0.2)] hover:shadow-[0_6px_25px_rgba(0,229,255,0.4)]">
            <Plus size={20} /> Add Password
          </button>
        </div>
        <CategoryTabs active={category} onChange={setCategory} />
        <div className="mt-6">
          {loading ? <div className="text-center py-16"><Loader2 size={36} className="animate-spin text-[var(--color-cyber-cyan)] mx-auto" /></div>
           : passwords.length === 0 ? <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20 px-4 glass-panel rounded-2xl"><ShieldOff size={56} className="text-[var(--color-cyber-teal)] opacity-40 mx-auto mb-4" /><p className="text-[var(--color-cyber-text-muted)] font-medium text-lg tracking-wide">No passwords found</p></motion.div>
           : <AnimatePresence>{passwords.map((pw, i) => <PasswordCard key={pw.id} password={pw} index={i} onReveal={handleReveal}
               onDelete={pw => { setTarget(pw); setModal('delete'); }} revealedPassword={revealedId === pw.id ? revealedPw : ''} showRevealed={revealedId === pw.id} />)}</AnimatePresence>}
        </div>
        <button onClick={() => setModal('add')} className="lg:hidden fixed bottom-28 right-6 w-14 h-14 cyber-button rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,229,255,0.4)] z-[30] transform hover:scale-105 transition-transform"><Plus size={24} className="text-[var(--color-cyber-darkest)]" /></button>
      </main>
      <BottomNav />

      {/* Reveal Modal */}
      <Modal show={modal === 'reveal'} onClose={() => setModal(null)}>
        <h3 className="text-white font-bold text-lg mb-1 tracking-wide">Authentication Required</h3>
        <p className="text-[var(--color-cyber-text-muted)] text-sm mb-5">Enter your master password to reveal this secret.</p>
        <input type="password" value={masterPw} onChange={e => setMasterPw(e.target.value)} placeholder="Master password"
          className={inputCls + " mb-5"} onKeyDown={e => e.key === 'Enter' && doReveal()} />
        <div className="flex gap-3">
          <button onClick={() => setModal(null)} className="flex-1 glass-panel hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-colors">Cancel</button>
          <button onClick={doReveal} disabled={actionLoading} className="flex-1 cyber-button py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
            {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />} Reveal
          </button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal show={modal === 'delete'} onClose={() => setModal(null)}>
        <h3 className="text-white font-bold text-lg mb-2">Delete Password</h3>
        <p className="text-[var(--color-cyber-text-muted)] text-sm mb-6 leading-relaxed">Are you sure you want to delete <span className="text-[var(--color-cyber-cyan)] font-semibold">{target?.site_name}</span>? This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setModal(null)} className="flex-1 glass-panel hover:bg-white/10 text-white font-medium py-3 rounded-xl transition-colors">Cancel</button>
          <button onClick={doDelete} className="flex-1 bg-red-500/90 hover:bg-red-500 text-white font-semibold py-3 rounded-xl shadow-[0_4px_15px_rgba(239,68,68,0.3)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.5)] transition-all">Delete</button>
        </div>
      </Modal>

      {/* Add Modal */}
      <Modal show={modal === 'add'} onClose={() => setModal(null)}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-white font-bold text-lg tracking-wide">Add Password</h3>
          <button onClick={() => setModal(null)} className="text-white/40 hover:text-[var(--color-cyber-cyan)] bg-white/5 p-2 rounded-full transition-colors"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <input value={addForm.siteName} onChange={e => setAddForm(f => ({...f, siteName: e.target.value}))} placeholder="Platform / Website Name" className={inputCls} />
          <div className="relative">
            <input type={showAddPw ? 'text' : 'password'} value={addForm.password}
              onChange={e => { setAddForm(f => ({...f, password: e.target.value})); checkLocal(e.target.value); }}
              placeholder="Your Password" className={inputCls + " pr-12"} />
            <div className="absolute right-3 top-1/2 -translate-y-1/2"><VisibilityToggle show={showAddPw} onToggle={() => setShowAddPw(p => !p)} /></div>
          </div>
          <StrengthMeter strength={addStrength} />
          <InfoNote visible={addForm.password.length > 0} />
          
          <select value={addForm.category} onChange={e => setAddForm(f => ({...f, category: e.target.value}))} className="w-full cyber-input px-4 py-3.5 rounded-xl cursor-pointer">
            <option value="email" className="bg-[var(--color-cyber-dark)]">Email</option>
            <option value="banking" className="bg-[var(--color-cyber-dark)]">Banking</option>
            <option value="social_media" className="bg-[var(--color-cyber-dark)]">Social Media</option>
            <option value="work" className="bg-[var(--color-cyber-dark)]">Work</option>
            <option value="others" className="bg-[var(--color-cyber-dark)]">Others</option>
          </select>
          
          <div className="flex gap-2">
            {['original','encrypted','both'].map(t =>
              <button key={t} onClick={() => setAddForm(f => ({...f, saveType: t}))} 
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  addForm.saveType === t 
                  ? 'cyber-button' 
                  : 'glass-panel text-white/60 hover:text-white hover:bg-white/10'
                }`}>
                {t[0].toUpperCase()+t.slice(1)}
              </button>
            )}
          </div>
          
          <input value={addForm.notes} onChange={e => setAddForm(f => ({...f, notes: e.target.value}))} placeholder="Optional secure note..." className={inputCls} />
          
          {(addForm.saveType === 'original' || addForm.saveType === 'both') &&
            <input type="password" value={addForm.masterPw} onChange={e => setAddForm(f => ({...f, masterPw: e.target.value}))} placeholder="Master password" className={inputCls} />}
          
          <button onClick={doAdd} disabled={actionLoading} className="w-full cyber-button mt-4 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2">
            {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />} Secure to Vault
          </button>
        </div>
      </Modal>
    </div>
  );
}
