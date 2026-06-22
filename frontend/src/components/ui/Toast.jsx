// ═══════════════════════════════════════════════════════════════════════════════
// VaultSense — Toast Notification Component
// ═══════════════════════════════════════════════════════════════════════════════
// Lightweight toast notifications for API success/error feedback.
// Usage: <Toast message="..." type="success|error|info" onClose={() => {}} />
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const TOAST_STYLES = {
  success: {
    bg: 'bg-success/10 border-success/30',
    icon: CheckCircle2,
    iconColor: 'text-success',
  },
  error: {
    bg: 'bg-danger/10 border-danger/30',
    icon: AlertTriangle,
    iconColor: 'text-danger',
  },
  info: {
    bg: 'bg-primary/10 border-primary/30',
    icon: Info,
    iconColor: 'text-primary',
  },
  warning: {
    bg: 'bg-amber-500/10 border-amber-500/30',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
  },
};

export function Toast({ message, type = 'info', onClose, duration = 3000 }) {
  const style = TOAST_STYLES[type] || TOAST_STYLES.info;
  const Icon = style.icon;

  useEffect(() => {
    if (duration > 0 && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border backdrop-blur-xl shadow-2xl max-w-sm ${style.bg}`}
    >
      <Icon className={`h-5 w-5 shrink-0 ${style.iconColor}`} />
      <span className="text-sm text-text font-medium">{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-2 p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="h-3.5 w-3.5 text-gray-400" />
        </button>
      )}
    </motion.div>
  );
}

/**
 * useToast() — Hook for managing toast state.
 */
export function useToast() {
  const [toast, setToast] = React.useState(null);

  const showToast = React.useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  const hideToast = React.useCallback(() => {
    setToast(null);
  }, []);

  const ToastComponent = toast ? (
    <Toast
      key={toast.id}
      message={toast.message}
      type={toast.type}
      onClose={hideToast}
    />
  ) : null;

  return { toast, showToast, hideToast, ToastComponent };
}
