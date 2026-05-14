import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: 'Supabase keys not configured in server env.' }, { status: 500 });
  }

  // Initialize absolute stateless client
  const devClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  const targetEmail = 'ao@gmail.com';
  const targetPass = 'ao1@123';
  const fullName = 'Account Officer (AO)';

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
      if (authErr.message.includes('already registered')) {
        return NextResponse.json({ 
          message: 'Akun auth.users ao@gmail.com sudah terdaftar di Supabase.',
          recommendation: 'Jika sudah terdaftar tapi role belum sesuai, Anda bisa mengubahnya langsung di tabel public.users.'
        });
      }
      throw authErr;
    }

    if (!authData?.user) {
      throw new Error('Auth creation failed to return user payload.');
    }

    // 2. Commit to public.users
    // We use .upsert() instead of .insert() to handle cases where a database trigger 
    // might have already created the profile row.
    const { error: dbErr } = await devClient
      .from('users')
      .upsert({
        id: authData.user.id,
        full_name: fullName,
        email: targetEmail,
        role: 'account_officer'
      }, { onConflict: 'id' });

    if (dbErr) {
      return NextResponse.json({ 
        success: false, 
        error: `Database Error: ${dbErr.message}`,
        details: dbErr.hint || 'Check if the users table has all required columns (id, full_name, role, email, password).'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: '🎉 AKUN DUMMY AO BERHASIL DIBUAT!',
      account: {
        email: targetEmail,
        password: targetPass,
        role: 'account_officer',
        instructions: 'Gunakan email ini untuk login ke halaman Dashboard AO.'
      }
    });

  } catch (err: any) {
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 400 });
  }
}
