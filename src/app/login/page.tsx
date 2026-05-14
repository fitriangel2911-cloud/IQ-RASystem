'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import BrandLogo from '@/components/brand/BrandLogo';

function GlobalSiteBackground() {
  return (
    <div className="site-bg-wrapper" aria-hidden="true">
      <div className="site-bg-pattern" />
      <div className="site-bg-overlay" />
    </div>
  );
}



export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const supabase = createClient();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Friendly user error remapping for Supabase standard codes
        if (error.message.toLowerCase().includes('email not confirmed')) {
          setErrorMsg('Email Anda belum diaktivasi. Silakan periksa kotak masuk email Anda untuk tautan konfirmasi.');
        } else if (error.message.toLowerCase().includes('invalid login credentials')) {
          setErrorMsg('Email atau Kata Sandi yang Anda masukkan salah.');
        } else {
          setErrorMsg(error.message);
        }
        setLoading(false);
        return;
      }

      if (data?.user) {
        // Redirect on successful login to Dashboard
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi gangguan teknis.');
      setLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  
  const getInputStyle = (fieldName: string) => ({
    width: '100%',
    background: 'rgba(255, 255, 255, 0.05)',
    border: `1.5px solid ${focusedField === fieldName ? '#cca334' : 'rgba(255, 255, 255, 0.15)'}`,
    borderRadius: '14px',
    padding: '15px 18px',
    paddingRight: fieldName === 'pass' ? '50px' : '18px', // Extra space for the eye icon
    color: 'white',
    fontSize: '16px',
    outline: 'none',
    transition: 'all 0.25s ease',
    boxShadow: focusedField === fieldName ? '0 0 12px rgba(204, 163, 52, 0.15)' : 'none',
  });

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: 600,
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: '0.3px'
  };

  return (
    <>
      <GlobalSiteBackground />
      
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        position: 'relative',
        zIndex: 10
      }}>
        
        <div 
          className="hero-glass-container"
          style={{
            maxWidth: '460px',
            width: '100%',
            padding: '54px 40px',
            boxShadow: '0 30px 70px rgba(0,0,0,0.35)',
            animation: 'fadeInScale 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          
          {/* Branding Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '24px' }}>
              <BrandLogo size={64} fontSize="32px" />
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
              Selamat Datang <span style={{ color: '#cca334' }}>Kembali</span>
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
              Masuk untuk mengakses akun IQ-RA System Anda
            </p>
          </div>

          <form onSubmit={handleLogin}>
            
            {errorMsg && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '14px 16px',
                color: '#fca5a5',
                fontSize: '14px',
                fontWeight: 600,
                marginBottom: '24px',
                textAlign: 'center',
                lineHeight: '1.5',
                animation: 'shake 0.3s'
              }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Alamat Email</label>
              <input 
                type="email" 
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                style={getInputStyle('email')}
              />
            </div>

            <div style={{ marginBottom: '36px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Kata Sandi</label>
                <a href="#" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontWeight: 600 }} onMouseOver={(e) => e.currentTarget.style.color = '#cca334'} onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
                  Lupa Sandi?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required
                  placeholder="Masukkan kata sandi Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('pass')}
                  onBlur={() => setFocusedField(null)}
                  style={getInputStyle('pass')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '15px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '5px'
                  }}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary-gold" 
              style={{ 
                width: '100%', 
                padding: '16px', 
                fontSize: '17px', 
                border: 'none', 
                cursor: loading ? 'not-allowed' : 'pointer', 
                opacity: loading ? 0.7 : 1,
                fontWeight: 800 
              }}
            >
              {loading ? 'Memproses Masuk...' : 'Masuk ke Sistem'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '28px' }}>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                Belum memiliki akun?{' '}
                <Link href="/register" style={{ color: '#cca334', textDecoration: 'none', fontWeight: 700, transition: 'opacity 0.2s' }} onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'} onMouseOut={(e) => e.currentTarget.style.opacity = '1'}>
                  Daftar Akun Baru
                </Link>
              </p>
            </div>

          </form>

        </div>
      </div>
    </>
  );
}
