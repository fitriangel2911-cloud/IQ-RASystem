import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Configuration missing.' }, { status: 500 });
  }

  // Create stateless admin-like client bypasser
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false }
  });

  const emailToFix = 'dps1@gmail.com';

  try {
    // 1. Direct SQL-like UPDATE query via REST API (Bypassing need for SQL editor entirely!)
    const { data, error } = await client
      .from('users')
      .update({ 
        role: 'dps',
        full_name: 'Dewan Pengawas Syariah (DPS)' 
      })
      .eq('email', emailToFix)
      .select();

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: false,
        message: `⚠️ Peringatan: Baris database untuk email '${emailToFix}' tidak ditemukan di tabel public.users.`,
        recommendation: 'Silakan coba daftarkan akun tersebut kembali, atau pastikan email yang Anda gunakan tepat dps1@gmail.com.'
      });
    }

    return NextResponse.json({
      success: true,
      message: `🎉 SUKSES TOTAL! Akun '${emailToFix}' telah ditingkatkan menjadi peran 'dps' secara langsung di database.`,
      updatedProfile: data[0],
      instructions: 'Sekarang, silakan kembali ke tab localhost:3000/dashboard, lalu klik LOG OUT / KELUAR AKUN, lalu LOGIN KEMBALI. Anda akan langsung masuk ke Dasbor DPS!'
    });

  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message,
      hint: 'Jika ini error constraint check, pastikan Anda sudah menjalankan SQL ALTER CONSTRAINT yang saya berikan sebelumnya di editor SQL!'
    }, { status: 400 });
  }
}
