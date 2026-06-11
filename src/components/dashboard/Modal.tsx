import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/context/ThemeContext';

export interface ModalProps {
  isOpen: boolean;
  type: 'alert' | 'confirm';
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export default function Modal({ isOpen, type, title, message, confirmText = 'OK', cancelText = 'Batal', onConfirm, onCancel }: ModalProps) {
  const { theme } = useTheme();
  const [render, setRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) setRender(true);
  }, [isOpen]);

  const handleAnimationEnd = () => {
    if (!isOpen) setRender(false);
  };

  if (!render) return null;

  const isAlert = type === 'alert';

  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        opacity: isOpen ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
      onTransitionEnd={handleAnimationEnd}
    >
      <div 
        style={{
          background: 'var(--bg-card)',
          backdropFilter: 'blur(20px)',
          border: '1.5px solid var(--border-primary)',
          borderRadius: '24px',
          padding: '32px',
          width: '90%',
          maxWidth: '400px',
          boxShadow: '0 25px 50px var(--shadow-color)',
          transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          color: 'var(--text-primary)'
        }}
      >
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: isAlert ? (title.toLowerCase().includes('berhasil') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)') : 'rgba(243, 198, 83, 0.1)',
          color: isAlert ? (title.toLowerCase().includes('berhasil') ? '#10b981' : '#ef4444') : 'var(--gold-intense)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          {isAlert ? (
            title.toLowerCase().includes('berhasil') ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            )
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          )}
        </div>

        <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: 900 }}>{title}</h3>
        <p style={{ margin: '0 0 32px 0', fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          {!isAlert && (
            <button 
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '14px',
                border: '2px solid var(--border-primary)',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '15px',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              {cancelText}
            </button>
          )}
          <button 
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '14px',
              border: 'none',
              background: isAlert && !title.toLowerCase().includes('berhasil') ? '#ef4444' : 'var(--text-primary)',
              color: isAlert && !title.toLowerCase().includes('berhasil') ? '#ffffff' : 'var(--bg-page)',
              fontSize: '15px',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 10px 20px var(--shadow-color)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
