import React, { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function EditProfileModal({ isOpen, onClose, profile, onUpdate }: any) {
  const [phone, setPhone] = useState(profile?.phone || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limit file size to 2MB
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file maksimal 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
        // Note: For full implementation, this file should be uploaded to Supabase Storage 
        // and the resulting public URL saved to avatarUrl. 
        // For now, we'll store the data URL in preview state to give immediate visual feedback.
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const supabase = createClient();
    
    // In a real app, you would upload the file to Supabase Storage here and get the URL
    // const uploadedUrl = await uploadToStorage(file);
    // For this prototype, we'll just save the text fields
    
    const { error } = await supabase
      .from('users')
      .update({ phone, email })
      .eq('id', profile?.id);

    setLoading(false);
    if (!error) {
      // Pass the preview image back to update the UI immediately
      if (onUpdate) onUpdate({ ...profile, phone, email, _preview_avatar: previewImage });
      onClose();
    } else {
      alert('Gagal memperbarui profil: ' + error.message);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
    }}>
      <div style={{
        background: 'var(--bg-card)', padding: '30px', borderRadius: '24px',
        width: '450px', border: '2px solid var(--border-primary)',
        boxShadow: '0 20px 50px var(--shadow-color)',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <h3 style={{ color: 'var(--text-primary)', margin: '0 0 24px 0', fontSize: '20px', fontWeight: 900 }}>✏️ Edit Profil & Preferensi</h3>
        
        {/* Avatar Upload */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'var(--border-primary)', color: 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: '24px', border: '3px solid var(--bg-page)',
            overflow: 'hidden'
          }}>
            {previewImage || avatarUrl ? (
              <img src={previewImage || avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              profile?.full_name?.charAt(0) || 'D'
            )}
          </div>
          <div>
            <input 
              type="file" 
              accept="image/jpeg, image/png" 
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'var(--text-primary)', color: 'var(--bg-page)', padding: '8px 16px',
                borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer',
                fontSize: '12px', marginBottom: '8px', transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.8'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}
            >
              📷 Unggah Foto Baru
            </button>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Format JPG/PNG. Maksimal 2MB.</div>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 800, marginBottom: '8px' }}>Nama Lengkap</label>
          <input 
            type="text" 
            value={profile?.full_name || ''} 
            disabled
            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-primary)', background: 'var(--bg-page)', color: 'var(--text-secondary)', fontWeight: 600, opacity: 0.7 }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 800, marginBottom: '8px' }}>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)}
            placeholder="email@domain.com"
            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-primary)', background: 'var(--bg-page)', color: 'var(--text-primary)', fontWeight: 600, outline: 'none' }}
          />
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 800, marginBottom: '8px' }}>Nomor Telepon / WhatsApp</label>
          <input 
            type="text" 
            value={phone} 
            onChange={e => setPhone(e.target.value)}
            placeholder="0812..."
            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-primary)', background: 'var(--bg-page)', color: 'var(--text-primary)', fontWeight: 600, outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid var(--border-primary)' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--border-primary)', background: 'transparent', color: 'var(--text-primary)', fontWeight: 800, cursor: 'pointer' }}>Batal</button>
          <button onClick={handleSave} disabled={loading} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: 'var(--text-primary)', color: 'var(--bg-page)', fontWeight: 800, cursor: 'pointer' }}>
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </div>
  );
}
