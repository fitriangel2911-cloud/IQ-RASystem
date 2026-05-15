'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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



export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation checks
    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal terdiri dari 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      // 1. Sign Up user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName
          }
        }
      });

      if (authError) {
        setErrorMsg(authError.message);
        setLoading(false);
        return;
      }

      if (authData?.user) {
        // 2. Record the user details in public.users (Hardcoded Role: 'member')
        const { error: dbError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            full_name: fullName,
            email: email,
            password: password, // Demonstrative plaintext storage for admin auditing
            role: 'member'
          });

        if (dbError) {
          // Clean up or log if the public profile fails to insert
          console.error('Failed to insert public user record:', dbError);
        }

        // Set success to show activation screen
        setSuccess(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan teknis.');
    } finally {
      setLoading(false);
    }
  };

  const getInputStyle = (fieldName: string) => ({
    width: '100%',
    background: 'rgba(255, 255, 255, 0.05)',
    border: `1.5px solid ${focusedField === fieldName ? '#cca334' : 'rgba(255, 255, 255, 0.15)'}`,
    borderRadius: '14px',
    padding: '15px 18px',
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
            maxWidth: '500px',
            width: '100%',
            padding: '48px 40px',
            boxShadow: '0 30px 70px rgba(0,0,0,0.35)',
            animation: 'fadeInScale 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          
          {/* Branding Header */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '20px' }}>
              <BrandLogo size={64} fontSize="32px" />
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
              Registrasi <span style={{ color: '#cca334' }}>Akun Baru</span>
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
              Buat akun akses digital iQ-RA System Anda
            </p>
          </div>

          {success ? (
            /* Verification Prompt View */
            <div style={{ textAlign: 'center', animation: 'fadeIn 0.4s' }}>
              <div style={{ fontSize: '64px', marginBottom: '24px' }}>✉️</div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#cca334', marginBottom: '16px' }}>
                Registrasi Berhasil!
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '16px', lineHeight: '1.7', marginBottom: '32px' }}>
                Tautan aktivasi telah dikirimkan ke email <strong>{email}</strong>.<br />
                Silakan cek kotak masuk atau folder spam Anda dan lakukan konfirmasi untuk mengaktifkan akun Anda.
              </p>
              
              <Link href="/login" className="btn-primary-gold" style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: 800 }}>
                Kembali ke Login
              </Link>
            </div>
          ) : (
            /* Registration Form View */
            <form onSubmit={handleRegister}>
              
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
                  animation: 'shake 0.3s'
                }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Nama Lengkap</label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Ahmad Fauzi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  style={getInputStyle('name')}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Alamat Email Aktif</label>
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

              <div style={{ marginBottom: '20px' }}>
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

              <div style={{ marginBottom: '36px' }}>
                <label style={labelStyle}>Konfirmasi Kata Sandi</label>
                <input 
                  type="password" 
                  required
                  placeholder="Ulangi kata sandi Anda"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField('confirmPass')}
                  onBlur={() => setFocusedField(null)}
                  style={getInputStyle('confirmPass')}
                />
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
                {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                  Sudah memiliki akun?{' '}
                  <Link href="/login" style={{ color: '#cca334', textDecoration: 'none', fontWeight: 700, transition: 'opacity 0.2s' }} onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'} onMouseOut={(e) => e.currentTarget.style.opacity = '1'}>
                    Masuk di sini
                  </Link>
                </p>
              </div>

            </form>
          )}

        </div>
      </div>
    </>
  );
}
