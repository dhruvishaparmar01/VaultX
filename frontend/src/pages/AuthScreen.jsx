import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import VisibilityToggle from '../components/VisibilityToggle';

export default function AuthScreen() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // ═══ Part 5: Final Login Handler ═══
  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be 6+ characters.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password.trim()
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('confirm') || msg.includes('verified')) {
          setError(
            'Disable "Confirm email" in Supabase → Authentication → Providers → Email → Save'
          );
        } else if (
          msg.includes('invalid') ||
          msg.includes('credentials') ||
          msg.includes('wrong')
        ) {
          setError('Wrong email or password.');
        } else {
          setError(error.message);
        }
        return;
      }

      if (data?.session) {
        navigate('/dashboard', { replace: true });
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // ═══ Part 5: Final Signup Handler ═══
  const handleSignup = async () => {
    setError('');
    if (!firstName.trim()) {
      setError('First name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password.trim(),
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim()
          },
          emailRedirectTo: undefined
        }
      });

      if (error) {
        if (error.message.includes('registered')) {
          setError('Account already exists. Please login.');
        } else {
          setError(error.message);
        }
        return;
      }

      if (data?.user) {
        // Check for duplicate identities (existing account)
        if (data.user.identities && data.user.identities.length === 0) {
          setError('An account with this email already exists. Try logging in instead.');
          return;
        }

        // Save profile — ignore if already exists
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: data.user.email,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            master_password_hash: ''
          }, { onConflict: 'id' });
        } catch { /* non-critical */ }

        addToast('Account created successfully!', 'success');
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // ═══ Part 5: Google Login ═══
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard'
      }
    });
    if (error) {
      setError('Google login failed: ' + error.message);
      setLoading(false);
    }
  };

  // ═══ H3: Forgot Password Flow ═══
  const handleForgotPassword = async () => {
    if (!email || !email.includes('@')) {
      setError('Enter your email address above first.');
      return;
    }
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: window.location.origin + '/auth' }
    );
    if (!error) {
      setResetSent(true);
      setError('');
    } else {
      setError(error.message);
    }
    setResetLoading(false);
  };

  const inputCls = "w-full cyber-input rounded-xl px-4 py-3 outline-none";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen flex items-center justify-center px-4 relative z-10"
    >
      <div className="glass-panel rounded-2xl p-8 w-full max-w-md relative overflow-hidden">
        {/* Subtle top glow line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--color-cyber-cyan)] to-transparent opacity-50"></div>
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <ShieldCheck size={24} className="text-luna-lightest" />
          <span className="text-luna-lightest font-semibold text-xl">VaultX</span>
        </div>

        {/* Tab toggle */}
        <div className="flex bg-[#0f172a8c] border border-white/5 rounded-xl p-1.5 mb-6">
          <button
            onClick={() => { setIsLogin(true); setError(''); setResetSent(false); }}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
              isLogin ? 'cyber-button' : 'text-white/60 hover:text-white'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); setResetSent(false); }}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
              !isLogin ? 'cyber-button' : 'text-white/60 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); isLogin ? handleLogin() : handleSignup(); }}
          className="space-y-4"
        >
          {/* First & Last Name (signup only) */}
          <AnimatePresence>
            {!isLogin && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/70 text-sm font-medium mb-1.5 block">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="First Name"
                      required
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-white/70 text-sm font-medium mb-1.5 block">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Last Name"
                      className={inputCls}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email */}
          <div>
            <label className="text-white/70 text-sm font-medium mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className={inputCls}
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-white/70 text-sm font-medium mb-1.5 block">
              {isLogin ? 'Password' : 'Master Password'}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className={inputCls + ' pr-12'}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <VisibilityToggle show={showPassword} onToggle={() => setShowPassword(p => !p)} />
              </div>
            </div>
          </div>

          {/* Confirm password (signup only) */}
          <AnimatePresence>
            {!isLogin && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
              >
                <label className="text-white/70 text-sm font-medium mb-1.5 block">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    className={inputCls + ' pr-12'}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <VisibilityToggle show={showConfirm} onToggle={() => setShowConfirm(p => !p)} />
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-red-500/10 border-l-2 border-red-500 rounded-r-lg px-4 py-3 mt-3 shadow-[0_4px_15px_rgba(239,68,68,0.1)]">
                  <p className="text-red-200/90 text-sm">
                    ⚠️ This is your master password. If you forget it, your saved passwords cannot be recovered. Store it safely.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* H3: Forgot password */}
          {isLogin && (
            <div className="text-right">
              {resetSent ? (
                <p className="text-green-400 text-xs mt-1">
                  ✓ Reset link sent to your email
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                  className="text-xs mt-1 block ml-auto"
                  style={{ color: '#06B6D4' }}
                >
                  {resetLoading ? 'Sending...' : 'Forgot Password?'}
                </button>
              )}
            </div>
          )}

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-red-400 text-sm"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full cyber-button rounded-xl py-3.5 flex items-center justify-center gap-2 mt-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {isLogin ? 'Login to Vault' : 'Create Secure Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 border-b border-white/10" />
          <span className="text-white/30 text-xs tracking-wider uppercase">or continue with</span>
          <div className="flex-1 border-b border-white/10" />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full glass-panel hover:bg-white/5 border border-white/10 text-white/90 py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 font-semibold disabled:opacity-70 group"
        >
          <div className="bg-white/10 group-hover:bg-white/20 p-1.5 rounded-full transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
          Google
        </button>
      </div>
    </motion.div>
  );
}
