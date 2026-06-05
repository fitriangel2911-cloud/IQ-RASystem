import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, isVisible, onClose, duration = 3500 }: ToastProps) {
  const [render, setRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setRender(true);
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const handleAnimationEnd = () => {
    if (!isVisible) setRender(false);
  };

  if (!render) return null;

  const getTheme = () => {
    switch (type) {
      case 'success': return { bg: 'rgba(16, 185, 129, 0.95)', border: '#059669', icon: '✅', text: '#ffffff' };
      case 'error': return { bg: 'rgba(239, 68, 68, 0.95)', border: '#b91c1c', icon: '❌', text: '#ffffff' };
      case 'warning': return { 
        bg: 'rgba(245, 158, 11, 0.95)', 
        border: '#d97706', 
        icon: <div style={{ background: '#02130e', color: '#f59e0b', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 900 }}>!</div>, 
        text: '#02130e' 
      };
      default: return { bg: 'rgba(59, 130, 246, 0.95)', border: '#2563eb', icon: 'ℹ️', text: '#ffffff' };
    }
  };

  const theme = getTheme();

  const toastContent = (
    <div 
      style={{
        position: 'fixed',
        top: isVisible ? '40px' : '-20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        background: theme.bg,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.border}`,
        borderRadius: '16px',
        padding: '16px 24px',
        color: theme.text,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        fontWeight: 800,
        fontSize: '14px',
        minWidth: '300px',
        maxWidth: '80%',
        justifyContent: 'center'
      }}
      onTransitionEnd={handleAnimationEnd}
    >
      <span style={{ fontSize: '18px' }}>{theme.icon}</span>
      <span>{message}</span>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(toastContent, document.body) : null;
}
