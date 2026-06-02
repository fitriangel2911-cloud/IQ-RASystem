'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle({ showText = true }: { showText?: boolean }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        borderRadius: '10px',
        padding: showText ? '6px 12px' : '6px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: showText ? '8px' : '0px',
        color: 'var(--text-primary)',
        fontSize: '11px',
        fontWeight: 900,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 12px var(--shadow-color)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        flexShrink: 0
      }}
      title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
    >
      <span style={{ fontSize: '14px' }}>
        {theme === 'light' ? '🌙' : '☀️'}
      </span>
      {showText && (
        <span style={{ textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
          {theme === 'light' ? 'GELAP' : 'TERANG'}
        </span>
      )}
    </button>
  );
}
