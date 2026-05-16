'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import BrandLogo from '@/components/brand/BrandLogo';


export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if we have a session (Supabase automatically handles the hash/recovery token)
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setErrorMsg('Sesi pemulihan tidak valid atau telah kedaluwarsa. Silakan ajukan reset kata sandi kembali.');
      }
    };
    checkSession();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Kata sandi harus minimal 6 karakter.');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memperbarui kata sandi.');
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
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '24px' }}>
              <BrandLogo size={64} fontSize="32px" />
            </div>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'white', marginBottom: '8px' }}>
              Perbarui <span style={{ color: '#cca334' }}>Kata Sandi</span>
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
              Silakan masukkan kata sandi baru Anda di bawah ini
            </p>
          </div>

          {success ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '50px', marginBottom: '20px' }}>✅</div>
              <h3 style={{ color: 'white', marginBottom: '10px' }}>Berhasil!</h3>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>Kata sandi Anda telah diperbarui. Mengalihkan ke halaman login...</p>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword}>
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

              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Kata Sandi Baru</label>
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
                  placeholder="Ulangi kata sandi baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setFocusedField('confirm')}
                  onBlur={() => setFocusedField(null)}
                  style={getInputStyle('confirm')}
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
                {loading ? 'Memperbarui...' : 'Simpan Kata Sandi Baru'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
