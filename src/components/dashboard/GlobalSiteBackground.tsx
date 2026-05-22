'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';

/**
 * GlobalSiteBackground
 * Menyediakan latar belakang solid hijau zamrud gelap yang mewah dengan 
 * efek animasi pola geometris Islami emas-putih yang bergerak lambat secara universal.
 * Dirender di z-index: 1 di bawah z-index: 10 pembungkus konten utama.
 */
export default function GlobalSiteBackground() {
  const pathname = usePathname();
  const { theme } = useTheme();

  // Deteksi rute dasbor secara cerdas untuk isolasi mutlak halaman publik
  const isDashboardRoute = 
    pathname?.startsWith('/members') || 
    pathname?.startsWith('/dashboard') || 
    pathname?.startsWith('/teller') || 
    pathname?.startsWith('/customer-service') || 
    pathname?.startsWith('/accounting') || 
    pathname?.startsWith('/ao') || 
    pathname?.startsWith('/manager') || 
    pathname?.startsWith('/dps');

  const isDarkDashboard = isDashboardRoute && theme === 'dark';

  // Latar dasar: Hijau zamrud pekat (#02130e) untuk malam, off-white (#f4f6f5) untuk siang, dan putih bersih (#ffffff) untuk halaman publik
  const baseBgColor = isDashboardRoute 
    ? (theme === 'dark' ? '#02130e' : '#f4f6f5')
    : '#ffffff';

  // Opacity pola: 0.28 agar menyatu elegan sebagai watermark bercahaya di dasbor gelap, 0.45 di dasbor terang agar terlihat jelas dengan warna aslinya, atau 1.0 penuh di halaman publik
  const patternOpacity = isDashboardRoute 
    ? (theme === 'light' ? 0.45 : 0.28) 
    : 1.0;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1, // Berada di atas html/body tetapi di bawah konten utama (yang disetel zIndex: 10)
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
      aria-hidden="true"
    >
      {/* Pola Geometris Islami Animasi Sesuai Gambar Asli */}
      <div 
        className="islamic-pattern-overlay-top"
        style={{
          position: 'absolute',
          inset: '-500px',
          backgroundImage: 'url("/pattern-bg.png")',
          backgroundSize: '500px auto',
          backgroundRepeat: 'repeat',
          opacity: patternOpacity,
          animation: 'movePatternTop 90s linear infinite',
          filter: 'none', 
          mixBlendMode: 'normal',
          transition: 'all 0.5s ease',
          zIndex: 2,
          pointerEvents: 'none'
        }}
      />
      
      {/* Latar Belakang Dasar Putih/Zamrud Dinamis */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          backgroundColor: baseBgColor,
          transition: 'background-color 0.5s ease',
          pointerEvents: 'none'
        }}
      />

      <style jsx global>{`
        @keyframes movePatternTop {
          from { transform: translate(0, 0); }
          to { transform: translate(500px, 500px); }
        }
      `}</style>
    </div>
  );
}
