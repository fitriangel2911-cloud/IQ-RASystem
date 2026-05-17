'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import BrandLogo from '@/components/brand/BrandLogo';
import GlobalSiteBackground from '@/components/dashboard/GlobalSiteBackground';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const supabase = createClient();

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      if (data?.user) {
        router.push('/login?msg=Silakan cek email Anda untuk konfirmasi akun.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi gangguan teknis.');
      setLoading(false);
    }
  };

  const getInputStyle = (fieldName: string) => ({
    width: '100%',
    background: 'rgba(255, 255, 255, 0.08)', // Premium glass input background
    border: `2px solid ${focusedField === fieldName ? '#cca334' : 'rgba(255, 255, 255, 0.25)'}`, // Gold focus border
    borderRadius: '16px',
    padding: '18px 20px',
    color: '#ffffff', // Pure white typed text
    fontSize: '18px', // Enlarged input text
    outline: 'none',
    transition: 'all 0.25s ease',
    boxShadow: focusedField === fieldName ? '0 0 12px rgba(204, 163, 52, 0.25)' : 'none',
  });

  const labelStyle = {
    display: 'block',
    marginBottom: '10px',
    fontSize: '16px', // Enlarged label text
    fontWeight: 700, // Bolder
    color: '#ffffff', // Pure white label text
    letterSpacing: '0.5px'
  };

  return (
    <>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        position: 'relative',
        zIndex: 10
      }}>
        
        <div 
          className="hero-glass-container"
          style={{
            maxWidth: '540px', // Slightly wider for larger inputs
            width: '100%',
            padding: '60px 48px',
            // Inherits the beautiful dark green glass background and gold border from the home page
            animation: 'fadeInScale 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          
          {/* Branding Header */}
          <div style={{ textAlign: 'center', marginBottom: '44px' }}>
            <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '28px' }}>
              <BrandLogo size={72} fontSize="34px" /> {/* Enlarged logo */}
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#ffffff', marginBottom: '12px', letterSpacing: '-0.5px' }}>
              Registrasi <span style={{ background: 'linear-gradient(135deg, #cca334 0%, #a67e26 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Akun Baru</span>
            </h2>
            <p style={{ fontSize: '17px', color: '#ffffff', fontWeight: 600, lineHeight: 1.5, opacity: 0.85 }}>
              Buat akun akses digital iQ-RA System Anda
            </p>
          </div>

          <form onSubmit={handleRegister}>
            
            {errorMsg && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1.5px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '14px',
                padding: '16px',
                color: '#fca5a5',
                fontSize: '15px',
                fontWeight: 700,
                marginBottom: '28px',
                textAlign: 'center',
                lineHeight: '1.5',
                animation: 'shake 0.3s'
              }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Nama Lengkap</label>
              <input 
                type="text" 
                required
                placeholder="Masukkan nama lengkap Anda"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                style={getInputStyle('name')}
              />
            </div>

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

            <div style={{ marginBottom: '40px' }}>
              <label style={labelStyle}>Kata Sandi</label>
              <input 
                type="password" 
                required
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('pass')}
                onBlur={() => setFocusedField(null)}
                style={getInputStyle('pass')}
              />
            </div>

            <div style={{ display: 'grid', gap: '16px' }}>
              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary-gold" 
                style={{ 
                  width: '100%', 
                  padding: '18px', // Enlarged button padding
                  fontSize: '20px', // Enlarged button text
                  border: 'none', 
                  cursor: loading ? 'not-allowed' : 'pointer', 
                  opacity: loading ? 0.7 : 1,
                  fontWeight: 900,
                  borderRadius: '16px'
                }}
              >
                {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '32px' }}>
                <p style={{ fontSize: '16px', color: '#ffffff', fontWeight: 600, opacity: 0.85 }}>
                  Sudah memiliki akun?{' '}
                  <Link href="/login" style={{ color: '#cca334', textDecoration: 'none', fontWeight: 800, transition: 'opacity 0.2s' }} onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'} onMouseOut={(e) => e.currentTarget.style.opacity = '1'}>
                    Masuk Sekarang
                  </Link>
                </p>
              </div>
            </div>

          </form>

        </div>
      </div>
    </>
  );
}
