'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Notification {
  id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData.user) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Setup realtime subscription
    const supabase = createClient();
    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, payload => {
        fetchNotifications();
      })
      .subscribe();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsRead = async (id: string) => {
    const supabase = createClient();
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userData.user.id)
      .eq('is_read', false);
    
    fetchNotifications();
  };

  const getTimeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `${seconds} detik lalu`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} menit lalu`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam lalu`;
    return `${Math.floor(seconds / 86400)} hari lalu`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'var(--bg-card)',
          border: '1.5px solid var(--border-primary)',
          borderRadius: '12px',
          padding: '10px',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 12px var(--shadow-color)',
          position: 'relative'
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            background: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 900,
            border: '2px solid var(--bg-page)',
            animation: 'pulse 2s infinite'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 12px)',
          right: 0,
          width: '340px',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid var(--border-primary)',
          borderRadius: '16px',
          boxShadow: '0 20px 40px var(--shadow-color)',
          zIndex: 100,
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ 
            padding: '16px 20px', 
            borderBottom: '1.5px solid var(--border-primary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-header)'
          }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: 'var(--text-primary)' }}>Notifikasi</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--gold-intense)',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Tandai semua dibaca
              </button>
            )}
          </div>
          
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>
                Tidak ada notifikasi saat ini.
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => !notif.is_read && markAsRead(notif.id)}
                  style={{ 
                    padding: '16px 20px', 
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    gap: '12px',
                    cursor: notif.is_read ? 'default' : 'pointer',
                    background: notif.is_read ? 'transparent' : 'rgba(204, 163, 52, 0.05)',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseOver={e => { if(!notif.is_read) e.currentTarget.style.background = 'rgba(204, 163, 52, 0.1)'; }}
                  onMouseOut={e => { if(!notif.is_read) e.currentTarget.style.background = 'rgba(204, 163, 52, 0.05)'; }}
                >
                  <div style={{ 
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: notif.type === 'info' ? 'rgba(59, 130, 246, 0.15)' : 
                                notif.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 
                                notif.type === 'warning' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: notif.type === 'info' ? '#3b82f6' : 
                           notif.type === 'success' ? '#10b981' : 
                           notif.type === 'warning' ? '#f59e0b' : '#ef4444',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px'
                  }}>
                    {notif.type === 'info' ? 'ℹ️' : notif.type === 'success' ? '✓' : notif.type === 'warning' ? '⚠️' : '🚨'}
                  </div>
                  <div>
                    <p style={{ margin: '0 0 6px 0', fontSize: '13px', lineHeight: 1.4, color: notif.is_read ? 'var(--text-secondary)' : 'var(--text-primary)', fontWeight: notif.is_read ? 600 : 800 }}>
                      {notif.message}
                    </p>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>{getTimeAgo(notif.created_at)}</span>
                  </div>
                  {!notif.is_read && (
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gold-intense)', alignSelf: 'center', marginLeft: 'auto', flexShrink: 0 }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
