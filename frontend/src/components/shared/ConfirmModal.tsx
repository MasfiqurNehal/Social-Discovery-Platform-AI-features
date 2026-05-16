"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = 'danger',
  loading = false
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!loading ? onClose : undefined}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md surface-elevated rounded-3xl overflow-hidden shadow-2xl pointer-events-auto border border-[var(--border)]"
            >
              <div className="relative p-8">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-[var(--bg-default)] text-[var(--text-muted)] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Icon & Content */}
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className={`p-4 rounded-2xl ${type === 'danger' ? 'bg-red-500/10 text-red-500' :
                    type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-brand-500/10 text-brand-500'
                    }`}>
                    {type === 'danger' ? <Trash2 className="h-8 w-8" /> : <AlertCircle className="h-8 w-8" />}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">
                      {title}
                    </h3>
                    <p className="text-[15px] leading-relaxed text-[var(--text-muted)]">
                      {message}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 mt-8">
                  <button
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 px-6 py-3.5 rounded-2xl border border-[var(--border)] hover:bg-[var(--bg-default)] text-[var(--text-primary)] font-bold text-sm transition-all"
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={loading}
                    className={`flex-1 px-6 py-3.5 rounded-2xl text-white font-bold text-sm transition-all shadow-lg ${type === 'danger' ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' :
                      type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' :
                        'bg-brand-500 hover:bg-brand-600 shadow-brand-500/20'
                      }`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      confirmText
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

