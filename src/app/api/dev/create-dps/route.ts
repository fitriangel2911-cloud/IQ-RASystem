import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Supabase keys not configured in server env.' }, { status: 500 });
  }

  // Initialize absolute stateless client so it doesn't interfere with any sessions
  const devClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  const targetEmail = 'dps@gmail.com';
  const targetPass = 'dps1@123';
  const fullName = 'Dewan Pengawas Syariah (DPS)';

  try {
    // 1. Attempt to sign up in Auth
    const { data: authData, error: authErr } = await devClient.auth.signUp({
      email: targetEmail,
      password: targetPass,
      options: {
        data: { full_name: fullName }
      }
    });

    if (authErr) {
      // If user already registered in auth, we may need to recover and insert public row.
      if (authErr.message.includes('already registered')) {
        return NextResponse.json({ 
          message: 'Akun auth.users dps@gmail.com sudah terdaftar di Supabase.',
          recommendation: 'Jika sudah terdaftar di auth tapi belum bisa login, pastikan Anda telah menjalankan SQL update constraint dan trigger di Supabase SQL Editor.'
        });
      }
      throw authErr;
    }

    if (!authData?.user) {
      throw new Error('Auth creation failed to return user payload.');
    }

    // 2. Commit to public.users
    const { error: dbErr } = await devClient
      .from('users')
      .insert({
        id: authData.user.id,
        full_name: fullName,
        email: targetEmail,
        role: 'dps'
      });

    if (dbErr) {
      throw new Error(`DB INSERT FAILED: ${dbErr.message}. (Tip: Pastikan Anda telah menjalankan SQL ALTER CONSTRAINT terlebih dahulu di Supabase Editor!)`);
    }

    return NextResponse.json({
      success: true,
      message: '🎉 AKUN DPS BERHASIL DIBUAT SECARA PROGRAMMATIK!',
      account: {
        email: targetEmail,
        role: 'dps',
        instructions: 'Anda sekarang dapat langsung login ke sistem menggunakan email ini. Modul auto-confirm trigger database akan otomatis mengaktifkan status login-nya.'
      }
    });

  } catch (err: any) {
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 400 });
  }
}
