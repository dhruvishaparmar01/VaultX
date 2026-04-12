import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldCheck, Lock, Loader2, Check } from 'lucide-react';
import { encryptPassword, saveToVault, getAiSuggestions } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import VisibilityToggle from '../components/VisibilityToggle';
import CopyButton from '../components/CopyButton';
import StrengthMeter from '../components/StrengthMeter';
import InfoNote from '../components/InfoNote';
import GeminiSuggestion from '../components/GeminiSuggestion';

// H1: Debounce hook to prevent API hammering on every keystroke
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function EncryptTool() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [encrypted, setEncrypted] = useState('');
  const [strength, setStrength] = useState(null);
  const [breached, setBreached] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [saveChecked, setSaveChecked] = useState(false);
  const [siteName, setSiteName] = useState('');
  const [category, setCategory] = useState('others');
  const [saveType, setSaveType] = useState('encrypted');
  const [masterPassword, setMasterPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // H1: Debounced password value — API calls only fire after 400ms of no typing
  const debouncedPassword = useDebounce(password, 400);

  // H1: Encrypt handler wrapped in useCallback to satisfy hook deps
  const handleEncrypt = useCallback(async (value) => {
    try {
      const result = await encryptPassword(value);
      if (result.success) {
        setEncrypted(result.data.encrypted);
        setStrength(result.data.strength);
        setBreached(result.data.breached);

        // Get AI suggestions for weak/fair passwords
        if (result.data.strength.label === 'Weak' || result.data.strength.label === 'Fair' || result.data.strength.label === 'Too Common') {
          setAiLoading(true);
          try {
            const aiRes = await getAiSuggestions(value, result.data.strength);
            if (aiRes.success) setAiSuggestions(aiRes.data.suggestions);
          } catch {
            setAiSuggestions(result.data.strength.suggestions || []);
          } finally {
            setAiLoading(false);
          }
        } else {
          setAiSuggestions([]);
        }
      }
    } catch {
      // Silent fail — keep previous state
    }
  }, []);

  // H1: Run encrypt API when debounced value changes
  useEffect(() => {
    if (!debouncedPassword) {
      setEncrypted('');
      setStrength(null);
      setBreached(null);
      setAiSuggestions([]);
      return;
    }

    handleEncrypt(debouncedPassword);
  }, [debouncedPassword, handleEncrypt]);

  const handleSave = async () => {
    if (!siteName.trim()) {
      addToast('Please enter a site name', 'error');
      return;
    }
    if ((saveType === 'original' || saveType === 'both') && !masterPassword) {
      addToast('Master password required to save original', 'error');
      return;
    }

    setSaving(true);
    try {
      await saveToVault({
        siteName,
        category,
        saveType,
        originalPassword: password,
        masterPassword: saveType === 'encrypted' ? undefined : masterPassword,
        notes
      });
      setSaveSuccess(true);
      addToast('Saved to Vault!', 'success');
      setTimeout(() => {
        setSaveSuccess(false);
        setSaveChecked(false);
        setSiteName('');
        setNotes('');
        setMasterPassword('');
      }, 1500);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-luna-dark">
      <Sidebar />
      <TopBar title="Encrypt & Analyze" />

      <main className="lg:ml-60 p-6 pb-24 lg:pb-6 max-w-3xl">
        {/* Page title */}
        <h2 className="text-white font-bold text-2xl mb-6 tracking-wide drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">Encrypt & Analyze</h2>

        {/* Password Input Card */}
        <div className="glass-panel rounded-2xl p-7 relative">
          <label className="text-[var(--color-cyber-text-muted)] text-[12px] uppercase tracking-widest font-semibold mb-3 block">Enter Your Password</label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 group">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Type a password to analyze..."
                className="w-full cyber-input text-white rounded-xl px-4 py-4 pr-12 text-lg tracking-wide"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <VisibilityToggle show={showPassword} onToggle={() => setShowPassword(p => !p)} />
              </div>
            </div>
            <CopyButton text={password} />
          </div>

          <StrengthMeter strength={strength} />
        </div>

        {/* Info Note */}
        <InfoNote visible={password.length > 0} />

        {/* Encrypted Output */}
        <AnimatePresence>
          {encrypted && (
            <motion.div
              initial={{ opacity: 0, y: 15, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              className="glass-panel border-white/5 rounded-2xl p-7 mt-5 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--color-cyber-purple)] to-transparent opacity-50"></div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-[var(--color-cyber-text-muted)] text-[12px] uppercase tracking-widest font-semibold">Encrypted Version</span>
                <span className="bg-[var(--color-cyber-purple)]/20 border border-[var(--color-cyber-purple)]/30 text-[var(--color-cyber-purple)] text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-md shadow-[0_0_10px_rgba(124,58,237,0.3)]">16-char Encrypted Key</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  readOnly
                  value={encrypted}
                  className="flex-1 bg-black/40 border border-white/5 text-[var(--color-cyber-cyan)] font-mono text-lg rounded-xl px-5 py-4 outline-none shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)]"
                />
                <CopyButton text={encrypted} size={22} />
              </div>
              <p className="text-[var(--color-cyber-text-muted)]/60 text-[11px] mt-2 tracking-wide">
                This 16-character key is universally unique to your password. It consistently outputs the exact same hash.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Breach Check Result */}
        <AnimatePresence>
          {breached !== null && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl p-3 mt-4 flex items-center gap-2 ${
                breached?.breached
                  ? 'bg-red-500/10 border border-red-400/50'
                  : 'bg-green-500/10 border border-green-400/30'
              }`}
            >
              {breached?.breached ? (
                <>
                  <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">
                    ⚠️ This password was found in {breached.count.toLocaleString()} data breaches. Do not use it.
                  </p>
                </>
              ) : breached?.breached === false ? (
                <>
                  <ShieldCheck size={18} className="text-green-400 flex-shrink-0" />
                  <p className="text-green-400 text-sm">✓ This password has not been found in known breaches.</p>
                </>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save to Vault */}
        <AnimatePresence>
          {encrypted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 ml-2"
            >
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={saveChecked}
                  onChange={e => setSaveChecked(e.target.checked)}
                  className="hidden"
                />
                <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                  saveChecked ? 'bg-[var(--color-cyber-cyan)] shadow-[0_0_10px_rgba(0,229,255,0.6)]' : 'border border-white/20 bg-white/5 group-hover:bg-white/10'
                }`}>
                  {saveChecked && <span className="text-[var(--color-cyber-darkest)] text-xs font-bold">✓</span>}
                </div>
                <span className="text-white/80 text-sm font-medium tracking-wide">Save this password to my Vault</span>
              </label>

              <AnimatePresence>
                {saveChecked && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4 mt-6 glass-panel rounded-2xl p-6">
                      <input
                        value={siteName}
                        onChange={e => setSiteName(e.target.value)}
                        placeholder="Platform / Website Name (e.g. Gmail)"
                        className="w-full cyber-input px-4 py-3.5 rounded-xl"
                      />
                      <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="w-full cyber-input px-4 py-3.5 rounded-xl appearance-none cursor-pointer"
                      >
                        <option value="email" className="bg-[var(--color-cyber-dark)]">Email</option>
                        <option value="banking" className="bg-[var(--color-cyber-dark)]">Banking</option>
                        <option value="social_media" className="bg-[var(--color-cyber-dark)]">Social Media</option>
                        <option value="work" className="bg-[var(--color-cyber-dark)]">Work</option>
                        <option value="others" className="bg-[var(--color-cyber-dark)]">Others</option>
                      </select>
                      <input
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Optional secure note..."
                        className="w-full cyber-input px-4 py-3.5 rounded-xl"
                      />

                      {/* Save type toggle */}
                      <div className="flex gap-2.5">
                        {['original', 'encrypted', 'both'].map(type => (
                          <button
                            key={type}
                            onClick={() => setSaveType(type)}
                            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                              saveType === type
                                ? 'cyber-button'
                                : 'glass-panel text-white/60 hover:text-white hover:bg-white/10 border-white/5'
                            }`}
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </button>
                        ))}
                      </div>

                      {/* Master password for original save */}
                      {(saveType === 'original' || saveType === 'both') && (
                        <div className="relative">
                           <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-cyber-text-muted)]" />
                           <input
                            type="password"
                            value={masterPassword}
                            onChange={e => setMasterPassword(e.target.value)}
                            placeholder="Master password to encrypt original"
                            className="w-full cyber-input pl-11 pr-4 py-3.5 rounded-xl"
                           />
                        </div>
                      )}

                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all mt-6 ${
                          saveSuccess
                            ? 'bg-green-500/20 border border-green-500/50 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                            : 'cyber-button shadow-[0_4px_15px_rgba(0,229,255,0.2)] hover:shadow-[0_6px_25px_rgba(0,229,255,0.4)]'
                        } disabled:opacity-70`}
                      >
                        {saving ? <Loader2 size={18} className="animate-spin text-[var(--color-cyber-darkest)]" /> : saveSuccess ? <Check size={18} /> : <Lock size={18} className="text-[var(--color-cyber-darkest)]" />}
                        {saveSuccess ? 'Secured in Vault' : 'Secure to Vault'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Suggestions */}
        {(strength?.label === 'Weak' || strength?.label === 'Fair' || strength?.label === 'Too Common') && (
          <GeminiSuggestion suggestions={aiSuggestions} loading={aiLoading} />
        )}
      </main>

      <BottomNav />
    </div>
  );
}
