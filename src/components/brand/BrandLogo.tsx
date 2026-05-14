'use client';

import React from 'react';

interface BrandLogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
  fontSize?: string;
  gap?: string;
}

export default function BrandLogo({ 
  size = 40, 
  showText = true, 
  textColor = '#f3c653', 
  fontSize = '24px',
  gap = '12px'
}: BrandLogoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap }}>
      <div style={{
        background: 'linear-gradient(135deg, #f3c653 0%, #cca334 100%)',
        width: size,
        height: size,
        borderRadius: size * 0.25,
        padding: size * 0.1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(204, 163, 52, 0.3)',
        flexShrink: 0
      }}>
        <img 
          src="/logo-recolored.png" 
          alt="iQ-RA Logo" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
        />
      </div>
      {showText && (
        <div style={{ 
          fontSize, 
          fontWeight: 900, 
          color: textColor, 
          letterSpacing: '1px',
          textTransform: 'uppercase',
          lineHeight: 1
        }}>
          iQ-RA <span style={{ opacity: 0.8, fontSize: '0.5em', display: 'block', marginTop: '2px' }}>System</span>
        </div>
      )}
    </div>
  );
}
