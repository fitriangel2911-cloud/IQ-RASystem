'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface ShiftData {
  id?: string;
  status: 'aktif' | 'tutup';
  start_time?: string;
  cash_in?: number;
  cash_system_end?: number;
  teller_name?: string;
  teller_id?: string;
}

interface ShiftLog {
  id: string;
  opened_at: string;
  closed_at?: string;
  cash_in: number;
  cash_system_end?: number;
  cash_physical_end?: number;
  difference?: number;
  difference_note?: string;
  teller_name: string;
}

interface Panel6Props {
  shiftStatus: ShiftData;
  tellerId: string;
  tellerName: string;
  cashOnHand: number;
  onShiftChange: (shift: ShiftData) => void;
}

const fmt = (n: number) => `Rp ${(n || 0).toLocaleString('id-ID')}`;

export default function Panel6Shift({ shiftStatus, tellerId, tellerName, cashOnHand, onShiftChange }: Panel6Props) {
  const [cashInAmount, setCashInAmount] = useState(0);
  const [displayCashIn, setDisplayCashIn] = useState('');
  const [cashPhysical, setCashPhysical] = useState(0);
  const [displayPhysical, setDisplayPhysical] = useState('');
  const [diffNote, setDiffNote] = useState('');
  const [shiftLogs, setShiftLogs] = useState<ShiftLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const difference = cashPhysical - cashOnHand;

  useEffect(() => {
    const fetchLogs = async () => {
      const supabase = createClient();
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('teller_shifts')
        .select('*')
        .gte('opened_at', today)
        .order('opened_at', { ascending: false })
        .limit(5);
      if (data) setShiftLogs(data);
    };
    fetchLogs();
  }, [shiftStatus]);

  const handleOpenShift = async () => {
    if (cashInAmount <= 0) { setMessage({ type: 'error', text: 'Masukkan modal awal kas yang valid.' }); return; }
    setLoading(true); setMessage(null);
    try {
      const supabase = createClient();
      const openedAt = new Date().toISOString();
      const { data, error } = await supabase.from('teller_shifts').insert({
        teller_id: tellerId,
        teller_name: tellerName,
        cash_in: cashInAmount,
        opened_at: openedAt,
        status: 'aktif',
      }).select().single();
      if (error) throw error;

      // INSERT JOURNAL FOR MODAL AWAL KAS (KAS TELLER DEBIT, KAS UTAMA/BANK CREDIT)
      const trxId = 'TRX-SHF-' + Date.now();
      await supabase.from('journal_entries').insert([
        {
          transaction_id: trxId,
          account_code: '110102', // Kas Teller (Masuk)
          debit: cashInAmount,
          credit: 0,
          description: `Modal Awal Buka Shift Kasir - ${tellerName}`,
          created_at: openedAt
        },
        {
          transaction_id: trxId,
          account_code: '110201', // Giro Bank / Kas Utama (Keluar)
          debit: 0,
          credit: cashInAmount,
          description: `Mutasi Kas Utama ke Kas Teller - Buka Shift ${tellerName}`,
          created_at: openedAt
        }
      ]);

      onShiftChange({ id: data.id, status: 'aktif', start_time: data.opened_at, cash_in: cashInAmount, teller_name: tellerName, teller_id: tellerId });
      setMessage({ type: 'success', text: `Shift dibuka! Modal awal: ${fmt(cashInAmount)}` });
      setCashInAmount(0); setDisplayCashIn('');
    } catch (err: any) {
      onShiftChange({ status: 'aktif', start_time: new Date().toISOString(), cash_in: cashInAmount, teller_name: tellerName, teller_id: tellerId });
      setMessage({ type: 'error', text: `Shift gagal dibuka penuh: ${err.message}` });
      setCashInAmount(0); setDisplayCashIn('');
    } finally { setLoading(false); }
  };

  const handleCloseShift = async () => {
    if (cashPhysical < 0) { setMessage({ type: 'error', text: 'Masukkan hasil hitung fisik kas terlebih dahulu.' }); return; }
    if (Math.abs(difference) > 0 && !diffNote) { setMessage({ type: 'error', text: 'Terdapat selisih kas! Wajib isi keterangan selisih.' }); return; }
    setLoading(true); setMessage(null);
    try {
      const supabase = createClient();
      const closedAt = new Date().toISOString();
      if (shiftStatus.id) {
        await supabase.from('teller_shifts').update({
          closed_at: closedAt,
          cash_system_end: cashOnHand,
          cash_physical_end: cashPhysical,
          difference,
          difference_note: diffNote || null,
          status: 'tutup',
        }).eq('id', shiftStatus.id);

        // KEMBALIKAN FISIK KAS TELLER KE KAS UTAMA
        if (cashPhysical > 0) {
          const trxId = 'TRX-SHFC-' + Date.now();
          await supabase.from('journal_entries').insert([
            {
              transaction_id: trxId,
              account_code: '110201', // Kas Utama (Masuk/Dikembalikan)
              debit: cashPhysical,
              credit: 0,
              description: `Pengembalian Fisik Kas Teller ke Kas Utama - Tutup Shift ${tellerName}`,
              created_at: closedAt
            },
            {
              transaction_id: trxId,
              account_code: '110102', // Kas Teller (Keluar/Dikosongkan)
              debit: 0,
              credit: cashPhysical,
              description: `Setoran Tutup Shift Kasir - ${tellerName}`,
              created_at: closedAt
            }
          ]);
        }
      }
      onShiftChange({ status: 'tutup', teller_name: tellerName, teller_id: tellerId });
      setMessage({ type: 'success', text: `Shift ditutup. Selisih: ${fmt(Math.abs(difference))} ${difference >= 0 ? '(Lebih)' : '(Kurang)'}` });
      setCashPhysical(0); setDisplayPhysical(''); setDiffNote('');
    } catch (err: any) {
      onShiftChange({ status: 'tutup', teller_name: tellerName, teller_id: tellerId });
      setMessage({ type: 'error', text: `Shift gagal ditutup penuh: ${err.message}` });
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Status Banner */}
      <div style={{
        background: shiftStatus.status === 'aktif' ? 'rgba(74,222,128,0.08)' : 'rgba(239,68,68,0.08)',
        border: `2px solid ${shiftStatus.status === 'aktif' ? '#4ade80' : '#ef4444'}`,
        borderRadius: '20px', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              width: '14px', height: '14px', borderRadius: '50%',
              background: shiftStatus.status === 'aktif' ? '#4ade80' : '#ef4444',
              display: 'inline-block',
              boxShadow: `0 0 10px ${shiftStatus.status === 'aktif' ? '#4ade80' : '#ef4444'}`
            }}></span>
            <div style={{ fontSize: '28px', fontWeight: 900, color: shiftStatus.status === 'aktif' ? '#4ade80' : '#ef4444', letterSpacing: '1px' }}>
              {shiftStatus.status === 'aktif' ? 'SHIFT AKTIF' : 'SHIFT TUTUP'}
            </div>
          </div>
          {shiftStatus.status === 'aktif' && shiftStatus.start_time && (
            <div style={{ fontSize: '15px', color: 'var(--text-secondary)', marginTop: '8px', fontWeight: 600 }}>
              Dimulai: {new Date(shiftStatus.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • 
              Modal Awal: <span style={{ color: '#4ade80', fontWeight: 800 }}>{fmt(shiftStatus.cash_in || 0)}</span>
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Kas di Tangan (Sistem)</div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#f3c653', marginTop: '6px' }}>{fmt(cashOnHand)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* OPEN SHIFT FORM */}
        <div style={{ background: 'var(--bg-card)', border: shiftStatus.status === 'tutup' ? '2px solid rgba(74,222,128,0.4)' : '1px solid var(--border-primary)', borderRadius: '20px', padding: '28px', opacity: shiftStatus.status === 'aktif' ? 0.5 : 1 }}>
          <h3 style={{ color: '#4ade80', fontSize: '20px', fontWeight: 900, margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Buka Shift
          </h3>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 900, color: '#cca334', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Modal Awal Kas (Cash-In)</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', fontWeight: 900, color: '#4ade80' }}>Rp</span>
              <input type="text" value={displayCashIn} onChange={e => {
                const n = e.target.value.replace(/\D/g, '');
                setCashInAmount(Number(n));
                setDisplayCashIn(n ? Number(n).toLocaleString('id-ID') : '');
              }} placeholder="0" disabled={shiftStatus.status === 'aktif'}
                style={{
                  width: '100%', background: 'var(--bg-page)', border: '2px solid var(--border-primary)',
                  borderRadius: '12px', padding: '16px 16px 16px 48px', color: 'var(--text-primary)',
                  fontSize: '26px', fontWeight: 900, outline: 'none'
                }}
              />
            </div>
          </div>
          <button onClick={handleOpenShift} disabled={loading || shiftStatus.status === 'aktif'} style={{
            width: '100%', padding: '16px', background: shiftStatus.status === 'aktif' ? 'rgba(74,222,128,0.1)' : 'linear-gradient(135deg, #4ade80, #16a34a)',
            border: 'none', borderRadius: '12px', color: shiftStatus.status === 'aktif' ? '#4ade80' : '#02130e',
            fontWeight: 900, fontSize: '16px', cursor: shiftStatus.status === 'aktif' ? 'not-allowed' : 'pointer',
            letterSpacing: '1px'
          }}>
            {shiftStatus.status === 'aktif' ? 'SHIFT SUDAH AKTIF' : loading ? 'PROSES...' : 'BUKA SHIFT SEKARANG'}
          </button>
        </div>

        {/* CLOSE SHIFT FORM */}
        <div style={{ background: 'var(--bg-card)', border: shiftStatus.status === 'aktif' ? '2px solid rgba(239,68,68,0.4)' : '1px solid var(--border-primary)', borderRadius: '20px', padding: '28px', opacity: shiftStatus.status === 'tutup' ? 0.5 : 1 }}>
          <h3 style={{ color: '#fca5a5', fontSize: '20px', fontWeight: 900, margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Tutup Shift
          </h3>

          {/* Reconciliation */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 900, color: '#cca334', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Hitung Fisik Kas</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px', fontWeight: 900, color: '#fca5a5' }}>Rp</span>
              <input type="text" value={displayPhysical} onChange={e => {
                const n = e.target.value.replace(/\D/g, '');
                setCashPhysical(Number(n));
                setDisplayPhysical(n ? Number(n).toLocaleString('id-ID') : '');
              }} placeholder="0" disabled={shiftStatus.status === 'tutup'}
                style={{
                  width: '100%', background: 'var(--bg-page)', border: '2px solid var(--border-primary)',
                  borderRadius: '12px', padding: '16px 16px 16px 48px', color: 'var(--text-primary)',
                  fontSize: '24px', fontWeight: 900, outline: 'none'
                }}
              />
            </div>
          </div>

          {cashPhysical > 0 && (
            <div style={{
              padding: '14px 18px', borderRadius: '12px', marginBottom: '14px',
              background: difference === 0 ? 'rgba(74,222,128,0.08)' : difference > 0 ? 'rgba(243,198,83,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${difference === 0 ? 'rgba(74,222,128,0.3)' : difference > 0 ? 'rgba(243,198,83,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Saldo Sistem</span>
                <span style={{ fontWeight: 800 }}>{fmt(cashOnHand)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Hitung Fisik</span>
                <span style={{ fontWeight: 800 }}>{fmt(cashPhysical)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 900 }}>
                <span>Selisih</span>
                <span style={{ color: difference === 0 ? '#4ade80' : difference > 0 ? '#f3c653' : '#fca5a5' }}>
                  {difference >= 0 ? '+' : ''}{fmt(difference)}
                </span>
              </div>
            </div>
          )}

          {cashPhysical > 0 && difference !== 0 && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 900, color: '#ef4444', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Keterangan Selisih (WAJIB)</label>
              <textarea value={diffNote} onChange={e => setDiffNote(e.target.value)} placeholder="Jelaskan penyebab selisih kas..."
                style={{
                  width: '100%', background: 'rgba(239,68,68,0.08)', border: '2px solid rgba(239,68,68,0.4)',
                  borderRadius: '12px', padding: '12px 16px', color: 'var(--text-primary)', fontSize: '15px',
                  fontWeight: 600, outline: 'none', minHeight: '60px', resize: 'none'
                }} />
            </div>
          )}

          <button onClick={handleCloseShift} disabled={loading || shiftStatus.status === 'tutup'} style={{
            width: '100%', padding: '16px', background: shiftStatus.status === 'tutup' ? 'rgba(239,68,68,0.1)' : 'linear-gradient(135deg, #fca5a5, #ef4444)',
            border: 'none', borderRadius: '12px', color: shiftStatus.status === 'tutup' ? '#fca5a5' : '#fff',
            fontWeight: 900, fontSize: '16px', cursor: shiftStatus.status === 'tutup' ? 'not-allowed' : 'pointer',
            letterSpacing: '1px'
          }}>
            {shiftStatus.status === 'tutup' ? 'SHIFT SUDAH DITUTUP' : loading ? 'PROSES...' : 'TUTUP SHIFT SEKARANG'}
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '14px 20px', borderRadius: '12px', fontWeight: 700, fontSize: '15px',
          background: message.type === 'success' ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1.5px solid ${message.type === 'success' ? '#4ade80' : '#ef4444'}`,
          color: message.type === 'success' ? '#4ade80' : '#fca5a5'
        }}>{message.text}</div>
      )}

      {shiftLogs.length > 0 && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: '20px', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-primary)' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: '#f3c653', textTransform: 'uppercase', letterSpacing: '1px' }}>Log Shift Hari Ini</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Buka', 'Tutup', 'Modal Awal', 'Saldo Fisik', 'Selisih', 'Status'].map(h => (
                    <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: '13px', fontWeight: 900, color: '#f3c653', textTransform: 'uppercase', letterSpacing: '1px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shiftLogs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <td style={{ padding: '12px 18px', fontSize: '14px', fontWeight: 600 }}>{new Date(log.opened_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{ padding: '12px 18px', fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>{log.closed_at ? new Date(log.closed_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td style={{ padding: '12px 18px', fontSize: '14px', fontWeight: 800 }}>{fmt(log.cash_in)}</td>
                    <td style={{ padding: '12px 18px', fontSize: '14px', fontWeight: 600 }}>{log.cash_physical_end ? fmt(log.cash_physical_end) : '-'}</td>
                    <td style={{ padding: '12px 18px', fontSize: '14px', fontWeight: 800, color: (log.difference || 0) === 0 ? '#4ade80' : '#fca5a5' }}>
                      {log.difference !== undefined && log.difference !== null ? `${log.difference >= 0 ? '+' : ''}${fmt(log.difference)}` : '-'}
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{
                        fontSize: '12px', fontWeight: 900, padding: '4px 10px', borderRadius: '6px',
                        background: log.closed_at ? 'rgba(239,68,68,0.1)' : 'rgba(74,222,128,0.1)',
                        color: log.closed_at ? '#fca5a5' : '#4ade80',
                        border: `1px solid ${log.closed_at ? '#ef4444' : '#4ade80'}44`
                      }}>
                        {log.closed_at ? 'TUTUP' : 'AKTIF'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
