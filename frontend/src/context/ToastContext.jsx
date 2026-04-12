import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext({});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] border backdrop-blur-2xl transition-all ${
                toast.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400 [text-shadow:0_0_8px_rgba(34,197,94,0.4)]' :
                toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400 [text-shadow:0_0_8px_rgba(239,68,68,0.4)]' :
                'bg-[var(--color-cyber-cyan)]/10 border-[var(--color-cyber-cyan)]/30 text-[var(--color-cyber-cyan)] [text-shadow:0_0_8px_rgba(0,229,255,0.4)]'
              }`}
            >
              {toast.type === 'success' && <CheckCircle size={18} />}
              {toast.type === 'error' && <AlertCircle size={18} />}
              {toast.type === 'info' && <Info size={18} />}
              <span className="text-sm font-medium flex-1">{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} className="opacity-60 hover:opacity-100">
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
