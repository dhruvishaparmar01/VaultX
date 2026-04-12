import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../services/api';

export default function SplashScreen() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [tagline, setTagline] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [profileName, setProfileName] = useState('');
  const fullTagline = 'Secure. Smart. Yours.';

  // Fetch profile name if user is logged in
  useEffect(() => {
    if (user) {
      getUserProfile(user.id).then(profile => {
        setProfileName(profile.first_name || '');
      }).catch(() => {});
    }
  }, [user]);

  // Typewriter effect
  useEffect(() => {
    const startDelay = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i < fullTagline.length) {
          setTagline(fullTagline.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
          setShowCursor(false);
        }
      }, 60);
      return () => clearInterval(interval);
    }, 1200);
    return () => clearTimeout(startDelay);
  }, []);

  // H6: Wait for auth to finish loading before starting redirect timer
  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      if (user) {
        navigate('/dashboard');
      } else {
        navigate('/auth');
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, [loading, user, navigate]);

  return (
    <motion.div
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--color-cyber-darkest)' }}
    >
      {/* Breathing gradient overlay */}
      <motion.div
        className="absolute inset-0 mix-blend-screen"
        animate={{ opacity: [0.15, 0.4, 0.15], scale: [1, 1.1, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(circle at center, var(--color-cyber-purple) 0%, transparent 60%)',
          filter: 'blur(60px)'
        }}
      />

      {/* Shield icon with glow */}
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.8, 1, 0.8],
          filter: [
            'drop-shadow(0 0 20px rgba(0,229,255,0.4))',
            'drop-shadow(0 0 40px rgba(0,229,255,0.8))',
            'drop-shadow(0 0 20px rgba(0,229,255,0.4))'
          ]
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="relative z-10"
      >
        <ShieldCheck size={80} className="text-[var(--color-cyber-cyan)] stroke-[1.5]" />
      </motion.div>

      {/* App name */}
      <motion.h1
        className="text-[var(--color-cyber-text)] font-bold text-5xl mt-6 tracking-tight relative z-10"
        initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
      >
        Vault<span className="text-[var(--color-cyber-cyan)]">X</span>
      </motion.h1>

      {/* Tagline with typewriter */}
      <div className="mt-3 h-6 relative z-10 font-medium">
        <span className="text-[var(--color-cyber-teal)] text-base">
          {tagline}
          {showCursor && (
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
              className="inline-block ml-0.5"
            >
              |
            </motion.span>
          )}
        </span>
      </div>

      {/* Personalized welcome for logged-in users */}
      {user && profileName && (
        <motion.p
          initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ delay: 1.8, duration: 0.8 }}
          className="text-[var(--color-cyber-text)] text-lg font-semibold mt-4 tracking-wide relative z-10"
        >
          Welcome back, <span className="text-[var(--color-cyber-cyan)]">{profileName}</span> 👋
        </motion.p>
      )}

      {/* Loading dots */}
      <div className="flex gap-2.5 mt-10 relative z-10">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-2.5 h-2.5 bg-[var(--color-cyber-cyan)] rounded-full shadow-[0_0_10px_rgba(0,229,255,0.6)]"
            animate={{ y: [0, -10, 0], opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut'
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
