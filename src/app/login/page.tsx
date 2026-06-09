'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import BrandLogo from '@/components/brand/BrandLogo';
import GlobalSiteBackground from '@/components/dashboard/GlobalSiteBackground';


export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetMode, setResetMode] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const supabase = createClient();

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
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
        const { data: dbProfile } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single();
          
        if (dbProfile) {
          const role = dbProfile.role;
          if (role === 'customer_service') window.location.href = '/customer-service';
          else if (role === 'teller') window.location.href = '/teller';
          else if (role === 'accounting') window.location.href = '/accounting';
          else if (role === 'manager') window.location.href = '/manager';
          else if (role === 'dps') window.location.href = '/dps';
          else if (role === 'member' || role === 'anggota') window.location.href = '/members';
          else if (role === 'account_officer' || role === 'ao') window.location.href = '/ao';
          else window.location.href = '/dashboard';
        } else {
          window.location.href = '/dashboard';
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi gangguan teknis.');
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const supabase = createClient();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Tautan reset kata sandi telah dikirim ke email Anda. Silakan periksa kotak masuk.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengirim email reset.');
    } finally {
      setLoading(false);
    }
  };

  const [showPassword, setShowPassword] = useState(false);
  
  const getInputStyle = (fieldName: string) => ({
    width: '100%',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '2px solid rgba(255, 255, 255, 0.25)',
    borderRadius: '16px',
    padding: '18px 20px',
    paddingRight: fieldName === 'pass' ? '55px' : '20px',
    color: '#ffffff',
    fontSize: '18px',
    outline: 'none',
    transition: 'all 0.25s ease',
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
        alignItems: 'flex-start', // Prevent center clipping on mobile
        justifyContent: 'center',
        padding: '32px 16px', // Enough padding for top margin
        position: 'relative',
        zIndex: 50,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch' // Smooth scroll on iOS
      }}>
        <div 
          className="hero-glass-container"
          style={{
            maxWidth: '500px',
            width: '100%',
            padding: '40px 24px', // Smaller padding for mobile fit
            margin: 'auto', // Centers vertically if taller than 100vh it pushes to top
            animation: 'fadeInScale 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative',
            zIndex: 60
          }}
        >
          
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '28px' }}>
              <BrandLogo size={72} fontSize="34px" /> {/* Enlarged logo */}
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#ffffff', marginBottom: '12px', letterSpacing: '-0.5px' }}>
              {resetMode ? 'Reset Kata Sandi' : <>Selamat Datang <span style={{ background: 'linear-gradient(135deg, #cca334 0%, #a67e26 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Kembali</span></>}
            </h2>
            <p style={{ fontSize: '17px', color: '#ffffff', fontWeight: 600, lineHeight: 1.5, opacity: 0.85 }}>
              {resetMode 
                ? 'Masukkan email Anda untuk menerima tautan pemulihan' 
                : 'Masuk untuk mengakses akun iQ-RA System Anda'}
            </p>
          </div>

          <form onSubmit={resetMode ? handleResetPassword : handleLogin}>
            
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

            {successMsg && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1.5px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '14px',
                padding: '16px',
                color: '#6ee7b7',
                fontSize: '15px',
                fontWeight: 700,
                marginBottom: '28px',
                textAlign: 'center',
                lineHeight: '1.5'
              }}>
                ✅ {successMsg}
              </div>
            )}

            <div style={{ marginBottom: '28px' }}>
              <label style={labelStyle}>Alamat Email</label>
              <input 
                type="email" 
                required
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={getInputStyle('email')}
                className="focus:border-[#cca334] focus:shadow-[0_0_12px_rgba(204,163,52,0.25)]"
              />
            </div>

            {!resetMode && (
              <div style={{ marginBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Kata Sandi</label>
                  <button 
                    type="button"
                    onClick={() => { setResetMode(true); setErrorMsg(null); setSuccessMsg(null); }}
                    style={{ background: 'none', border: 'none', padding: 0, fontSize: '15px', color: '#cca334', textDecoration: 'none', fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s' }} 
                    onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'} 
                    onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    Lupa Sandi?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required
                    placeholder="Masukkan kata sandi Anda"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={getInputStyle('pass')}
                    className="focus:border-[#cca334] focus:shadow-[0_0_12px_rgba(204,163,52,0.25)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '18px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.4)',
                      cursor: 'pointer',
                      fontSize: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '5px'
                    }}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              onClick={resetMode ? handleResetPassword : handleLogin}
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
              {loading 
                ? (resetMode ? 'Mengirim...' : 'Memproses...') 
                : (resetMode ? 'Kirim Tautan Reset' : 'Masuk ke Sistem')}
            </button>

            <div style={{ textAlign: 'center', marginTop: '32px' }}>
              <p style={{ fontSize: '16px', color: '#ffffff', fontWeight: 600, opacity: 0.85 }}>
                {resetMode ? (
                  <button 
                    type="button"
                    onClick={() => { setResetMode(false); setErrorMsg(null); setSuccessMsg(null); }}
                    style={{ background: 'none', border: 'none', color: '#cca334', textDecoration: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '16px' }}
                  >
                    Kembali ke Login
                  </button>
                ) : (
                  <>
                    Belum memiliki akun?{' '}
                    <Link href="/register" style={{ color: '#cca334', textDecoration: 'none', fontWeight: 800, transition: 'opacity 0.2s' }} onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'} onMouseOut={(e) => e.currentTarget.style.opacity = '1'}>
                      Daftar Akun Baru
                    </Link>
                  </>
                )}
              </p>
            </div>

          </form>

        </div>
      </div>
    </>
  );
}
