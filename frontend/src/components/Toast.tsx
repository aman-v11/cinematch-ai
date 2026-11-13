import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, BookmarkCheck, Heart, Info, AlertCircle, X } from 'lucide-react';
import type { ToastNotification } from '../lib/utils';

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<ToastNotification>;
      const toast = customEvent.detail;
      setToasts((prev) => [toast, ...prev.slice(0, 4)]);

      // Auto dismiss after 3.5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 3500);
    };

    window.addEventListener('cinematch-toast', handleToast);
    return () => window.removeEventListener('cinematch-toast', handleToast);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
        maxWidth: 360,
        width: 'calc(100vw - 48px)',
      }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          let Icon = Info;
          let iconColor = 'var(--accent-light)';
          let borderColor = 'var(--border-accent)';
          let glowColor = 'var(--accent-glow)';

          if (toast.type === 'watchlist') {
            Icon = BookmarkCheck;
            iconColor = '#60a5fa'; // blue
            borderColor = 'rgba(96, 165, 250, 0.4)';
            glowColor = 'rgba(96, 165, 250, 0.2)';
          } else if (toast.type === 'like') {
            Icon = Heart;
            iconColor = '#f43f5e'; // rose/red
            borderColor = 'rgba(244, 63, 94, 0.4)';
            glowColor = 'rgba(244, 63, 94, 0.2)';
          } else if (toast.type === 'success') {
            Icon = CheckCircle2;
            iconColor = '#10b981'; // green
            borderColor = 'rgba(16, 185, 129, 0.4)';
            glowColor = 'rgba(16, 185, 129, 0.2)';
          } else if (toast.type === 'error') {
            Icon = AlertCircle;
            iconColor = '#ef4444';
            borderColor = 'rgba(239, 68, 68, 0.4)';
            glowColor = 'rgba(239, 68, 68, 0.2)';
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                pointerEvents: 'auto',
                background: 'rgba(17, 17, 24, 0.95)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1px solid ${borderColor}`,
                boxShadow: `0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px ${glowColor}`,
                borderRadius: 14,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: iconColor,
                }}
              >
                <Icon size={18} fill={toast.type === 'like' ? 'currentColor' : 'none'} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                  }}
                >
                  {toast.title}
                </p>
                {toast.message && (
                  <p
                    style={{
                      margin: '2px 0 0',
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.3,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {toast.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 6,
                }}
                aria-label="Close notification"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
