import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

export default function FormModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '550px',
}: FormModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="modal-content"
            style={{ maxWidth }}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--space-6)',
            }}>
              <h2 style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                letterSpacing: '-0.01em',
              }}>
                {title}
              </h2>
              <button
                onClick={onClose}
                aria-label="Close modal"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-text-tertiary)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-bg-subtle)';
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-tertiary)';
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div>{children}</div>

            {/* Footer */}
            {footer && (
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 'var(--space-3)',
                marginTop: 'var(--space-6)',
                paddingTop: 'var(--space-5)',
                borderTop: '1px solid var(--color-border)',
              }}>
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
